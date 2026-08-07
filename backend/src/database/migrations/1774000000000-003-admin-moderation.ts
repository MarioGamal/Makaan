import { MigrationInterface, QueryRunner } from 'typeorm';

export class AdminModeration1774000000000 implements MigrationInterface {
  name = 'AdminModeration1774000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "username" character varying(120)`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_hash" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "two_factor_secret" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_2fa_enabled" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_USERS_USERNAME_UNIQUE" ON "users" ("username") WHERE "username" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."admin_actions_action_type_enum" AS ENUM('approve', 'reject', 'unpublish', 'block_user')`,
    );
    await queryRunner.query(
      `CREATE TABLE "admin_actions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "admin_id" uuid NOT NULL, "action_type" "public"."admin_actions_action_type_enum" NOT NULL, "target_listing_id" uuid, "target_user_id" uuid, "reason" text, "notes" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_647291f7f62fdbc50dc08ed4f26" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ADMIN_ACTIONS_ADMIN_CREATED_AT" ON "admin_actions" ("admin_id", "created_at")`,
    );
    await queryRunner.query(
      `CREATE TABLE "seller_notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "seller_id" uuid NOT NULL, "listing_id" uuid NOT NULL, "rejection_reason" "public"."listings_rejection_reason_enum" NOT NULL, "notes" text, "is_read" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_d3d1d7990f7a146f6e4b3dbddf6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "admin_actions" ADD CONSTRAINT "FK_ADMIN_ACTIONS_ADMIN" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "admin_actions" ADD CONSTRAINT "FK_ADMIN_ACTIONS_LISTING" FOREIGN KEY ("target_listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "admin_actions" ADD CONSTRAINT "FK_ADMIN_ACTIONS_TARGET_USER" FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_notifications" ADD CONSTRAINT "FK_SELLER_NOTIFICATIONS_SELLER" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_notifications" ADD CONSTRAINT "FK_SELLER_NOTIFICATIONS_LISTING" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "seller_notifications" DROP CONSTRAINT "FK_SELLER_NOTIFICATIONS_LISTING"`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_notifications" DROP CONSTRAINT "FK_SELLER_NOTIFICATIONS_SELLER"`,
    );
    await queryRunner.query(
      `ALTER TABLE "admin_actions" DROP CONSTRAINT "FK_ADMIN_ACTIONS_TARGET_USER"`,
    );
    await queryRunner.query(
      `ALTER TABLE "admin_actions" DROP CONSTRAINT "FK_ADMIN_ACTIONS_LISTING"`,
    );
    await queryRunner.query(
      `ALTER TABLE "admin_actions" DROP CONSTRAINT "FK_ADMIN_ACTIONS_ADMIN"`,
    );
    await queryRunner.query(`DROP TABLE "seller_notifications"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ADMIN_ACTIONS_ADMIN_CREATED_AT"`,
    );
    await queryRunner.query(`DROP TABLE "admin_actions"`);
    await queryRunner.query(
      `DROP TYPE "public"."admin_actions_action_type_enum"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_USERS_USERNAME_UNIQUE"`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "is_2fa_enabled"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "two_factor_secret"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "password_hash"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "username"`,
    );
  }
}
