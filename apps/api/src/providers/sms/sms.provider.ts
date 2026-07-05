import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '../../core/config/config.service';

/** SmsProvider abstraction (§5.2). Adapters resolved by env flag via Nest DI. */
export interface SmsProvider {
  send(toE164: string, body: string): Promise<void>;
}

export const SMS_PROVIDER = Symbol('SMS_PROVIDER');

/** Dev/test: logs the code instead of sending (never in prod). */
@Injectable()
export class ConsoleMockSmsProvider implements SmsProvider {
  private readonly logger = new Logger('SMS:mock');
  private readonly outbox: Array<{ to: string; body: string }> = [];
  async send(toE164: string, body: string): Promise<void> {
    this.outbox.push({ to: toE164, body });
    this.logger.log(`→ ${toE164}: ${body}`);
  }
  /** Test hook. */
  last(): { to: string; body: string } | undefined {
    return this.outbox[this.outbox.length - 1];
  }
}

/**
 * Africa's Talking adapter — DECIDED default (§15): Kenya-first, cheaper local delivery.
 * Uses the bulk SMS endpoint; batch multiple recipients in one call at scale (see SCALE.md).
 */
@Injectable()
export class AfricasTalkingSmsProvider implements SmsProvider {
  private readonly logger = new Logger('SMS:africastalking');
  constructor(private readonly config: ConfigService) {}

  async send(toE164: string, body: string): Promise<void> {
    const { AT_API_KEY, AT_USERNAME, AT_SENDER_ID } = this.config.env;
    if (!AT_API_KEY || !AT_USERNAME) throw new Error('Africa’s Talking not configured');

    const form = new URLSearchParams();
    form.set('username', AT_USERNAME);
    form.set('to', toE164);
    form.set('message', body);
    if (AT_SENDER_ID) form.set('from', AT_SENDER_ID);

    const res = await fetch('https://api.africastalking.com/version1/messaging', {
      method: 'POST',
      headers: {
        apiKey: AT_API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: form.toString(),
    });
    if (!res.ok) {
      const text = await res.text();
      this.logger.error(`AT send failed ${res.status}: ${text}`);
      throw new Error('SMS send failed');
    }
  }
}

/**
 * Twilio adapter — the global default for a worldwide audience (§15 re-decided for global
 * scope). Reaches every country's mobile networks.
 */
@Injectable()
export class TwilioSmsProvider implements SmsProvider {
  private readonly logger = new Logger('SMS:twilio');
  constructor(private readonly config: ConfigService) {}

  async send(toE164: string, body: string): Promise<void> {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_FROM; // a Twilio number or Messaging Service SID
    if (!sid || !token || !from) throw new Error('Twilio not configured');

    const form = new URLSearchParams({ To: toE164, Body: body });
    if (from.startsWith('MG')) form.set('MessagingServiceSid', from);
    else form.set('From', from);

    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    });
    if (!res.ok) {
      this.logger.error(`Twilio send failed ${res.status}: ${await res.text()}`);
      throw new Error('SMS send failed');
    }
  }
}

/**
 * HybridSmsProvider — cost-aware global routing. African destinations go via Africa's Talking
 * (cheaper local delivery); everywhere else via Twilio. Falls back to Twilio if AT isn't
 * configured. This is the recommended production default for a worldwide app with strong
 * African traffic (Learnix's origin market).
 */
@Injectable()
export class HybridSmsProvider implements SmsProvider {
  // E.164 calling-code prefixes for the African numbering zone (ITU zone 2, +2xx, plus a few).
  private static readonly AFRICAN_PREFIXES = [
    '+20', '+212', '+213', '+216', '+218', '+220', '+221', '+222', '+223', '+224', '+225',
    '+226', '+227', '+228', '+229', '+230', '+231', '+232', '+233', '+234', '+235', '+236',
    '+237', '+238', '+239', '+240', '+241', '+242', '+243', '+244', '+245', '+246', '+248',
    '+249', '+250', '+251', '+252', '+253', '+254', '+255', '+256', '+257', '+258', '+260',
    '+261', '+262', '+263', '+264', '+265', '+266', '+267', '+268', '+269', '+27', '+290',
    '+291', '+297', '+298', '+299',
  ];

  constructor(
    private readonly africas: AfricasTalkingSmsProvider,
    private readonly twilio: TwilioSmsProvider,
  ) {}

  private isAfrican(toE164: string): boolean {
    return HybridSmsProvider.AFRICAN_PREFIXES.some((p) => toE164.startsWith(p));
  }

  async send(toE164: string, body: string): Promise<void> {
    if (this.isAfrican(toE164)) {
      try {
        await this.africas.send(toE164, body);
        return;
      } catch {
        // Fall through to Twilio on AT failure/misconfig.
      }
    }
    await this.twilio.send(toE164, body);
  }
}
