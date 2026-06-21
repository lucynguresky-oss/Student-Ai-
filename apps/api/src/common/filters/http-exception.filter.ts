import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { v4 as uuidv4 } from 'uuid';

interface ErrorResponse {
  success: false;
  data: null;
  error: {
    code: string;
    message: string;
    fields?: Record<string, string[]>;
    requestId: string;
  };
}

/**
 * Central exception filter — catches all exceptions and formats them
 * into the standard Learnix error envelope. Never leaks stack traces.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();
    const requestId = uuidv4();

    let status: number;
    let code: string;
    let message: string;
    let fields: Record<string, string[]> | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exResponse = exception.getResponse();

      if (typeof exResponse === 'string') {
        code = this.statusToCode(status);
        message = exResponse;
      } else if (typeof exResponse === 'object' && exResponse !== null) {
        const obj = exResponse as Record<string, unknown>;
        code = (obj.error as string) ?? this.statusToCode(status);
        message = Array.isArray(obj.message)
          ? (obj.message as string[]).join('; ')
          : (obj.message as string) ?? 'An error occurred';

        // Extract validation field errors from class-validator
        if (Array.isArray(obj.message) && status === HttpStatus.BAD_REQUEST) {
          code = 'VALIDATION_ERROR';
          fields = this.extractValidationFields(obj.message as string[]);
        }
      } else {
        code = this.statusToCode(status);
        message = 'An error occurred';
      }
    } else {
      // Unhandled exceptions — log the full stack, return generic message
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      code = 'INTERNAL_ERROR';
      message = 'An unexpected error occurred';

      this.logger.error(
        `Unhandled exception [${requestId}] ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    // Log all errors (debug level for 4xx, error level for 5xx)
    if (status >= 500) {
      this.logger.error(`[${requestId}] ${status} ${code}: ${message}`);
    } else {
      this.logger.warn(`[${requestId}] ${status} ${code}: ${message}`);
    }

    const errorResponse: ErrorResponse = {
      success: false,
      data: null,
      error: {
        code,
        message,
        ...(fields && { fields }),
        requestId,
      },
    };

    response.status(status).send(errorResponse);
  }

  private statusToCode(status: number): string {
    const map: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'RATE_LIMITED',
      500: 'INTERNAL_ERROR',
    };
    return map[status] ?? `HTTP_${status}`;
  }

  private extractValidationFields(messages: string[]): Record<string, string[]> {
    const fields: Record<string, string[]> = {};
    for (const msg of messages) {
      // class-validator messages often start with the property name
      const parts = msg.split(' ');
      const field = parts[0] ?? 'unknown';
      if (!fields[field]) fields[field] = [];
      fields[field].push(msg);
    }
    return fields;
  }
}
