import { describe, expect, it, jest } from '@jest/globals';
import type { EntityManager } from 'typeorm';

import { AuditEvent } from '../../src/models/audit-event.entity';

const REDACTED = '[REDACTED]';
const UNSERIALIZABLE = '[UNSERIALIZABLE]';

type RedactForLogs = (value: unknown) => unknown;

type AuditRecordInput = {
  actorKind: 'user' | 'anonymous' | 'system';
  actorId: string | null;
  action: string;
  targetKind: string;
  targetId: string | null;
  correlationId: string;
  metadata?: Record<string, unknown>;
};

type AuditServiceContract = {
  record(manager: EntityManager, input: AuditRecordInput): Promise<void>;
};

function auditPrimitives(): {
  redactForLogs: RedactForLogs;
  AuditService: new () => AuditServiceContract;
} {
  // Loaded at assertion time so this test remains a compile-valid red contract before T024 exists.
  const redaction = require('../../src/utils/log-redaction') as {
    redactForLogs: RedactForLogs;
  };
  const audit = require('../../src/services/audit.service') as {
    AuditService: new () => AuditServiceContract;
  };

  return {
    redactForLogs: redaction.redactForLogs,
    AuditService: audit.AuditService,
  };
}

describe('protected audit and log redaction contract', () => {
  it('recursively redacts protected keys and protected string values while preserving safe audit fields', () => {
    const { redactForLogs } = auditPrimitives();
    const input = {
      eventCategory: 'moderation.listing_approved',
      action: 'listing.approve',
      correlationId: 'corr_01JSAFE',
      targetKind: 'listing',
      targetId: '9b4d0cf7-2a55-4c04-93c9-ff88184e9e24',
      phone: '+201001234567',
      otp: '123456',
      password: 'not-a-real-password',
      sessionToken: 'opaque-session-token',
      csrfToken: 'csrf-token',
      secondFactorSecret: 'JBSWY3DPEHPK3PXP',
      exactLocation: { latitude: 30.0444, longitude: 31.2357 },
      evidence: {
        documentContent: 'Egyptian national ID document contents',
        documentImage: 'base64-identity-document',
      },
      nested: {
        recipientPhone: '+201001234567',
        note: 'Call +201001234567 after approval',
        otpAttempt: '123456',
      },
    };

    const redacted = redactForLogs(input) as Record<string, unknown>;

    expect(redacted).toMatchObject({
      eventCategory: 'moderation.listing_approved',
      action: 'listing.approve',
      correlationId: 'corr_01JSAFE',
      targetKind: 'listing',
      targetId: '9b4d0cf7-2a55-4c04-93c9-ff88184e9e24',
      phone: REDACTED,
      otp: REDACTED,
      password: REDACTED,
      sessionToken: REDACTED,
      csrfToken: REDACTED,
      secondFactorSecret: REDACTED,
      exactLocation: REDACTED,
      evidence: REDACTED,
      nested: {
        recipientPhone: REDACTED,
        note: REDACTED,
        otpAttempt: REDACTED,
      },
    });
  });

  it('does not mutate caller-owned audit input', () => {
    const { redactForLogs } = auditPrimitives();
    const input = {
      action: 'listing.reject',
      correlationId: 'corr_immutable',
      nested: { phoneNumber: '+201001234567' },
    };
    const original = JSON.parse(JSON.stringify(input)) as typeof input;

    redactForLogs(input);

    expect(input).toEqual(original);
  });

  it('fails safely for circular data and throwing accessors without exposing protected values', () => {
    const { redactForLogs } = auditPrimitives();
    const circular: Record<string, unknown> = { phone: '+201001234567' };
    circular.self = circular;
    Object.defineProperty(circular, 'unavailable', {
      enumerable: true,
      get: () => {
        throw new Error('identity document contents must not escape');
      },
    });

    expect(() => redactForLogs(circular)).not.toThrow();
    expect(redactForLogs(circular)).toEqual({
      phone: REDACTED,
      self: UNSERIALIZABLE,
      unavailable: UNSERIALIZABLE,
    });
  });

  it('writes audit events through the supplied transaction manager and rejects independent writes', async () => {
    const { AuditService } = auditPrimitives();
    const transactionalRepository = {
      create: jest.fn((input: AuditRecordInput) => input),
      save: jest.fn(async () => undefined),
    };
    const manager = {
      getRepository: jest.fn(() => transactionalRepository),
    } as unknown as EntityManager;
    const input: AuditRecordInput = {
      actorKind: 'user',
      actorId: '6e8f4228-251a-4b2b-92e3-0df6d05d0ab5',
      action: 'listing.approve',
      targetKind: 'listing',
      targetId: '9b4d0cf7-2a55-4c04-93c9-ff88184e9e24',
      correlationId: 'corr_transaction',
      metadata: { reasonKey: 'listing.approved' },
    };
    const auditService = new AuditService();

    await auditService.record(manager, input);

    expect(manager.getRepository).toHaveBeenCalledWith(AuditEvent);
    expect(transactionalRepository.create).toHaveBeenCalledWith(
      expect.objectContaining(input),
    );
    expect(transactionalRepository.save).toHaveBeenCalledTimes(1);
    await expect(
      auditService.record(undefined as unknown as EntityManager, input),
    ).rejects.toThrow(/entity manager|transaction/i);
  });
});
