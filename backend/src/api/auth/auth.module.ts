import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthSession } from '../../models/auth-session.entity';
import { Listing } from '../../models/listing.entity';
import { SellerProfile } from '../../models/seller-profile.entity';
import { User } from '../../models/user.entity';
import { AuthService } from '../../services/auth.service';
import { MockOtpService } from '../../services/mock-otp.service';
import { OtpService } from '../../services/otp.service';
import { SellerTypeInferenceService } from '../../services/seller-type.service';

import { AuthController } from './auth.controller';

@Module({
  imports: [
    JwtModule.register({}),
    TypeOrmModule.forFeature([User, AuthSession, SellerProfile, Listing]),
  ],
  controllers: [AuthController],
  providers: [
    OtpService,
    MockOtpService,
    AuthService,
    SellerTypeInferenceService,
  ],
  exports: [AuthService, OtpService, MockOtpService],
})
export class AuthModule {}

