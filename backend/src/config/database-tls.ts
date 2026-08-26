import { readFileSync } from 'node:fs';

import type { DatabaseTlsMode } from './environment';

export type DatabaseSslOptions =
  | false
  | { rejectUnauthorized: true; ca?: string };

/** Uses the platform trust store for hosted providers unless an explicit CA is required. */
export function databaseSslOptions(
  mode: DatabaseTlsMode,
  caFile?: string,
): DatabaseSslOptions {
  if (mode === 'disable') return false;
  if (mode === 'verify-full') {
    if (!caFile) throw new Error('Database TLS CA file is required.');
    return { ca: readFileSync(caFile, 'utf8'), rejectUnauthorized: true };
  }
  return { rejectUnauthorized: true };
}
