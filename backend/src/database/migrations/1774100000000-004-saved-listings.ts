import { MigrationInterface, QueryRunner } from 'typeorm';

export class SavedListings1774100000000 implements MigrationInterface {
  name = 'SavedListings1774100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "saved_listings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "buyer_id" uuid, "listing_id" uuid NOT NULL, "session_id" character varying(120), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_SAVED_LISTINGS_BUYER_LISTING" UNIQUE ("buyer_id", "listing_id"), CONSTRAINT "UQ_SAVED_LISTINGS_SESSION_LISTING" UNIQUE ("session_id", "listing_id"), CONSTRAINT "PK_0ca011156f7eeaf0f74645b50c8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "saved_listings" ADD CONSTRAINT "FK_SAVED_LISTINGS_BUYER" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "saved_listings" ADD CONSTRAINT "FK_SAVED_LISTINGS_LISTING" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "saved_listings" DROP CONSTRAINT "FK_SAVED_LISTINGS_LISTING"`,
    );
    await queryRunner.query(
      `ALTER TABLE "saved_listings" DROP CONSTRAINT "FK_SAVED_LISTINGS_BUYER"`,
    );
    await queryRunner.query(`DROP TABLE "saved_listings"`);
  }
}
