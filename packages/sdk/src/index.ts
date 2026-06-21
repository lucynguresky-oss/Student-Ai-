/**
 * @learnix/sdk — Auto-generated API client
 *
 * This package will be auto-generated from the OpenAPI spec.
 * For now, it provides a basic client wrapper.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

export interface ApiResponse<T> {
  data?: T;
  meta?: {
    cursor?: string;
    hasMore?: boolean;
    total?: number;
  };
  error?: {
    type: string;
    title: string;
    status: number;
    detail?: string;
  };
}

export class LearnixClient {
  private baseUrl: string;
  private accessToken?: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || API_BASE_URL;
  }

  setToken(token: string) {
    this.accessToken = token;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    return res.json();
  }

  // Health
  async healthz() {
    return this.request<{ status: string }>('GET', '/healthz');
  }

  async readyz() {
    return this.request<{ status: string; services: Record<string, string> }>('GET', '/readyz');
  }
}

export const learnix = new LearnixClient();
