import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { expect, describe, it } from '@jest/globals';
import { DataSource, MigrationInterface } from 'typeorm';

import { MAKAAN_ENTITIES } from '../../src/models';
import { AdminAction } from '../../src/models/admin-action.entity';
import { AnonymousSubject } from '../../src/models/anonymous-subject.entity';
import { AuditEvent } from '../../src/models/audit-event.entity';
import { AuthSession } from '../../src/models/auth-session.entity';
import { CairoArea } from '../../src/models/cairo-area.entity';
import { EvidenceAccess } from '../../src/models/evidence-access.entity';
import { Inquiry } from '../../src/models/inquiry.entity';
import { Listing } from '../../src/models/listing.entity';
import { Photo } from '../../src/models/photo.entity';
import { SavedListing } from '../../src/models/saved-listing.entity';
import { SellerNotification } from '../../src/models/seller-notification.entity';
import { SellerProfile } from '../../src/models/seller-profile.entity';
import { User } from '../../src/models/user.entity';
import { VerificationCase } from '../../src/models/verification-case.entity';
import { VerificationEvidence } from '../../src/models/verification-evidence.entity';
import { View } from '../../src/models/view.entity';

const migrationDirectory = resolve(__dirname, '../../src/database/migrations');
const runtimeDataSourcePath = resolve(
  __dirname,
  '../../src/database/data-source.ts',
);
const repairMigrationPattern = /(?:^|-)00[5-9]-/;
const expectedEntities = [
  AdminAction,
  AnonymousSubject,
  AuditEvent,
  AuthSession,
  CairoArea,
  EvidenceAccess,
  Inquiry,
  Listing,
  Photo,
  SavedListing,
  SellerNotification,
  SellerProfile,
  User,
  VerificationCase,
  VerificationEvidence,
  View,
];

type MigrationConstructor = new () => MigrationInterface;

type LoadedMigration = {
  fileName: string;
  migration: MigrationConstructor;
};

function loadMigrations(): LoadedMigration[] {
  return readdirSync(migrationDirectory)
    .filter((fileName) => fileName.endsWith('.ts') && fileName !== '.gitkeep')
    .sort()
    .flatMap((fileName) => {
      // ts-jest transpiles the migration modules before this test loads them.
      const moduleExports = require(
        join(migrationDirectory, fileName),
      ) as Record<string, unknown>;
      const migration = Object.values(moduleExports).find(
        (candidate): candidate is MigrationConstructor =>
          typeof candidate === 'function' &&
          typeof (candidate as MigrationConstructor).prototype.up ===
            'function' &&
          typeof (candidate as MigrationConstructor).prototype.down ===
            'function',
      );

      return migration ? [{ fileName, migration }] : [];
    });
}

/**
 * TEST_DATABASE_URL is always preferred. DATABASE_URL is accepted only when
 * APP_MODE=test, and both targets must name an obviously disposable database.
 */
function resolveTestDatabaseUrl(): string | undefined {
  return (
    process.env.TEST_DATABASE_URL ??
    (process.env.APP_MODE === 'test' ? process.env.DATABASE_URL : undefined)
  );
}

function assertDisposableTestDatabase(url: string): void {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error(
      'Migration integration requires a valid disposable test database URL.',
    );
  }

  if (!['postgres:', 'postgresql:'].includes(parsedUrl.protocol)) {
    throw new Error(
      'Migration integration requires a PostgreSQL test database URL.',
    );
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  const databaseName = decodeURIComponent(
    parsedUrl.pathname.slice(1),
  ).toLowerCase();
  const hasTestDatabaseName = /(^|[_-])(test|ci)([_-]|$)/.test(databaseName);
  const looksProductionLike = /(prod|production|live|makaan\.eg)/.test(
    `${hostname}/${databaseName}`,
  );

  if (!hasTestDatabaseName || looksProductionLike) {
    throw new Error(
      'Migration integration refuses a non-disposable or production-looking database target.',
    );
  }
}

async function resetVerifiedTestSchema(dataSource: DataSource): Promise<void> {
  // This is intentionally limited to the schema of an already-validated disposable database.
  await dataSource.query('DROP SCHEMA IF EXISTS public CASCADE');
  await dataSource.query('CREATE SCHEMA public');
}

const migrationUrl = resolveTestDatabaseUrl();
const describeMigrationIntegration = migrationUrl ? describe : describe.skip;

describe('migration static contracts', () => {
  it('uses the canonical complete entity registry and disables schema synchronization', () => {
    const runtimeDataSourceSource = readFileSync(runtimeDataSourcePath, 'utf8');

    expect(runtimeDataSourceSource).toMatch(/synchronize:\s*false/);
    expect(runtimeDataSourceSource).toContain('MAKAAN_ENTITIES');
    expect(MAKAAN_ENTITIES).toEqual(expectedEntities);
  });

  it('discovers the applied migration history and requires schema reconciliation migration 005', () => {
    const loadedMigrations = loadMigrations();
    const fileNames = loadedMigrations.map(({ fileName }) => fileName);

    expect(fileNames).toEqual(
      expect.arrayContaining([
        '001-create-extensions.ts',
        '1773549084611-002-create-schema.ts',
        '1774000000000-003-admin-moderation.ts',
        '1774100000000-004-saved-listings.ts',
      ]),
    );
    expect(fileNames.some((fileName) => /(?:^|-)005-/.test(fileName))).toBe(
      true,
    );
  });

  it.each([
    'postgresql://app:secret@production-db.internal/makaan',
    'postgresql://app:secret@localhost/makaan_dev',
    'mysql://app:secret@localhost/makaan_test',
  ])('refuses an unsafe migration target: %s', (unsafeUrl) => {
    expect(() => assertDisposableTestDatabase(unsafeUrl)).toThrow();
  });

  it('accepts an explicitly named disposable PostgreSQL target', () => {
    expect(() =>
      assertDisposableTestDatabase(
        'postgresql://makaan_test:makaan_test@localhost:5433/makaan_test',
      ),
    ).not.toThrow();
  });
});

describeMigrationIntegration('migration database integration', () => {
  let dataSource: DataSource;

  it('migrates an empty disposable database, safely reverses repair migrations, reapplies, and matches entity metadata', async () => {
    expect(migrationUrl).toBeDefined();
    assertDisposableTestDatabase(migrationUrl as string);

    const loadedMigrations = loadMigrations();
    const repairMigrations = loadedMigrations.filter(({ fileName }) =>
      repairMigrationPattern.test(fileName),
    );

    dataSource = new DataSource({
      type: 'postgres',
      url: migrationUrl,
      entities: [...MAKAAN_ENTITIES],
      migrations: loadedMigrations.map(({ migration }) => migration),
      synchronize: false,
    });

    expect(dataSource.options.synchronize).toBe(false);

    await dataSource.initialize();
    try {
      await resetVerifiedTestSchema(dataSource);
      await dataSource.runMigrations();
      await assertEntityParity(dataSource);

      for (let index = 0; index < repairMigrations.length; index += 1) {
        await dataSource.undoLastMigration();
      }

      await dataSource.runMigrations();
      await assertEntityParity(dataSource);
    } finally {
      if (dataSource.isInitialized) {
        await dataSource.destroy();
      }
    }
  }, 60_000);
});

async function assertEntityParity(dataSource: DataSource): Promise<void> {
  const rows = (await dataSource.query(
    `SELECT table_name, column_name
       FROM information_schema.columns
      WHERE table_schema = 'public'`,
  )) as Array<{ table_name: string; column_name: string }>;

  const columnsByTable = new Map<string, Set<string>>();
  for (const row of rows) {
    const columns = columnsByTable.get(row.table_name) ?? new Set<string>();
    columns.add(row.column_name);
    columnsByTable.set(row.table_name, columns);
  }

  for (const metadata of dataSource.entityMetadatas) {
    const databaseColumns = columnsByTable.get(metadata.tableName);
    expect(databaseColumns).toBeDefined();

    for (const column of metadata.columns) {
      expect(databaseColumns?.has(column.databaseName)).toBe(true);
    }
  }

  const sessionConstraints = (await dataSource.query(
    `SELECT conname
       FROM pg_constraint
      WHERE conrelid = 'auth_sessions'::regclass`,
  )) as Array<{ conname: string }>;
  expect(sessionConstraints.map(({ conname }) => conname)).toEqual(
    expect.arrayContaining([
      'CHK_AUTH_SESSIONS_EXPIRY_ORDER',
      'CHK_AUTH_SESSIONS_SCOPE_ROLE',
    ]),
  );

  const auditSessionForeignKeys = (await dataSource.query(
    `SELECT COUNT(*)::integer AS count
       FROM pg_constraint
      WHERE conrelid = 'audit_events'::regclass
        AND contype = 'f'
        AND pg_get_constraintdef(oid) LIKE '%session_id%'`,
  )) as Array<{ count: number }>;
  expect(auditSessionForeignKeys[0]?.count).toBe(0);

  const evidenceColumns = (await dataSource.query(
    `SELECT column_default, is_nullable
       FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'verification_evidence'
        AND column_name = 'uploaded_at'`,
  )) as Array<{ column_default: string | null; is_nullable: string }>;
  expect(evidenceColumns[0]).toEqual({
    column_default: 'now()',
    is_nullable: 'NO',
  });
}
