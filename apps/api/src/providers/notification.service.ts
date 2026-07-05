import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Queue, Worker, type JobsOptions } from 'bullmq';
import { ConfigService } from '../core/config/config.service';
import type { SmsProvider } from './sms/sms.provider';
import type { EmailProvider, EmailMessage } from './email/email.provider';

/**
 * NotificationService — every SMS/email goes through a BullMQ queue with retry/backoff
 * (§5.2). This decouples the request path from provider latency/outages: a slow SMS gateway
 * can't hold an HTTP request open, and transient failures retry automatically. At scale the
 * worker runs as a SEPARATE process (see docs/SCALE.md) so heavy sends never starve request
 * handling.
 *
 * In test/dev the queue processes inline via an in-process worker against the same Redis.
 */
const JOB_OPTS: JobsOptions = {
  attempts: 5,
  backoff: { type: 'exponential', delay: 2000 },
  removeOnComplete: 1000,
  removeOnFail: 5000,
};

@Injectable()
export class NotificationService implements OnModuleDestroy {
  private readonly logger = new Logger(NotificationService.name);
  private readonly smsQueue: Queue;
  private readonly emailQueue: Queue;
  private readonly workers: Worker[] = [];

  constructor(
    private readonly config: ConfigService,
    private readonly sms: { instance: SmsProvider },
    private readonly email: { instance: EmailProvider },
  ) {
    const connection = { url: config.env.REDIS_URL } as any;
    this.smsQueue = new Queue('sms', { connection });
    this.emailQueue = new Queue('email', { connection });

    // Start in-process workers. In production, run these in a dedicated worker entrypoint.
    this.workers.push(
      new Worker(
        'sms',
        async (job) => {
          await this.sms.instance.send(job.data.to, job.data.body);
        },
        { connection, concurrency: 20 },
      ),
    );
    this.workers.push(
      new Worker(
        'email',
        async (job) => {
          await this.email.instance.send(job.data as EmailMessage);
        },
        { connection, concurrency: 20 },
      ),
    );
  }

  async sendSms(to: string, body: string): Promise<void> {
    await this.smsQueue.add('send', { to, body }, JOB_OPTS);
  }

  async sendEmail(msg: EmailMessage): Promise<void> {
    await this.emailQueue.add('send', msg, JOB_OPTS);
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all(this.workers.map((w) => w.close()));
    await this.smsQueue.close();
    await this.emailQueue.close();
  }
}
