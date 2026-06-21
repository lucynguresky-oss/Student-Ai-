import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Prisma } from '@prisma/client';

/**
 * Converts Prisma known-request errors into clean HTTP responses so that
 * raw database messages never leak to the client.
 * Uses HttpAdapterHost so it works with any transport (Fastify or Express).
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    this.logger.warn(
      `Prisma ${exception.code}: ${exception.message.split('\n').pop()?.trim()}`,
    );

    const { status, message } = this.resolve(exception);
    // Works with both Fastify and Express adapters
    if (typeof response.status === 'function') {
      // Fastify
      void (response as { status: (code: number) => { send: (body: unknown) => void } })
        .status(status)
        .send({ statusCode: status, message });
    } else {
      // Express fallback
      (response as { statusCode: number; json: (body: unknown) => void }).statusCode = status;
      (response as { statusCode: number; json: (body: unknown) => void }).json({ statusCode: status, message });
    }
  }

  private resolve(e: Prisma.PrismaClientKnownRequestError): {
    status: number;
    message: string;
  } {
    switch (e.code) {
      // Unique constraint violation
      case 'P2002': {
        const fields = (e.meta?.target as string[])?.join(', ') ?? 'field';
        return {
          status: HttpStatus.CONFLICT,
          message: `A record with that ${fields} already exists.`,
        };
      }
      // Record not found
      case 'P2025':
        return { status: HttpStatus.NOT_FOUND, message: 'Record not found.' };
      // Foreign key constraint
      case 'P2003':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Related record not found.',
        };
      // Required field missing
      case 'P2011':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'A required field is missing.',
        };
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'A database error occurred.',
        };
    }
  }
}
