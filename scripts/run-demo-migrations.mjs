import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

import dotenv from 'dotenv';

const repositoryRoot = process.cwd();
dotenv.config({ path: resolve(repositoryRoot, '.env.demo') });

if (process.env.APP_MODE !== 'demo') {
  throw new Error('Hosted migrations require APP_MODE=demo in .env.demo.');
}

const result = spawnSync('bash', ['scripts/migrations.sh', 'run'], {
  cwd: repositoryRoot,
  env: { ...process.env, MAKAAN_ENV_FILE: '.env.demo' },
  stdio: 'inherit',
});

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
