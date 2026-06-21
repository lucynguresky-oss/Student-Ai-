import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

/**
 * PayPal Orders v2 client: OAuth (cached), Create Order, Capture Order,
 * and webhook signature verification.
 *
 * Required env vars:
 *   PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com   (or https://api-m.paypal.com)
 *   PAYPAL_CLIENT_ID=...
 *   PAYPAL_CLIENT_SECRET=...
 *   PAYPAL_WEBHOOK_ID=...       (from the PayPal dashboard webhook you register)
 *
 * NOTE: PayPal does NOT support KES. Use USD (or another supported currency)
 * for the global/PayPal path and M-Pesa for the KES/EA path.
 * Verify the current supported-currency list in PayPal's docs before going live.
 */
@Injectable()
export class PaypalClient {
  private readonly log = new Logger(PaypalClient.name);
  private tokenCache: { token: string; expiresAt: number } | null = null;

  constructor(private readonly config: ConfigService) {}

  private base() {
    return this.config.getOrThrow<string>('PAYPAL_BASE_URL').replace(/\/$/, '');
  }

  private async getToken(): Promise<string> {
    if (this.tokenCache && Date.now() < this.tokenCache.expiresAt) {
      return this.tokenCache.token;
    }
    const id     = this.config.getOrThrow<string>('PAYPAL_CLIENT_ID');
    const secret = this.config.getOrThrow<string>('PAYPAL_CLIENT_SECRET');
    const basic  = Buffer.from(`${id}:${secret}`).toString('base64');

    const { data } = await axios.post(
      `${this.base()}/v1/oauth2/token`,
      'grant_type=client_credentials',
      {
        headers: {
          Authorization:  `Basic ${basic}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );
    const ttl = Number(data.expires_in ?? 32000);
    this.tokenCache = { token: data.access_token, expiresAt: Date.now() + (ttl - 60) * 1000 };
    return this.tokenCache.token;
  }

  /**
   * Creates an order the buyer will approve via the PayPal JS SDK on the client.
   * requestId is an idempotency key — safe to retry with same key.
   */
  async createOrder(params: {
    amount:      number;
    currency:    string; // 3-letter ISO, PayPal-supported (e.g. USD)
    referenceId: string;
    customId:    string; // your paymentId — echoed back in capture + webhook
    description: string;
    requestId:   string; // PayPal-Request-Id (idempotency key)
  }): Promise<{ id: string; status: string }> {
    const token = await this.getToken();
    const value = params.amount.toFixed(2); // 2-decimal for most currencies

    const { data } = await axios.post(
      `${this.base()}/v2/checkout/orders`,
      {
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: params.referenceId,
            custom_id:    params.customId,
            description:  params.description.slice(0, 127),
            amount: { currency_code: params.currency, value },
          },
        ],
      },
      {
        headers: {
          Authorization:     `Bearer ${token}`,
          'Content-Type':    'application/json',
          'PayPal-Request-Id': params.requestId,
        },
      },
    );
    return { id: data.id, status: data.status };
  }

  /** Captures funds for a buyer-approved order. */
  async captureOrder(orderId: string): Promise<{
    status:    string;
    captureId?: string;
    amount?:   { currency_code: string; value: string };
    customId?: string;
  }> {
    const token = await this.getToken();
    const { data } = await axios.post(
      `${this.base()}/v2/checkout/orders/${orderId}/capture`,
      {},
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } },
    );
    const cap = data?.purchase_units?.[0]?.payments?.captures?.[0];
    return {
      status:    data.status,
      captureId: cap?.id,
      amount:    cap?.amount,
      customId:  cap?.custom_id ?? data?.purchase_units?.[0]?.custom_id,
    };
  }

  /**
   * Verifies a webhook event came from PayPal (prevents spoofed confirmations).
   * Must be called with the RAW body bytes — NOT the parsed JSON.
   */
  async verifyWebhook(headers: Record<string, any>, rawEvent: any): Promise<boolean> {
    const token     = await this.getToken();
    const webhookId = this.config.getOrThrow<string>('PAYPAL_WEBHOOK_ID');

    const { data } = await axios.post(
      `${this.base()}/v1/notifications/verify-webhook-signature`,
      {
        auth_algo:        headers['paypal-auth-algo'],
        cert_url:         headers['paypal-cert-url'],
        transmission_id:  headers['paypal-transmission-id'],
        transmission_sig: headers['paypal-transmission-sig'],
        transmission_time: headers['paypal-transmission-time'],
        webhook_id:       webhookId,
        webhook_event:    rawEvent,
      },
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } },
    );
    return data?.verification_status === 'SUCCESS';
  }
}
