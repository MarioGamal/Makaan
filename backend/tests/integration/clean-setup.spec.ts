import { describe, expect, it } from '@jest/globals';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DataSource } from 'typeorm';

const rootPackage = JSON.parse(
  readFileSync(join(__dirname, '../../../package.json'), 'utf8'),
) as { scripts?: Record<string, string> };

const testDatabaseUrl = process.env.TEST_DATABASE_URL;

function assertDisposableTestDatabase(url: string | undefined): URL {
  if (!url) {
    throw new Error(
      'TEST_DATABASE_URL is required for destructive integration setup.',
    );
  }
  const parsed = new URL(url);
  const databaseName = parsed.pathname.replace(/^\//, '');
  const localHost = ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname);
  if (
    process.env.APP_MODE !== 'test' ||
    !localHost ||
    !databaseName.startsWith('makaan_test')
  ) {
    throw new Error('Refusing a non-disposable database target.');
  }
  return parsed;
}

const databaseIt = testDatabaseUrl ? it : it.skip;

describe('clean setup and governed demo data contract', () => {
  it('exposes the documented root commands for local services, migrations, seed, and guarded resets', () => {
    for (const command of [
      'local:up',
      'db:migrate',
      'db:seed',
      'local:reset-demo',
      'local:reset-empty',
    ]) {
      expect(rootPackage.scripts?.[command]).toEqual(expect.any(String));
    }
  });

  it('requires an application seed/reset command surface before any database is touched', () => {
    expect(() => require('../../src/database/seed')).not.toThrow();
    expect(() => require('../../src/database/reset')).not.toThrow();
  });

  it('refuses missing, production-looking, remote, and non-test database targets before destructive work', () => {
    const originalMode = process.env.APP_MODE;
    try {
      process.env.APP_MODE = 'test';
      expect(() => assertDisposableTestDatabase(undefined)).toThrow(
        'TEST_DATABASE_URL',
      );
      expect(() =>
        assertDisposableTestDatabase(
          'postgresql://user:pass@db.example/makaan_test',
        ),
      ).toThrow('Refusing');
      expect(() =>
        assertDisposableTestDatabase('postgresql://user:pass@localhost/makaan'),
      ).toThrow('Refusing');
      process.env.APP_MODE = 'production';
      expect(() =>
        assertDisposableTestDatabase(
          'postgresql://user:pass@localhost/makaan_test_clean',
        ),
      ).toThrow('Refusing');
    } finally {
      if (originalMode === undefined) delete process.env.APP_MODE;
      else process.env.APP_MODE = originalMode;
    }
  });

  it('guards the implemented reset command for both local and test modes', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const reset = require('../../src/database/reset') as {
      assertResetDatabaseTarget(url: string, mode?: string): URL;
    };

    expect(() =>
      reset.assertResetDatabaseTarget(
        'postgresql://user:pass@localhost:5433/makaan_test_clean',
        'test',
      ),
    ).not.toThrow();
    expect(() =>
      reset.assertResetDatabaseTarget(
        'postgresql://user:pass@localhost:5433/makaan_dev',
        'local',
      ),
    ).not.toThrow();
    expect(() =>
      reset.assertResetDatabaseTarget(
        'postgresql://user:pass@db.example/makaan_test_clean',
        'test',
      ),
    ).toThrow('Refusing');
    expect(() =>
      reset.assertResetDatabaseTarget(
        'postgresql://user:pass@localhost/makaan_production',
        'local',
      ),
    ).toThrow('Refusing');
    expect(() =>
      reset.assertResetDatabaseTarget(
        'postgresql://user:pass@localhost/makaan_dev',
        'production',
      ),
    ).toThrow('only in local or test');
  });

  databaseIt(
    'seeds twice and performs guarded demo/empty resets only on an explicit disposable test database',
    async () => {
      const databaseUrl = assertDisposableTestDatabase(testDatabaseUrl);
      // T030/T031 must export idempotent commands. The guard is deliberately evaluated before importing them.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const seed = require('../../src/database/seed') as {
        seedDatabase(url: string): Promise<void>;
      };
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const reset = require('../../src/database/reset') as {
        resetDemoData(url: string): Promise<void>;
        resetEmptyData(url: string): Promise<void>;
      };

      await seed.seedDatabase(databaseUrl.toString());
      await seed.seedDatabase(databaseUrl.toString());
      const source = new DataSource({
        type: 'postgres',
        url: databaseUrl.toString(),
      });
      await source.initialize();
      try {
        const counts = (await source.query(
          `SELECT
             (SELECT COUNT(*)::integer FROM cairo_areas) AS areas,
             (SELECT COUNT(*)::integer FROM users) AS users,
             (SELECT COUNT(*)::integer FROM seller_profiles) AS profiles,
             (SELECT COUNT(*)::integer FROM listings) AS listings,
             (SELECT COUNT(*)::integer FROM photos) AS photos,
             (SELECT COUNT(*)::integer FROM admin_actions) AS actions`,
        )) as Array<Record<string, number>>;
        expect(counts[0]).toEqual({
          areas: 3,
          users: 4,
          profiles: 3,
          listings: 4,
          photos: 12,
          actions: 3,
        });

        const protectedRows = (await source.query(
          `SELECT legacy_phone_number, phone_ciphertext, phone_lookup_hash,
                  legacy_two_factor_secret, second_factor_secret_ciphertext
             FROM users`,
        )) as Array<Record<string, string | null>>;
        expect(
          protectedRows.every((row) => row.legacy_phone_number === null),
        ).toBe(true);
        expect(
          protectedRows.every((row) => row.legacy_two_factor_secret === null),
        ).toBe(true);
        expect(JSON.stringify(protectedRows)).not.toContain('+201000000000');
        expect(JSON.stringify(protectedRows)).not.toContain('JBSWY3DPEHPK3PXP');

        await reset.resetDemoData(databaseUrl.toString());
        const demoCount = (await source.query(
          `SELECT COUNT(*)::integer AS count FROM listings`,
        )) as Array<{ count: number }>;
        expect(demoCount[0]?.count).toBe(4);

        await reset.resetEmptyData(databaseUrl.toString());
        const emptyCounts = (await source.query(
          `SELECT
             (SELECT COUNT(*)::integer FROM cairo_areas) AS areas,
             (SELECT COUNT(*)::integer FROM users) AS users,
             (SELECT COUNT(*)::integer FROM listings) AS listings`,
        )) as Array<Record<string, number>>;
        expect(emptyCounts[0]).toEqual({ areas: 0, users: 0, listings: 0 });
      } finally {
        await source.destroy();
      }
    },
    60_000,
  );
});
