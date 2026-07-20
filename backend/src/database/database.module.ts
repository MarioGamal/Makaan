import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthSession } from '../models/auth-session.entity';
import { CairoArea } from '../models/cairo-area.entity';
import { Listing } from '../models/listing.entity';
import { Photo } from '../models/photo.entity';
import { SellerProfile } from '../models/seller-profile.entity';
import { User } from '../models/user.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.getOrThrow<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: false,
        logging: configService.get<string>('NODE_ENV') !== 'production',
        ssl:
          configService.get<string>('NODE_ENV') === 'production'
            ? { rejectUnauthorized: false }
            : false,
        extra: {
          min: 2,
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000,
        },
        entities: [User, CairoArea, Listing, Photo, AuthSession, SellerProfile],
      }),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}

