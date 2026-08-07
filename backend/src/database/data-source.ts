import { readFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';

import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

import { parseEnvironment } from '../config/environment';
import { MAKAAN_ENTITIES } from '../models';

const currentDirectory = process.cwd();
const repositoryRoot =
  basename(currentDirectory) === 'backend'
    ? dirname(currentDirectory)
    : currentDirectory;
dotenv.config({ path: resolve(repositoryRoot, '.env') });

const environment = parseEnvironment(process.env);
const ssl =
  environment.databaseTlsMode === 'verify-full'
    ? {
        ca: readFileSync(environment.databaseTlsCaFile as string, 'utf8'),
        rejectUnauthorized: true as const,
      }
    : false;

export default new DataSource({
  type: 'postgres',
  url: environment.databaseUrl,
  entities: [...MAKAAN_ENTITIES],
  migrations: [resolve(__dirname, 'migrations/*.{ts,js}')],
  synchronize: false,
  ssl,
});
