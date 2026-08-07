import { describe, expect, it } from '@jest/globals';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DataSource } from 'typeorm';

const migrationPath = resolve(
  __dirname,
  '../../src/database/migrations/1774500000000-008-events-saves-media.ts',
);
const servicePath = resolve(
  __dirname,
  '../../src/services/contact-intent.service.ts',
);
const controllerPath = resolve(
  __dirname,
  '../../src/api/listings/contact-intents.controller.ts',
);
const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const databaseIt = testDatabaseUrl ? it : it.skip;

function requiredSource(path: string): string {
  expect(existsSync(path)).toBe(true);
  return readFileSync(path, 'utf8');
}

describe('contact intent privacy and event contract', () => {
  it('persists append-only contact intents with exactly one principal, method, rate decision, expiry, and single-use resolution', () => {
    const source = requiredSource(migrationPath);

    expect(source).toMatch(/contact_intents/i);
    expect(source).toMatch(/user_id/i);
    expect(source).toMatch(/anonymous_subject_id/i);
    expect(source).toMatch(/CHK_CONTACT.*PRINCIPAL|exactly one principal/i);
    expect(source).toMatch(/phone.*whatsapp/i);
    expect(source).toMatch(/rate.*decision|accepted_at/i);
    expect(source).toMatch(/expires_at/i);
    expect(source).toMatch(/resolved_at/i);
    expect(source).toMatch(/token_hash|resolver_token_hash/i);
  });

  it('creates only accepted, rate-limited contact events and resolves once before TTL for the same principal', () => {
    const source = requiredSource(servicePath);
    const controller = requiredSource(controllerPath);

    expect(source).toMatch(/AbuseControlService|abuseControl/i);
    expect(source).toMatch(/consume\(\s*['"]contact['"]/i);
    expect(source).toMatch(/expiresAt|expires_at/i);
    expect(source).toMatch(/resolvedAt|resolved_at/i);
    expect(source).toMatch(/userId|anonymousSubject/i);
    expect(source).toMatch(/accepted/i);
    expect(controller).toMatch(/contact-intents/i);
    expect(controller).toMatch(/resolve/i);
  });

  it('keeps raw destinations out of intent rows, JSON responses, and application logs', () => {
    const source = requiredSource(servicePath);
    const controller = requiredSource(controllerPath);
    const combined = `${source}\n${controller}`;

    expect(combined).not.toMatch(
      /console\.(log|info|warn|error).*phone|logger\..*phone/i,
    );
    expect(combined).not.toMatch(
      /destination\s*[:=]\s*(listing|seller).*phone/i,
    );
    expect(combined).not.toMatch(
      /phoneNumber|phone_number|whatsappNumber|whatsapp_number/i,
    );
    expect(combined).toMatch(/intentToken/i);
  });

  databaseIt(
    'has no raw-destination column and records resolver expiry/single-use fields',
    async () => {
      const dataSource = new DataSource({
        type: 'postgres',
        url: testDatabaseUrl,
      });
      await dataSource.initialize();
      try {
        const columns = (await dataSource.query(
          `SELECT column_name
           FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'contact_intents'`,
        )) as Array<{ column_name: string }>;
        const names = columns.map((column) => column.column_name);

        expect(names).toEqual(
          expect.arrayContaining(['expires_at', 'resolved_at']),
        );
        expect(names).toEqual(
          expect.not.arrayContaining([
            'phone',
            'phone_number',
            'destination',
            'whatsapp_number',
          ]),
        );
      } finally {
        await dataSource.destroy();
      }
    },
  );
});
