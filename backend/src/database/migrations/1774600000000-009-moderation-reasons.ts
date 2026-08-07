import { MigrationInterface, QueryRunner } from 'typeorm';

export class ModerationReasons1774600000000 implements MigrationInterface {
  name = 'ModerationReasons1774600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."listings_rejection_reason_enum" ADD VALUE IF NOT EXISTS 'media_issue'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."listings_rejection_reason_enum" ADD VALUE IF NOT EXISTS 'participation_unconfirmed'`,
    );
  }

  public async down(): Promise<void> {
    // PostgreSQL enum values are intentionally forward-only; removing them can corrupt history.
  }
}
