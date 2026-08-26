import { basename, dirname, resolve } from 'node:path';

import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

import { databaseSslOptions } from '../config/database-tls';
import { parseEnvironment } from '../config/environment';
import { MAKAAN_ENTITIES } from '../models';

const currentDirectory = process.cwd();
const repositoryRoot =
  basename(currentDirectory) === 'backend'
    ? dirname(currentDirectory)
    : currentDirectory;
dotenv.config({
  path: resolve(repositoryRoot, process.env.MAKAAN_ENV_FILE ?? '.env'),
});

const environment = parseEnvironment(process.env);
const ssl = databaseSslOptions(
  environment.databaseTlsMode,
  environment.databaseTlsCaFile,
);

export default new DataSource({
  type: 'postgres',
  url: environment.databaseUrl,
  entities: [...MAKAAN_ENTITIES],
  migrations: [resolve(__dirname, 'migrations/*.{ts,js}')],
  synchronize: false,
  ssl,
});
