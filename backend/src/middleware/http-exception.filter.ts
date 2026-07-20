import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

type ErrorResponseBody = {
  statusCode: number;
  message: string | string[];
  error: string;
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<{
      status: (code: number) => { json: (body: ErrorResponseBody) => void };
    }>();

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
        message: (normalizedResponse.message as string | string[]) ?? exception.message,
        error: (normalizedResponse.error as string) ?? exception.name,
      });
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: 'Internal Server Error',
    });
  }
}

