import { MigrationInterface, QueryRunner } from 'typeorm';

/** Adds governed geography, private/public listing lifecycle, and immutable submitted revisions. */
export class ListingPrivacyLifecycleCanonical1774400000000 implements MigrationInterface {
  name = 'ListingPrivacyLifecycleCanonical1774400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cairo_areas" ADD "normalized_name_ar" character varying(160)`,
    );
    await queryRunner.query(
      `ALTER TABLE "cairo_areas" ADD "normalized_name_en" character varying(160)`,
    );
    await queryRunner.query(
      `ALTER TABLE "cairo_areas" ADD "is_active" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "cairo_areas" ADD "display_order" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `UPDATE "cairo_areas" SET "normalized_name_ar" = lower(trim("name_ar")), "normalized_name_en" = lower(trim("name_en"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "cairo_areas" ALTER COLUMN "normalized_name_ar" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "cairo_areas" ALTER COLUMN "normalized_name_en" SET NOT NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_CAIRO_AREAS_NORMALIZED_AR" ON "cairo_areas" ("normalized_name_ar")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_CAIRO_AREAS_NORMALIZED_EN" ON "cairo_areas" ("normalized_name_en")`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."cairo_area_aliases_locale_enum" AS ENUM('ar', 'en')`,
    );
    await queryRunner.query(
      `CREATE TABLE "cairo_area_aliases" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "area_id" uuid NOT NULL,
        "locale" "public"."cairo_area_aliases_locale_enum" NOT NULL,
        "display_alias" character varying(160) NOT NULL,
        "normalized_alias" character varying(160) NOT NULL,
        "provenance" character varying(160) NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_CAIRO_AREA_ALIASES" PRIMARY KEY ("id"),
        CONSTRAINT "FK_CAIRO_AREA_ALIASES_AREA" FOREIGN KEY ("area_id") REFERENCES "cairo_areas"("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "UQ_CAIRO_AREA_ALIASES_LOCALE_NORMALIZED" UNIQUE ("locale", "normalized_alias")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_CAIRO_AREA_ALIASES_AREA" ON "cairo_area_aliases" ("area_id") WHERE "is_active" = true`,
    );

    await queryRunner.query(
      `ALTER TABLE "listings" ALTER COLUMN "purpose" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."listings_purpose_enum" RENAME TO "listings_purpose_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."listings_purpose_enum" AS ENUM('sale', 'long_term_rent')`,
    );
    await queryRunner.query(
      `ALTER TABLE "listings" ALTER COLUMN "purpose" TYPE "public"."listings_purpose_enum" USING (CASE WHEN "purpose"::text = 'rent' THEN 'long_term_rent' ELSE "purpose"::text END)::"public"."listings_purpose_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."listings_purpose_enum_old"`);

    await queryRunner.query(
      `ALTER TABLE "listings" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."listings_status_enum" RENAME TO "listings_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."listings_status_enum" AS ENUM('draft', 'pending_review', 'active', 'rejected', 'sold', 'inactive', 'expired')`,
    );
    await queryRunner.query(
      `ALTER TABLE "listings" ALTER COLUMN "status" TYPE "public"."listings_status_enum" USING (CASE WHEN "status"::text = 'submitted' THEN 'pending_review' ELSE "status"::text END)::"public"."listings_status_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."listings_status_enum_old"`);
    await queryRunner.query(
      `ALTER TABLE "listings" ALTER COLUMN "status" SET DEFAULT 'draft'`,
    );

    await queryRunner.query(
      `ALTER TABLE "listings" RENAME COLUMN "location" TO "exact_location"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."listings_public_location_mode_enum" AS ENUM('approximate', 'area_only')`,
    );
    for (const statement of [
      `ADD "title_ar" character varying(180)`,
      `ADD "title_en" character varying(180)`,
      `ADD "description_ar" text`,
      `ADD "description_en" text`,
      `ADD "amenities" jsonb NOT NULL DEFAULT '[]'::jsonb`,
      `ADD "private_address_ciphertext" text`,
      `ADD "floor_number" integer`,
      `ADD "seller_public_location_mode" "public"."listings_public_location_mode_enum"`,
      `ADD "approved_public_location_mode" "public"."listings_public_location_mode_enum"`,
      `ADD "public_location" geography(Point,4326)`,
      `ADD "public_location_distance_m" integer`,
      `ADD "availability_confirmed_at" TIMESTAMP WITH TIME ZONE`,
      `ADD "availability_warning_sent_at" TIMESTAMP WITH TIME ZONE`,
      `ADD "expires_at" TIMESTAMP WITH TIME ZONE`,
      `ADD "current_revision_id" uuid`,
      `ADD "approved_revision_id" uuid`,
      `ADD "lock_version" integer NOT NULL DEFAULT 1`,
      `ADD "approved_by" uuid`,
      `ADD "rejected_at" TIMESTAMP WITH TIME ZONE`,
      `ADD "rejected_by" uuid`,
    ]) {
      await queryRunner.query(`ALTER TABLE "listings" ${statement}`);
    }
    await queryRunner.query(
      `ALTER TABLE "listings" ADD CONSTRAINT "CHK_LISTINGS_PUBLIC_PRECISION" CHECK (
        ("approved_public_location_mode" IS NULL AND "public_location" IS NULL AND "public_location_distance_m" IS NULL)
        OR ("approved_public_location_mode" = 'area_only' AND "public_location" IS NULL AND "public_location_distance_m" IS NULL)
        OR ("approved_public_location_mode" = 'approximate' AND "public_location" IS NOT NULL AND "public_location_distance_m" BETWEEN 100 AND 500)
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "listings" ADD CONSTRAINT "CHK_LISTINGS_MODERATOR_PRECISION" CHECK (
        "approved_public_location_mode" IS NULL OR "seller_public_location_mode" = 'approximate' OR "approved_public_location_mode" = 'area_only'
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "listings" ADD CONSTRAINT "CHK_LISTINGS_AVAILABILITY_WINDOW" CHECK (
        ("availability_confirmed_at" IS NULL AND "expires_at" IS NULL)
        OR ("availability_confirmed_at" IS NOT NULL AND "expires_at" = "availability_confirmed_at" + INTERVAL '30 days')
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "listings" ADD CONSTRAINT "CHK_LISTINGS_LOCK_VERSION" CHECK ("lock_version" > 0)`,
    );
    await queryRunner.query(
      `ALTER TABLE "listings" ADD CONSTRAINT "FK_LISTINGS_APPROVED_BY" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "listings" ADD CONSTRAINT "FK_LISTINGS_REJECTED_BY" FOREIGN KEY ("rejected_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."listing_revisions_change_classification_enum" AS ENUM('material', 'non_material')`,
    );
    await queryRunner.query(
      `CREATE TABLE "listing_revisions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "listing_id" uuid NOT NULL,
        "revision_number" integer NOT NULL,
        "snapshot" jsonb NOT NULL,
        "exact_location" geography(Point,4326) NOT NULL,
        "participation_declaration_version" integer NOT NULL,
        "declared_participation" "public"."seller_profiles_declared_participation_enum" NOT NULL,
        "media_references" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "change_classification" "public"."listing_revisions_change_classification_enum" NOT NULL,
        "created_by" uuid NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_LISTING_REVISIONS" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_LISTING_REVISIONS_NUMBER" UNIQUE ("listing_id", "revision_number"),
        CONSTRAINT "CHK_LISTING_REVISIONS_NUMBER" CHECK ("revision_number" > 0),
        CONSTRAINT "FK_LISTING_REVISIONS_LISTING" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "FK_LISTING_REVISIONS_AUTHOR" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_LISTING_REVISIONS_LISTING_CREATED" ON "listing_revisions" ("listing_id", "created_at")`,
    );
    await queryRunner.query(
      `CREATE TRIGGER "TRG_LISTING_REVISIONS_APPEND_ONLY" BEFORE UPDATE OR DELETE ON "listing_revisions" FOR EACH ROW EXECUTE FUNCTION makaan_reject_append_only_mutation()`,
    );
    await queryRunner.query(
      `ALTER TABLE "listings" ADD CONSTRAINT "FK_LISTINGS_CURRENT_REVISION" FOREIGN KEY ("current_revision_id") REFERENCES "listing_revisions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "listings" ADD CONSTRAINT "FK_LISTINGS_APPROVED_REVISION" FOREIGN KEY ("approved_revision_id") REFERENCES "listing_revisions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "listings" ADD CONSTRAINT "CHK_LISTINGS_ACTIVE_ELIGIBILITY" CHECK (
        "status" <> 'active' OR (
          "approved_revision_id" IS NOT NULL AND "current_revision_id" = "approved_revision_id"
          AND "approved_at" IS NOT NULL AND "approved_by" IS NOT NULL
          AND "availability_confirmed_at" IS NOT NULL AND "expires_at" > "availability_confirmed_at"
          AND "seller_public_location_mode" IS NOT NULL AND "approved_public_location_mode" IS NOT NULL
        )
      ) NOT VALID`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_LISTINGS_PUBLIC_LOCATION_GIST" ON "listings" USING GiST ("public_location") WHERE "public_location" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_LISTINGS_PUBLIC_ELIGIBILITY" ON "listings" ("status", "expires_at", "area_id", "approved_at", "id")`,
    );
    await queryRunner.query(`
      CREATE FUNCTION makaan_validate_listing_geography() RETURNS trigger AS $$
      DECLARE governed_boundary geography;
      DECLARE actual_distance double precision;
      BEGIN
        IF NEW.area_id IS NULL THEN
          IF NEW.public_location IS NOT NULL THEN
            RAISE EXCEPTION 'public listing location requires a governed area';
          END IF;
          RETURN NEW;
        END IF;
        SELECT boundary INTO governed_boundary FROM cairo_areas WHERE id = NEW.area_id AND is_active = true;
        IF governed_boundary IS NULL THEN
          RAISE EXCEPTION 'listing area must be an active governed Cairo area';
        END IF;
        IF NEW.exact_location IS NOT NULL AND NOT ST_Covers(governed_boundary::geometry, NEW.exact_location::geometry) THEN
          RAISE EXCEPTION 'exact listing location must be inside its governed area';
        END IF;
        IF NEW.public_location IS NOT NULL THEN
          IF NOT ST_Covers(governed_boundary::geometry, NEW.public_location::geometry) THEN
            RAISE EXCEPTION 'public listing location must be inside its governed area';
          END IF;
          actual_distance := ST_Distance(NEW.exact_location, NEW.public_location);
          IF actual_distance < 100 OR actual_distance > 500 OR abs(actual_distance - NEW.public_location_distance_m) > 2 THEN
            RAISE EXCEPTION 'approximate location distance must be stable and between 100 and 500 metres';
          END IF;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);
    await queryRunner.query(
      `CREATE TRIGGER "TRG_LISTINGS_GOVERNED_GEOGRAPHY" BEFORE INSERT OR UPDATE OF "area_id", "exact_location", "public_location", "public_location_distance_m" ON "listings" FOR EACH ROW EXECUTE FUNCTION makaan_validate_listing_geography()`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM "listings" WHERE "status" = 'expired') THEN
          RAISE EXCEPTION 'Migration 007 down is disposable-schema-only after lifecycle writes; restore a backup or forward-fix instead';
        END IF;
      END
      $$
    `);
    await queryRunner.query(
      `DROP TRIGGER "TRG_LISTINGS_GOVERNED_GEOGRAPHY" ON "listings"`,
    );
    await queryRunner.query(`DROP FUNCTION makaan_validate_listing_geography`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_LISTINGS_PUBLIC_ELIGIBILITY"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_LISTINGS_PUBLIC_LOCATION_GIST"`,
    );
    await queryRunner.query(
      `ALTER TABLE "listings" DROP CONSTRAINT "CHK_LISTINGS_ACTIVE_ELIGIBILITY"`,
    );
    await queryRunner.query(
      `ALTER TABLE "listings" DROP CONSTRAINT "FK_LISTINGS_APPROVED_REVISION"`,
    );
    await queryRunner.query(
      `ALTER TABLE "listings" DROP CONSTRAINT "FK_LISTINGS_CURRENT_REVISION"`,
    );
    await queryRunner.query(
      `DROP TRIGGER "TRG_LISTING_REVISIONS_APPEND_ONLY" ON "listing_revisions"`,
    );
    await queryRunner.query(`DROP TABLE "listing_revisions"`);
    await queryRunner.query(
      `DROP TYPE "public"."listing_revisions_change_classification_enum"`,
    );
    for (const constraint of [
      'FK_LISTINGS_REJECTED_BY',
      'FK_LISTINGS_APPROVED_BY',
      'CHK_LISTINGS_LOCK_VERSION',
      'CHK_LISTINGS_AVAILABILITY_WINDOW',
      'CHK_LISTINGS_MODERATOR_PRECISION',
      'CHK_LISTINGS_PUBLIC_PRECISION',
    ]) {
      await queryRunner.query(
        `ALTER TABLE "listings" DROP CONSTRAINT "${constraint}"`,
      );
    }
    for (const column of [
      'rejected_by',
      'rejected_at',
      'approved_by',
      'lock_version',
      'approved_revision_id',
      'current_revision_id',
      'expires_at',
      'availability_warning_sent_at',
      'availability_confirmed_at',
      'public_location_distance_m',
      'public_location',
      'approved_public_location_mode',
      'seller_public_location_mode',
      'floor_number',
      'private_address_ciphertext',
      'amenities',
      'description_en',
      'description_ar',
      'title_en',
      'title_ar',
    ]) {
      await queryRunner.query(`ALTER TABLE "listings" DROP COLUMN "${column}"`);
    }
    await queryRunner.query(
      `DROP TYPE "public"."listings_public_location_mode_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "listings" RENAME COLUMN "exact_location" TO "location"`,
    );

    await queryRunner.query(
      `ALTER TABLE "listings" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."listings_status_enum" RENAME TO "listings_status_enum_new"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."listings_status_enum" AS ENUM('draft', 'submitted', 'active', 'rejected', 'sold', 'inactive')`,
    );
    await queryRunner.query(
      `ALTER TABLE "listings" ALTER COLUMN "status" TYPE "public"."listings_status_enum" USING (CASE WHEN "status"::text = 'pending_review' THEN 'submitted' ELSE "status"::text END)::"public"."listings_status_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."listings_status_enum_new"`);
    await queryRunner.query(
      `ALTER TABLE "listings" ALTER COLUMN "status" SET DEFAULT 'draft'`,
    );

    await queryRunner.query(
      `ALTER TYPE "public"."listings_purpose_enum" RENAME TO "listings_purpose_enum_new"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."listings_purpose_enum" AS ENUM('sale', 'rent')`,
    );
    await queryRunner.query(
      `ALTER TABLE "listings" ALTER COLUMN "purpose" TYPE "public"."listings_purpose_enum" USING (CASE WHEN "purpose"::text = 'long_term_rent' THEN 'rent' ELSE "purpose"::text END)::"public"."listings_purpose_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."listings_purpose_enum_new"`);

    await queryRunner.query(
      `DROP INDEX "public"."IDX_CAIRO_AREA_ALIASES_AREA"`,
    );
    await queryRunner.query(`DROP TABLE "cairo_area_aliases"`);
    await queryRunner.query(
      `DROP TYPE "public"."cairo_area_aliases_locale_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_CAIRO_AREAS_NORMALIZED_EN"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_CAIRO_AREAS_NORMALIZED_AR"`,
    );
    for (const column of [
      'display_order',
      'is_active',
      'normalized_name_en',
      'normalized_name_ar',
    ]) {
      await queryRunner.query(
        `ALTER TABLE "cairo_areas" DROP COLUMN "${column}"`,
      );
    }
  }
}
