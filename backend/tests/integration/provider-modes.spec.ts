import { describe, expect, it, jest } from '@jest/globals';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Test } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { parseEnvironment } from '../../src/config/environment';
import { LocalMapMetadataProvider } from '../../src/services/providers/local/local-map-metadata.provider';
import { LocalMediaProvider } from '../../src/services/providers/local/local-media.provider';
import { LocalOtpProvider } from '../../src/services/providers/local/local-otp.provider';
import { DeterministicScannerProvider } from '../../src/services/providers/local/deterministic-scanner.provider';
import {
  MAP_METADATA_PROVIDER,
  MEDIA_PROVIDER,
  MEDIA_SCANNER_PROVIDER,
  OTP_PROVIDER,
  ProvidersModule,
} from '../../src/services/providers/providers.module';

const EICAR = 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*';

function providerConfig(values: Record<string, string>) {
  return { getOrThrow: jest.fn((name: string) => values[name]), get: jest.fn((name: string) => values[name]) };
}

function completeProductionEnvironment(): NodeJS.ProcessEnv {
  return {
    APP_MODE: 'production', NODE_ENV: 'production', PORT: '4000', PUBLIC_APP_URL: 'https://api.makaan.eg',
    ALLOWED_ORIGINS: 'https://makaan.eg', TRUSTED_PROXY_CIDRS: '10.0.0.0/8', COOKIE_SECURE: 'true', COOKIE_SAME_SITE: 'lax',
    SELLER_SESSION_IDLE_MINUTES: '480', SELLER_SESSION_ABSOLUTE_HOURS: '720', ADMIN_SESSION_IDLE_MINUTES: '30', ADMIN_SESSION_ABSOLUTE_HOURS: '8', CONTACT_INTENT_TTL_SECONDS: '300',
    DATABASE_URL: 'postgresql://app:secure-password@db.internal.makaan.eg:5432/makaan', DATABASE_TLS_MODE: 'verify-full', DATABASE_TLS_CA_FILE: '/run/secrets/db-ca.pem',
    REDIS_URL: 'rediss://cache.internal.makaan.eg:6380/0', REDIS_TLS: 'true',
    SESSION_TOKEN_PEPPER: 'secure-production-session-pepper', CSRF_TOKEN_PEPPER: 'secure-production-csrf-pepper', PHONE_LOOKUP_PEPPER: 'secure-production-phone-pepper', FIELD_ENCRYPTION_KEY: 'secure-production-field-encryption-key',
    OTP_PROVIDER: 'twilio', SMS_PROVIDER: 'twilio', TWILIO_ACCOUNT_SID: 'ACproduction', TWILIO_AUTH_TOKEN: 'secure-token', TWILIO_PHONE_NUMBER: '+201000000000',
    MEDIA_PROVIDER: 's3', MEDIA_S3_REGION: 'me-central-1', MEDIA_S3_BUCKET: 'makaan-private-media', MEDIA_S3_ENDPOINT: 'https://objects.makaan.eg', MEDIA_S3_ACCESS_KEY_ID: 'access-key', MEDIA_S3_SECRET_ACCESS_KEY: 'secret-key',
    MALWARE_SCANNER_PROVIDER: 'clamav', CLAMAV_HOST: 'clamav.internal.makaan.eg', CLAMAV_PORT: '3310', MAP_PROVIDER: 'mapbox', MAPBOX_TOKEN: 'restricted-map-token',
    NEXT_PUBLIC_API_URL: 'https://api.makaan.eg', NEXT_PUBLIC_MAP_PROVIDER: 'mapbox', NEXT_PUBLIC_MAPBOX_TOKEN: 'restricted-map-token', EVIDENCE_RETENTION_DAYS: '30', LOG_RETENTION_DAYS: '90', LOG_LEVEL: 'info',
  };
}

describe('local/test provider modes', () => {
  it('provides deterministic account-free OTP, media, scanner, and accessible-map substitutes', async () => {
    const otp = new LocalOtpProvider();
    expect(await otp.request({ phone: '+201001234567', purpose: 'seller_sign_in' })).toEqual({ accepted: true, expiresInSeconds: 300 });
    expect(await otp.verify({ phone: '+201001234567', purpose: 'seller_sign_in', code: '123456' })).toEqual({ status: 'verified' });
    expect(await otp.verify({ phone: '+201001234567', purpose: 'seller_sign_in', code: '000000' })).toEqual({ status: 'invalid' });

    const scanner = new DeterministicScannerProvider();
    expect(await scanner.scan({ bytes: Buffer.from('safe fixture'), contentType: 'image/webp', objectKey: 'safe.webp' })).toEqual({ verdict: 'clean' });
    expect(await scanner.scan({ bytes: Buffer.from(EICAR), contentType: 'image/webp', objectKey: 'eicar.webp' })).toEqual({ verdict: 'malicious', reasonCode: 'test_signature_detected' });
    expect(await scanner.scan({ bytes: Buffer.from('MAKAAN_SCANNER_ERROR_TEST_MARKER'), contentType: 'image/webp', objectKey: 'error.webp' })).toEqual({ verdict: 'error', reasonCode: 'scanner_unavailable' });

    const map = await new LocalMapMetadataProvider().getPublicMetadata();
    expect(map).toMatchObject({ provider: 'local', presentation: 'accessible-list-fallback', requiresAccessToken: false });

    const mediaRoot = await mkdtemp(join(tmpdir(), 'makaan-provider-test-'));
    try {
      const media = new LocalMediaProvider(mediaRoot);
      const stored = await media.write({ namespace: 'listing-media', key: 'fixture/photo.webp', bytes: Buffer.from('safe fixture'), contentType: 'image/webp' });
      expect(stored.byteLength).toBe(12);
      await expect(media.read(stored)).resolves.toEqual(Buffer.from('safe fixture'));
      await media.delete(stored);
      await expect(media.read(stored)).rejects.toThrow('unavailable');
    } finally {
      await rm(mediaRoot, { recursive: true, force: true });
    }
  });

  it('binds the four local substitutes only in local/test mode', async () => {
    const values = { APP_MODE: 'test', OTP_PROVIDER: 'local_fixed', MEDIA_PROVIDER: 'local', MALWARE_SCANNER_PROVIDER: 'deterministic', MAP_PROVIDER: 'accessible_local', LOCAL_MEDIA_ROOT: 'infrastructure/local-media' };
    const module = await Test.createTestingModule({ imports: [ConfigModule.forRoot({ isGlobal: true }), ProvidersModule] })
      .overrideProvider(ConfigService).useValue(providerConfig(values)).compile();
    expect(module.get(OTP_PROVIDER)).toBeInstanceOf(LocalOtpProvider);
    expect(module.get(MEDIA_PROVIDER)).toBeInstanceOf(LocalMediaProvider);
    expect(module.get(MEDIA_SCANNER_PROVIDER)).toBeInstanceOf(DeterministicScannerProvider);
    expect(module.get(MAP_METADATA_PROVIDER)).toBeInstanceOf(LocalMapMetadataProvider);
  });

  it('rejects production placeholders and cannot register local substitutes in production', async () => {
    expect(() => parseEnvironment({ ...completeProductionEnvironment(), SESSION_TOKEN_PEPPER: 'replace-with-production-secret' })).toThrow();
    expect(() => parseEnvironment({ ...completeProductionEnvironment(), MAP_PROVIDER: 'accessible_local' })).toThrow();

    const values = { APP_MODE: 'production', OTP_PROVIDER: 'local_fixed', MEDIA_PROVIDER: 'local', MALWARE_SCANNER_PROVIDER: 'deterministic', MAP_PROVIDER: 'accessible_local', LOCAL_MEDIA_ROOT: 'infrastructure/local-media' };
    await expect(
      Test.createTestingModule({ imports: [ConfigModule.forRoot({ isGlobal: true }), ProvidersModule] })
        .overrideProvider(ConfigService).useValue(providerConfig(values)).compile(),
    ).rejects.toThrow('provider is not registered');
  });
});
