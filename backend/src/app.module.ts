import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';

import { AdminModule } from './api/admin/admin.module';
import { AuthModule } from './api/auth/auth.module';
import { BuyerModule } from './api/buyer/buyer.module';
import { HealthModule } from './api/health/health.module';
import { ListingsModule } from './api/listings/listings.module';
import { SellerListingsModule } from './api/listings/seller-listings.module';
import { validateEnvironment } from './config/environment';
import { RedisModule } from './config/redis.module';
import { DatabaseModule } from './database/database.module';
import { CorrelationIdMiddleware } from './middleware/correlation-id.middleware';
import { HttpExceptionFilter } from './middleware/http-exception.filter';
import { LoggingInterceptor } from './middleware/logging.interceptor';
import { AuditService } from './services/audit.service';
import { ProvidersModule } from './services/providers';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.MAKAAN_ENV_FILE
        ? [process.env.MAKAAN_ENV_FILE, `../${process.env.MAKAAN_ENV_FILE}`]
        : ['.env', '../.env'],
      cache: true,
      validate: validateEnvironment,
    }),
    AdminModule,
    AuthModule,
    BuyerModule,
    HealthModule,
    DatabaseModule,
    RedisModule,
    ListingsModule,
    SellerListingsModule,
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: 20,
      },
    ]),
    ProvidersModule,
  ],
  providers: [
    AuditService,
    CorrelationIdMiddleware,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationIdMiddleware).forRoutes('{*path}');
  }
}
