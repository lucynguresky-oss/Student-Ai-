import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

export interface EnvelopeResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: null | { code: string; message: string; fields?: Record<string, string> };
  meta?: Record<string, unknown>;
}

/**
 * Wraps every successful response in the standard Learnix API envelope.
 * Controllers can return `{ data, meta }` to pass pagination info,
 * or just return the data directly.
 */
@Injectable()
export class EnvelopeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<EnvelopeResponse> {
    return next.handle().pipe(
      map((responseBody) => {
        // If the controller already returned an envelope-like shape with `data` key
        if (responseBody && typeof responseBody === 'object' && 'data' in responseBody && 'meta' in responseBody) {
          return {
            success: true,
            data: responseBody.data,
            error: null,
            meta: responseBody.meta ?? undefined,
          };
        }

        // If the controller returned { data: ... } without meta
        if (responseBody && typeof responseBody === 'object' && 'data' in responseBody && !('success' in responseBody)) {
          return {
            success: true,
            data: responseBody.data,
            error: null,
          };
        }

        // Otherwise, wrap the raw return value
        return {
          success: true,
          data: responseBody ?? null,
          error: null,
        };
      }),
    );
  }
}
