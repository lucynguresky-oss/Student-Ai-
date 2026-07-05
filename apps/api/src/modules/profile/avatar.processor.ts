import { Injectable, Logger, OnModuleDestroy, Inject } from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
import { ConfigService } from '../../core/config/config.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { STORAGE_PROVIDER, type StorageProvider } from '../../providers/storage/storage.provider';
import sharp from 'sharp';

@Injectable()
export class AvatarProcessorService implements OnModuleDestroy {
  private readonly logger = new Logger(AvatarProcessorService.name);
  private readonly queue: Queue;
  private readonly worker: Worker;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {
    const connection = { url: config.env.REDIS_URL } as any;
    this.queue = new Queue('avatar', { connection });

    this.worker = new Worker(
      'avatar',
      async (job) => {
        const { userId, key } = job.data as { userId: string; key: string };
        await this.processAvatar(userId, key);
      },
      { connection, concurrency: 5 },
    );
  }

  async queueProcessing(userId: string, key: string): Promise<void> {
    await this.queue.add('process', { userId, key }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    });
  }

  private async processAvatar(userId: string, key: string): Promise<void> {
    try {
      this.logger.log(`Processing avatar for user ${userId}: ${key}`);

      // 1. Download original object from storage
      const obj = await this.storage.getObject(key);

      // Validate size (max 5MB)
      if (obj.data.length > 5 * 1024 * 1024) {
        throw new Error('Avatar file size exceeds 5MB limit');
      }

      // 2. Validate magic bytes and resize using sharp
      const image = sharp(obj.data);
      const metadata = await image.metadata();

      if (!metadata.format || !['png', 'jpeg', 'webp', 'gif'].includes(metadata.format)) {
        throw new Error(`Unsupported image format: ${metadata.format}`);
      }

      // 3. Generate 320px and 96px webp variants
      const data320 = await image.clone().resize(320, 320, { fit: 'cover' }).webp().toBuffer();
      const data96 = await image.clone().resize(96, 96, { fit: 'cover' }).webp().toBuffer();

      // 4. Upload variants back to storage
      const baseKey = key.substring(0, key.lastIndexOf('.'));
      const key320 = `${baseKey}-320.webp`;
      const key96 = `${baseKey}-96.webp`;

      await this.storage.putObject(key320, data320, 'image/webp');
      await this.storage.putObject(key96, data96, 'image/webp');

      const url320 = this.storage.publicUrl(key320);

      // 5. Update the user's profile with the 320px version (standard display avatar)
      await this.prisma.profile.update({
        where: { userId },
        data: { avatarUrl: url320 },
      });

      this.logger.log(`Avatar successfully processed and saved for user ${userId}`);
    } catch (e) {
      this.logger.error(`Failed to process avatar for user ${userId}: ${(e as Error).message}`, (e as Error).stack);
      throw e;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.queue.close();
    await this.worker.close();
  }
}
