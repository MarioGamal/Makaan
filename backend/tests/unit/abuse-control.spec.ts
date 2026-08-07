import { describe, expect, it, jest } from '@jest/globals';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import Redis from 'ioredis';

import { resolveAbuseLimit } from '../../src/config/abuse-limits';
import { AbuseControlService } from '../../src/services/abuse-control.service';

type Settings = Record<string, string | undefined>;

function config(settings: Settings = {}): ConfigService {
  return {
    get: jest.fn((key: string) => settings[key]),
    getOrThrow: jest.fn((key: string) => {
      const value = settings[key];
      if (value === undefined) {
        throw new Error(`missing ${key}`);
      }
      return value;
    }),
  } as unknown as ConfigService;
}

function redis(evalResult: unknown): Redis {
  return {
    eval: jest.fn(async () => evalResult),
  } as unknown as Redis;
}

function request(remoteAddress: string, forwardedFor?: string): Request {
  return {
    socket: { remoteAddress },
    headers: forwardedFor ? { 'x-forwarded-for': forwardedFor } : {},
  } as unknown as Request;
}

describe('AbuseControlService', () => {
  it('uses one atomic Redis script with a namespaced, HMAC-protected identity and configured window', async () => {
    const redisClient = redis(1);
    const service = new AbuseControlService(
      redisClient,
      config({
        SESSION_TOKEN_PEPPER: 'unit-test-pepper',
        ABUSE_CONTACT_LIMIT: '7',
      }),
    );

    await service.consume('contact', ['phone:hash', 'ip:hash']);

    expect(redisClient.eval).toHaveBeenCalledWith(
      expect.stringContaining("redis.call('INCR', KEYS[1])"),
      1,
      expect.stringMatching(/^abuse:contact:[a-f0-9]{64}$/),
      60 * 60,
    );
    expect((redisClient.eval as jest.Mock).mock.calls[0]?.[0]).toContain(
      "redis.call('EXPIRE', KEYS[1], ARGV[1])",
    );
  });

  it('keeps separate identity tuples in separate rate-limit buckets', async () => {
    const redisClient = redis(1);
    const service = new AbuseControlService(
      redisClient,
      config({ SESSION_TOKEN_PEPPER: 'unit-test-pepper' }),
    );

    await service.consume('otpRequest', ['phone:a', 'ip:bc']);
    await service.consume('otpRequest', ['phone:ab', 'ip:c']);

    const firstKey = (redisClient.eval as jest.Mock).mock.calls[0]?.[2];
    const secondKey = (redisClient.eval as jest.Mock).mock.calls[1]?.[2];
    expect(firstKey).not.toEqual(secondKey);
  });

  it.each([
    ['Redis rejection', redis(new Error('redis unavailable'))],
    ['malformed Redis result', redis('not-a-count')],
    ['zero Redis result', redis(0)],
  ])('fails closed on %s', async (_caseName, redisClient) => {
    const service = new AbuseControlService(
      redisClient,
      config({ SESSION_TOKEN_PEPPER: 'unit-test-pepper' }),
    );

    await expect(service.consume('upload', ['ip:hash'])).rejects.toMatchObject({
      status: 503,
      response: { message: 'abuse_control_unavailable' },
    });
  });

  it('honours configured limits and rejects agent submission limits above owner limits', async () => {
    const overridden = config({
      ABUSE_CONTACT_LIMIT: '7',
      ABUSE_OWNER_LISTING_SUBMISSION_LIMIT: '3',
      ABUSE_AGENT_LISTING_SUBMISSION_LIMIT: '4',
    });

    expect(resolveAbuseLimit(overridden, 'contact')).toEqual({
      limit: 7,
      windowSeconds: 60 * 60,
    });
    expect(() =>
      resolveAbuseLimit(overridden, 'agentListingSubmission'),
    ).toThrow(/must not exceed the owner limit/);
  });

  it('does not trust X-Forwarded-For from an untrusted direct peer', () => {
    const service = new AbuseControlService(
      redis(1),
      config({
        SESSION_TOKEN_PEPPER: 'unit-test-pepper',
        TRUSTED_PROXY_CIDRS: '10.0.0.0/8',
      }),
    );

    expect(
      service.clientAddress(request('198.51.100.44', '203.0.113.10')),
    ).toBe('198.51.100.44');
  });

  it('walks only trusted IPv4 proxy hops from right to left', () => {
    const service = new AbuseControlService(
      redis(1),
      config({
        SESSION_TOKEN_PEPPER: 'unit-test-pepper',
        TRUSTED_PROXY_CIDRS: '10.0.0.0/8',
      }),
    );

    expect(
      service.clientAddress(
        request('10.0.0.9', '203.0.113.10, 10.0.0.8, 198.51.100.42'),
      ),
    ).toBe('198.51.100.42');
  });

  it('handles trusted IPv6 CIDRs and bracketed IPv6 direct peers', () => {
    const service = new AbuseControlService(
      redis(1),
      config({
        SESSION_TOKEN_PEPPER: 'unit-test-pepper',
        TRUSTED_PROXY_CIDRS: '2001:db8:1234::/48',
      }),
    );

    expect(
      service.clientAddress(
        request('[2001:db8:1234::9]', '2001:db8:ffff::7, 2001:db8:1234::8'),
      ),
    ).toBe('2001:db8:ffff::7');
  });
});
