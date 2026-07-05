import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import { ERROR_CODES, ERROR_MESSAGES, type ApiErrorEnvelope, type ErrorCode } from '@learnix/validation';

/**
 * AppException — throw this anywhere to produce the §5 error envelope with a typed code.
 */
export class AppException extends HttpException {
  constructor(
    readonly code: ErrorCode,
    status: HttpStatus,
    message?: string,
    readonly details?: Record<string, unknown>,
  ) {
    super({ code, message: message ?? ERROR_MESSAGES[code], details }, status);
  }

  static unauthorized(code: ErrorCode = ERROR_CODES.AUTH_UNAUTHORIZED, message?: string) {
    return new AppException(code, HttpStatus.UNAUTHORIZED, message);
  }
  static forbidden(code: ErrorCode = ERROR_CODES.FORBIDDEN, message?: string, details?: Record<string, unknown>) {
    return new AppException(code, HttpStatus.FORBIDDEN, message, details);
  }
  static badRequest(code: ErrorCode, message?: string, details?: Record<string, unknown>) {
    return new AppException(code, HttpStatus.BAD_REQUEST, message, details);
  }
  static conflict(code: ErrorCode, message?: string) {
    return new AppException(code, HttpStatus.CONFLICT, message);
  }
  static notFound(code: ErrorCode = ERROR_CODES.NOT_FOUND, message?: string) {
    return new AppException(code, HttpStatus.NOT_FOUND, message);
  }
  static rateLimited(retryAfterSec: number) {
    return new AppException(ERROR_CODES.RATE_LIMITED, HttpStatus.TOO_MANY_REQUESTS, undefined, {
      retryAfter: retryAfterSec,
    });
  }
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: ApiErrorEnvelope = {
      error: { code: ERROR_CODES.INTERNAL, message: ERROR_MESSAGES.INTERNAL },
    };

    if (exception instanceof AppException) {
      status = exception.getStatus();
      const resp = exception.getResponse() as { code: ErrorCode; message: string; details?: Record<string, unknown> };
      body = { error: { code: resp.code, message: resp.message, details: resp.details } };
      if (resp.details?.retryAfter) reply.header('Retry-After', String(resp.details.retryAfter));
    } else if (exception instanceof ZodError) {
      status = HttpStatus.BAD_REQUEST;
      body = {
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: ERROR_MESSAGES.VALIDATION_ERROR,
          details: { issues: exception.issues.map((i) => ({ path: i.path, message: i.message })) },
        },
      };
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const r = exception.getResponse();
      const message = typeof r === 'string' ? r : ((r as { message?: string }).message ?? 'Error');
      const code =
        status === HttpStatus.NOT_FOUND
          ? ERROR_CODES.NOT_FOUND
          : status === HttpStatus.FORBIDDEN
            ? ERROR_CODES.FORBIDDEN
            : status === HttpStatus.UNAUTHORIZED
              ? ERROR_CODES.AUTH_UNAUTHORIZED
              : ERROR_CODES.VALIDATION_ERROR;
      body = { error: { code, message: Array.isArray(message) ? message.join('; ') : message } };
    } else {
      this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    }

    reply.status(status).send(body);
  }
}
