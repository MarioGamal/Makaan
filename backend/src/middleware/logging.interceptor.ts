import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

const SENSITIVE_KEYS = /(otp|token|authorization|password|secret)/i;
const PHONE_PATTERN = /(\+?\d{2,3})?(\d{2,4})(\d{4,})(\d{2})/g;

const maskPhoneNumber = (value: string): string =>
  value.replace(PHONE_PATTERN, (_match, prefix = '', start = '', middle = '', end = '') => {
    const maskedMiddle = middle.length >= 4 ? '****' : '*'.repeat(middle.length);
    return `${prefix}${start}${maskedMiddle}${end}`;
  });

const sanitizeForLogs = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForLogs(item));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => {
        if (SENSITIVE_KEYS.test(key)) {
          return [key, '[REDACTED]'];
        }

        return [key, sanitizeForLogs(nestedValue)];
      }),
    );
  }

  if (typeof value === 'string') {
    if (SENSITIVE_KEYS.test(value)) {
      return '[REDACTED]';
    }

    return maskPhoneNumber(value);
  }

  return value;
};

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{
      method: string;
      originalUrl?: string;
      url: string;
      query?: unknown;
      params?: unknown;
      body?: unknown;
      user?: { id?: string };
    }>();
    const response = context.switchToHttp().getResponse<{ statusCode: number }>();
    const startedAt = Date.now();
    const requestSummary = sanitizeForLogs({
      method: request.method,
      url: request.originalUrl ?? request.url,
      query: request.query,
      params: request.params,
      body: request.body,
      userId: request.user?.id,
    });

    this.logger.log(`Incoming request ${JSON.stringify(requestSummary)}`);

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.log(
            JSON.stringify({
              message: 'Request completed',
              method: request.method,
              url: request.originalUrl ?? request.url,
              statusCode: response.statusCode,
              durationMs: Date.now() - startedAt,
              userId: request.user?.id,
            }),
          );
        },
        error: (error: Error) => {
          this.logger.error(
            JSON.stringify({
              message: 'Request failed',
              method: request.method,
              url: request.originalUrl ?? request.url,
              durationMs: Date.now() - startedAt,
              statusCode: response.statusCode,
              error: sanitizeForLogs(error.message),
              userId: request.user?.id,
            }),
          );
        },
      }),
    );
  }
}

