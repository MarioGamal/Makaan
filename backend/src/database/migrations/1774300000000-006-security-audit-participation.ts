import { MigrationInterface, QueryRunner } from 'typeorm';

/** Adds the security, participation, verification, and immutable-audit foundation. */
export class SecurityAuditParticipation1774300000000 implements MigrationInterface {
  name = 'SecurityAuditParticipation1774300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."auth_sessions_session_scope_enum" AS ENUM('seller', 'admin')`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_sessions" RENAME COLUMN "expires_at" TO "absolute_expires_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_sessions" ADD "session_scope" "public"."auth_sessions_session_scope_enum" NOT NULL DEFAULT 'seller'`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_sessions" ADD "role_at_issue" "public"."users_user_type_enum" NOT NULL DEFAULT 'seller'`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_sessions" ADD "csrf_hash" character varying(128) NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_sessions" ADD "last_seen_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_sessions" ADD "idle_expires_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_sessions" ADD "revocation_reason" character varying(120)`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_sessions" ADD "rotated_from_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_sessions" ADD "ip_prefix_hash" character varying(128)`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_sessions" ADD "user_agent_hash" character varying(128)`,
    );
    await queryRunner.query(
      `UPDATE "auth_sessions" AS session SET "role_at_issue" = users."user_type" FROM "users" WHERE users."id" = session."user_id"`,
    );
    await queryRunner.query(
      `UPDATE "auth_sessions" AS session SET "session_scope" = 'admin' FROM "users" WHERE users."id" = session."user_id" AND users."user_type" = 'admin'`,
    );
    await queryRunner.query(
      `UPDATE "auth_sessions" SET "csrf_hash" = 'legacy-revoked:' || "id"::text, "revoked_at" = COALESCE("revoked_at", now()), "revocation_reason" = COALESCE("revocation_reason", 'security_schema_upgrade')`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_sessions" ALTER COLUMN "session_scope" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_sessions" ALTER COLUMN "role_at_issue" DROP DEFAULT`,
    );
    await queryRunner.query(
      `UPDATE "auth_sessions" SET "idle_expires_at" = LEAST("idle_expires_at", "absolute_expires_at")`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_sessions" ADD CONSTRAINT "CHK_AUTH_SESSIONS_EXPIRY_ORDER" CHECK ("idle_expires_at" <= "absolute_expires_at")`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_sessions" ADD CONSTRAINT "CHK_AUTH_SESSIONS_SCOPE_ROLE" CHECK (("session_scope" = 'admin' AND "role_at_issue" = 'admin') OR ("session_scope" = 'seller' AND "role_at_issue" = 'seller'))`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_sessions" ADD CONSTRAINT "FK_AUTH_SESSIONS_ROTATED_FROM" FOREIGN KEY ("rotated_from_id") REFERENCES "auth_sessions"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_AUTH_SESSIONS_TOKEN_HASH" ON "auth_sessions" ("token_hash")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_AUTH_SESSIONS_USER_SCOPE" ON "auth_sessions" ("user_id", "session_scope")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_AUTH_SESSIONS_ACTIVE_EXPIRY" ON "auth_sessions" ("absolute_expires_at", "idle_expires_at") WHERE "revoked_at" IS NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "users" RENAME COLUMN "phone_number" TO "legacy_phone_number"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "legacy_phone_number" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" RENAME COLUMN "two_factor_secret" TO "legacy_two_factor_secret"`,
    );
    await queryRunner.query(`ALTER TABLE "users" ADD "phone_ciphertext" text`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "phone_lookup_hash" character varying(128)`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "display_name" character varying(120)`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "password_version" integer NOT NULL DEFAULT 1`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "recovery_version" integer NOT NULL DEFAULT 1`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "second_factor_secret_ciphertext" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "CHK_USERS_PHONE_PROTECTED_OR_LEGACY" CHECK ("user_type" = 'admin' OR ("phone_ciphertext" IS NOT NULL AND "phone_lookup_hash" IS NOT NULL) OR "legacy_phone_number" IS NOT NULL)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_USERS_PHONE_LOOKUP_HASH" ON "users" ("phone_lookup_hash") WHERE "phone_lookup_hash" IS NOT NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "seller_profiles" RENAME COLUMN "seller_type" TO "declared_participation"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."seller_profiles_seller_type_enum" RENAME TO "seller_profiles_declared_participation_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."seller_profiles_classification_source_enum" AS ENUM('self_declared', 'moderator_override', 'risk_signal')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."seller_profiles_review_state_enum" AS ENUM('clear', 'under_review', 'suspended')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."seller_profiles_verification_state_enum" AS ENUM('not_verified', 'pending', 'verified', 'rejected', 'expired')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."seller_profiles_moderator_participation_override_enum" AS ENUM('owner', 'agent')`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_profiles" ADD "participation_declaration_version" integer NOT NULL DEFAULT 1`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_profiles" ADD "agent_declaration_confirmed_version" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_profiles" ADD "agent_declaration_confirmed_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_profiles" ADD "agent_declaration_confirmed_by" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_profiles" ADD "classification_source" "public"."seller_profiles_classification_source_enum" NOT NULL DEFAULT 'self_declared'`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_profiles" ADD "moderator_participation_override" "public"."seller_profiles_moderator_participation_override_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_profiles" ADD "review_state" "public"."seller_profiles_review_state_enum" NOT NULL DEFAULT 'clear'`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_profiles" ADD "verification_state" "public"."seller_profiles_verification_state_enum" NOT NULL DEFAULT 'not_verified'`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_profiles" ADD "verification_decided_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_profiles" ADD "verification_decided_by" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_profiles" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_profiles" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_profiles" ADD CONSTRAINT "CHK_SELLER_PROFILE_AGENT_CONFIRMATION" CHECK (("agent_declaration_confirmed_version" IS NULL AND "agent_declaration_confirmed_at" IS NULL AND "agent_declaration_confirmed_by" IS NULL) OR ("agent_declaration_confirmed_version" IS NOT NULL AND "agent_declaration_confirmed_at" IS NOT NULL AND "agent_declaration_confirmed_by" IS NOT NULL))`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_profiles" ADD CONSTRAINT "FK_SELLER_PROFILE_AGENT_CONFIRMATION_ADMIN" FOREIGN KEY ("agent_declaration_confirmed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_profiles" ADD CONSTRAINT "FK_SELLER_PROFILE_VERIFICATION_ADMIN" FOREIGN KEY ("verification_decided_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE TABLE "anonymous_subjects" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "token_hash" character varying(128) NOT NULL,
        "csrf_hash" character varying(128) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "last_seen_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "expires_at" TIMESTAMP WITH TIME ZONE,
        "revoked_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_ANONYMOUS_SUBJECTS" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_ANONYMOUS_SUBJECTS_TOKEN_HASH" UNIQUE ("token_hash")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ANONYMOUS_SUBJECTS_ACTIVE_EXPIRY" ON "anonymous_subjects" ("expires_at") WHERE "revoked_at" IS NULL`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."verification_cases_status_enum" AS ENUM('open', 'approved', 'rejected', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "verification_cases" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "seller_id" uuid NOT NULL,
        "status" "public"."verification_cases_status_enum" NOT NULL DEFAULT 'open',
        "decision_reason" text,
        "retention_hold_reason" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "decided_at" TIMESTAMP WITH TIME ZONE,
        "decided_by" uuid,
        CONSTRAINT "PK_VERIFICATION_CASES" PRIMARY KEY ("id"),
        CONSTRAINT "FK_VERIFICATION_CASES_SELLER" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "FK_VERIFICATION_CASES_DECIDER" FOREIGN KEY ("decided_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_VERIFICATION_CASES_SELLER_STATUS" ON "verification_cases" ("seller_id", "status")`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."verification_evidence_scan_state_enum" AS ENUM('pending', 'clean', 'malicious', 'failed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "verification_evidence" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "case_id" uuid NOT NULL,
        "uploaded_by" uuid NOT NULL,
        "metadata_ciphertext" text NOT NULL,
        "private_object_reference" text NOT NULL,
        "scan_state" "public"."verification_evidence_scan_state_enum" NOT NULL DEFAULT 'pending',
        "uploaded_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "decision_at" TIMESTAMP WITH TIME ZONE,
        "deletion_due_at" TIMESTAMP WITH TIME ZONE,
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        "retention_hold_reason" text,
        CONSTRAINT "PK_VERIFICATION_EVIDENCE" PRIMARY KEY ("id"),
        CONSTRAINT "FK_VERIFICATION_EVIDENCE_CASE" FOREIGN KEY ("case_id") REFERENCES "verification_cases"("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "FK_VERIFICATION_EVIDENCE_UPLOADER" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_VERIFICATION_EVIDENCE_CASE" ON "verification_evidence" ("case_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_VERIFICATION_EVIDENCE_RETENTION" ON "verification_evidence" ("deletion_due_at") WHERE "deleted_at" IS NULL`,
    );

    await queryRunner.query(
      `CREATE TABLE "evidence_accesses" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "case_id" uuid NOT NULL,
        "evidence_id" uuid NOT NULL,
        "actor_id" uuid NOT NULL,
        "purpose" character varying(160) NOT NULL,
        "correlation_id" character varying(128) NOT NULL,
        "accessed_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_EVIDENCE_ACCESSES" PRIMARY KEY ("id"),
        CONSTRAINT "FK_EVIDENCE_ACCESSES_CASE" FOREIGN KEY ("case_id") REFERENCES "verification_cases"("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "FK_EVIDENCE_ACCESSES_EVIDENCE" FOREIGN KEY ("evidence_id") REFERENCES "verification_evidence"("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "FK_EVIDENCE_ACCESSES_ACTOR" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_EVIDENCE_ACCESSES_EVIDENCE_TIME" ON "evidence_accesses" ("evidence_id", "accessed_at")`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."audit_events_actor_kind_enum" AS ENUM('user', 'anonymous', 'system')`,
    );
    await queryRunner.query(
      `CREATE TABLE "audit_events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "actor_kind" "public"."audit_events_actor_kind_enum" NOT NULL,
        "actor_id" uuid,
        "actor_snapshot" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "session_id" uuid,
        "action" character varying(160) NOT NULL,
        "target_kind" character varying(120) NOT NULL,
        "target_id" uuid,
        "prior_state" jsonb,
        "resulting_state" jsonb,
        "reason_key" character varying(160),
        "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "occurred_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "correlation_id" character varying(128) NOT NULL,
        CONSTRAINT "PK_AUDIT_EVENTS" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_AUDIT_EVENTS_TARGET_TIME" ON "audit_events" ("target_kind", "target_id", "occurred_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_AUDIT_EVENTS_ACTOR_TIME" ON "audit_events" ("actor_kind", "actor_id", "occurred_at")`,
    );

    await queryRunner.query(`
      CREATE FUNCTION makaan_reject_append_only_mutation() RETURNS trigger AS $$
      BEGIN
        RAISE EXCEPTION 'append-only table % cannot be updated or deleted', TG_TABLE_NAME;
      END;
      $$ LANGUAGE plpgsql
    `);
    await queryRunner.query(
      `CREATE TRIGGER "TRG_AUDIT_EVENTS_APPEND_ONLY" BEFORE UPDATE OR DELETE ON "audit_events" FOR EACH ROW EXECUTE FUNCTION makaan_reject_append_only_mutation()`,
    );
    await queryRunner.query(
      `CREATE TRIGGER "TRG_EVIDENCE_ACCESSES_APPEND_ONLY" BEFORE UPDATE OR DELETE ON "evidence_accesses" FOR EACH ROW EXECUTE FUNCTION makaan_reject_append_only_mutation()`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
            FROM "users"
           WHERE "legacy_phone_number" IS NULL
        ) THEN
          RAISE EXCEPTION 'Migration 006 down is disposable-schema-only after 006-era writes; restore a backup or forward-fix instead';
        END IF;
      END
      $$
    `);
    await queryRunner.query(
      `DROP TRIGGER "TRG_EVIDENCE_ACCESSES_APPEND_ONLY" ON "evidence_accesses"`,
    );
    await queryRunner.query(
      `DROP TRIGGER "TRG_AUDIT_EVENTS_APPEND_ONLY" ON "audit_events"`,
    );
    await queryRunner.query(`DROP FUNCTION makaan_reject_append_only_mutation`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_AUDIT_EVENTS_ACTOR_TIME"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_AUDIT_EVENTS_TARGET_TIME"`,
    );
    await queryRunner.query(`DROP TABLE "audit_events"`);
    await queryRunner.query(
      `DROP TYPE "public"."audit_events_actor_kind_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_EVIDENCE_ACCESSES_EVIDENCE_TIME"`,
    );
    await queryRunner.query(`DROP TABLE "evidence_accesses"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_VERIFICATION_EVIDENCE_RETENTION"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_VERIFICATION_EVIDENCE_CASE"`,
    );
    await queryRunner.query(`DROP TABLE "verification_evidence"`);
    await queryRunner.query(
      `DROP TYPE "public"."verification_evidence_scan_state_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_VERIFICATION_CASES_SELLER_STATUS"`,
    );
    await queryRunner.query(`DROP TABLE "verification_cases"`);
    await queryRunner.query(
      `DROP TYPE "public"."verification_cases_status_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ANONYMOUS_SUBJECTS_ACTIVE_EXPIRY"`,
    );
    await queryRunner.query(`DROP TABLE "anonymous_subjects"`);

    await queryRunner.query(
      `ALTER TABLE "seller_profiles" DROP CONSTRAINT "FK_SELLER_PROFILE_VERIFICATION_ADMIN"`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_profiles" DROP CONSTRAINT "FK_SELLER_PROFILE_AGENT_CONFIRMATION_ADMIN"`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_profiles" DROP CONSTRAINT "CHK_SELLER_PROFILE_AGENT_CONFIRMATION"`,
    );
    for (const column of [
      'updated_at',
      'created_at',
      'verification_decided_by',
      'verification_decided_at',
      'verification_state',
      'review_state',
      'moderator_participation_override',
      'classification_source',
      'agent_declaration_confirmed_by',
      'agent_declaration_confirmed_at',
      'agent_declaration_confirmed_version',
      'participation_declaration_version',
    ]) {
      await queryRunner.query(
        `ALTER TABLE "seller_profiles" DROP COLUMN "${column}"`,
      );
    }
    await queryRunner.query(
      `DROP TYPE "public"."seller_profiles_moderator_participation_override_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."seller_profiles_verification_state_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."seller_profiles_review_state_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."seller_profiles_classification_source_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."seller_profiles_declared_participation_enum" RENAME TO "seller_profiles_seller_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_profiles" RENAME COLUMN "declared_participation" TO "seller_type"`,
    );

    await queryRunner.query(
      `DROP INDEX "public"."IDX_USERS_PHONE_LOOKUP_HASH"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "CHK_USERS_PHONE_PROTECTED_OR_LEGACY"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "second_factor_secret_ciphertext"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "recovery_version"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "password_version"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "display_name"`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "phone_lookup_hash"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "phone_ciphertext"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" RENAME COLUMN "legacy_two_factor_secret" TO "two_factor_secret"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "legacy_phone_number" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" RENAME COLUMN "legacy_phone_number" TO "phone_number"`,
    );

    await queryRunner.query(
      `DROP INDEX "public"."IDX_AUTH_SESSIONS_ACTIVE_EXPIRY"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_AUTH_SESSIONS_USER_SCOPE"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_AUTH_SESSIONS_TOKEN_HASH"`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_sessions" DROP CONSTRAINT "FK_AUTH_SESSIONS_ROTATED_FROM"`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_sessions" DROP CONSTRAINT "CHK_AUTH_SESSIONS_SCOPE_ROLE"`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_sessions" DROP CONSTRAINT "CHK_AUTH_SESSIONS_EXPIRY_ORDER"`,
    );
    for (const column of [
      'user_agent_hash',
      'ip_prefix_hash',
      'rotated_from_id',
      'revocation_reason',
      'idle_expires_at',
      'last_seen_at',
      'csrf_hash',
      'role_at_issue',
      'session_scope',
    ]) {
      await queryRunner.query(
        `ALTER TABLE "auth_sessions" DROP COLUMN "${column}"`,
      );
    }
    await queryRunner.query(
      `ALTER TABLE "auth_sessions" RENAME COLUMN "absolute_expires_at" TO "expires_at"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."auth_sessions_session_scope_enum"`,
    );
  }
}
