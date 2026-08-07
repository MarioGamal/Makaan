import { describe, expect, it, jest } from '@jest/globals';
import { ConfigService } from '@nestjs/config';
import { UserType } from '@makaan/shared/constants/enums';
import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';
import { DataSource, Repository } from 'typeorm';

import { User, UserStatus } from '../../src/models/user.entity';
import { AdminAuthService } from '../../src/services/admin-auth.service';
import { AuthService } from '../../src/services/auth.service';
import { OtpProvider } from '../../src/services/providers/otp.provider';

const config = (values: Record<string, string> = {}): ConfigService => ({
  get: jest.fn((key: string) => values[key]),
  getOrThrow: jest.fn((key: string) => values[key]),
} as unknown as ConfigService);

function userRepository(found: User | null = null): Repository<User> & { create: jest.Mock; save: jest.Mock } {
  const query = { addSelect: jest.fn().mockReturnThis(), where: jest.fn().mockReturnThis(), andWhere: jest.fn().mockReturnThis(), getOne: jest.fn(async () => found) };
  const create = jest.fn((input: Partial<User>) => ({ id: 'user-1', createdAt: new Date('2026-01-01T00:00:00Z'), ...input }));
  const save = jest.fn(async (user: User) => user);
  return { create, save, createQueryBuilder: jest.fn(() => query) } as unknown as Repository<User> & { create: jest.Mock; save: jest.Mock };
}

describe('AdminAuthService', () => {
  it('requires a valid mandatory second factor and rejects blocked administrators', async () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    const administrator = { id: 'admin-1', username: 'admin@makaan.test', userType: UserType.ADMIN, status: UserStatus.ACTIVE, passwordHash: await bcrypt.hash('correct-password', 4), twoFactorSecret: secret, secondFactorSecretCiphertext: null, lastLoginAt: null } as User;
    const service = new AdminAuthService(config({ FIELD_ENCRYPTION_KEY: 'unit-encryption-key' }), userRepository(administrator));

    await expect(service.login('admin@makaan.test', 'correct-password', '000000')).rejects.toMatchObject({ status: 401 });
    jest.spyOn(speakeasy.totp, 'verify').mockImplementation(({ token }) => token === 'valid-code');
    const validCode = 'valid-code';
    await expect(service.login('admin@makaan.test', 'correct-password', validCode)).resolves.toMatchObject({ administrator: { role: 'admin' } });

    const blocked = { ...administrator, status: UserStatus.BLOCKED } as User;
    await expect(new AdminAuthService(config(), userRepository(blocked)).login('admin@makaan.test', 'correct-password', validCode)).rejects.toMatchObject({ status: 401 });
  });

  it('creates local fixture admins with encrypted second-factor material, never raw local secret storage', async () => {
    const repository = userRepository();
    const service = new AdminAuthService(config({ APP_MODE: 'test', LOCAL_ADMIN_EMAIL: 'admin@makaan.test', LOCAL_ADMIN_PASSWORD: 'fixture-password', LOCAL_ADMIN_TOTP_SECRET: 'JBSWY3DPEHPK3PXP', FIELD_ENCRYPTION_KEY: 'unit-encryption-key' }), repository);
    jest.spyOn(speakeasy.totp, 'verify').mockImplementation(({ token }) => token === 'valid-code');
    const code = 'valid-code';

    await service.login('admin@makaan.test', 'fixture-password', code);

    const created = repository.create.mock.calls[0]?.[0] as User;
    expect(created.secondFactorSecretCiphertext).toMatch(/^v1:/);
    expect(created.secondFactorSecretCiphertext).not.toContain('JBSWY3DPEHPK3PXP');
    expect(created.twoFactorSecret).toBeNull();
  });
});

describe('AuthService', () => {
  it('rejects provider-invalid OTPs before persistence', async () => {
    const otpProvider: OtpProvider = {
      request: async () => ({ accepted: true, expiresInSeconds: 300 }),
      verify: async () => ({ status: 'invalid' }),
    };
    const transaction = jest.fn();
    const service = new AuthService(config(), { transaction } as unknown as DataSource, otpProvider);

    await expect(service.verifyOtp('+201001234567', '000000')).rejects.toMatchObject({ status: 400 });
    expect(transaction).not.toHaveBeenCalled();
  });

  it('persists encrypted/hash phone fields and clears the raw legacy phone column for verified sellers', async () => {
    const users = userRepository();
    const profiles = { create: jest.fn((input) => input), save: jest.fn(async (profile) => profile) };
    const userQuery = { addSelect: jest.fn().mockReturnThis(), leftJoinAndSelect: jest.fn().mockReturnThis(), where: jest.fn().mockReturnThis(), orWhere: jest.fn().mockReturnThis(), getOne: jest.fn(async () => null) };
    (users.createQueryBuilder as unknown as jest.Mock).mockReturnValue(userQuery);
    const manager = { getRepository: jest.fn((entity) => entity === User ? users : profiles) };
    const otpProvider: OtpProvider = {
      request: async () => ({ accepted: true, expiresInSeconds: 300 }),
      verify: async () => ({ status: 'verified' }),
    };
    const dataSource = {
      transaction: async <T>(callback: (value: typeof manager) => Promise<T>) => callback(manager),
    } as unknown as DataSource;
    const service = new AuthService(config({ PHONE_LOOKUP_PEPPER: 'lookup-pepper', FIELD_ENCRYPTION_KEY: 'field-encryption-key' }), dataSource, otpProvider);

    await service.verifyOtp('+201001234567', '123456');

    const created = users.create.mock.calls[0]?.[0] as User;
    expect(created.phoneNumber).toBeNull();
    expect(created.phoneCiphertext).toMatch(/^v1:/);
    expect(created.phoneCiphertext).not.toContain('+201001234567');
    expect(created.phoneLookupHash).toMatch(/^[a-f0-9]{64}$/);
    expect(created.phoneLookupHash).not.toContain('+201001234567');
  });
});
