import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async getConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              include: { learnerProfile: true },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { sender: { include: { learnerProfile: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMessages(conversationId: string, limit = 50, cursor?: string) {
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          include: { learnerProfile: true },
        },
      },
    });
    return messages;
  }

  async sendMessage(senderId: string, conversationId: string, body: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId,
        body,
      },
      include: {
        sender: {
          include: { learnerProfile: true },
        },
      },
    });

    return message;
  }

  async getOrCreateDirectConversation(user1Id: string, user2Id: string) {
    const existing = await this.prisma.conversation.findFirst({
      where: {
        isGroup: false,
        AND: [
          { participants: { some: { userId: user1Id } } },
          { participants: { some: { userId: user2Id } } },
        ],
      },
      include: {
        participants: { include: { user: { include: { learnerProfile: true } } } },
      },
    });

    if (existing) return existing;

    const newConversation = await this.prisma.conversation.create({
      data: {
        isGroup: false,
        participants: {
          create: [{ userId: user1Id }, { userId: user2Id }],
        },
      },
      include: {
        participants: { include: { user: { include: { learnerProfile: true } } } },
      },
    });

    return newConversation;
  }
}
