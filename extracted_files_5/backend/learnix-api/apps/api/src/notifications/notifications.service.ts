import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CursorPaginationDto, Page } from '../common/dto/pagination.dto';
import { MarkReadDto } from './dto/mark-read.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    userId: string,
    q: CursorPaginationDto,
  ): Promise<Page<unknown>> {
    const rows = await this.prisma.notification.findMany({
      where: { userId },
      include: {
        actor: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            isVerified: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: q.limit + 1,
      ...(q.cursor ? { cursor: { id: q.cursor }, skip: 1 } : {}),
    });

    // attach a tiny post thumbnail when the notification references a post
    const postIds = rows
      .map((n) => n.postId)
      .filter((id): id is string => !!id);
    const previews = postIds.length
      ? await this.prisma.post.findMany({
          where: { id: { in: postIds } },
          select: {
            id: true,
            media: {
              take: 1,
              orderBy: { position: 'asc' },
              select: { thumbnailUrl: true, url: true },
            },
          },
        })
      : [];
    const previewMap = new Map(previews.map((p) => [p.id, p.media[0] ?? null]));

    const hasMore = rows.length > q.limit;
    const slice = hasMore ? rows.slice(0, q.limit) : rows;
    const items = slice.map((n) => ({
      ...n,
      postPreview: n.postId ? (previewMap.get(n.postId) ?? null) : null,
    }));

    return {
      items,
      nextCursor: hasMore ? slice[slice.length - 1].id : null,
    };
  }

  async unreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  async markRead(userId: string, dto: MarkReadDto): Promise<{ updated: number }> {
    const where = dto.all
      ? { userId, isRead: false }
      : { userId, id: { in: dto.ids ?? [] } };
    const res = await this.prisma.notification.updateMany({
      where,
      data: { isRead: true },
    });
    return { updated: res.count };
  }
}
