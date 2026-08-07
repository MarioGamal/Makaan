import { describe, expect, it } from '@jest/globals';

import { parseEnvironment } from '../../src/config/environment';

const localEnvironment = (): NodeJS.ProcessEnv => ({
  APP_MODE: 'local',
  NODE_ENV: 'development',
  PORT: '4000',
  PUBLIC_APP_URL: 'http://localhost:4000',
  ALLOWED_ORIGINS: 'http://localhost:3000',
  TRUSTED_PROXY_CIDRS: '',
  COOKIE_SECURE: 'false',
  COOKIE_SAME_SITE: 'lax',
  COOKIE_DOMAIN: '',
  SELLER_SESSION_IDLE_MINUTES: '480',
  SELLER_SESSION_ABSOLUTE_HOURS: '720',
  ADMIN_SESSION_IDLE_MINUTES: '30',
  ADMIN_SESSION_ABSOLUTE_HOURS: '8',
  CONTACT_INTENT_TTL_SECONDS: '300',
  DATABASE_URL:
    'postgresql://makaan_dev:makaan_dev_password_change_in_production@localhost:5433/makaan_dev',
  DATABASE_TLS_MODE: 'disable',
  DATABASE_TLS_CA_FILE: '',
  REDIS_URL: 'redis://localhost:6379/0',
  REDIS_TLS: 'false',
  SESSION_TOKEN_PEPPER:
    'local-development-session-pepper-change-before-production',
  CSRF_TOKEN_PEPPER: 'local-development-csrf-pepper-change-before-production',
  PHONE_LOOKUP_PEPPER:
    'local-development-phone-pepper-change-before-production',
  FIELD_ENCRYPTION_KEY: 'local-development-32-byte-base64-key-replace',
  OTP_PROVIDER: 'local_fixed',
  LOCAL_FIXED_OTP: '123456',
  MEDIA_PROVIDER: 'local',
  LOCAL_MEDIA_ROOT: 'infrastructure/local-media',
  MALWARE_SCANNER_PROVIDER: 'deterministic',
  MAP_PROVIDER: 'accessible_local',
  LOCAL_ADMIN_EMAIL: 'admin@makaan.test',
  LOCAL_ADMIN_PASSWORD: 'local-admin-password-only',
  LOCAL_ADMIN_TOTP_SECRET: 'JBSWY3DPEHPK3PXP',
  EVIDENCE_RETENTION_DAYS: '30',
  LOG_RETENTION_DAYS: '90',
  LOG_LEVEL: 'debug',
  NEXT_PUBLIC_API_URL: 'http://localhost:4000',
  NEXT_PUBLIC_MAP_PROVIDER: 'accessible_local',
  NEXT_PUBLIC_MAPBOX_TOKEN: '',
});

const productionEnvironment = (): NodeJS.ProcessEnv => ({
  ...localEnvironment(),
  APP_MODE: 'production',
  NODE_ENV: 'production',
  PUBLIC_APP_URL: 'https://api.makaan.eg',
  ALLOWED_ORIGINS: 'https://makaan.eg,https://www.makaan.eg',
  TRUSTED_PROXY_CIDRS: '10.0.0.0/8,2001:db8:1234::/48',
  COOKIE_SECURE: 'true',
  COOKIE_SAME_SITE: 'lax',
  DATABASE_URL:
    'postgresql://app:production-password@db.internal.makaan.eg:5432/makaan',
  DATABASE_TLS_MODE: 'verify-full',
  DATABASE_TLS_CA_FILE: '/run/secrets/database-ca.pem',
  REDIS_URL: 'rediss://cache.internal.makaan.eg:6380/0',
  REDIS_TLS: 'true',
  SESSION_TOKEN_PEPPER: 'production-session-pepper-with-sufficient-entropy',
  CSRF_TOKEN_PEPPER: 'production-csrf-pepper-with-sufficient-entropy',
  PHONE_LOOKUP_PEPPER: 'production-phone-pepper-with-sufficient-entropy',
  FIELD_ENCRYPTION_KEY: 'production-field-encryption-key-from-secret-manager',
  OTP_PROVIDER: 'twilio',
  SMS_PROVIDER: 'twilio',
  TWILIO_ACCOUNT_SID: 'ACproductionAccountId',
  TWILIO_AUTH_TOKEN: 'production-twilio-auth-token',
  TWILIO_PHONE_NUMBER: '+201000000000',
  MEDIA_PROVIDER: 's3',
  MEDIA_S3_REGION: 'me-central-1',
  MEDIA_S3_BUCKET: 'makaan-private-media-production',
  MEDIA_S3_ENDPOINT: 'https://objects.makaan.eg',
  MEDIA_S3_ACCESS_KEY_ID: 'production-media-access-key',
  MEDIA_S3_SECRET_ACCESS_KEY: 'production-media-secret-key',
  MALWARE_SCANNER_PROVIDER: 'clamav',
  MALWARE_SCANNER_PROVIDER_PRODUCTION: 'clamav',
  CLAMAV_HOST: 'clamav.internal.makaan.eg',
  CLAMAV_PORT: '3310',
  MAP_PROVIDER: 'mapbox',
  MAPBOX_TOKEN: 'production-restricted-map-token',
  NEXT_PUBLIC_API_URL: 'https://api.makaan.eg',
  NEXT_PUBLIC_MAP_PROVIDER: 'mapbox',
  NEXT_PUBLIC_MAPBOX_TOKEN: 'production-restricted-map-token',
  LOCAL_FIXED_OTP: undefined,
  LOCAL_MEDIA_ROOT: undefined,
  LOCAL_ADMIN_EMAIL: undefined,
  LOCAL_ADMIN_PASSWORD: undefined,
  LOCAL_ADMIN_TOTP_SECRET: undefined,
});

describe('discriminated application configuration', () => {
  it('accepts explicit local mode with only documented local adapters', () => {
    expect(parseEnvironment(localEnvironment())).toMatchObject({
      appMode: 'local',
      otpProvider: 'local_fixed',
      mediaProvider: 'local',
      malwareScannerProvider: 'deterministic',
      mapProvider: 'accessible_local',
    });
  });

  it('accepts production only when every required secure provider and transport setting is present', () => {
    expect(parseEnvironment(productionEnvironment())).toMatchObject({
      appMode: 'production',
      cookieSecure: true,
      databaseTlsMode: 'verify-full',
      redisTls: true,
      otpProvider: 'twilio',
      mediaProvider: 's3',
      malwareScannerProvider: 'clamav',
      mapProvider: 'mapbox',
    });
  });

  it.each([
    ['missing APP_MODE', { APP_MODE: undefined }],
    ['unknown APP_MODE', { APP_MODE: 'staging' }],
    [
      'placeholder secret',
      { SESSION_TOKEN_PEPPER: 'replace-with-production-secret' },
    ],
    ['placeholder encryption key', { FIELD_ENCRYPTION_KEY: 'change-me' }],
    ['local OTP adapter', { OTP_PROVIDER: 'local_fixed' }],
    ['local media adapter', { MEDIA_PROVIDER: 'local' }],
    ['deterministic scanner', { MALWARE_SCANNER_PROVIDER: 'deterministic' }],
    ['local map adapter', { MAP_PROVIDER: 'accessible_local' }],
    ['insecure cookie', { COOKIE_SECURE: 'false' }],
    ['SameSite none cookie', { COOKIE_SAME_SITE: 'none' }],
    [
      'cookie domain incompatible with host-only cookies',
      { COOKIE_DOMAIN: '.makaan.eg' },
    ],
    ['insecure database TLS', { DATABASE_TLS_MODE: 'disable' }],
    ['missing database CA', { DATABASE_TLS_CA_FILE: '' }],
    [
      'insecure Redis URL',
      { REDIS_URL: 'redis://cache.makaan.example:6379/0' },
    ],
    ['disabled Redis TLS', { REDIS_TLS: 'false' }],
    ['HTTP public URL', { PUBLIC_APP_URL: 'http://api.makaan.eg' }],
    ['wildcard origin', { ALLOWED_ORIGINS: '*' }],
    [
      'localhost production origin',
      { ALLOWED_ORIGINS: 'http://localhost:3000' },
    ],
    ['missing trusted proxy', { TRUSTED_PROXY_CIDRS: '' }],
    ['wildcard trusted proxy', { TRUSTED_PROXY_CIDRS: '0.0.0.0/0' }],
    ['missing SMS credential', { TWILIO_AUTH_TOKEN: '' }],
    ['missing private media bucket', { MEDIA_S3_BUCKET: '' }],
    ['missing scanner host', { CLAMAV_HOST: '' }],
    ['missing production map token', { MAPBOX_TOKEN: '' }],
    [
      'public local map adapter',
      { NEXT_PUBLIC_MAP_PROVIDER: 'accessible_local' },
    ],
    ['local admin fixture', { LOCAL_ADMIN_EMAIL: 'admin@makaan.test' }],
  ])('rejects production %s', (_caseName, override) => {
    expect(() =>
      parseEnvironment({ ...productionEnvironment(), ...override }),
    ).toThrow();
  });

  it('rejects malformed abuse-limit overrides and an agent limit above the owner limit at startup', () => {
    expect(() =>
      parseEnvironment({
        ...localEnvironment(),
        ABUSE_UPLOAD_LIMIT: '0',
      }),
    ).toThrow();
    expect(() =>
      parseEnvironment({
        ...localEnvironment(),
        ABUSE_OWNER_LISTING_SUBMISSION_LIMIT: '2',
        ABUSE_AGENT_LISTING_SUBMISSION_LIMIT: '3',
      }),
    ).toThrow();
  });
});
