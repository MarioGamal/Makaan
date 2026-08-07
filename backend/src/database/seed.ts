import {
  createCipheriv,
  createHash,
  createHmac,
  randomBytes,
} from 'node:crypto';

import { ListingStatus } from '@makaan/shared/constants/enums';
import bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';

import { MAKAAN_ENTITIES } from '../models';

import { assertLocalDatabaseTarget } from './database-command-safety';
import {
  areaAliases,
  cairoAreas,
  DEMO_IDS,
  DEMO_TIMESTAMP,
  demoListings,
  demoUsers,
  mediaMetadata,
  moderationFixtures,
  sellerProfiles,
} from './fixtures/demo-fixtures';

function protectedValue(value: string, secret: string): string {
  const key = createHash('sha256').update(secret).digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(value, 'utf8'),
    cipher.final(),
  ]);
  return `v1:${iv.toString('base64url')}:${cipher.getAuthTag().toString('base64url')}:${ciphertext.toString('base64url')}`;
}

function requireLocalSeedEnvironment(databaseUrl?: string): {
  databaseUrl: string;
  phoneLookupPepper: string;
  fieldEncryptionKey: string;
  adminEmail: string;
  adminPassword: string;
  adminTotpSecret: string;
} {
  const mode = process.env.APP_MODE;
  if (mode !== 'local' && mode !== 'test') {
    throw new Error('Demo seed is available only in local or test mode.');
  }
  const resolvedUrl = databaseUrl ?? process.env.DATABASE_URL;
  if (!resolvedUrl) {
    throw new Error('Demo seed requires an explicit DATABASE_URL.');
  }
  const target = assertLocalDatabaseTarget(resolvedUrl, mode);
  return {
    databaseUrl: target.toString(),
    phoneLookupPepper:
      process.env.PHONE_LOOKUP_PEPPER ?? 'makaan-test-phone-pepper',
    fieldEncryptionKey:
      process.env.FIELD_ENCRYPTION_KEY ?? 'makaan-test-field-encryption-key',
    adminEmail: process.env.LOCAL_ADMIN_EMAIL ?? 'admin@makaan.test',
    adminPassword:
      process.env.LOCAL_ADMIN_PASSWORD ?? 'local-admin-password-only',
    adminTotpSecret: process.env.LOCAL_ADMIN_TOTP_SECRET ?? 'JBSWY3DPEHPK3PXP',
  };
}

/** Seeds deterministic local demonstration records with protected local-only sign-in material. */
export async function seedDatabase(databaseUrl?: string): Promise<void> {
  const environment = requireLocalSeedEnvironment(databaseUrl);
  const adminPasswordHash = await bcrypt.hash(environment.adminPassword, 12);
  const adminSecondFactorCiphertext = protectedValue(
    environment.adminTotpSecret,
    environment.fieldEncryptionKey,
  );
  const source = new DataSource({
    type: 'postgres',
    url: environment.databaseUrl,
    entities: [...MAKAAN_ENTITIES],
    synchronize: false,
    ssl: false,
  });
  await source.initialize();

  try {
    await source.transaction(async (manager) => {
      for (const area of cairoAreas) {
        await manager.query(
          `INSERT INTO cairo_areas (id, name_en, name_ar, boundary, parent_id, level,
             normalized_name_ar, normalized_name_en, is_active, display_order)
           VALUES ($1, $2, $3, ST_GeogFromText($4), NULL, 0, $6, $7, true, $5)
           ON CONFLICT (id) DO UPDATE SET name_en = EXCLUDED.name_en, name_ar = EXCLUDED.name_ar,
             boundary = EXCLUDED.boundary, parent_id = NULL, level = EXCLUDED.level,
             normalized_name_ar = EXCLUDED.normalized_name_ar,
             normalized_name_en = EXCLUDED.normalized_name_en,
             is_active = true, display_order = EXCLUDED.display_order`,
          [
            area.id,
            area.nameEn,
            area.nameAr,
            area.boundaryWkt,
            cairoAreas.indexOf(area),
            area.nameAr,
            area.nameEn.toLowerCase(),
          ],
        );
      }

      for (const alias of areaAliases) {
        await manager.query(
          `INSERT INTO cairo_area_aliases (id, area_id, locale, display_alias,
             normalized_alias, provenance, is_active, created_at)
           VALUES ($1, $2, $3, $4, $5, 'reviewed_demo_fixture', true, $6)
           ON CONFLICT (id) DO UPDATE SET area_id = EXCLUDED.area_id,
             locale = EXCLUDED.locale, display_alias = EXCLUDED.display_alias,
             normalized_alias = EXCLUDED.normalized_alias,
             provenance = EXCLUDED.provenance, is_active = true`,
          [
            alias.id,
            alias.areaId,
            alias.locale,
            alias.displayAlias,
            alias.normalizedAlias,
            DEMO_TIMESTAMP,
          ],
        );
      }

      for (const user of demoUsers) {
        const phone = 'phone' in user ? user.phone : null;
        const phoneCiphertext = phone
          ? protectedValue(phone, environment.fieldEncryptionKey)
          : null;
        const phoneLookupHash = phone
          ? createHmac('sha256', environment.phoneLookupPepper)
              .update(phone)
              .digest('hex')
          : null;
        const isAdmin = user.id === DEMO_IDS.admin;
        await manager.query(
          `INSERT INTO users (id, legacy_phone_number, phone_ciphertext, phone_lookup_hash, display_name,
             username, user_type, status, is_phone_verified, password_hash, legacy_two_factor_secret,
             is_2fa_enabled, password_version, recovery_version, second_factor_secret_ciphertext,
             created_at, last_login_at)
           VALUES ($1, NULL, $2, $3, $4, $5, $6, $7, $8, $9, NULL, $10, 1, 1, $11, $12, NULL)
           ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name, username = EXCLUDED.username,
             user_type = EXCLUDED.user_type, status = EXCLUDED.status,
             is_phone_verified = EXCLUDED.is_phone_verified, password_hash = EXCLUDED.password_hash,
             legacy_two_factor_secret = NULL, is_2fa_enabled = EXCLUDED.is_2fa_enabled,
             phone_ciphertext = EXCLUDED.phone_ciphertext,
             phone_lookup_hash = EXCLUDED.phone_lookup_hash,
             second_factor_secret_ciphertext = EXCLUDED.second_factor_secret_ciphertext`,
          [
            user.id,
            phoneCiphertext,
            phoneLookupHash,
            user.displayName,
            isAdmin ? environment.adminEmail : user.username,
            user.userType,
            user.status,
            user.isPhoneVerified,
            isAdmin ? adminPasswordHash : null,
            isAdmin,
            isAdmin ? adminSecondFactorCiphertext : null,
            DEMO_TIMESTAMP,
          ],
        );
      }

      for (const profile of sellerProfiles) {
        await manager.query(
          `INSERT INTO seller_profiles (user_id, declared_participation, listing_count, is_verified, verified_at,
             participation_declaration_version, agent_declaration_confirmed_version,
             agent_declaration_confirmed_at, agent_declaration_confirmed_by, classification_source,
             moderator_participation_override, review_state, verification_state, verification_decided_at,
             verification_decided_by, created_at, updated_at)
           VALUES ($1, $2, 0, $3, $4, 1, NULL, NULL, NULL, 'self_declared', NULL, 'clear', $5, $6, $7, $8, $8)
           ON CONFLICT (user_id) DO UPDATE SET declared_participation = EXCLUDED.declared_participation,
             listing_count = EXCLUDED.listing_count, is_verified = EXCLUDED.is_verified,
             verified_at = EXCLUDED.verified_at, verification_state = EXCLUDED.verification_state,
             verification_decided_at = EXCLUDED.verification_decided_at,
             verification_decided_by = EXCLUDED.verification_decided_by, updated_at = EXCLUDED.updated_at`,
          [
            profile.userId,
            profile.declaredParticipation,
            profile.isVerified,
            profile.isVerified ? DEMO_TIMESTAMP : null,
            profile.verificationState,
            profile.verificationDecidedAt,
            profile.verificationDecidedBy,
            DEMO_TIMESTAMP,
          ],
        );
      }

      for (const listing of demoListings) {
        await manager.query(
          `INSERT INTO listings (id, seller_id, area_id, purpose, property_type, size_sqm, bedrooms, bathrooms,
             finishing_level, price_egp, description, exact_location, status, view_count, save_count, contact_count,
             created_at, updated_at, submitted_at, approved_at, rejection_reason,
             title_ar, title_en, description_ar, description_en, seller_public_location_mode,
             approved_public_location_mode, public_location, public_location_distance_m,
             availability_confirmed_at, expires_at, approved_by,
             rejected_at, rejected_by, lock_version)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, ST_GeogFromText($12), $13, 0, 0, 0,
             $14, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23,
             CASE WHEN $24::text IS NULL THEN NULL ELSE ST_GeogFromText($24) END, $25,
             $26, $27, $28, $29, $30, 1)
           ON CONFLICT (id) DO UPDATE SET seller_id = EXCLUDED.seller_id, area_id = EXCLUDED.area_id,
             purpose = EXCLUDED.purpose, property_type = EXCLUDED.property_type, size_sqm = EXCLUDED.size_sqm,
             bedrooms = EXCLUDED.bedrooms, bathrooms = EXCLUDED.bathrooms,
             finishing_level = EXCLUDED.finishing_level, price_egp = EXCLUDED.price_egp,
             description = EXCLUDED.description, exact_location = EXCLUDED.exact_location,
             submitted_at = EXCLUDED.submitted_at, approved_at = EXCLUDED.approved_at,
             rejection_reason = EXCLUDED.rejection_reason, updated_at = EXCLUDED.updated_at,
             title_ar = EXCLUDED.title_ar, title_en = EXCLUDED.title_en,
             description_ar = EXCLUDED.description_ar, description_en = EXCLUDED.description_en,
             seller_public_location_mode = EXCLUDED.seller_public_location_mode,
             approved_public_location_mode = EXCLUDED.approved_public_location_mode,
             public_location = EXCLUDED.public_location,
             public_location_distance_m = EXCLUDED.public_location_distance_m,
             availability_confirmed_at = EXCLUDED.availability_confirmed_at,
             expires_at = EXCLUDED.expires_at, approved_by = EXCLUDED.approved_by,
             rejected_at = EXCLUDED.rejected_at,
             rejected_by = EXCLUDED.rejected_by`,
          [
            listing.id,
            listing.sellerId,
            listing.areaId,
            listing.purpose,
            listing.propertyType,
            listing.sizeSqm,
            listing.bedrooms,
            listing.bathrooms,
            listing.finishingLevel,
            listing.priceEgp,
            listing.description,
            listing.locationWkt,
            ListingStatus.DRAFT,
            DEMO_TIMESTAMP,
            listing.submittedAt,
            listing.approvedAt,
            listing.rejectionReason,
            listing.description.slice(0, 170),
            `Demo residential listing ${listing.id.slice(-4)}`,
            listing.description,
            `Governed Cairo residential fixture ${listing.id.slice(-4)}.`,
            listing.sellerPublicLocationMode,
            listing.approvedPublicLocationMode,
            listing.publicLocationWkt,
            listing.publicLocationDistanceM,
            listing.status === ListingStatus.ACTIVE
              ? '2099-01-01T00:00:00.000Z'
              : null,
            listing.status === ListingStatus.ACTIVE
              ? '2099-01-31T00:00:00.000Z'
              : null,
            listing.status === ListingStatus.ACTIVE ? DEMO_IDS.admin : null,
            listing.status === ListingStatus.REJECTED
              ? '2026-01-06T09:00:00.000Z'
              : null,
            listing.status === ListingStatus.REJECTED ? DEMO_IDS.admin : null,
          ],
        );

        const profile = sellerProfiles.find(
          ({ userId }) => userId === listing.sellerId,
        );
        if (!profile) throw new Error('Fixture seller profile is missing.');
        await manager.query(
          `INSERT INTO listing_revisions (id, listing_id, revision_number, snapshot, exact_location,
             participation_declaration_version, declared_participation, media_references,
             change_classification, created_by, created_at)
           VALUES ($1, $2, 1, $3::jsonb, ST_GeogFromText($4), 1, $5, '[]'::jsonb,
             'material', $6, $7)
           ON CONFLICT (id) DO NOTHING`,
          [
            listing.revisionId,
            listing.id,
            JSON.stringify({
              purpose: listing.purpose,
              propertyType: listing.propertyType,
              sizeSqm: listing.sizeSqm,
              bedrooms: listing.bedrooms,
              bathrooms: listing.bathrooms,
              priceEgp: listing.priceEgp,
              descriptionAr: listing.description,
            }),
            listing.locationWkt,
            profile.declaredParticipation,
            listing.sellerId,
            listing.submittedAt ?? DEMO_TIMESTAMP,
          ],
        );
        await manager.query(
          `UPDATE listings
              SET status = $2::listings_status_enum, current_revision_id = $3::uuid,
                  approved_revision_id = CASE WHEN $2::text = 'active' THEN $3::uuid ELSE NULL END
            WHERE id = $1`,
          [listing.id, listing.status, listing.revisionId],
        );
      }

      for (const media of mediaMetadata) {
        await manager.query(
          `INSERT INTO photos (id, listing_id, cloudinary_url, display_order, original_filename, width, height, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO UPDATE SET listing_id = EXCLUDED.listing_id, cloudinary_url = EXCLUDED.cloudinary_url,
             display_order = EXCLUDED.display_order, original_filename = EXCLUDED.original_filename,
             width = EXCLUDED.width, height = EXCLUDED.height`,
          [
            media.id,
            media.listingId,
            media.cloudinaryUrl,
            media.displayOrder,
            media.originalFilename,
            media.width,
            media.height,
            DEMO_TIMESTAMP,
          ],
        );
        const listing = demoListings.find(({ id }) => id === media.listingId);
        if (!listing) throw new Error('Fixture media listing is missing.');
        await manager.query(
          `INSERT INTO listing_media (id, listing_id, revision_id,
             source_object_reference_ciphertext, source_key_version,
             approved_derivative_reference, detected_mime, byte_size, width, height,
             sha256_digest, perceptual_hash, scan_state, scan_engine, scanned_at,
             display_order, created_at, deleted_at)
           VALUES ($1, $2, $3, $4, 1, $5, 'image/jpeg', 262144, $6, $7,
             $8, $9, 'clean', 'deterministic-local', $10, $11, $10, NULL)
           ON CONFLICT (id) DO UPDATE SET revision_id = EXCLUDED.revision_id,
             source_object_reference_ciphertext = EXCLUDED.source_object_reference_ciphertext,
             source_key_version = EXCLUDED.source_key_version,
             approved_derivative_reference = EXCLUDED.approved_derivative_reference,
             detected_mime = EXCLUDED.detected_mime, byte_size = EXCLUDED.byte_size,
             width = EXCLUDED.width, height = EXCLUDED.height,
             sha256_digest = EXCLUDED.sha256_digest, perceptual_hash = EXCLUDED.perceptual_hash,
             scan_state = EXCLUDED.scan_state, scan_engine = EXCLUDED.scan_engine,
             scanned_at = EXCLUDED.scanned_at, display_order = EXCLUDED.display_order,
             deleted_at = NULL`,
          [
            media.id,
            media.listingId,
            listing.revisionId,
            protectedValue(
              `listing-media/${media.listingId}/${media.originalFilename}`,
              environment.fieldEncryptionKey,
            ),
            media.cloudinaryUrl,
            media.width,
            media.height,
            createHash('sha256')
              .update(`${media.listingId}:${media.displayOrder}`)
              .digest('hex'),
            createHash('sha256')
              .update(`perceptual:${media.listingId}:${media.displayOrder}`)
              .digest('hex')
              .slice(0, 32),
            DEMO_TIMESTAMP,
            media.displayOrder,
          ],
        );
      }

      for (const action of moderationFixtures) {
        await manager.query(
          `INSERT INTO admin_actions (id, admin_id, action_type, target_listing_id, target_user_id, reason, notes, created_at)
           VALUES ($1, $2, $3, $4, NULL, $5, $6, $7)
           ON CONFLICT (id) DO UPDATE SET admin_id = EXCLUDED.admin_id, action_type = EXCLUDED.action_type,
             target_listing_id = EXCLUDED.target_listing_id, target_user_id = NULL, reason = EXCLUDED.reason,
             notes = EXCLUDED.notes`,
          [
            action.id,
            DEMO_IDS.admin,
            action.actionType,
            action.targetListingId,
            action.reason,
            action.notes,
            DEMO_TIMESTAMP,
          ],
        );
      }
    });
  } finally {
    await source.destroy();
  }
}

if (require.main === module) {
  seedDatabase().catch((error: unknown) => {
    // Report only the database error message, never the query, parameters, or connection details.
    const message = error instanceof Error ? error.message : 'unknown error';
    console.error(`Demo seed failed: ${message}`);
    process.exitCode = 1;
  });
}
