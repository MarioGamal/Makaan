import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { databaseSslOptions } from '../config/database-tls';
import { MAKAAN_ENTITIES } from '../models';

function databaseSsl(configService: ConfigService) {
  return databaseSslOptions(
    configService.getOrThrow<'disable' | 'require' | 'verify-full'>(
      'DATABASE_TLS_MODE',
    ),
    configService.get<string>('DATABASE_TLS_CA_FILE'),
  );
}

@Global()
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.getOrThrow<string>('DATABASE_URL'),
        autoLoadEntities: false,
        synchronize: false,
        // TypeORM query parameters can contain exact property coordinates and
        // other protected values. Application-level structured logs provide
        // request diagnostics without serializing SQL parameters.
        logging: false,
        ssl: databaseSsl(configService),
        extra: {
          min: 2,
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000,
        },
        entities: [...MAKAAN_ENTITIES],
      }),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
