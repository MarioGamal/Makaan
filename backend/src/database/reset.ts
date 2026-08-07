import 'reflect-metadata';

import { DataSource } from 'typeorm';

import { MAKAAN_ENTITIES } from '../models';

import { assertLocalDatabaseTarget } from './database-command-safety';
import { seedDatabase } from './seed';

export type ResetMode = 'local' | 'test';

/**
 * Destructive reset commands are deliberately limited to loopback Makaan
 * development/test databases. Production and remote targets are never valid.
 */
export function assertResetDatabaseTarget(
  databaseUrl: string,
  appMode = process.env.APP_MODE,
): URL {
  return assertLocalDatabaseTarget(databaseUrl, appMode);
}

function resetDataSource(databaseUrl: string): DataSource {
  return new DataSource({
    type: 'postgres',
    url: databaseUrl,
    entities: [...MAKAAN_ENTITIES],
    synchronize: false,
    ssl: false,
  });
}

export async function resetEmptyData(databaseUrl: string): Promise<void> {
  const target = assertResetDatabaseTarget(databaseUrl);
  const dataSource = resetDataSource(target.toString());
  await dataSource.initialize();
  try {
    const tableNames = [
      ...new Set(dataSource.entityMetadatas.map(({ tableName }) => tableName)),
    ];
    if (tableNames.some((tableName) => !/^[a-z][a-z0-9_]*$/.test(tableName))) {
      throw new Error('Reset encountered an unexpected table name.');
    }
    const quotedTables = tableNames
      .map((tableName) => `"${tableName}"`)
      .join(', ');
    await dataSource.query(
      `TRUNCATE TABLE ${quotedTables} RESTART IDENTITY CASCADE`,
    );
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

export async function resetDemoData(databaseUrl: string): Promise<void> {
  await resetEmptyData(databaseUrl);
  await seedDatabase(databaseUrl);
}

async function runResetCli(): Promise<void> {
  const action = process.argv[2];
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || (action !== 'demo' && action !== 'empty')) {
    throw new Error(
      'Usage: reset.ts <demo|empty> with an explicit DATABASE_URL.',
    );
  }
  if (action === 'demo') {
    await resetDemoData(databaseUrl);
  } else {
    await resetEmptyData(databaseUrl);
  }
}

if (require.main === module) {
  void runResetCli().catch((error: unknown) => {
    const message =
      error instanceof Error ? error.message : 'Database reset failed.';
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  });
}
