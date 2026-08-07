# Makaan

Makaan is an Arabic-first (RTL) marketplace for Cairo residential properties for sale and long-term
rent. English (LTR) remains a complete alternative. The release-one flow prioritizes individual
owners while allowing clearly declared agents under stricter moderation.

The working product includes public discovery with privacy-safe maps and listing details, anonymous
or signed-in saves, privacy-preserving contact-intent handoff, local listing media, seller drafts and
submission, and a moderator review loop. Exact locations and seller contact details are retained only
where needed for validation and are not included in the public listing projection.

## Local development

Requirements: Node.js 20 LTS, npm 10, Docker Engine with Compose v2, and free host ports 3000
(web), 4000 (API), 5433 (PostGIS), and 6379 (Redis).

```bash
cp .env.example .env
npm ci
npm run local:up
set -a; source .env; set +a
npm run db:migrate
npm run db:seed
npm run dev
```

Open `http://localhost:3000`; Arabic should be selected and rendered RTL by default. The API base
is `http://localhost:4000/api/v1`, and its health check is
`http://localhost:4000/api/v1/health`.

`db:migrate` deliberately requires `DATABASE_URL` in the calling shell, hence the export command
above. The seed and reset scripts load `.env` themselves. Docker Compose starts PostGIS on `5433`
and Redis on `6379`, bound to loopback only. Use `npm run local:status` to inspect services and
`npm run local:down` to stop them. `npm run local:tools` also starts the optional PgAdmin profile.

## Local fixtures

- Seller phone: `+201000000000`; request a local OTP and enter the fixed code `123456`.
- Admin email: `admin@makaan.test`
- Admin password: `local-admin-password-only`
- Admin TOTP seed: `JBSWY3DPEHPK3PXP`

Import the TOTP seed into an authenticator application and enter its current time-based code when
signing in. It does not correspond to a permanent six-digit value. These are public local-only
fixtures; never reuse them outside local development. The OTP must not be logged or returned by the
API.

## Database commands and recovery

Run migrations and seed after starting services:

```bash
set -a; source .env; set +a
npm run db:migrate
npm run db:seed
```

To restore deterministic demo data, or to clear the current schema respectively:

```bash
npm run local:reset-demo
npm run local:reset-empty
```

Seed is idempotent. Reset is destructive, and migration/seed/reset commands accept only explicit,
loopback, non-production-looking Makaan development or test databases. If a migration fails, correct
the local configuration or migration issue and rerun `npm run db:migrate`; use a revert only for an
intentional non-production operation with `MAKAAN_ALLOW_MIGRATION_REVERT=1`. Do not use reset or
revert against shared or production data.

For an isolated migration check, run `npm run db:migrate:validate`; it creates disposable Compose
services and requires Docker. If Docker is unavailable, install/start Docker Engine with the Compose
v2 plugin, then retry `npm run local:up`. Docker Compose has not been run on the current host
validation environment.

The repository's current root validation command is:

```bash
npm run validate
```

It runs format, lint, typecheck, and the currently configured test suites. New automated-test
authoring and the Arabic/English browser matrix are deliberately deferred for the present delivery
pass; see [release evidence](specs/003-marketplace-redesign/evidence/release-one.md) for the checks
that have actually been observed.

## Runtime dependencies

PostGIS is required for governed Cairo areas and privacy-safe public location queries. Redis is
required for abuse-control/rate-limit enforcement, including contact-intent creation. The local media
provider stores demo media locally; it is suitable for development only and does not expose private
source URLs through the public API.
