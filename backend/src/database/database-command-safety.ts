/** Accepts only explicit loopback Makaan development/test databases. */
export function assertLocalDatabaseTarget(
  databaseUrl: string,
  appMode = process.env.APP_MODE,
): URL {
  if (appMode !== 'local' && appMode !== 'test') {
    throw new Error(
      'Database command is available only in local or test mode.',
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    throw new Error('Database command requires an explicit PostgreSQL URL.');
  }

  const databaseName = decodeURIComponent(
    parsed.pathname.slice(1),
  ).toLowerCase();
  const hostname = parsed.hostname.toLowerCase();
  const isLoopback = ['localhost', '127.0.0.1', '::1'].includes(hostname);
  const isPostgres = ['postgres:', 'postgresql:'].includes(parsed.protocol);
  const validName =
    appMode === 'test'
      ? /^makaan_test(?:[_-]|$)/.test(databaseName)
      : /^makaan_(?:dev|local)(?:[_-]|$)/.test(databaseName);
  const looksProductionLike = /(prod|production|live|makaan\.eg)/.test(
    `${hostname}/${databaseName}`,
  );
  if (!isPostgres || !isLoopback || !validName || looksProductionLike) {
    throw new Error(
      'Refusing a non-disposable or production-looking database target.',
    );
  }
  return parsed;
}
