import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AdminModule } from './api/admin/admin.module';
import { AuthModule } from './api/auth/auth.module';
import { BuyerModule } from './api/buyer/buyer.module';
import { ListingsModule } from './api/listings/listings.module';
import { SellerListingsModule } from './api/listings/seller-listings.module';
import { cloudinaryProvider } from './config/cloudinary.config';
import { RedisModule } from './config/redis.module';
import { DatabaseModule } from './database/database.module';
import { HttpExceptionFilter } from './middleware/http-exception.filter';
import { JwtStrategy } from './middleware/jwt-auth.guard';
import { LoggingInterceptor } from './middleware/logging.interceptor';
import { RolesGuard } from './middleware/roles.guard';
import { AuthSession } from './models/auth-session.entity';
import { ImageProcessingService } from './utils/image.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '../.env' }),
    AdminModule,
    AuthModule,
    BuyerModule,
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
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
    TypeOrmModule.forFeature([AuthSession]),
  ],
  providers: [
    cloudinaryProvider,
    JwtStrategy,
    RolesGuard,
    ImageProcessingService,
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
export class AppModule {}
