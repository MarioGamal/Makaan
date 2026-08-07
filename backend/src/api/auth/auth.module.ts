import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DatabaseModule } from '../../database/database.module';
import { CsrfGuard } from '../../middleware/csrf.guard';
import { SessionGuard } from '../../middleware/session.guard';
import { AnonymousSubject } from '../../models/anonymous-subject.entity';
import { AuthSession } from '../../models/auth-session.entity';
import { SellerProfile } from '../../models/seller-profile.entity';
import { User } from '../../models/user.entity';
import { AbuseControlService } from '../../services/abuse-control.service';
import { AnonymousSubjectService } from '../../services/anonymous-subject.service';
import { AuthService } from '../../services/auth.service';
import { ParticipationService } from '../../services/participation.service';
import { SessionService } from '../../services/session.service';

import { AnonymousController } from './anonymous.controller';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([
      User,
      AuthSession,
      SellerProfile,
      AnonymousSubject,
    ]),
  ],
  controllers: [AuthController, AnonymousController],
  providers: [
    AuthService,
    SessionService,
    AnonymousSubjectService,
    ParticipationService,
    AbuseControlService,
    SessionGuard,
    CsrfGuard,
  ],
  exports: [
    AuthService,
    SessionService,
    AnonymousSubjectService,
    ParticipationService,
    AbuseControlService,
    SessionGuard,
    CsrfGuard,
  ],
})
export class AuthModule {}
