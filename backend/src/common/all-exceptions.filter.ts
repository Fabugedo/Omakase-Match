import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

/**
 * Global error handling (T014). Every error leaves the API in the contract's
 * Error shape ({ message, code }). Expected HttpExceptions are passed through
 * with their status; anything unexpected is logged server-side and returned as
 * a generic 500 so internals never leak to clients (Principle III).
 */
interface ErrorBody {
  message: string;
  code?: string;
}

function codeForStatus(status: number): string {
  return HttpStatus[status] ?? 'ERROR';
}

function normalizeHttpException(response: string | object, status: number): ErrorBody {
  if (typeof response === 'string') {
    return { message: response, code: codeForStatus(status) };
  }
  const r = response as Record<string, unknown>;
  const rawMessage = r.message ?? r.error;
  const message = Array.isArray(rawMessage)
    ? rawMessage.join(', ')
    : typeof rawMessage === 'string'
      ? rawMessage
      : codeForStatus(status);
  const code = typeof r.code === 'string' ? r.code : codeForStatus(status);
  return { message, code };
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: ErrorBody = { message: 'Internal server error', code: 'INTERNAL_ERROR' };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      body = normalizeHttpException(exception.getResponse(), status);
    } else {
      this.logger.error(
        `Unhandled error on ${req.method} ${req.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    res.status(status).json(body);
  }
}
