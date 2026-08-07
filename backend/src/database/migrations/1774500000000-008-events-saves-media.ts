import { MigrationInterface, QueryRunner } from 'typeorm';

/** Adds race-safe membership, privacy-minimal events/intents, and protected media metadata. */
export class EventsSavesMedia1774500000000 implements MigrationInterface {
  name = 'EventsSavesMedia1774500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "saved_listings" DROP CONSTRAINT "UQ_SAVED_LISTINGS_BUYER_LISTING"`,
    );
    await queryRunner.query(
      `ALTER TABLE "saved_listings" DROP CONSTRAINT "UQ_SAVED_LISTINGS_SESSION_LISTING"`,
    );
    await queryRunner.query(
      `ALTER TABLE "saved_listings" DROP CONSTRAINT "FK_SAVED_LISTINGS_BUYER"`,
    );
    await queryRunner.query(
      `DELETE FROM "saved_listings" WHERE "buyer_id" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "saved_listings" RENAME COLUMN "buyer_id" TO "user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "saved_listings" DROP COLUMN "session_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "saved_listings" ADD "anonymous_subject_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "saved_listings" ADD "active" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "saved_listings" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "saved_listings" ADD "deactivated_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "saved_listings" ADD CONSTRAINT "CHK_SAVED_LISTINGS_EXACTLY_ONE_PRINCIPAL" CHECK (("user_id" IS NOT NULL AND "anonymous_subject_id" IS NULL) OR ("user_id" IS NULL AND "anonymous_subject_id" IS NOT NULL))`,
    );
    await queryRunner.query(
      `ALTER TABLE "saved_listings" ADD CONSTRAINT "CHK_SAVED_LISTINGS_DEACTIVATION" CHECK (("active" = true AND "deactivated_at" IS NULL) OR "active" = false)`,
    );
    await queryRunner.query(
      `ALTER TABLE "saved_listings" ADD CONSTRAINT "FK_SAVED_LISTINGS_USER" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "saved_listings" ADD CONSTRAINT "FK_SAVED_LISTINGS_ANONYMOUS" FOREIGN KEY ("anonymous_subject_id") REFERENCES "anonymous_subjects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_SAVED_LISTINGS_ACTIVE_USER" ON "saved_listings" ("user_id", "listing_id") WHERE "active" = true AND "user_id" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_SAVED_LISTINGS_ACTIVE_ANONYMOUS" ON "saved_listings" ("anonymous_subject_id", "listing_id") WHERE "active" = true AND "anonymous_subject_id" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_SAVED_LISTINGS_LISTING_ACTIVE" ON "saved_listings" ("listing_id") WHERE "active" = true`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."listing_views_source_enum" AS ENUM('map_click', 'search', 'direct')`,
    );
    await queryRunner.query(
      `CREATE TABLE "listing_views" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "listing_id" uuid NOT NULL,
        "user_id" uuid,
        "anonymous_subject_id" uuid,
        "source" "public"."listing_views_source_enum" NOT NULL DEFAULT 'direct',
        "time_bucket" TIMESTAMP WITH TIME ZONE NOT NULL,
        "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "correlation_id" character varying(128) NOT NULL,
        "occurred_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_LISTING_VIEWS" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_LISTING_VIEWS_EXACTLY_ONE_PRINCIPAL" CHECK (("user_id" IS NOT NULL AND "anonymous_subject_id" IS NULL) OR ("user_id" IS NULL AND "anonymous_subject_id" IS NOT NULL)),
        CONSTRAINT "FK_LISTING_VIEWS_LISTING" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "FK_LISTING_VIEWS_USER" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "FK_LISTING_VIEWS_ANONYMOUS" FOREIGN KEY ("anonymous_subject_id") REFERENCES "anonymous_subjects"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
      )`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_LISTING_VIEWS_USER_BUCKET" ON "listing_views" ("listing_id", "user_id", "time_bucket") WHERE "user_id" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_LISTING_VIEWS_ANONYMOUS_BUCKET" ON "listing_views" ("listing_id", "anonymous_subject_id", "time_bucket") WHERE "anonymous_subject_id" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE TRIGGER "TRG_LISTING_VIEWS_APPEND_ONLY" BEFORE UPDATE OR DELETE ON "listing_views" FOR EACH ROW EXECUTE FUNCTION makaan_reject_append_only_mutation()`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."contact_intents_method_enum" AS ENUM('phone', 'whatsapp')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."contact_intents_rate_decision_enum" AS ENUM('accepted', 'rejected')`,
    );
    await queryRunner.query(
      `CREATE TABLE "contact_intents" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "listing_id" uuid NOT NULL,
        "user_id" uuid,
        "anonymous_subject_id" uuid,
        "method" "public"."contact_intents_method_enum" NOT NULL,
        "rate_decision" "public"."contact_intents_rate_decision_enum" NOT NULL,
        "resolver_token_hash" character varying(128),
        "accepted_at" TIMESTAMP WITH TIME ZONE,
        "expires_at" TIMESTAMP WITH TIME ZONE,
        "resolved_at" TIMESTAMP WITH TIME ZONE,
        "correlation_id" character varying(128) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_CONTACT_INTENTS" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_CONTACT_INTENTS_EXACTLY_ONE_PRINCIPAL" CHECK (("user_id" IS NOT NULL AND "anonymous_subject_id" IS NULL) OR ("user_id" IS NULL AND "anonymous_subject_id" IS NOT NULL)),
        CONSTRAINT "CHK_CONTACT_INTENTS_ACCEPTANCE" CHECK (("rate_decision" = 'accepted' AND "resolver_token_hash" IS NOT NULL AND "accepted_at" IS NOT NULL AND "expires_at" IS NOT NULL AND "expires_at" > "accepted_at") OR ("rate_decision" = 'rejected' AND "resolver_token_hash" IS NULL AND "accepted_at" IS NULL AND "expires_at" IS NULL AND "resolved_at" IS NULL)),
        CONSTRAINT "UQ_CONTACT_INTENTS_TOKEN_HASH" UNIQUE ("resolver_token_hash"),
        CONSTRAINT "FK_CONTACT_INTENTS_LISTING" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "FK_CONTACT_INTENTS_USER" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "FK_CONTACT_INTENTS_ANONYMOUS" FOREIGN KEY ("anonymous_subject_id") REFERENCES "anonymous_subjects"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_CONTACT_INTENTS_PRINCIPAL_EXPIRY" ON "contact_intents" ("user_id", "anonymous_subject_id", "expires_at")`,
    );
    await queryRunner.query(
      `CREATE TABLE "contact_events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "intent_id" uuid NOT NULL,
        "listing_id" uuid NOT NULL,
        "user_id" uuid,
        "anonymous_subject_id" uuid,
        "method" "public"."contact_intents_method_enum" NOT NULL,
        "correlation_id" character varying(128) NOT NULL,
        "occurred_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_CONTACT_EVENTS" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_CONTACT_EVENTS_INTENT" UNIQUE ("intent_id"),
        CONSTRAINT "CHK_CONTACT_EVENTS_EXACTLY_ONE_PRINCIPAL" CHECK (("user_id" IS NOT NULL AND "anonymous_subject_id" IS NULL) OR ("user_id" IS NULL AND "anonymous_subject_id" IS NOT NULL)),
        CONSTRAINT "FK_CONTACT_EVENTS_INTENT" FOREIGN KEY ("intent_id") REFERENCES "contact_intents"("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "FK_CONTACT_EVENTS_LISTING" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "FK_CONTACT_EVENTS_USER" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "FK_CONTACT_EVENTS_ANONYMOUS" FOREIGN KEY ("anonymous_subject_id") REFERENCES "anonymous_subjects"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_CONTACT_EVENTS_LISTING_TIME" ON "contact_events" ("listing_id", "occurred_at")`,
    );
    await queryRunner.query(
      `CREATE TRIGGER "TRG_CONTACT_EVENTS_APPEND_ONLY" BEFORE UPDATE OR DELETE ON "contact_events" FOR EACH ROW EXECUTE FUNCTION makaan_reject_append_only_mutation()`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."listing_media_scan_state_enum" AS ENUM('pending', 'clean', 'malicious', 'failed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "listing_media" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "listing_id" uuid NOT NULL,
        "revision_id" uuid,
        "source_object_reference_ciphertext" text NOT NULL,
        "source_key_version" integer NOT NULL DEFAULT 1,
        "approved_derivative_reference" text,
        "detected_mime" character varying(80) NOT NULL,
        "byte_size" integer NOT NULL,
        "width" integer NOT NULL,
        "height" integer NOT NULL,
        "sha256_digest" character varying(64) NOT NULL,
        "perceptual_hash" character varying(128),
        "scan_state" "public"."listing_media_scan_state_enum" NOT NULL DEFAULT 'pending',
        "scan_engine" character varying(120),
        "scanned_at" TIMESTAMP WITH TIME ZONE,
        "display_order" integer NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_LISTING_MEDIA" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_LISTING_MEDIA_SIZE" CHECK ("byte_size" > 0 AND "byte_size" <= 5242880),
        CONSTRAINT "CHK_LISTING_MEDIA_DIMENSIONS" CHECK ("width" > 0 AND "height" > 0),
        CONSTRAINT "CHK_LISTING_MEDIA_KEY_VERSION" CHECK ("source_key_version" > 0),
        CONSTRAINT "FK_LISTING_MEDIA_LISTING" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "FK_LISTING_MEDIA_REVISION" FOREIGN KEY ("revision_id") REFERENCES "listing_revisions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
      )`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_LISTING_MEDIA_ACTIVE_ORDER" ON "listing_media" ("listing_id", "display_order") WHERE "deleted_at" IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_LISTING_MEDIA_REVISION_SCAN" ON "listing_media" ("revision_id", "scan_state") WHERE "deleted_at" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM "saved_listings" WHERE "anonymous_subject_id" IS NOT NULL)
          OR EXISTS (SELECT 1 FROM "listing_views")
          OR EXISTS (SELECT 1 FROM "contact_intents")
          OR EXISTS (SELECT 1 FROM "listing_media") THEN
          RAISE EXCEPTION 'Migration 008 down is disposable-schema-only after event/media writes; restore a backup or forward-fix instead';
        END IF;
      END
      $$
    `);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_LISTING_MEDIA_REVISION_SCAN"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."UQ_LISTING_MEDIA_ACTIVE_ORDER"`,
    );
    await queryRunner.query(`DROP TABLE "listing_media"`);
    await queryRunner.query(
      `DROP TYPE "public"."listing_media_scan_state_enum"`,
    );
    await queryRunner.query(
      `DROP TRIGGER "TRG_CONTACT_EVENTS_APPEND_ONLY" ON "contact_events"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_CONTACT_EVENTS_LISTING_TIME"`,
    );
    await queryRunner.query(`DROP TABLE "contact_events"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_CONTACT_INTENTS_PRINCIPAL_EXPIRY"`,
    );
    await queryRunner.query(`DROP TABLE "contact_intents"`);
    await queryRunner.query(
      `DROP TYPE "public"."contact_intents_rate_decision_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."contact_intents_method_enum"`);
    await queryRunner.query(
      `DROP TRIGGER "TRG_LISTING_VIEWS_APPEND_ONLY" ON "listing_views"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."UQ_LISTING_VIEWS_ANONYMOUS_BUCKET"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."UQ_LISTING_VIEWS_USER_BUCKET"`,
    );
    await queryRunner.query(`DROP TABLE "listing_views"`);
    await queryRunner.query(`DROP TYPE "public"."listing_views_source_enum"`);

    await queryRunner.query(
      `DROP INDEX "public"."IDX_SAVED_LISTINGS_LISTING_ACTIVE"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."UQ_SAVED_LISTINGS_ACTIVE_ANONYMOUS"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."UQ_SAVED_LISTINGS_ACTIVE_USER"`,
    );
    await queryRunner.query(
      `ALTER TABLE "saved_listings" DROP CONSTRAINT "FK_SAVED_LISTINGS_ANONYMOUS"`,
    );
    await queryRunner.query(
      `ALTER TABLE "saved_listings" DROP CONSTRAINT "FK_SAVED_LISTINGS_USER"`,
    );
    await queryRunner.query(
      `ALTER TABLE "saved_listings" DROP CONSTRAINT "CHK_SAVED_LISTINGS_DEACTIVATION"`,
    );
    await queryRunner.query(
      `ALTER TABLE "saved_listings" DROP CONSTRAINT "CHK_SAVED_LISTINGS_EXACTLY_ONE_PRINCIPAL"`,
    );
    for (const column of [
      'deactivated_at',
      'updated_at',
      'active',
      'anonymous_subject_id',
    ]) {
      await queryRunner.query(
        `ALTER TABLE "saved_listings" DROP COLUMN "${column}"`,
      );
    }
    await queryRunner.query(
      `ALTER TABLE "saved_listings" ADD "session_id" character varying(120)`,
    );
    await queryRunner.query(
      `ALTER TABLE "saved_listings" RENAME COLUMN "user_id" TO "buyer_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "saved_listings" ADD CONSTRAINT "FK_SAVED_LISTINGS_BUYER" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "saved_listings" ADD CONSTRAINT "UQ_SAVED_LISTINGS_BUYER_LISTING" UNIQUE ("buyer_id", "listing_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "saved_listings" ADD CONSTRAINT "UQ_SAVED_LISTINGS_SESSION_LISTING" UNIQUE ("session_id", "listing_id")`,
    );
  }
}
