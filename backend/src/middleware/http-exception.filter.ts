import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

type ErrorResponseBody = {
  statusCode: number;
  code: string;
  message: string | string[];
  error: string;
  correlationId: string;
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<{
      status: (code: number) => { json: (body: ErrorResponseBody) => void };
    }>();
    const request = ctx.getRequest<{ correlationId?: string }>();
    const correlationId = request.correlationId ?? 'unavailable';

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const normalizedResponse =
        typeof exceptionResponse === 'string'
          ? {
              message: exceptionResponse,
              error: exception.name,
            }
          : (exceptionResponse as Record<string, unknown>);

      response.status(statusCode).json({
        statusCode,
        code:
          (normalizedResponse.code as string | undefined) ??
          errorCode(statusCode, normalizedResponse.message),
        message:
          (normalizedResponse.message as string | string[]) ??
          exception.message,
        error: (normalizedResponse.error as string) ?? exception.name,
        correlationId,
      });
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'internal_error',
      message: 'Internal server error',
      error: 'Internal Server Error',
      correlationId,
    });
  }
}

function errorCode(statusCode: number, message: unknown): string {
  const normalized = Array.isArray(message)
    ? message.join(' ').toLowerCase()
    : String(message ?? '').toLowerCase();
  if (statusCode === HttpStatus.UNAUTHORIZED) {
    return normalized.includes('session')
      ? 'SESSION_EXPIRED'
      : 'UNAUTHENTICATED';
  }
  if (statusCode === HttpStatus.FORBIDDEN) {
    return normalized.includes('csrf') || normalized.includes('origin')
      ? 'CSRF_INVALID'
      : 'FORBIDDEN';
  }
  if (statusCode === HttpStatus.NOT_FOUND) return 'NOT_FOUND';
  if (statusCode === HttpStatus.CONFLICT) return 'CONFLICT';
  if (statusCode === HttpStatus.TOO_MANY_REQUESTS) return 'RATE_LIMITED';
  if (statusCode === HttpStatus.UNSUPPORTED_MEDIA_TYPE) return 'MEDIA_INVALID';
  if (statusCode === HttpStatus.BAD_REQUEST) return 'VALIDATION_ERROR';
  return 'INTERNAL_ERROR';
}
