export const APP_MODES = ['local', 'test', 'production'] as const;
export type AppMode = (typeof APP_MODES)[number];

export type OtpProviderMode = 'local_fixed' | 'twilio';
export type MediaProviderMode = 'local' | 's3';
export type MalwareScannerProviderMode = 'deterministic' | 'clamav';
export type MapProviderMode = 'accessible_local' | 'mapbox';
export type DatabaseTlsMode = 'disable' | 'verify-full';

export interface EnvironmentConfig {
  appMode: AppMode;
  nodeEnv: string;
  port: number;
  publicAppUrl: URL;
  allowedOrigins: string[];
  trustedProxyCidrs: string[];
  cookieSecure: boolean;
  cookieSameSite: 'lax';
  cookieDomain?: string;
  sellerSessionIdleMinutes: number;
  sellerSessionAbsoluteHours: number;
  adminSessionIdleMinutes: number;
  adminSessionAbsoluteHours: number;
  contactIntentTtlSeconds: number;
  databaseUrl: string;
  databaseTlsMode: DatabaseTlsMode;
  databaseTlsCaFile?: string;
  redisUrl: string;
  redisTls: boolean;
  sessionTokenPepper: string;
  csrfTokenPepper: string;
  phoneLookupPepper: string;
  fieldEncryptionKey: string;
  otpProvider: OtpProviderMode;
  mediaProvider: MediaProviderMode;
  malwareScannerProvider: MalwareScannerProviderMode;
  mapProvider: MapProviderMode;
  evidenceRetentionDays: number;
  logRetentionDays: number;
  logLevel: string;
}

interface ValidationIssue {
  name: string;
  reason: string;
}

export class EnvironmentValidationError extends Error {
  readonly issues: ReadonlyArray<ValidationIssue>;

  constructor(issues: ValidationIssue[]) {
    super(
      `Invalid application configuration: ${issues.map(({ name, reason }) => `${name} ${reason}`).join('; ')}`,
    );
    this.name = 'EnvironmentValidationError';
    this.issues = issues;
  }
}

const PLACEHOLDER_FRAGMENTS = [
  'replace-with',
  'change-me',
  'change-before-production',
  'local-development',
  'local-admin',
];

const SECRET_NAMES = [
  'SESSION_TOKEN_PEPPER',
  'CSRF_TOKEN_PEPPER',
  'PHONE_LOOKUP_PEPPER',
  'FIELD_ENCRYPTION_KEY',
] as const;

const LOCAL_ONLY_NAMES = [
  'LOCAL_FIXED_OTP',
  'LOCAL_MEDIA_ROOT',
  'LOCAL_ADMIN_EMAIL',
  'LOCAL_ADMIN_PASSWORD',
  'LOCAL_ADMIN_TOTP_SECRET',
] as const;

const ABUSE_LIMIT_NAMES = [
  'ABUSE_OTP_REQUEST_LIMIT',
  'ABUSE_OTP_VERIFICATION_LIMIT',
  'ABUSE_ADMIN_LOGIN_LIMIT',
  'ABUSE_OWNER_LISTING_SUBMISSION_LIMIT',
  'ABUSE_AGENT_LISTING_SUBMISSION_LIMIT',
  'ABUSE_UPLOAD_LIMIT',
  'ABUSE_CONTACT_LIMIT',
] as const;

function valueOf(environment: NodeJS.ProcessEnv, name: string): string {
  return environment[name]?.trim() ?? '';
}

function required(
  environment: NodeJS.ProcessEnv,
  name: string,
  issues: ValidationIssue[],
): string {
  const value = valueOf(environment, name);
  if (!value) {
    issues.push({ name, reason: 'is required' });
  }
  return value;
}

function positiveInteger(
  environment: NodeJS.ProcessEnv,
  name: string,
  issues: ValidationIssue[],
  maximum = Number.MAX_SAFE_INTEGER,
): number {
  const raw = required(environment, name, issues);
  const parsed = Number(raw);
  if (!Number.isSafeInteger(parsed) || parsed <= 0 || parsed > maximum) {
    issues.push({
      name,
      reason: `must be a positive integer no greater than ${maximum}`,
    });
  }
  return parsed;
}

function booleanValue(
  environment: NodeJS.ProcessEnv,
  name: string,
  issues: ValidationIssue[],
): boolean {
  const raw = required(environment, name, issues);
  if (raw !== 'true' && raw !== 'false') {
    issues.push({ name, reason: 'must be true or false' });
  }
  return raw === 'true';
}

function oneOf<const T extends readonly string[]>(
  environment: NodeJS.ProcessEnv,
  name: string,
  allowed: T,
  issues: ValidationIssue[],
): T[number] {
  const raw = required(environment, name, issues);
  if (!allowed.includes(raw)) {
    issues.push({ name, reason: `must be one of ${allowed.join(', ')}` });
  }
  return raw as T[number];
}

function urlValue(
  environment: NodeJS.ProcessEnv,
  name: string,
  issues: ValidationIssue[],
  protocols: string[],
): URL {
  const raw = required(environment, name, issues);
  try {
    const url = new URL(raw);
    if (!protocols.includes(url.protocol)) {
      issues.push({ name, reason: `must use ${protocols.join(' or ')}` });
    }
    return url;
  } catch {
    issues.push({ name, reason: 'must be a valid URL' });
    return new URL('http://invalid.local');
  }
}

function isReservedExampleHost(hostname: string): boolean {
  return hostname === 'example' || hostname.endsWith('.example');
}

function isPlaceholder(value: string): boolean {
  const normalized = value.toLowerCase();
  return PLACEHOLDER_FRAGMENTS.some((fragment) =>
    normalized.includes(fragment),
  );
}

function parseAllowedOrigins(
  environment: NodeJS.ProcessEnv,
  issues: ValidationIssue[],
  production: boolean,
): string[] {
  const raw = required(environment, 'ALLOWED_ORIGINS', issues);
  const origins = raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (origins.length === 0 || origins.includes('*')) {
    issues.push({
      name: 'ALLOWED_ORIGINS',
      reason: 'must be a non-wildcard exact allowlist',
    });
  }

  for (const origin of origins) {
    try {
      const url = new URL(origin);
      const isExactOrigin =
        url.origin === origin && !url.username && !url.password;
      if (!isExactOrigin) {
        issues.push({
          name: 'ALLOWED_ORIGINS',
          reason: 'must contain exact origins only',
        });
      }
      if (
        production &&
        (url.protocol !== 'https:' ||
          url.hostname === 'localhost' ||
          url.hostname === '127.0.0.1' ||
          isReservedExampleHost(url.hostname))
      ) {
        issues.push({
          name: 'ALLOWED_ORIGINS',
          reason: 'must contain production HTTPS origins',
        });
      }
    } catch {
      issues.push({
        name: 'ALLOWED_ORIGINS',
        reason: 'contains an invalid origin',
      });
    }
  }

  return [...new Set(origins)];
}

function parseTrustedProxyCidrs(
  environment: NodeJS.ProcessEnv,
  issues: ValidationIssue[],
  production: boolean,
): string[] {
  const cidrs = valueOf(environment, 'TRUSTED_PROXY_CIDRS')
    .split(',')
    .map((cidr) => cidr.trim())
    .filter(Boolean);

  if (production && cidrs.length === 0) {
    issues.push({
      name: 'TRUSTED_PROXY_CIDRS',
      reason: 'is required in production',
    });
  }
  if (
    cidrs.some(
      (cidr) => cidr === '0.0.0.0/0' || cidr === '::/0' || !cidr.includes('/'),
    )
  ) {
    issues.push({
      name: 'TRUSTED_PROXY_CIDRS',
      reason: 'must contain specific CIDR ranges',
    });
  }
  return cidrs;
}

function validateProductionProviders(
  environment: NodeJS.ProcessEnv,
  issues: ValidationIssue[],
): void {
  const requiredProviderValues = [
    'SMS_PROVIDER',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_PHONE_NUMBER',
    'MEDIA_S3_REGION',
    'MEDIA_S3_BUCKET',
    'MEDIA_S3_ENDPOINT',
    'MEDIA_S3_ACCESS_KEY_ID',
    'MEDIA_S3_SECRET_ACCESS_KEY',
    'CLAMAV_HOST',
    'CLAMAV_PORT',
    'MAPBOX_TOKEN',
    'NEXT_PUBLIC_API_URL',
    'NEXT_PUBLIC_MAPBOX_TOKEN',
  ];

  for (const name of requiredProviderValues) {
    const value = required(environment, name, issues);
    if (isPlaceholder(value)) {
      issues.push({ name, reason: 'must not use a placeholder' });
    }
  }

  if (valueOf(environment, 'SMS_PROVIDER') !== 'twilio') {
    issues.push({
      name: 'SMS_PROVIDER',
      reason: 'must be twilio in production',
    });
  }
  if (valueOf(environment, 'NEXT_PUBLIC_MAP_PROVIDER') !== 'mapbox') {
    issues.push({
      name: 'NEXT_PUBLIC_MAP_PROVIDER',
      reason: 'must be mapbox in production',
    });
  }
  if (
    valueOf(environment, 'MALWARE_SCANNER_PROVIDER_PRODUCTION') !== 'clamav'
  ) {
    issues.push({
      name: 'MALWARE_SCANNER_PROVIDER_PRODUCTION',
      reason: 'must be clamav in production',
    });
  }

  for (const name of LOCAL_ONLY_NAMES) {
    if (valueOf(environment, name)) {
      issues.push({ name, reason: 'must be absent in production' });
    }
  }
}

export function parseEnvironment(
  environment: NodeJS.ProcessEnv,
): EnvironmentConfig {
  const issues: ValidationIssue[] = [];
  const appMode = oneOf(environment, 'APP_MODE', APP_MODES, issues);
  const production = appMode === 'production';
  const nodeEnv = required(environment, 'NODE_ENV', issues);
  const port = positiveInteger(environment, 'PORT', issues, 65_535);
  const publicAppUrl = urlValue(environment, 'PUBLIC_APP_URL', issues, [
    'http:',
    'https:',
  ]);
  const allowedOrigins = parseAllowedOrigins(environment, issues, production);
  const trustedProxyCidrs = parseTrustedProxyCidrs(
    environment,
    issues,
    production,
  );
  const cookieSecure = booleanValue(environment, 'COOKIE_SECURE', issues);
  const cookieSameSite = oneOf(
    environment,
    'COOKIE_SAME_SITE',
    ['lax'] as const,
    issues,
  );
  const cookieDomain = valueOf(environment, 'COOKIE_DOMAIN') || undefined;
  const sellerSessionIdleMinutes = positiveInteger(
    environment,
    'SELLER_SESSION_IDLE_MINUTES',
    issues,
  );
  const sellerSessionAbsoluteHours = positiveInteger(
    environment,
    'SELLER_SESSION_ABSOLUTE_HOURS',
    issues,
  );
  const adminSessionIdleMinutes = positiveInteger(
    environment,
    'ADMIN_SESSION_IDLE_MINUTES',
    issues,
  );
  const adminSessionAbsoluteHours = positiveInteger(
    environment,
    'ADMIN_SESSION_ABSOLUTE_HOURS',
    issues,
  );
  const contactIntentTtlSeconds = positiveInteger(
    environment,
    'CONTACT_INTENT_TTL_SECONDS',
    issues,
  );
  const databaseUrl = required(environment, 'DATABASE_URL', issues);
  urlValue(environment, 'DATABASE_URL', issues, ['postgres:', 'postgresql:']);
  const databaseTlsMode = oneOf(
    environment,
    'DATABASE_TLS_MODE',
    ['disable', 'verify-full'] as const,
    issues,
  );
  const databaseTlsCaFile =
    valueOf(environment, 'DATABASE_TLS_CA_FILE') || undefined;
  const redisUrl = required(environment, 'REDIS_URL', issues);
  const parsedRedisUrl = urlValue(environment, 'REDIS_URL', issues, [
    'redis:',
    'rediss:',
  ]);
  const redisTls = booleanValue(environment, 'REDIS_TLS', issues);
  const sessionTokenPepper = required(
    environment,
    'SESSION_TOKEN_PEPPER',
    issues,
  );
  const csrfTokenPepper = required(environment, 'CSRF_TOKEN_PEPPER', issues);
  const phoneLookupPepper = required(
    environment,
    'PHONE_LOOKUP_PEPPER',
    issues,
  );
  const fieldEncryptionKey = required(
    environment,
    'FIELD_ENCRYPTION_KEY',
    issues,
  );
  const otpProvider = oneOf(
    environment,
    'OTP_PROVIDER',
    ['local_fixed', 'twilio'] as const,
    issues,
  );
  const mediaProvider = oneOf(
    environment,
    'MEDIA_PROVIDER',
    ['local', 's3'] as const,
    issues,
  );
  const malwareScannerProvider = oneOf(
    environment,
    'MALWARE_SCANNER_PROVIDER',
    ['deterministic', 'clamav'] as const,
    issues,
  );
  const mapProvider = oneOf(
    environment,
    'MAP_PROVIDER',
    ['accessible_local', 'mapbox'] as const,
    issues,
  );
  const evidenceRetentionDays = positiveInteger(
    environment,
    'EVIDENCE_RETENTION_DAYS',
    issues,
  );
  const logRetentionDays = positiveInteger(
    environment,
    'LOG_RETENTION_DAYS',
    issues,
  );
  const logLevel = required(environment, 'LOG_LEVEL', issues);

  for (const name of ABUSE_LIMIT_NAMES) {
    const raw = valueOf(environment, name);
    if (raw && (!Number.isSafeInteger(Number(raw)) || Number(raw) <= 0)) {
      issues.push({ name, reason: 'must be a positive integer when provided' });
    }
  }
  const ownerSubmissionLimit = Number(
    valueOf(environment, 'ABUSE_OWNER_LISTING_SUBMISSION_LIMIT') || 3,
  );
  const agentSubmissionLimit = Number(
    valueOf(environment, 'ABUSE_AGENT_LISTING_SUBMISSION_LIMIT') || 2,
  );
  if (agentSubmissionLimit > ownerSubmissionLimit) {
    issues.push({
      name: 'ABUSE_AGENT_LISTING_SUBMISSION_LIMIT',
      reason: 'must not exceed the owner submission limit',
    });
  }

  for (const name of SECRET_NAMES) {
    const value = valueOf(environment, name);
    if (value.length < 32) {
      issues.push({ name, reason: 'must contain at least 32 characters' });
    }
    if (production && isPlaceholder(value)) {
      issues.push({
        name,
        reason: 'must not use a placeholder or local fixture',
      });
    }
  }

  if (production) {
    if (nodeEnv !== 'production') {
      issues.push({
        name: 'NODE_ENV',
        reason: 'must be production when APP_MODE is production',
      });
    }
    if (
      publicAppUrl.protocol !== 'https:' ||
      isReservedExampleHost(publicAppUrl.hostname)
    ) {
      issues.push({
        name: 'PUBLIC_APP_URL',
        reason: 'must be a production HTTPS URL',
      });
    }
    if (!cookieSecure) {
      issues.push({
        name: 'COOKIE_SECURE',
        reason: 'must be true in production',
      });
    }
    if (cookieDomain) {
      issues.push({
        name: 'COOKIE_DOMAIN',
        reason: 'must be empty for host-only cookies',
      });
    }
    if (databaseTlsMode !== 'verify-full') {
      issues.push({
        name: 'DATABASE_TLS_MODE',
        reason: 'must be verify-full in production',
      });
    }
    if (!databaseTlsCaFile) {
      issues.push({
        name: 'DATABASE_TLS_CA_FILE',
        reason: 'is required in production',
      });
    }
    if (!redisTls || parsedRedisUrl.protocol !== 'rediss:') {
      issues.push({
        name: 'REDIS_TLS',
        reason: 'must use rediss transport in production',
      });
    }
    if (
      otpProvider !== 'twilio' ||
      mediaProvider !== 's3' ||
      malwareScannerProvider !== 'clamav' ||
      mapProvider !== 'mapbox'
    ) {
      issues.push({
        name: 'APP_MODE',
        reason: 'must select production providers',
      });
    }
    validateProductionProviders(environment, issues);
  } else {
    if (
      otpProvider !== 'local_fixed' ||
      mediaProvider !== 'local' ||
      malwareScannerProvider !== 'deterministic' ||
      mapProvider !== 'accessible_local'
    ) {
      issues.push({
        name: 'APP_MODE',
        reason: 'must select local/test providers',
      });
    }
    required(environment, 'LOCAL_FIXED_OTP', issues);
    required(environment, 'LOCAL_MEDIA_ROOT', issues);
  }

  if (issues.length > 0) {
    throw new EnvironmentValidationError(issues);
  }

  return {
    appMode,
    nodeEnv,
    port,
    publicAppUrl,
    allowedOrigins,
    trustedProxyCidrs,
    cookieSecure,
    cookieSameSite,
    cookieDomain,
    sellerSessionIdleMinutes,
    sellerSessionAbsoluteHours,
    adminSessionIdleMinutes,
    adminSessionAbsoluteHours,
    contactIntentTtlSeconds,
    databaseUrl,
    databaseTlsMode,
    databaseTlsCaFile,
    redisUrl,
    redisTls,
    sessionTokenPepper,
    csrfTokenPepper,
    phoneLookupPepper,
    fieldEncryptionKey,
    otpProvider,
    mediaProvider,
    malwareScannerProvider,
    mapProvider,
    evidenceRetentionDays,
    logRetentionDays,
    logLevel,
  };
}

/** Nest ConfigModule validator that preserves existing uppercase lookups after validation. */
export function validateEnvironment(
  environment: Record<string, unknown>,
): Record<string, unknown> {
  const processEnvironment = Object.fromEntries(
    Object.entries(environment).map(([key, value]) => [
      key,
      value == null ? undefined : String(value),
    ]),
  ) as NodeJS.ProcessEnv;
  const parsed = parseEnvironment(processEnvironment);
  return { ...environment, APP_MODE: parsed.appMode, MAKAAN_CONFIG: parsed };
}
