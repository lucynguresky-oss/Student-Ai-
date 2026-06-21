import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagesService } from './messages.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private userSockets = new Map<string, string>(); // userId -> socketId

  constructor(private readonly messagesService: MessagesService) {}

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.userSockets.set(userId, client.id);
      client.join(`user_${userId}`);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.userSockets.delete(userId);
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() payload: { senderId: string; conversationId: string; body: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { senderId, conversationId, body } = payload;
    
    // Save to database
    const message = await this.messagesService.sendMessage(senderId, conversationId, body);

    // Broadcast to the conversation room
    this.server.to(`conv_${conversationId}`).emit('newMessage', message);
    
    return message;
  }

  @SubscribeMessage('joinConversation')
  handleJoinConversation(
    @MessageBody() payload: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`conv_${payload.conversationId}`);
    return { event: 'joined', room: payload.conversationId };
  }

  @SubscribeMessage('leaveConversation')
  handleLeaveConversation(
    @MessageBody() payload: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`conv_${payload.conversationId}`);
    return { event: 'left', room: payload.conversationId };
  }
}
