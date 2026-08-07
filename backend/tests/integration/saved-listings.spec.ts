import { describe, expect, it } from '@jest/globals';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DataSource } from 'typeorm';

const migrationPath = resolve(
  __dirname,
  '../../src/database/migrations/1774500000000-008-events-saves-media.ts',
);
const servicePath = resolve(
  __dirname,
  '../../src/services/saved-listing.service.ts',
);
const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const databaseIt = testDatabaseUrl ? it : it.skip;

function migrationSource(): string {
  expect(existsSync(migrationPath)).toBe(true);
  return readFileSync(migrationPath, 'utf8');
}

function serviceSource(): string {
  expect(existsSync(servicePath)).toBe(true);
  return readFileSync(servicePath, 'utf8');
}

describe('saved listing membership contract', () => {
  it('migrates saves to one and only one user-or-anonymous principal with active-membership uniqueness', () => {
    const source = migrationSource();

    expect(source).toMatch(/anonymous_subject_id/i);
    expect(source).toMatch(
      /CHK_SAVED_LISTINGS.*PRINCIPAL|exactly one principal/i,
    );
    expect(source).toMatch(/user_id.*listing_id|listing_id.*user_id/i);
    expect(source).toMatch(
      /anonymous_subject_id.*listing_id|listing_id.*anonymous_subject_id/i,
    );
    expect(source).toMatch(/WHERE\s+.*active/i);
  });

  it('uses a transactional, race-safe idempotent save/reactivation and deactivating unsave', () => {
    const source = serviceSource();

    expect(source).toMatch(/anonymousSubject|anonymous_subject/i);
    expect(source).toMatch(/userId|user_id/i);
    expect(source).toMatch(/ON CONFLICT|upsert|transaction/i);
    expect(source).toMatch(/active\s*[:=]\s*true/i);
    expect(source).toMatch(/active\s*[:=]\s*false/i);
    expect(source).not.toMatch(/sessionId|session_id/);
  });

  it('derives seller save metrics from active memberships rather than mutable listing counters', () => {
    const source = serviceSource();

    expect(source).toMatch(/COUNT\s*\(|count\s*\(/);
    expect(source).toMatch(/active/i);
    expect(source).not.toMatch(/increment\([^\n]*saveCount|save_count\s*\+/i);
  });

  databaseIt(
    'exposes the principal check and both partial active unique indexes after migrations',
    async () => {
      const dataSource = new DataSource({
        type: 'postgres',
        url: testDatabaseUrl,
      });
      await dataSource.initialize();
      try {
        const constraints = (await dataSource.query(
          `SELECT pg_get_constraintdef(oid) AS definition
           FROM pg_constraint
          WHERE conrelid = 'saved_listings'::regclass
            AND contype = 'c'`,
        )) as Array<{ definition: string }>;
        const indexes = (await dataSource.query(
          `SELECT indexdef
           FROM pg_indexes
          WHERE schemaname = 'public' AND tablename = 'saved_listings'`,
        )) as Array<{ indexdef: string }>;
        const definitions = constraints.map((row) => row.definition).join('\n');
        const indexDefinitions = indexes.map((row) => row.indexdef).join('\n');

        expect(definitions).toMatch(
          /user_id.*IS NULL.*anonymous_subject_id.*IS NOT NULL|anonymous_subject_id.*IS NULL.*user_id.*IS NOT NULL/i,
        );
        expect(indexDefinitions).toMatch(
          /UNIQUE.*\(user_id, listing_id\).*WHERE.*active/i,
        );
        expect(indexDefinitions).toMatch(
          /UNIQUE.*\(anonymous_subject_id, listing_id\).*WHERE.*active/i,
        );
      } finally {
        await dataSource.destroy();
      }
    },
  );
});
