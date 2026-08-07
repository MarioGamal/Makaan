import {
  HttpException,
  HttpStatus,
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import cookieParser from 'cookie-parser';
import {
  NextFunction,
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';
import request from 'supertest';

import { AdminAuthController } from '../../src/api/admin/admin-auth.controller';
import { AnonymousController } from '../../src/api/auth/anonymous.controller';
import { AuthController } from '../../src/api/auth/auth.controller';
import { CsrfGuard } from '../../src/middleware/csrf.guard';
import { CorrelationIdMiddleware } from '../../src/middleware/correlation-id.middleware';
import { HttpExceptionFilter } from '../../src/middleware/http-exception.filter';
import { SessionGuard } from '../../src/middleware/session.guard';
import { AuthSessionScope } from '../../src/models/auth-session.entity';
import { UserStatus } from '../../src/models/user.entity';
import { AbuseControlService } from '../../src/services/abuse-control.service';
import { AdminAuthService } from '../../src/services/admin-auth.service';
import { AnonymousSubjectService } from '../../src/services/anonymous-subject.service';
import { AuthService } from '../../src/services/auth.service';
import { SessionService } from '../../src/services/session.service';
import { UserType } from '@makaan/shared/constants/enums';

const SELLER_COOKIE = 'makaan-seller';
const ADMIN_COOKIE = 'makaan-admin';
const ANONYMOUS_COOKIE = 'makaan-anonymous';
const SELLER_CSRF_COOKIE = 'makaan-seller-csrf';
const ADMIN_CSRF_COOKIE = 'makaan-admin-csrf';
const ANONYMOUS_CSRF_COOKIE = 'makaan-anonymous-csrf';
const ALLOWED_ORIGIN = 'http://localhost:3000';

const sellerSessionCookie = `${SELLER_COOKIE}=seller-session`;
const adminSessionCookie = `${ADMIN_COOKIE}=admin-session`;

const forbiddenCredentialKeys = [
  'accessToken',
  'tokenType',
  'sessionId',
  'password',
  'secondFactorSecret',
] as const;

function cookieValues(cookies: string | string[] | undefined): string[] {
  return !cookies ? [] : Array.isArray(cookies) ? cookies : [cookies];
}

function expectNoBearerOrSessionCredentials(value: unknown): void {
  const serialized = JSON.stringify(value);
  for (const key of forbiddenCredentialKeys) {
    expect(serialized).not.toContain(`\"${key}\"`);
  }
}

function expectOpaqueHttpOnlyCookie(
  cookies: string | string[] | undefined,
  name: string,
): void {
  const cookie = cookieValues(cookies).find((candidate) =>
    candidate.startsWith(`${name}=`),
  );
  expect(cookie).toBeDefined();
  expect(cookie).toContain('HttpOnly');
  expect(cookie).toContain('SameSite=Lax');
  expect(cookie).not.toContain('Bearer');
}

function expectReadableCsrfCookie(
  cookies: string | string[] | undefined,
  name: string,
): void {
  const cookie = cookieValues(cookies).find((candidate) =>
    candidate.startsWith(`${name}=`),
  );
  expect(cookie).toBeDefined();
  expect(cookie).not.toContain('HttpOnly');
  expect(cookie).toContain('SameSite=Lax');
}

function session(
  id: string,
  userId: string,
  scope: AuthSessionScope,
  csrf = `${scope}-csrf`,
) {
  return {
    id,
    userId,
    sessionScope: scope,
    roleAtIssue:
      scope === AuthSessionScope.ADMIN ? UserType.ADMIN : UserType.SELLER,
    csrfHash: csrf,
    absoluteExpiresAt: new Date('2030-01-01T00:00:00.000Z'),
    idleExpiresAt: new Date('2029-12-31T23:00:00.000Z'),
    lastSeenAt: new Date('2029-12-01T00:00:00.000Z'),
    revokedAt: null as Date | null,
    user: {
      id: userId,
      userType:
        scope === AuthSessionScope.ADMIN ? UserType.ADMIN : UserType.SELLER,
      status: UserStatus.ACTIVE,
    },
  };
}

/** In-memory HTTP collaborators: no DB, Redis, or real secrets. */
async function createContractApp() {
  const seller = session(
    'seller-session-id',
    'seller-1',
    AuthSessionScope.SELLER,
  );
  const admin = session('admin-session-id', 'admin-1', AuthSessionScope.ADMIN);
  const sessions = new Map([
    ['seller-session', seller],
    ['admin-session', admin],
  ]);
  const callsByLimitAndIdentity = new Map<string, number>();

  const sessionServiceMock = {
    cookieName: jest.fn((scope: AuthSessionScope) =>
      scope === AuthSessionScope.SELLER ? SELLER_COOKIE : ADMIN_COOKIE,
    ),
    csrfCookieName: jest.fn((scope: AuthSessionScope) =>
      scope === AuthSessionScope.SELLER
        ? SELLER_CSRF_COOKIE
        : ADMIN_CSRF_COOKIE,
    ),
    sessionCookieSettings: jest.fn(() => ({
      httpOnly: true,
      secure: false,
      sameSite: 'lax' as const,
      path: '/' as const,
      maxAge: 60_000,
    })),
    csrfCookieSettings: jest.fn(() => ({
      httpOnly: false,
      secure: false,
      sameSite: 'lax' as const,
      path: '/' as const,
      maxAge: 60_000,
    })),
    issue: jest.fn(async (_user: unknown, scope: AuthSessionScope) => {
      const issuedSession = scope === AuthSessionScope.SELLER ? seller : admin;
      issuedSession.revokedAt = null;
      return {
        session: issuedSession,
        sessionToken:
          scope === AuthSessionScope.SELLER
            ? 'seller-session'
            : 'admin-session',
        csrfToken:
          scope === AuthSessionScope.SELLER ? 'seller-csrf' : 'admin-csrf',
      };
    }),
    authenticate: jest.fn(
      async (rawToken: string | undefined, scope: AuthSessionScope) => {
        const found = rawToken ? sessions.get(rawToken) : undefined;
        if (!found || found.sessionScope !== scope || found.revokedAt) {
          throw new UnauthorizedException('session_invalid');
        }
        return found;
      },
    ),
    rotateCsrf: jest.fn(async (sessionId: string) => {
      const found = [seller, admin].find(
        (candidate) => candidate.id === sessionId,
      );
      if (!found) throw new UnauthorizedException('session_invalid');
      const rotated = `${found.sessionScope}-csrf-rotated`;
      found.csrfHash = rotated;
      return rotated;
    }),
    revokeByToken: jest.fn(
      async (rawToken: string | undefined, scope: AuthSessionScope) => {
        const found = rawToken ? sessions.get(rawToken) : undefined;
        if (found && found.sessionScope === scope) found.revokedAt = new Date();
      },
    ),
    csrfMatches: jest.fn(
      (current: { csrfHash: string }, raw: string | undefined) =>
        current.csrfHash === raw,
    ),
  };

  const anonymousSubject = {
    id: 'anonymous-1',
    csrfHash: 'anonymous-csrf',
    revokedAt: null,
  };
  const anonymousSubjectServiceMock = {
    cookieName: jest.fn(() => ANONYMOUS_COOKIE),
    csrfCookieName: jest.fn(() => ANONYMOUS_CSRF_COOKIE),
    subjectCookieSettings: jest.fn(() => ({
      httpOnly: true,
      secure: false,
      sameSite: 'lax' as const,
      path: '/' as const,
      maxAge: 60_000,
    })),
    csrfCookieSettings: jest.fn(() => ({
      httpOnly: false,
      secure: false,
      sameSite: 'lax' as const,
      path: '/' as const,
      maxAge: 60_000,
    })),
    issueOrRotateCsrf: jest.fn(async (rawToken?: string) => ({
      subject: anonymousSubject,
      subjectToken: rawToken ?? 'anonymous-session',
      csrfToken: rawToken ? 'anonymous-csrf-rotated' : 'anonymous-csrf',
    })),
    authenticate: jest.fn(async (rawToken: string | undefined) => {
      if (rawToken !== 'anonymous-session')
        throw new UnauthorizedException('anonymous_subject_invalid');
      return anonymousSubject;
    }),
    csrfMatches: jest.fn(
      (current: { csrfHash: string }, raw: string | undefined) =>
        current.csrfHash === raw,
    ),
  };

  const abuseControlServiceMock = {
    clientAddress: jest.fn(() => '192.0.2.10'),
    protectedIdentity: jest.fn((value: string) => `hash:${value}`),
    protectedClientPrefix: jest.fn((value: string) => `prefix-hash:${value}`),
    consume: jest.fn(async (name: string, identity: readonly string[]) => {
      const key = `${name}:${identity.join(':')}`;
      const attempts = (callsByLimitAndIdentity.get(key) ?? 0) + 1;
      callsByLimitAndIdentity.set(key, attempts);
      if (attempts > 5) {
        throw new HttpException(
          { code: 'rate_limit_exceeded', message: 'request_limit_reached' },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }),
  };

  const moduleRef = await Test.createTestingModule({
    controllers: [AuthController, AdminAuthController, AnonymousController],
    providers: [
      Reflector,
      SessionGuard,
      CsrfGuard,
      {
        provide: ConfigService,
        useValue: {
          get: jest.fn((key: string) =>
            key === 'ALLOWED_ORIGINS' ? ALLOWED_ORIGIN : undefined,
          ),
        },
      },
      {
        provide: AuthService,
        useValue: {
          requestOtp: jest.fn(async () => undefined),
          verifyOtp: jest.fn(async () => ({
            user: {
              id: 'seller-1',
              userType: UserType.SELLER,
              status: UserStatus.ACTIVE,
            },
            seller: { id: 'seller-1', role: 'seller' },
          })),
        },
      },
      {
        provide: AdminAuthService,
        useValue: {
          login: jest.fn(async () => ({
            user: {
              id: 'admin-1',
              userType: UserType.ADMIN,
              status: UserStatus.ACTIVE,
            },
            administrator: { id: 'admin-1', role: 'admin' },
          })),
        },
      },
      { provide: SessionService, useValue: sessionServiceMock },
      {
        provide: AnonymousSubjectService,
        useValue: anonymousSubjectServiceMock,
      },
      { provide: AbuseControlService, useValue: abuseControlServiceMock },
    ],
  }).compile();

  const app = moduleRef.createNestApplication();
  const correlationIds = new CorrelationIdMiddleware();
  app.use(
    (request: ExpressRequest, response: ExpressResponse, next: NextFunction) =>
      correlationIds.use(request, response, next),
  );
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.init();
  return { app, sessionServiceMock, abuseControlServiceMock };
}

describe('session-security contract', () => {
  let app: INestApplication;
  let sessionServiceMock: Awaited<
    ReturnType<typeof createContractApp>
  >['sessionServiceMock'];
  let abuseControlServiceMock: Awaited<
    ReturnType<typeof createContractApp>
  >['abuseControlServiceMock'];

  beforeAll(async () => {
    ({ app, sessionServiceMock, abuseControlServiceMock } =
      await createContractApp());
  });

  afterAll(async () => {
    await app.close();
  });

  it('establishes only an opaque HttpOnly seller cookie and no bearer/session credentials in the OTP response', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/otp/verifications')
      .send({ phone: '+201001234567', code: '123456' })
      .expect(201);

    expect(response.body).toEqual({
      seller: { id: 'seller-1', role: 'seller' },
    });
    expectNoBearerOrSessionCredentials(response.body);
    expectOpaqueHttpOnlyCookie(response.headers['set-cookie'], SELLER_COOKIE);
    expectReadableCsrfCookie(
      response.headers['set-cookie'],
      SELLER_CSRF_COOKIE,
    );
  });

  it('requires validated administrator second factor input and establishes only an opaque HttpOnly admin cookie', async () => {
    const invalid = await request(app.getHttpServer())
      .post('/admin/sessions')
      .send({
        email: 'moderator@makaan.test',
        password: 'long-enough-password',
      })
      .expect(400);
    expectNoBearerOrSessionCredentials(invalid.body);

    const response = await request(app.getHttpServer())
      .post('/admin/sessions')
      .send({
        email: 'moderator@makaan.test',
        password: 'long-enough-password',
        secondFactorCode: '123456',
      })
      .expect(201);
    expect(response.body).toEqual({
      administrator: { id: 'admin-1', role: 'admin' },
    });
    expectNoBearerOrSessionCredentials(response.body);
    expectOpaqueHttpOnlyCookie(response.headers['set-cookie'], ADMIN_COOKIE);
    expectReadableCsrfCookie(response.headers['set-cookie'], ADMIN_CSRF_COOKIE);
  });

  it('keeps seller/admin CSRF exact-scope, reissues no session cookie on CSRF GET, and issues anonymous subject only when needed', async () => {
    const sellerCsrf = await request(app.getHttpServer())
      .get('/auth/csrf')
      .set('Cookie', sellerSessionCookie)
      .expect(200);
    const adminCsrf = await request(app.getHttpServer())
      .get('/admin/csrf')
      .set('Cookie', adminSessionCookie)
      .expect(200);
    const anonymousCsrf = await request(app.getHttpServer())
      .get('/anonymous/csrf')
      .expect(200);

    expect(
      cookieValues(sellerCsrf.headers['set-cookie']).join(';'),
    ).not.toContain(`${SELLER_COOKIE}=`);
    expect(
      cookieValues(adminCsrf.headers['set-cookie']).join(';'),
    ).not.toContain(`${ADMIN_COOKIE}=`);
    expectReadableCsrfCookie(
      sellerCsrf.headers['set-cookie'],
      SELLER_CSRF_COOKIE,
    );
    expectReadableCsrfCookie(
      adminCsrf.headers['set-cookie'],
      ADMIN_CSRF_COOKIE,
    );
    expectOpaqueHttpOnlyCookie(
      anonymousCsrf.headers['set-cookie'],
      ANONYMOUS_COOKIE,
    );
    expectReadableCsrfCookie(
      anonymousCsrf.headers['set-cookie'],
      ANONYMOUS_CSRF_COOKIE,
    );

    await request(app.getHttpServer())
      .delete('/auth/session')
      .set('Cookie', [sellerSessionCookie, `${ADMIN_CSRF_COOKIE}=admin-csrf`])
      .set('Origin', ALLOWED_ORIGIN)
      .set('X-CSRF-Token', 'admin-csrf')
      .expect(403);
    await request(app.getHttpServer())
      .delete('/auth/session')
      .set('Cookie', [sellerSessionCookie, `${SELLER_CSRF_COOKIE}=seller-csrf`])
      .set('Origin', 'https://attacker.example')
      .set('X-CSRF-Token', 'seller-csrf')
      .expect(403);
  });

  it('revokes logout immediately and rejects expired/invalid seller sessions', async () => {
    await request(app.getHttpServer())
      .delete('/auth/session')
      .set('Cookie', [
        sellerSessionCookie,
        `${SELLER_CSRF_COOKIE}=seller-csrf-rotated`,
      ])
      .set('Origin', ALLOWED_ORIGIN)
      .set('X-CSRF-Token', 'seller-csrf-rotated')
      .expect(200);
    expect(sessionServiceMock.revokeByToken).toHaveBeenCalledWith(
      'seller-session',
      AuthSessionScope.SELLER,
    );

    await request(app.getHttpServer())
      .get('/auth/session')
      .set('Cookie', sellerSessionCookie)
      .expect(401);
    await request(app.getHttpServer())
      .get('/auth/session')
      .set('Cookie', `${SELLER_COOKIE}=expired-session`)
      .expect(401);
    await sessionServiceMock.issue({}, AuthSessionScope.SELLER);
  });

  it('enforces the seller/admin role matrix and ignores Authorization bearer headers', async () => {
    await request(app.getHttpServer())
      .get('/admin/session')
      .set('Cookie', adminSessionCookie)
      .expect(200);
    await request(app.getHttpServer())
      .get('/auth/session')
      .set('Authorization', 'Bearer forged-browser-token')
      .expect(401);
    await request(app.getHttpServer())
      .get('/admin/session')
      .set('Cookie', sellerSessionCookie)
      .expect(403);
    await request(app.getHttpServer())
      .get('/auth/session')
      .set('Cookie', adminSessionCookie)
      .expect(403);
  });

  it('fails closed at the documented OTP/admin-login limits and derives rate identity without trusting X-Forwarded-For', async () => {
    const forwarded = '198.51.100.4';
    const otpResponses = [];
    for (let attempt = 0; attempt < 6; attempt += 1) {
      otpResponses.push(
        await request(app.getHttpServer())
          .post('/auth/otp/requests')
          .set('X-Forwarded-For', forwarded)
          .send({ phone: '+201001234567', locale: 'ar' }),
      );
    }
    expect(otpResponses.at(-1)?.status).toBe(429);
    const adminResponses = [];
    for (let attempt = 0; attempt < 6; attempt += 1) {
      adminResponses.push(
        await request(app.getHttpServer())
          .post('/admin/sessions')
          .set('X-Forwarded-For', forwarded)
          .send({
            email: 'moderator@makaan.test',
            password: 'long-enough-password',
            secondFactorCode: '123456',
          }),
      );
    }
    expect(adminResponses.at(-1)?.status).toBe(429);
    expect(abuseControlServiceMock.consume).toHaveBeenCalledWith('otpRequest', [
      'client',
      '192.0.2.10',
    ]);
    expect(abuseControlServiceMock.consume).toHaveBeenCalledWith('adminLogin', [
      'client',
      '192.0.2.10',
    ]);
    for (const response of [...otpResponses, ...adminResponses]) {
      const serialized = JSON.stringify(response.body);
      expect(serialized).not.toContain(forwarded);
      expectNoBearerOrSessionCredentials(response.body);
    }
  });

  it('does not echo OTPs, passwords, phones, or factor codes in validation/security responses', async () => {
    const phone = '+201001234567';
    const otp = '123456';
    const password = 'highly-sensitive-password';
    const factor = '654321';
    const response = await request(app.getHttpServer())
      .post('/admin/sessions')
      .send({
        email: 'moderator@makaan.test',
        password,
        secondFactorCode: factor,
        phone,
        otp,
      })
      .expect(400);

    const serialized = JSON.stringify(response.body);
    for (const protectedValue of [phone, otp, password, factor])
      expect(serialized).not.toContain(protectedValue);
    expectNoBearerOrSessionCredentials(response.body);
    expect(response.body).toEqual(
      expect.objectContaining({
        code: expect.any(String),
        message: expect.anything(),
        correlationId: expect.any(String),
      }),
    );
  });
});
