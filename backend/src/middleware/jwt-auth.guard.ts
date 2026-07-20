import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { IsNull, MoreThan, Repository } from 'typeorm';

import { AuthSession } from '../models/auth-session.entity';
import { UserStatus } from '../models/user.entity';

type JwtPayload = {
  sub: string;
  sessionId: string;
  userType: string;
};

export type AuthenticatedUser = {
  id: string;
  sessionId: string;
  userType: string;
};

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectRepository(AuthSession)
    private readonly authSessionRepository: Repository<AuthSession>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request: { cookies?: { makaan_token?: string } }) =>
          request?.cookies?.makaan_token ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (!payload.sub || !payload.sessionId) {
      throw new UnauthorizedException('Invalid authentication session');
    }

    const session = await this.authSessionRepository.findOne({
      where: {
        id: payload.sessionId,
        userId: payload.sub,
        revokedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
      relations: {
        user: true,
      },
    });

    if (!session || session.user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Authentication session is no longer valid');
    }

    return {
      id: session.user.id,
      sessionId: session.id,
      userType: session.user.userType,
    };
  }
}
