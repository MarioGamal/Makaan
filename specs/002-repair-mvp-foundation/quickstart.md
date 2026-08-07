# Quickstart: Repair MVP Foundation

This is the executable clean-environment contract for the feature. Completion requires the commands
below to pass from a fresh clone and from CI.

## Prerequisites

- Node.js 20 LTS and npm 10
- Docker Engine with Compose v2
- Ports 3000 (web), 4000 (API), 5433 (PostGIS), and 6379 (Redis) available, or explicit supported overrides

No paid SMS, map, storage, or scanner account is required in `APP_MODE=local`.

## First Run

```bash
cp .env.example .env
npm ci
npm run local:up
set -a; source .env; set +a
npm run db:migrate
npm run db:seed
npm run dev
```

Open `http://localhost:3000`. Arabic RTL must load by default. The API health endpoint is
`http://localhost:4000/api/v1/health`.

The API base is `http://localhost:4000/api/v1`; the health endpoint is
`http://localhost:4000/api/v1/health`. Compose exposes PostGIS on loopback port `5433` and Redis on
loopback port `6379`. Use `npm run local:status` to inspect them, `npm run local:down` to stop them,
and `npm run local:tools` to include the optional PgAdmin profile.

The local seller fixture phone is `+201000000000`; request an OTP and enter the fixed local code
`123456`. The local admin fixture is `admin@makaan.test` with password
`local-admin-password-only` and TOTP seed `JBSWY3DPEHPK3PXP`. Import that seed in an authenticator
application and use its current time-based code—there is no static six-digit TOTP code. These are
public local-only fixtures and must never be reused outside local development. The OTP must never
appear in application logs or API responses. Local media and map adapters must be visibly identified
as local substitutes and cannot start in production mode.

`db:migrate` reads `DATABASE_URL` from the shell, so export `.env` before running it as shown above.
The seed and reset scripts load `.env` themselves.

## Demonstration Journeys

1. Search Arabic and English Cairo area variants; switch list/map presentation and confirm identical
   eligible results and public-safe locations.
2. Filter owners only, then include labelled agents; save/unsave anonymously and reload the browser.
3. Accept a phone or WhatsApp contact handoff; confirm the listing response/markup/logs contain no raw
   destination.
4. Sign in as an owner, create a complete listing with 3–10 valid photos and location consent, then submit.
5. Sign in as the second-factor-protected moderator, inspect exact private information, establish canonical
   identity, choose no-more-precise public location, and approve/reject with bilingual feedback.
6. Exercise availability reconfirmation, material edit review, duplicate/dispute, suspension, and session
   revocation fixtures.

## Reset Paths

```bash
npm run local:reset-demo
npm run local:reset-empty
```

`local:reset-demo` restores deterministic governed/demo data. `local:reset-empty` produces an empty current
schema without demonstration accounts or listings. Seed is idempotent. Reset is destructive and,
like seed, accepts only explicit loopback Makaan local/test databases; production, remote,
production-looking, and incorrectly named targets are rejected.

If a migration fails, correct the local configuration or migration problem and rerun
`npm run db:migrate`. A revert is deliberately blocked unless it is non-production and
`MAKAAN_ALLOW_MIGRATION_REVERT=1` is set; never use a reset or revert against shared or production
data. If Docker is unavailable, install/start Docker Engine with the Compose v2 plugin, then retry
`npm run local:up`. Docker Compose was unavailable in the current host validation environment, so a
full Compose run is not claimed here.

## Required Validation

```bash
npm run validate
```

The single command is shared by local development and CI and must fail if any required stage fails:

- format check, lint, typecheck, and production builds;
- isolated migration empty → up → safe down → up plus schema/entity parity;
- idempotent seed and reset checks;
- backend unit, contract, authorization, spatial, lifecycle, and integration tests;
- frontend unit/integration tests;
- Playwright journeys in Arabic/English at 375×667 and 1440×900, including axe checks, keyboard/focus,
  200% zoom review evidence, target sizing, reduced motion, announcements, and map/list fallback;
- protected-data scans over API responses, rendered HTML, browser storage, logs, and validation artifacts.

For focused work, workspace scripts may run individual suites, but they do not replace `npm run validate`.

## Migration and Seed Discipline

```bash
npm run db:migrate
npm run db:migrate:validate
npm run db:seed
```

Never enable TypeORM `synchronize`. Never edit migrations 001–004 after they have shipped. Seed behavior is
application code and may not depend on first-volume Compose initialization. Production rollback uses a
forward fix or verified backup restore whenever a structural down migration cannot safely preserve writes.

## Production Configuration Guard

Starting with `APP_MODE=production` must reject placeholder secrets, local OTP/media/map/scanner adapters,
unverified database TLS, missing trusted origins/proxy configuration, insecure cookies, and missing real
providers. A successful local run is not evidence that production provider configuration is safe.
