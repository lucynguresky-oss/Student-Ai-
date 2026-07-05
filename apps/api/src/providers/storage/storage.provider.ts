import { Injectable } from '@nestjs/common';
import { createHmac, createHash } from 'node:crypto';
import { ConfigService } from '../../core/config/config.service';

export interface PresignedUpload {
  url: string;
  method: 'PUT';
  key: string;
  headers: Record<string, string>;
  publicUrl: string;
}

/** StorageProvider abstraction (§5.3 avatar presign). */
export interface StorageProvider {
  presignPut(key: string, contentType: string, maxBytes: number): Promise<PresignedUpload>;
  publicUrl(key: string): string;
  getObject(key: string): Promise<{ data: Buffer; contentType: string }>;
  putObject(key: string, data: Buffer, contentType: string): Promise<void>;
}

export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');

@Injectable()
export class MockStorageProvider implements StorageProvider {
  private static readonly store = new Map<string, { data: Buffer; contentType: string }>();

  constructor(private readonly config: ConfigService) {}

  async presignPut(key: string, contentType: string, _maxBytes: number): Promise<PresignedUpload> {
    return {
      url: `${this.config.env.API_BASE_URL}/dev-upload/${key}`,
      method: 'PUT',
      key,
      headers: { 'Content-Type': contentType },
      publicUrl: this.publicUrl(key),
    };
  }

  publicUrl(key: string): string {
    const base = this.config.env.STORAGE_PUBLIC_BASE_URL ?? `${this.config.env.API_BASE_URL}/mock-media`;
    return `${base}/${key}`;
  }

  async getObject(key: string): Promise<{ data: Buffer; contentType: string }> {
    const obj = MockStorageProvider.store.get(key);
    if (!obj) throw new Error(`Object not found: ${key}`);
    return obj;
  }

  async putObject(key: string, data: Buffer, contentType: string): Promise<void> {
    MockStorageProvider.store.set(key, { data, contentType });
  }
}

/**
 * Cloudflare R2 adapter — DECIDED default (§15): cheap egress, S3-compatible.
 */
@Injectable()
export class R2StorageProvider implements StorageProvider {
  constructor(private readonly config: ConfigService) {}

  publicUrl(key: string): string {
    const base = this.config.env.STORAGE_PUBLIC_BASE_URL;
    if (!base) throw new Error('STORAGE_PUBLIC_BASE_URL required');
    return `${base}/${key}`;
  }

  private signUrl(method: 'GET' | 'PUT', key: string, contentType?: string): { url: string; headers: Record<string, string> } {
    const {
      STORAGE_BUCKET: bucket,
      STORAGE_ENDPOINT: endpoint,
      STORAGE_ACCESS_KEY_ID: accessKey,
      STORAGE_SECRET_ACCESS_KEY: secretKey,
      STORAGE_REGION: region,
    } = this.config.env;
    if (!bucket || !endpoint || !accessKey || !secretKey) throw new Error('R2 not configured');

    const host = new URL(endpoint).host;
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);
    const service = 's3';
    const scope = `${dateStamp}/${region}/${service}/aws4_request`;
    const expires = 300;

    const canonicalUri = `/${bucket}/${key}`;
    const params = new URLSearchParams({
      'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
      'X-Amz-Credential': `${accessKey}/${scope}`,
      'X-Amz-Date': amzDate,
      'X-Amz-Expires': String(expires),
      'X-Amz-SignedHeaders': 'host',
    });
    const canonicalQuery = [...params.entries()]
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');

    const canonicalRequest = [
      method,
      canonicalUri,
      canonicalQuery,
      `host:${host}\n`,
      'host',
      'UNSIGNED-PAYLOAD',
    ].join('\n');

    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      scope,
      createHash('sha256').update(canonicalRequest).digest('hex'),
    ].join('\n');

    const kDate = createHmac('sha256', `AWS4${secretKey}`).update(dateStamp).digest();
    const kRegion = createHmac('sha256', kDate).update(region).digest();
    const kService = createHmac('sha256', kRegion).update(service).digest();
    const kSigning = createHmac('sha256', kService).update('aws4_request').digest();
    const signature = createHmac('sha256', kSigning).update(stringToSign).digest('hex');

    const url = `${endpoint}${canonicalUri}?${canonicalQuery}&X-Amz-Signature=${signature}`;
    const headers: Record<string, string> = { host };
    if (contentType) {
      headers['Content-Type'] = contentType;
    }
    return { url, headers };
  }

  async presignPut(key: string, contentType: string, _maxBytes: number): Promise<PresignedUpload> {
    const signed = this.signUrl('PUT', key, contentType);
    return {
      url: signed.url,
      method: 'PUT',
      key,
      headers: signed.headers,
      publicUrl: this.publicUrl(key),
    };
  }

  async getObject(key: string): Promise<{ data: Buffer; contentType: string }> {
    const signed = this.signUrl('GET', key);
    const res = await fetch(signed.url, {
      method: 'GET',
      headers: signed.headers,
    });
    if (!res.ok) throw new Error(`Failed to fetch ${key}: ${res.statusText}`);
    const arrayBuffer = await res.arrayBuffer();
    const data = Buffer.from(arrayBuffer);
    const contentType = res.headers.get('content-type') || 'application/octet-stream';
    return { data, contentType };
  }

  async putObject(key: string, data: Buffer, contentType: string): Promise<void> {
    const signed = this.signUrl('PUT', key, contentType);
    const res = await fetch(signed.url, {
      method: 'PUT',
      headers: signed.headers,
      body: data,
    });
    if (!res.ok) throw new Error(`Failed to upload ${key}: ${res.statusText}`);
  }
}
