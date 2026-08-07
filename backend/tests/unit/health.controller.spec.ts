import { describe, expect, it, jest } from '@jest/globals';
import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

import { HealthController } from '../../src/api/health/health.controller';

const secretValues = {
  APP_MODE: 'local',
  DATABASE_URL: 'postgresql://health-user:database-secret@db.internal/makaan',
  OTP_PROVIDER: 'local_fixed',
  MAPBOX_TOKEN: 'map-token-that-must-not-leak',
  SESSION_TOKEN_PEPPER: 'session-pepper-that-must-not-leak',
};

function controllerFor(databaseReady = true, appMode = 'local') {
  const dataSource = {
    isInitialized: databaseReady,
    query: jest
      .fn<() => Promise<unknown>>()
      .mockResolvedValue([{ '?column?': 1 }]),
  } as unknown as DataSource;
  const configService = {
    getOrThrow: jest.fn((name: string) =>
      name === 'APP_MODE'
        ? appMode
        : secretValues[name as keyof typeof secretValues],
    ),
  } as unknown as ConfigService;

  return {
    controller: new HealthController(dataSource, configService),
    dataSource,
  };
}

describe('HealthController', () => {
  it('reports liveness without depending on external services', () => {
    const { controller, dataSource } = controllerFor(false);

    expect(controller.liveness()).toEqual({ status: 'ok' });
    expect(dataSource.query).not.toHaveBeenCalled();
  });

  it('reports readiness only after a successful database connectivity query', async () => {
    const { controller, dataSource } = controllerFor();

    await expect(controller.readiness()).resolves.toEqual({
      status: 'ready',
      database: 'ready',
      providers: { mode: 'local', status: 'configured' },
    });
    expect(dataSource.query).toHaveBeenCalledWith('SELECT 1');
  });

  it('returns a non-sensitive unavailable response when the database is down', async () => {
    const { controller } = controllerFor(false);

    await expect(controller.readiness()).rejects.toMatchObject({
      status: 503,
      response: {
        status: 'not_ready',
        database: 'unavailable',
        providers: { mode: 'local', status: 'configured' },
      },
    });
  });

  it('uses a coarse production provider mode without returning provider configuration values', async () => {
    const { controller } = controllerFor(true, 'production');

    const response = await controller.readiness();
    const serialized = JSON.stringify(response);

    expect(response.providers).toEqual({
      mode: 'production',
      status: 'configured',
    });
    for (const value of Object.values(secretValues)) {
      expect(serialized).not.toContain(value);
    }
  });

  it('does not query an uninitialized database data source', async () => {
    const { controller, dataSource } = controllerFor(false);

    await expect(controller.readiness()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(dataSource.query).not.toHaveBeenCalled();
  });
});
