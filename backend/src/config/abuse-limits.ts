import { ConfigService } from '@nestjs/config';

export const ABUSE_LIMITS = {
  otpRequest: {
    environmentName: 'ABUSE_OTP_REQUEST_LIMIT',
    limit: 5,
    windowSeconds: 15 * 60,
  },
  otpVerification: {
    environmentName: 'ABUSE_OTP_VERIFICATION_LIMIT',
    limit: 5,
    windowSeconds: 5 * 60,
  },
  adminLogin: {
    environmentName: 'ABUSE_ADMIN_LOGIN_LIMIT',
    limit: 5,
    windowSeconds: 15 * 60,
  },
  ownerListingSubmission: {
    environmentName: 'ABUSE_OWNER_LISTING_SUBMISSION_LIMIT',
    limit: 3,
    windowSeconds: 24 * 60 * 60,
  },
  agentListingSubmission: {
    environmentName: 'ABUSE_AGENT_LISTING_SUBMISSION_LIMIT',
    limit: 2,
    windowSeconds: 24 * 60 * 60,
  },
  upload: {
    environmentName: 'ABUSE_UPLOAD_LIMIT',
    limit: 20,
    windowSeconds: 60 * 60,
  },
  contact: {
    environmentName: 'ABUSE_CONTACT_LIMIT',
    limit: 10,
    windowSeconds: 60 * 60,
  },
} as const;

export type AbuseLimitName = keyof typeof ABUSE_LIMITS;

export interface AbuseLimit {
  limit: number;
  windowSeconds: number;
}

export function resolveAbuseLimit(
  configService: ConfigService,
  name: AbuseLimitName,
): AbuseLimit {
  const definition = ABUSE_LIMITS[name];
  const raw = configService.get<string>(definition.environmentName);
  const limit =
    raw === undefined || raw === '' ? definition.limit : Number(raw);
  if (!Number.isSafeInteger(limit) || limit <= 0) {
    throw new Error(`${definition.environmentName} must be a positive integer`);
  }
  if (
    name === 'agentListingSubmission' &&
    limit > resolveAbuseLimit(configService, 'ownerListingSubmission').limit
  ) {
    throw new Error(
      'ABUSE_AGENT_LISTING_SUBMISSION_LIMIT must not exceed the owner limit',
    );
  }
  return { limit, windowSeconds: definition.windowSeconds };
}
