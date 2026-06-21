import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

/**
 * Low-level Safaricom Daraja client: OAuth token (cached ~1h), STK Push, STK Query.
 * All credentials come from env only. Base URL toggles sandbox ↔ production via env.
 *
 * Required env vars:
 *   DARAJA_BASE_URL=https://sandbox.safaricom.co.ke   (or production)
 *   DARAJA_CONSUMER_KEY=...
 *   DARAJA_CONSUMER_SECRET=...
 *   DARAJA_SHORTCODE=...              (BusinessShortCode)
 *   DARAJA_PASSKEY=...                (Lipa Na M-Pesa Online passkey)
 *   DARAJA_TX_TYPE=CustomerPayBillOnline   (or CustomerBuyGoodsOnline for Till)
 *   MPESA_CALLBACK_URL=https://<public-https>/payments/mpesa/callback
 *
 * Dev setup: callback URL must be public HTTPS. Use cloudflared/ngrok to tunnel
 * localhost, then set MPESA_CALLBACK_URL to that tunnel + /payments/mpesa/callback.
 */
@Injectable()
export class DarajaClient {
  private readonly log = new Logger(DarajaClient.name);
  private tokenCache: { token: string; expiresAt: number } | null = null;

  constructor(private readonly config: ConfigService) {}

  private base() {
    return this.config.getOrThrow<string>('DARAJA_BASE_URL').replace(/\/$/, '');
  }

  private timestamp(): string {
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, '0');
    return (
      `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}` +
      `${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
    );
  }

  private password(timestamp: string): string {
    const shortcode = this.config.getOrThrow<string>('DARAJA_SHORTCODE');
    const passkey   = this.config.getOrThrow<string>('DARAJA_PASSKEY');
    return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
  }

  /** Cached OAuth access token — refreshed before expiry */
  private async getToken(): Promise<string> {
    if (this.tokenCache && Date.now() < this.tokenCache.expiresAt) {
      return this.tokenCache.token;
    }
    const key    = this.config.getOrThrow<string>('DARAJA_CONSUMER_KEY');
    const secret = this.config.getOrThrow<string>('DARAJA_CONSUMER_SECRET');
    const basic  = Buffer.from(`${key}:${secret}`).toString('base64');

    const { data } = await axios.get(
      `${this.base()}/oauth/v1/generate?grant_type=client_credentials`,
      { headers: { Authorization: `Basic ${basic}` } },
    );

    const token = data.access_token as string;
    const ttl   = Number(data.expires_in ?? 3600);
    this.tokenCache = { token, expiresAt: Date.now() + (ttl - 60) * 1000 };
    return token;
  }

  /**
   * Initiates an STK push.
   * Returns CheckoutRequestID / MerchantRequestID for tracking and reconciliation.
   */
  async stkPush(params: {
    msisdn: string;         // normalized 2547########
    amount: number;         // whole shillings
    accountReference: string;
    description: string;
  }): Promise<{ checkoutRequestId: string; merchantRequestId: string; raw: any }> {
    const token     = await this.getToken();
    const timestamp = this.timestamp();
    const shortcode = this.config.getOrThrow<string>('DARAJA_SHORTCODE');
    const txType    = this.config.get<string>('DARAJA_TX_TYPE') ?? 'CustomerPayBillOnline';
    const callbackUrl = this.config.getOrThrow<string>('MPESA_CALLBACK_URL');

    const body = {
      BusinessShortCode: shortcode,
      Password:          this.password(timestamp),
      Timestamp:         timestamp,
      TransactionType:   txType,
      Amount:            Math.round(params.amount),
      PartyA:            params.msisdn,
      PartyB:            shortcode,
      PhoneNumber:       params.msisdn,
      CallBackURL:       callbackUrl,
      AccountReference:  params.accountReference.slice(0, 12),
      TransactionDesc:   params.description.slice(0, 13),
    };

    const { data } = await axios.post(
      `${this.base()}/mpesa/stkpush/v1/processrequest`,
      body,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    return {
      checkoutRequestId: data.CheckoutRequestID,
      merchantRequestId: data.MerchantRequestID,
      raw: data,
    };
  }

  /**
   * Reconciliation: query the final status of an STK push.
   * Used by getStatus() after the grace window if no callback arrived.
   */
  async stkQuery(checkoutRequestId: string): Promise<any> {
    const token     = await this.getToken();
    const timestamp = this.timestamp();
    const shortcode = this.config.getOrThrow<string>('DARAJA_SHORTCODE');

    const { data } = await axios.post(
      `${this.base()}/mpesa/stkpushquery/v1/query`,
      {
        BusinessShortCode: shortcode,
        Password:          this.password(timestamp),
        Timestamp:         timestamp,
        CheckoutRequestID: checkoutRequestId,
      },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return data;
  }
}
