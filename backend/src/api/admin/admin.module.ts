import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AdminAction } from '../../models/admin-action.entity';
import { AuthSession } from '../../models/auth-session.entity';
import { Listing } from '../../models/listing.entity';
import { Photo } from '../../models/photo.entity';
import { SellerNotification } from '../../models/seller-notification.entity';
import { SellerProfile } from '../../models/seller-profile.entity';
import { User } from '../../models/user.entity';
import { AdminAuthService } from '../../services/admin-auth.service';
import { DuplicateDetectionService } from '../../services/duplicate-detection.service';

import { AdminAuthController } from './admin-auth.controller';
import { AdminModerationController } from './admin-moderation.controller';

@Module({
  imports: [
    JwtModule.register({}),
    TypeOrmModule.forFeature([
      User,
      AuthSession,
      Listing,
      Photo,
      SellerProfile,
      AdminAction,
      SellerNotification,
    ]),
  ],
  controllers: [AdminAuthController, AdminModerationController],
  providers: [AdminAuthService, DuplicateDetectionService],
})
export class AdminModule {}
