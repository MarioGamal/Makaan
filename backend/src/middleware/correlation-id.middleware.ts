import { randomUUID } from 'node:crypto';

import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

const CORRELATION_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface CorrelatedRequest extends Request {
  correlationId?: string;
}

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(
    request: CorrelatedRequest,
    response: Response,
    next: NextFunction,
  ): void {
    const incoming = request.headers['x-correlation-id'];
    const correlationId =
      typeof incoming === 'string' && CORRELATION_ID_PATTERN.test(incoming)
        ? incoming.toLowerCase()
        : randomUUID();
    request.correlationId = correlationId;
    response.setHeader('X-Correlation-Id', correlationId);
    next();
  }
}
