import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';

import {
  HttpException,
  HttpStatus,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import Redis from 'ioredis';

import { AbuseLimitName, resolveAbuseLimit } from '../config/abuse-limits';
import { REDIS_CLIENT } from '../config/redis.module';

const CONSUME_LIMIT_SCRIPT = `
local current = redis.call('INCR', KEYS[1])
if current == 1 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return current
`;

@Injectable()
export class AbuseControlService {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly configService: ConfigService,
  ) {}

  async consume(
    name: AbuseLimitName,
    identities: ReadonlyArray<string>,
  ): Promise<void> {
    if (identities.length === 0 || identities.some((value) => !value)) {
      throw new ServiceUnavailableException('abuse_control_unavailable');
    }
    const limit = resolveAbuseLimit(this.configService, name);
    const identity = this.hashIdentity(identities.join('\u001f'));
    const key = `abuse:${name}:${identity}`;

    try {
      const result = await this.redis.eval(
        CONSUME_LIMIT_SCRIPT,
        1,
        key,
        limit.windowSeconds,
      );
      const attempts = Number(result);
      if (!Number.isSafeInteger(attempts) || attempts <= 0) {
        throw new Error('invalid rate-limit response');
      }
      if (attempts > limit.limit) {
        throw new HttpException(
          { code: 'rate_limit_exceeded', message: 'request_limit_reached' },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    } catch (error) {
      if (
        error instanceof HttpException &&
        error.getStatus() === HttpStatus.TOO_MANY_REQUESTS
      ) {
        throw error;
      }
      throw new ServiceUnavailableException('abuse_control_unavailable');
    }
  }

  clientAddress(request: Request): string {
    const directAddress = normalizeAddress(
      request.socket.remoteAddress ?? request.ip ?? '',
    );
    if (!directAddress) {
      return 'unavailable';
    }

    const trustedCidrs = (
      this.configService.get<string>('TRUSTED_PROXY_CIDRS') ?? ''
    )
      .split(',')
      .map((cidr) => cidr.trim())
      .filter(Boolean);
    if (!isAddressTrusted(directAddress, trustedCidrs)) {
      return directAddress;
    }

    const forwarded = request.headers['x-forwarded-for'];
    if (typeof forwarded !== 'string') {
      return directAddress;
    }
    const chain = forwarded
      .split(',')
      .map((address) => normalizeAddress(address))
      .filter((address): address is string => Boolean(address));
    let current = directAddress;
    for (let index = chain.length - 1; index >= 0; index -= 1) {
      if (!isAddressTrusted(current, trustedCidrs)) {
        break;
      }
      current = chain[index] as string;
    }
    return current;
  }

  protectedIdentity(value: string): string {
    return this.hashIdentity(value);
  }

  protectedClientPrefix(address: string): string {
    const parsed = ipValue(address);
    if (!parsed) {
      return this.hashIdentity('unavailable');
    }
    const prefix = parsed.bits === 32 ? 24 : 56;
    const shift = BigInt(parsed.bits - prefix);
    const masked = (parsed.value >> shift) << shift;
    return this.hashIdentity(`${parsed.bits}:${prefix}:${masked.toString(16)}`);
  }

  private hashIdentity(value: string): string {
    return createHmac(
      'sha256',
      this.configService.getOrThrow<string>('SESSION_TOKEN_PEPPER'),
    )
      .update(value)
      .digest('hex');
  }
}

function normalizeAddress(address: string): string | undefined {
  const trimmed = address.trim().replace(/^\[|\]$/g, '');
  const withoutIpv4Prefix = trimmed.startsWith('::ffff:')
    ? trimmed.slice(7)
    : trimmed;
  return isIP(withoutIpv4Prefix) ? withoutIpv4Prefix : undefined;
}

function isAddressTrusted(
  address: string,
  cidrs: ReadonlyArray<string>,
): boolean {
  return cidrs.some((cidr) => addressInCidr(address, cidr));
}

function addressInCidr(address: string, cidr: string): boolean {
  const [networkAddress, prefixRaw] = cidr.split('/');
  if (!networkAddress || !prefixRaw) {
    return false;
  }
  const addressValue = ipValue(address);
  const networkValue = ipValue(networkAddress);
  if (
    !addressValue ||
    !networkValue ||
    addressValue.bits !== networkValue.bits
  ) {
    return false;
  }
  const prefix = Number(prefixRaw);
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > addressValue.bits) {
    return false;
  }
  const shift = BigInt(addressValue.bits - prefix);
  return addressValue.value >> shift === networkValue.value >> shift;
}

function ipValue(
  address: string,
): { value: bigint; bits: 32 | 128 } | undefined {
  const normalized = normalizeAddress(address);
  if (!normalized) {
    return undefined;
  }
  if (isIP(normalized) === 4) {
    return {
      value: normalized
        .split('.')
        .reduce((value, octet) => (value << 8n) | BigInt(octet), 0n),
      bits: 32,
    };
  }

  const [leftRaw, rightRaw] = normalized.split('::');
  const left = leftRaw ? leftRaw.split(':').filter(Boolean) : [];
  const right = rightRaw ? rightRaw.split(':').filter(Boolean) : [];
  const missing = 8 - left.length - right.length;
  if (missing < 0 || (!normalized.includes('::') && missing !== 0)) {
    return undefined;
  }
  const groups = [
    ...left,
    ...Array.from({ length: missing }, () => '0'),
    ...right,
  ];
  if (
    groups.length !== 8 ||
    groups.some((group) => !/^[0-9a-f]{1,4}$/i.test(group))
  ) {
    return undefined;
  }
  return {
    value: groups.reduce(
      (value, group) => (value << 16n) | BigInt(`0x${group}`),
      0n,
    ),
    bits: 128,
  };
}
