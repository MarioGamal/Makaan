import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

type ProviderMode = 'local' | 'production';

interface ReadinessResponse {
  status: 'ready';
  database: 'ready';
  providers: {
    mode: ProviderMode;
    status: 'configured';
  };
}

/**
 * Deliberately exposes only operational state. Provider names, endpoints, and
 * configuration values can be sensitive and must not be returned from here.
 */
@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  liveness() {
    return { status: 'ok' };
  }

  @Get('ready')
  async readiness(): Promise<ReadinessResponse> {
    const providerMode = this.providerMode();

    try {
      if (!this.dataSource.isInitialized) {
        throw new Error('Database data source is not initialized.');
      }

      await this.dataSource.query('SELECT 1');
    } catch {
      throw new ServiceUnavailableException({
        status: 'not_ready',
        database: 'unavailable',
        providers: { mode: providerMode, status: 'configured' },
      });
    }

    return {
      status: 'ready',
      database: 'ready',
      providers: { mode: providerMode, status: 'configured' },
    };
  }

  private providerMode(): ProviderMode {
    return this.configService.getOrThrow<string>('APP_MODE') === 'production'
      ? 'production'
      : 'local';
  }
}
