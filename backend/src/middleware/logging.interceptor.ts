import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

import { redactForLog } from '../utils/log-redaction';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{
      method: string;
      originalUrl?: string;
      url: string;
      baseUrl?: string;
      route?: { path?: string };
      query?: unknown;
      params?: unknown;
      correlationId?: string;
    }>();
    const response = context
      .switchToHttp()
      .getResponse<{ statusCode: number }>();
    const startedAt = Date.now();
    const routePath = request.route?.path;
    const safeUrl = routePath
      ? `${request.baseUrl ?? ''}${routePath}`
      : (request.originalUrl ?? request.url).split('?')[0];
    const requestSummary = redactForLog({
      method: request.method,
      url: safeUrl,
      queryKeys:
        request.query && typeof request.query === 'object'
          ? Object.keys(request.query)
          : [],
      paramKeys:
        request.params && typeof request.params === 'object'
          ? Object.keys(request.params)
          : [],
      correlationId: request.correlationId,
    });

    this.logger.log(`Incoming request ${JSON.stringify(requestSummary)}`);

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.log(
            JSON.stringify({
              message: 'Request completed',
              method: request.method,
              url: safeUrl,
              statusCode: response.statusCode,
              durationMs: Date.now() - startedAt,
              correlationId: request.correlationId,
            }),
          );
        },
        error: (error: Error) => {
          this.logger.error(
            JSON.stringify({
              message: 'Request failed',
              method: request.method,
              url: safeUrl,
              durationMs: Date.now() - startedAt,
              statusCode: response.statusCode,
              error: redactForLog(error.message),
              correlationId: request.correlationId,
            }),
          );
        },
      }),
    );
  }
}
