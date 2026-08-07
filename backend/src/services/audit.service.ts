import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { AuditActorKind, AuditEvent } from '../models/audit-event.entity';
import { isProtectedKey, redactForLog } from '../utils/log-redaction';

export interface AppendAuditEvent {
  actorKind: AuditActorKind;
  actorId?: string | null;
  actorSnapshot?: Record<string, unknown>;
  sessionId?: string | null;
  action: string;
  targetKind: string;
  targetId?: string | null;
  priorState?: Record<string, unknown> | null;
  resultingState?: Record<string, unknown> | null;
  reasonKey?: string | null;
  metadata?: Record<string, unknown>;
  correlationId: string;
  occurredAt?: Date;
}

const ALLOWED_ACTOR_SNAPSHOT_KEYS = new Set([
  'role',
  'status',
  'participation',
  'accountVersion',
]);
const ALLOWED_METADATA_KEYS = new Set([
  'policyVersion',
  'fieldNames',
  'outcome',
  'source',
  'lockVersion',
  'participation',
  'status',
  'purpose',
  'reasonKey',
]);

@Injectable()
export class AuditService {
  /** The caller supplies its EntityManager so state and audit commit or roll back together. */
  async append(
    manager: EntityManager,
    event: AppendAuditEvent,
  ): Promise<AuditEvent> {
    if (!manager || typeof manager.getRepository !== 'function') {
      throw new Error(
        'A transaction EntityManager is required for audit writes',
      );
    }
    const repository = manager.getRepository(AuditEvent);
    const auditEvent = repository.create({
      actorKind: event.actorKind,
      actorId: event.actorId ?? null,
      actorSnapshot: allowlisted(
        event.actorSnapshot ?? {},
        ALLOWED_ACTOR_SNAPSHOT_KEYS,
      ),
      sessionId: event.sessionId ?? null,
      action: event.action,
      targetKind: event.targetKind,
      targetId: event.targetId ?? null,
      priorState: summarizeState(event.priorState),
      resultingState: summarizeState(event.resultingState),
      reasonKey: event.reasonKey ?? null,
      metadata: allowlisted(event.metadata ?? {}, ALLOWED_METADATA_KEYS),
      correlationId: event.correlationId,
      occurredAt: event.occurredAt ?? new Date(),
    });
    return repository.save(auditEvent);
  }

  async record(
    manager: EntityManager,
    event: AppendAuditEvent,
  ): Promise<AuditEvent> {
    return this.append(manager, event);
  }
}

function allowlisted(
  value: Record<string, unknown>,
  allowedKeys: ReadonlySet<string>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => allowedKeys.has(key) && !isProtectedKey(key))
      .map(([key, nested]) => [key, redactForLog(nested)]),
  );
}

function summarizeState(
  value: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  if (!value) {
    return null;
  }
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !isProtectedKey(key))
      .map(([key, nested]) => [key, redactForLog(nested)]),
  );
}
