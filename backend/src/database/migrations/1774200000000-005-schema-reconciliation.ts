import { MigrationInterface, QueryRunner } from 'typeorm';

/** Reconciles entities that existed in application code but were absent from migrations 001–004. */
export class SchemaReconciliation1774200000000 implements MigrationInterface {
  name = 'SchemaReconciliation1774200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "listings" ADD "description" text`);

    await queryRunner.query(
      `CREATE TYPE "public"."views_source_enum" AS ENUM('map_click', 'search', 'direct')`,
    );
    await queryRunner.query(
      `CREATE TABLE "views" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "listing_id" uuid NOT NULL,
        "viewer_id" uuid,
        "source" "public"."views_source_enum" NOT NULL DEFAULT 'direct',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_VIEWS" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_VIEWS_LISTING_CREATED_AT" ON "views" ("listing_id", "created_at")`,
    );
    await queryRunner.query(
      `ALTER TABLE "views" ADD CONSTRAINT "FK_VIEWS_LISTING" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "views" ADD CONSTRAINT "FK_VIEWS_VIEWER" FOREIGN KEY ("viewer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."inquiries_contact_method_enum" AS ENUM('whatsapp', 'call')`,
    );
    await queryRunner.query(
      `CREATE TABLE "inquiries" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "listing_id" uuid NOT NULL,
        "buyer_id" uuid,
        "contact_method" "public"."inquiries_contact_method_enum" NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_INQUIRIES" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_INQUIRIES_LISTING_ID" ON "inquiries" ("listing_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "inquiries" ADD CONSTRAINT "FK_INQUIRIES_LISTING" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "inquiries" ADD CONSTRAINT "FK_INQUIRIES_BUYER" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "inquiries" DROP CONSTRAINT "FK_INQUIRIES_BUYER"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inquiries" DROP CONSTRAINT "FK_INQUIRIES_LISTING"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_INQUIRIES_LISTING_ID"`);
    await queryRunner.query(`DROP TABLE "inquiries"`);
    await queryRunner.query(
      `DROP TYPE "public"."inquiries_contact_method_enum"`,
    );

    await queryRunner.query(
      `ALTER TABLE "views" DROP CONSTRAINT "FK_VIEWS_VIEWER"`,
    );
    await queryRunner.query(
      `ALTER TABLE "views" DROP CONSTRAINT "FK_VIEWS_LISTING"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_VIEWS_LISTING_CREATED_AT"`,
    );
    await queryRunner.query(`DROP TABLE "views"`);
    await queryRunner.query(`DROP TYPE "public"."views_source_enum"`);

    await queryRunner.query(`ALTER TABLE "listings" DROP COLUMN "description"`);
  }
}
