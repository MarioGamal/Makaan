import { describe, expect, it } from '@jest/globals';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const listingControllerSource = readFileSync(
  join(__dirname, '../../src/api/listings/listings.controller.ts'),
  'utf8',
);
const publicListingPath = join(
  __dirname,
  '../../src/services/public-listing.service.ts',
);
const publicListingSource = existsSync(publicListingPath)
  ? readFileSync(publicListingPath, 'utf8')
  : '';

/** Fields that must never cross the anonymous listing/SSR boundary. */
const forbiddenPublicFields = [
  'lat',
  'lng',
  'location.coordinates',
  'status',
  'viewCount',
  'saveCount',
  'contactCount',
  'stats',
  'submittedAt',
  'approvedAt',
  'rejectionReason',
  'phoneNumber',
  'sellerId',
  'session',
  'csrf',
  'audit',
  'risk',
  'duplicate',
  'storage',
] as const;

describe('public listings contract (T035)', () => {
  it('uses the dedicated allowlisted public projection rather than the legacy search serializer', () => {
    expect(listingControllerSource).toMatch(/PublicListingService/);
    expect(listingControllerSource).not.toMatch(/ListingSearchService/);
  });

  it('defines a public projection with the required safe fields and exactly one participation label', () => {
    expect(publicListingSource).toMatch(/rankingVersion.*organic-v1/s);
    expect(publicListingSource).toMatch(/sellerParticipation/);
    expect(publicListingSource).toMatch(/verified_owner/);
    expect(publicListingSource).toMatch(/owner_not_verified/);
    expect(publicListingSource).toMatch(/location.*precision/s);
    expect(publicListingSource).toMatch(/nameAr/);
    expect(publicListingSource).toMatch(/nameEn/);
    expect(publicListingSource).toMatch(/title/);
    expect(publicListingSource).toMatch(/description/);
  });

  it('does not serialize forbidden private, moderation, engagement, or exact-location fields', () => {
    for (const field of forbiddenPublicFields) {
      expect(publicListingSource).not.toContain(`${field}:`);
    }
  });

  it('makes search and detail indistinguishable for non-public lifecycle states', () => {
    // Eligibility is stricter than the legacy `status = active` predicate: it also
    // requires approval, availability confirmation, residential/Cairo scope, and
    // an unexpired public lifecycle. Detail must return 404 for every failure.
    expect(publicListingSource).toMatch(
      /isPubliclyEligible|public eligibility/i,
    );
    expect(publicListingSource).toMatch(/NotFoundException/);
    expect(publicListingSource).toMatch(/availability_confirmed_at/);
  });
});
