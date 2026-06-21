import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { CallStatus, CallType, MessageType } from '@prisma/client';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { MessagingService } from './messaging.service';

interface AuthedSocket extends Socket {
  data: { userId: string };
}

@WebSocketGateway({
  namespace: '/realtime',
  cors: { origin: true, credentials: true },
})
export class ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(ChatGateway.name);
  // userId -> set of socket ids (a user may have several devices/tabs)
  private readonly online = new Map<string, Set<string>>();

  @WebSocketServer() server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly messaging: MessagingService,
    private readonly prisma: PrismaService,
  ) {}

  // ---- connection lifecycle ----

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token =
        (client.handshake.auth?.token as string) ||
        (client.handshake.query?.token as string);
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token, {
        secret: this.config.get<string>('jwt.accessSecret'),
      });
      const userId = payload.sub;
      (client as AuthedSocket).data.userId = userId;

      await client.join(this.userRoom(userId));
      const set = this.online.get(userId) ?? new Set<string>();
      const wasOffline = set.size === 0;
      set.add(client.id);
      this.online.set(userId, set);

      if (wasOffline) this.server.emit('presence:update', { userId, online: true });
      this.logger.log(`connected ${userId} (${client.id})`);
    } catch {
      client.emit('error', { message: 'Unauthorized' });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    const userId = (client as AuthedSocket).data?.userId;
    if (!userId) return;
    const set = this.online.get(userId);
    if (set) {
      set.delete(client.id);
      if (set.size === 0) {
        this.online.delete(userId);
        this.server.emit('presence:update', { userId, online: false });
      }
    }
  }

  // ---- chat rooms ----

  @SubscribeMessage('conversation:join')
  async onJoin(client: AuthedSocket, payload: { conversationId: string }) {
    if (!(await this.messaging.isMember(payload.conversationId, client.data.userId))) {
      return { ok: false, error: 'forbidden' };
    }
    await client.join(this.convRoom(payload.conversationId));
    return { ok: true };
  }

  @SubscribeMessage('conversation:leave')
  async onLeave(client: AuthedSocket, payload: { conversationId: string }) {
    await client.leave(this.convRoom(payload.conversationId));
    return { ok: true };
  }

  @SubscribeMessage('message:send')
  async onMessage(
    client: AuthedSocket,
    payload: {
      conversationId: string;
      body?: string;
      type?: MessageType;
      mediaUrl?: string;
      postId?: string;
    },
  ) {
    const message = await this.messaging.sendMessage(
      payload.conversationId,
      client.data.userId,
      {
        body: payload.body,
        type: payload.type,
        mediaUrl: payload.mediaUrl,
        postId: payload.postId,
      },
    );
    this.server.to(this.convRoom(payload.conversationId)).emit('message:new', message);
    return { ok: true, message };
  }

  @SubscribeMessage('typing')
  onTyping(
    client: AuthedSocket,
    payload: { conversationId: string; isTyping: boolean },
  ) {
    client.to(this.convRoom(payload.conversationId)).emit('typing', {
      conversationId: payload.conversationId,
      userId: client.data.userId,
      isTyping: payload.isTyping,
    });
  }

  @SubscribeMessage('read')
  async onRead(client: AuthedSocket, payload: { conversationId: string }) {
    await this.messaging.markRead(payload.conversationId, client.data.userId);
    this.server.to(this.convRoom(payload.conversationId)).emit('read', {
      conversationId: payload.conversationId,
      userId: client.data.userId,
      readAt: new Date(),
    });
    return { ok: true };
  }

  // ---- WebRTC call signaling ----
  // The gateway is the signaling channel; the actual audio/video stream is a
  // peer-to-peer WebRTC connection negotiated by relaying SDP + ICE candidates.

  @SubscribeMessage('call:invite')
  async onCallInvite(
    client: AuthedSocket,
    payload: { conversationId: string; callType: CallType },
  ) {
    if (!(await this.messaging.isMember(payload.conversationId, client.data.userId))) {
      return { ok: false, error: 'forbidden' };
    }
    const call = await this.prisma.callLog.create({
      data: {
        conversationId: payload.conversationId,
        initiatorId: client.data.userId,
        type: payload.callType ?? CallType.VIDEO,
        status: CallStatus.RINGING,
      },
    });
    const others = (
      await this.messaging.participantIds(payload.conversationId)
    ).filter((id) => id !== client.data.userId);
    for (const uid of others) {
      this.server.to(this.userRoom(uid)).emit('call:incoming', {
        callId: call.id,
        conversationId: payload.conversationId,
        from: client.data.userId,
        callType: call.type,
      });
    }
    return { ok: true, callId: call.id };
  }

  @SubscribeMessage('call:accept')
  async onCallAccept(client: AuthedSocket, payload: { callId: string }) {
    const call = await this.prisma.callLog.update({
      where: { id: payload.callId },
      data: { status: CallStatus.ONGOING },
    });
    this.server
      .to(this.convRoom(call.conversationId))
      .emit('call:accepted', { callId: call.id, by: client.data.userId });
    return { ok: true };
  }

  @SubscribeMessage('call:decline')
  async onCallDecline(client: AuthedSocket, payload: { callId: string }) {
    const call = await this.prisma.callLog.update({
      where: { id: payload.callId },
      data: { status: CallStatus.DECLINED, endedAt: new Date() },
    });
    this.server
      .to(this.convRoom(call.conversationId))
      .emit('call:declined', { callId: call.id, by: client.data.userId });
    return { ok: true };
  }

  @SubscribeMessage('call:end')
  async onCallEnd(client: AuthedSocket, payload: { callId: string }) {
    const call = await this.prisma.callLog.update({
      where: { id: payload.callId },
      data: { status: CallStatus.ENDED, endedAt: new Date() },
    });
    this.server
      .to(this.convRoom(call.conversationId))
      .emit('call:ended', { callId: call.id, by: client.data.userId });
    return { ok: true };
  }

  /** Relay an SDP offer/answer or ICE candidate to a specific peer. */
  @SubscribeMessage('call:signal')
  onCallSignal(
    client: AuthedSocket,
    payload: { to: string; data: unknown },
  ) {
    this.server.to(this.userRoom(payload.to)).emit('call:signal', {
      from: client.data.userId,
      data: payload.data,
    });
  }

  // ---- room helpers ----
  private userRoom(userId: string): string {
    return `user:${userId}`;
  }
  private convRoom(conversationId: string): string {
    return `conv:${conversationId}`;
  }
}
