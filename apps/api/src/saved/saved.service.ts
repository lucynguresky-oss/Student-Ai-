import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CursorPaginationDto, Page } from '../common/dto/pagination.dto';

@Injectable()
export class SavedService {
  constructor(private readonly prisma: PrismaService) {}

  async listSaved(
    userId: string,
    q: CursorPaginationDto,
  ): Promise<Page<unknown>> {
    const rows = await this.prisma.bookmark.findMany({
      where: { userId },
      include: { post: { include: this.postInclude() } },
      orderBy: { createdAt: 'desc' },
      take: q.limit + 1,
      ...(q.cursor
        ? { cursor: { userId_postId: { userId, postId: q.cursor } }, skip: 1 }
        : {}),
    });
    const hasMore = rows.length > q.limit;
    const slice = hasMore ? rows.slice(0, q.limit) : rows;
    return {
      items: slice.map((b) => b.post),
      nextCursor: hasMore ? slice[slice.length - 1].postId : null,
    };
  }

  async listCollections(userId: string) {
    const cols = await this.prisma.collection.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { bookmarks: true } } },
    });
    return cols.map((c) => ({
      id: c.id,
      name: c.name,
      count: c._count.bookmarks,
      createdAt: c.createdAt,
    }));
  }

  async createCollection(userId: string, name: string) {
    try {
      return await this.prisma.collection.create({ data: { userId, name } });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ForbiddenException('You already have a collection with that name');
      }
      throw e;
    }
  }

  async deleteCollection(userId: string, collectionId: string) {
    const col = await this.prisma.collection.findUnique({
      where: { id: collectionId },
      select: { userId: true },
    });
    if (!col) throw new NotFoundException('Collection not found');
    if (col.userId !== userId) throw new ForbiddenException('Not your collection');
    await this.prisma.collection.delete({ where: { id: collectionId } });
    return { deleted: true };
  }

  async collectionPosts(
    userId: string,
    collectionId: string,
    q: CursorPaginationDto,
  ): Promise<Page<unknown>> {
    const col = await this.prisma.collection.findUnique({
      where: { id: collectionId },
      select: { userId: true },
    });
    if (!col) throw new NotFoundException('Collection not found');
    if (col.userId !== userId) throw new ForbiddenException('Not your collection');

    const rows = await this.prisma.bookmark.findMany({
      where: { userId, collectionId },
      include: { post: { include: this.postInclude() } },
      orderBy: { createdAt: 'desc' },
      take: q.limit + 1,
      ...(q.cursor
        ? { cursor: { userId_postId: { userId, postId: q.cursor } }, skip: 1 }
        : {}),
    });
    const hasMore = rows.length > q.limit;
    const slice = hasMore ? rows.slice(0, q.limit) : rows;
    return {
      items: slice.map((b) => b.post),
      nextCursor: hasMore ? slice[slice.length - 1].postId : null,
    };
  }

  /** Move a saved post into (or out of) a collection. */
  async assign(userId: string, postId: string, collectionId: string | null) {
    const bookmark = await this.prisma.bookmark.findUnique({
      where: { userId_postId: { userId, postId } },
      select: { userId: true },
    });
    if (!bookmark) throw new NotFoundException('You have not saved that post');

    if (collectionId) {
      const col = await this.prisma.collection.findUnique({
        where: { id: collectionId },
        select: { userId: true },
      });
      if (!col || col.userId !== userId) {
        throw new ForbiddenException('Not your collection');
      }
    }
    await this.prisma.bookmark.update({
      where: { userId_postId: { userId, postId } },
      data: { collectionId },
    });
    return { ok: true };
  }

  private postInclude(): Prisma.PostInclude {
    return {
      author: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          isVerified: true,
        },
      },
      media: { orderBy: { position: 'asc' } },
      subject: { select: { id: true, nameEn: true } },
    };
  }
}
