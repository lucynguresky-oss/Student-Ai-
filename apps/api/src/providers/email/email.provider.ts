import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '../../core/config/config.service';

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/** EmailProvider abstraction (§5.2). */
export interface EmailProvider {
  send(msg: EmailMessage): Promise<void>;
}

export const EMAIL_PROVIDER = Symbol('EMAIL_PROVIDER');

@Injectable()
export class ConsoleMockEmailProvider implements EmailProvider {
  private readonly logger = new Logger('Email:mock');
  private readonly outbox: EmailMessage[] = [];
  async send(msg: EmailMessage): Promise<void> {
    this.outbox.push(msg);
    this.logger.log(`→ ${msg.to} | ${msg.subject}`);
  }
  last(): EmailMessage | undefined {
    return this.outbox[this.outbox.length - 1];
  }
}

/** Resend adapter — DECIDED default (§15). Simple, good deliverability. */
@Injectable()
export class ResendEmailProvider implements EmailProvider {
  private readonly logger = new Logger('Email:resend');
  constructor(private readonly config: ConfigService) {}

  async send(msg: EmailMessage): Promise<void> {
    const { RESEND_API_KEY, EMAIL_FROM } = this.config.env;
    if (!RESEND_API_KEY) throw new Error('Resend not configured');
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [msg.to],
        subject: msg.subject,
        html: msg.html,
        text: msg.text,
      }),
    });
    if (!res.ok) {
      this.logger.error(`Resend failed ${res.status}: ${await res.text()}`);
      throw new Error('Email send failed');
    }
  }
}

@Injectable()
export class SesEmailProvider implements EmailProvider {
  async send(_msg: EmailMessage): Promise<void> {
    throw new Error('SES adapter not enabled — set EMAIL_PROVIDER=resend or mock');
  }
}
