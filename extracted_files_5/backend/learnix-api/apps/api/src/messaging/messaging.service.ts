import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MessageType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SafetyService } from '../safety/safety.service';
import { CursorPaginationDto, Page } from '../common/dto/pagination.dto';

@Injectable()
export class MessagingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly safety: SafetyService,
  ) {}

  /** Find an existing 1:1 conversation between two users, or create one. */
  async getOrCreateDirect(userId: string, otherUsername: string) {
    const other = await this.prisma.user.findUnique({
      where: { username: otherUsername },
      select: { id: true },
    });
    if (!other) throw new NotFoundException('User not found');
    if (other.id === userId) {
      throw new ForbiddenException('Cannot start a chat with yourself');
    }
    if (await this.safety.isBlockedBetween(userId, other.id)) {
      throw new ForbiddenException('Unavailable');
    }

    // existing direct conversation containing exactly these two participants
    const existing = await this.prisma.conversation.findFirst({
      where: {
        isGroup: false,
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: other.id } } },
        ],
      },
      select: { id: true },
    });
    if (existing) return this.getConversation(existing.id, userId);

    const created = await this.prisma.conversation.create({
      data: {
        isGroup: false,
        participants: {
          create: [{ userId }, { userId: other.id }],
        },
      },
      select: { id: true },
    });
    return this.getConversation(created.id, userId);
  }

  async listConversations(userId: string) {
    const parts = await this.prisma.conversationParticipant.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            participants: { include: { user: this.userCard() } },
            messages: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        },
      },
      orderBy: { conversation: { updatedAt: 'desc' } },
    });

    return Promise.all(
      parts.map(async (p) => {
        const unread = await this.prisma.message.count({
          where: {
            conversationId: p.conversationId,
            senderId: { not: userId },
            createdAt: { gt: p.lastReadAt ?? new Date(0) },
          },
        });
        return {
          ...this.shapeConversation(p.conversation, userId),
          lastMessage: p.conversation.messages[0] ?? null,
          unreadCount: unread,
        };
      }),
    );
  }

  async getConversation(conversationId: string, userId: string) {
    await this.assertMember(conversationId, userId);
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: { include: { user: this.userCard() } } },
    });
    if (!conv) throw new NotFoundException('Conversation not found');
    return this.shapeConversation(conv, userId);
  }

  async getMessages(
    conversationId: string,
    userId: string,
    q: CursorPaginationDto,
  ): Promise<Page<unknown>> {
    await this.assertMember(conversationId, userId);
    const rows = await this.prisma.message.findMany({
      where: { conversationId },
      include: { sender: this.userCard() },
      orderBy: { createdAt: 'desc' },
      take: q.limit + 1,
      ...(q.cursor ? { cursor: { id: q.cursor }, skip: 1 } : {}),
    });
    const hasMore = rows.length > q.limit;
    const slice = hasMore ? rows.slice(0, q.limit) : rows;

    // attach shared-post previews for POST_SHARE messages
    const postIds = slice
      .map((m) => m.postId)
      .filter((id): id is string => !!id);
    const sharedPosts = postIds.length
      ? await this.prisma.post.findMany({
          where: { id: { in: postIds } },
          select: {
            id: true,
            caption: true,
            author: { select: { id: true, username: true, avatarUrl: true } },
            media: {
              take: 1,
              orderBy: { position: 'asc' },
              select: { thumbnailUrl: true, url: true },
            },
          },
        })
      : [];
    const postMap = new Map(sharedPosts.map((p) => [p.id, p]));

    const items = slice.map((m) => ({
      ...m,
      sharedPost: m.postId ? (postMap.get(m.postId) ?? null) : null,
    }));
    return { items, nextCursor: hasMore ? slice[slice.length - 1].id : null };
  }

  /** Share a post into a conversation (Instagram-style "send in DM"). */
  async sharePost(conversationId: string, senderId: string, postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });
    if (!post) throw new NotFoundException('Post not found');
    return this.sendMessage(conversationId, senderId, {
      type: MessageType.POST_SHARE,
      postId,
    });
  }

  /** Persist a message and bump the conversation's updatedAt. Returns the row. */
  async sendMessage(
    conversationId: string,
    senderId: string,
    input: { body?: string; type?: MessageType; mediaUrl?: string; postId?: string },
  ) {
    await this.assertMember(conversationId, senderId);
    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: {
          conversationId,
          senderId,
          type: input.type ?? MessageType.TEXT,
          body: input.body,
          mediaUrl: input.mediaUrl,
          postId: input.postId,
        },
        include: { sender: this.userCard() },
      }),
      this.prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      }),
    ]);
    return message;
  }

  async markRead(conversationId: string, userId: string) {
    await this.assertMember(conversationId, userId);
    await this.prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: new Date() },
    });
    return { ok: true };
  }

  /** Ids of the other participants — used to target call/room events. */
  async participantIds(conversationId: string): Promise<string[]> {
    const parts = await this.prisma.conversationParticipant.findMany({
      where: { conversationId },
      select: { userId: true },
    });
    return parts.map((p) => p.userId);
  }

  async isMember(conversationId: string, userId: string): Promise<boolean> {
    const part = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
      select: { userId: true },
    });
    return !!part;
  }

  // ---- helpers ----

  private async assertMember(conversationId: string, userId: string) {
    if (!(await this.isMember(conversationId, userId))) {
      throw new ForbiddenException('Not a participant of this conversation');
    }
  }

  private shapeConversation(
    conv: {
      id: string;
      isGroup: boolean;
      title: string | null;
      updatedAt: Date;
      participants: Array<{
        userId: string;
        user: {
          id: string;
          username: string;
          displayName: string | null;
          avatarUrl: string | null;
        };
      }>;
    },
    userId: string,
  ) {
    const others = conv.participants
      .filter((p) => p.userId !== userId)
      .map((p) => p.user);
    return {
      id: conv.id,
      isGroup: conv.isGroup,
      title: conv.isGroup
        ? conv.title
        : (others[0]?.displayName ?? others[0]?.username ?? 'Chat'),
      updatedAt: conv.updatedAt,
      participants: conv.participants.map((p) => p.user),
      otherParticipants: others,
    };
  }

  private userCard() {
    return {
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        isVerified: true,
      },
    };
  }
}
