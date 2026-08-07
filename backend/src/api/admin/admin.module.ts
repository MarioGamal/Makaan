import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AdminAction } from '../../models/admin-action.entity';
import { AuthSession } from '../../models/auth-session.entity';
import { Listing } from '../../models/listing.entity';
import { Photo } from '../../models/photo.entity';
import { SellerNotification } from '../../models/seller-notification.entity';
import { SellerProfile } from '../../models/seller-profile.entity';
import { User } from '../../models/user.entity';
import { AdminAuthService } from '../../services/admin-auth.service';
import { AuditService } from '../../services/audit.service';
import { AuthModule } from '../auth/auth.module';

import { AdminAuthController } from './admin-auth.controller';
import { AdminModerationController } from './admin-moderation.controller';

@Module({
  imports: [
    AuthModule,
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
  providers: [AdminAuthService, AuditService],
})
export class AdminModule {}
