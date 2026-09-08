# Makaan

Makaan is an Arabic-first property marketplace for residential homes in Cairo. Release one supports
properties for sale and long-term rent. It prioritizes individual owners while allowing clearly
labelled agents under stricter moderation. English remains a complete LTR alternative.

The application includes:

- Buyer landing, search, filters, listing details, saved homes, and privacy-safe maps
- Seller phone/OTP sign-in, local drafts, five-step listing creation, image upload, and status tracking
- Owner and declared-agent participation labels
- Moderator sign-in with TOTP, private review data, approval, rejection, and unpublishing
- Exact-location protection with only area-level or reviewed approximate locations exposed publicly
- An Arabic/English assistant that answers listing and site questions from the public search
  projection, widens a search that returns nothing, and runs with no account or model key
- PostgreSQL/PostGIS persistence, Redis sessions and abuse controls, and pluggable media/maps providers

Live demo: <https://makaan-zeta.vercel.app>

## Repository layout

```text
backend/        NestJS API, TypeORM entities/migrations, providers, and seed data
frontend/       Next.js Pages Router application
shared/         Types and enums shared by frontend and backend
infrastructure/ Local Docker Compose and local-media storage
scripts/        Service, migration, and validation commands
specs/          SpecKit specifications, plans, tasks, and release evidence
docs/           Configuration, deployment, and brand handoffs
tests/          Browser/E2E suites and fixtures
```

The repository is an npm workspace. Run commands from the repository root unless a section says
otherwise.

## Developer prerequisites

- Node.js `20.19.x` (the repository rejects Node 21+)
- npm 10
- Docker Desktop or Docker Engine with Compose v2
- Git
- Free local ports `3000`, `4000`, `5433`, and `6379`

Check the toolchain:

```bash
node --version
npm --version
docker version
docker compose version
```

## First-time local setup

```bash
git clone https://github.com/MarioGamal/Makaan.git
cd Makaan
git switch codex/marketplace-redesign
cp .env.example .env
cp frontend/.env.local.example frontend/.env.local
npm ci
npm run local:up
set -a; source .env; set +a
npm run db:migrate
npm run db:seed
npm run dev
```

Open <http://localhost:3000>. Arabic and RTL are the defaults. The API is available at
<http://localhost:4000/api/v1>, with liveness at <http://localhost:4000/api/v1/health> and database
readiness at <http://localhost:4000/api/v1/health/ready>.

`db:migrate` deliberately requires `DATABASE_URL` in the calling shell, which is why the export
command precedes it. Seed and reset commands load the root `.env` themselves.

The default frontend template uses the accessible local map substitute. To use Mapbox locally,
change these values in `frontend/.env.local`:

```env
NEXT_PUBLIC_MAP_PROVIDER=mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=<public Mapbox pk.* token restricted to localhost>
```

Restart the frontend after changing any `NEXT_PUBLIC_*` value because Next.js embeds it in the
browser bundle.

## Environment-file policy

Do **not** share `.env`, `.env.demo`, or `frontend/.env.local` files. They are ignored because a
populated file can contain database passwords, Redis credentials, Cloudinary secrets, session
peppers, moderator credentials, and provider tokens.

Use the committed templates instead:

| File developers create | Safe template                 | Purpose                                                         |
| ---------------------- | ----------------------------- | --------------------------------------------------------------- |
| `.env`                 | `.env.example`                | Local backend, PostGIS, Redis, fixtures, and provider selection |
| `frontend/.env.local`  | `frontend/.env.local.example` | Optional browser API/map configuration                          |
| `.env.demo`            | `.env.demo.example`           | Maintainer-only hosted-demo administration                      |

Every developer should copy the local templates and keep the default account-free providers. If a
developer needs a third-party service, give them a separate least-privilege credential through a
team password manager or the provider's access controls—never through Git, chat, email, or a shared
environment file. A Mapbox `pk.*` token is browser-visible by design, but it should still be
origin-restricted and separated from production to protect quota and simplify revocation.

Never give ordinary feature developers the hosted `.env.demo`. The authoritative hosted values are
stored directly in Vercel and Render; Neon, Upstash, and Cloudinary access should be granted through
their own team/member controls when someone genuinely needs operational access.

See [configuration details](docs/configuration.md) for the complete environment contract.

## Local fixtures

Local-only credentials are intentionally public and deterministic:

- Seller phone: `+201000000000`
- Seller OTP: `123456`
- Moderator URL: <http://localhost:3000/admin/login>
- Moderator email: `admin@makaan.test`
- Moderator password: `local-admin-password-only`
- Moderator TOTP seed: `JBSWY3DPEHPK3PXP`

Import the TOTP seed into an authenticator application to obtain the changing six-digit moderator
code. These values must never be reused in demo or production environments. The seller OTP must not
be logged or returned by the API.

## Everyday workflow

```bash
npm run local:up       # Start PostGIS and Redis
npm run dev            # Start API and frontend together
npm run local:status   # Check local service state
npm run local:down     # Stop local services
```

Run backend or frontend independently when useful:

```bash
npm run dev:backend
npm run dev:frontend
```

Before handing work over:

```bash
npm run typecheck
npm run lint
npm run build
```

`npm run validate` additionally runs formatting checks and the current automated suites. Tests are
not the present product-delivery priority, but developers should avoid introducing new failures and
validate changed flows proportionately. Release evidence is recorded in
[specs/003-marketplace-redesign/evidence/release-one.md](specs/003-marketplace-redesign/evidence/release-one.md).

## Team workflow

The current integration branch is `codex/marketplace-redesign`. Developers should update it and
branch from it rather than working directly on the deployed branch:

```bash
git switch codex/marketplace-redesign
git pull --ff-only
git switch -c feature/<short-feature-name>
```

- Keep frontend, backend, migration, and shared-contract changes in the same pull request when they
  form one feature.
- Coordinate before changing shared files, TypeORM entities, migrations, authentication, privacy
  projections, or deployment configuration.
- Add new migrations; do not edit a migration that has already run on the hosted demo.
- Never enable TypeORM `synchronize` or run destructive reset commands against shared environments.
- Include manual verification steps and note any deferred validation in the pull request.
- Rebase or merge the latest integration branch before handoff and resolve shared-contract changes
  deliberately rather than accepting one side wholesale.

## Database and demo data

After starting local services:

```bash
set -a; source .env; set +a
npm run db:migrate
npm run db:seed
```

The seed is idempotent. The reset commands below are destructive and accept only explicit,
loopback, non-production-looking Makaan databases:

```bash
npm run local:reset-demo
npm run local:reset-empty
```

Do not use reset or migration-revert commands against shared or production data. Hosted-demo
migration and seed commands are maintainer operations documented separately in
[docs/demo-deployment.md](docs/demo-deployment.md).

## Product and security guardrails

- Arabic RTL is the default; every changed flow must remain complete in English LTR.
- Release-one scope is Cairo residential sale and long-term rent.
- Owners are prioritized; agents must remain clearly labelled and more strictly moderated.
- Exact coordinates and seller contact data must never enter public listing responses or logs.
- A listing becomes public only after moderator approval and availability confirmation.
- Keep seller, moderator, and anonymous sessions scoped separately; unsafe requests require CSRF.
- Do not replace provider failures with silent success paths.
- Do not commit generated uploads, local data, credentials, `.env*` files, or validation artifacts.

Read [AGENTS.md](AGENTS.md) before implementation and use the current SpecKit material under
`specs/003-marketplace-redesign/` for product intent and acceptance criteria.

## Common local problems

### `Docker Engine with Compose v2 is required`

Start Docker Desktop and wait until the engine reports healthy, then verify `docker compose version`
and rerun `npm run local:up`.

### PostgreSQL platform warning on Apple Silicon

The local PostGIS image may run as `linux/amd64` on an ARM Mac. A platform warning is expected; it is
not a failure if the container becomes healthy.

### `EADDRINUSE :::4000`

Another API process already owns port 4000. Find it with `lsof -nP -iTCP:4000 -sTCP:LISTEN`, stop the
known stale process, then rerun `npm run dev`.

### Images do not display locally

Run `npm run db:seed`, confirm the API is on port 4000, and confirm files exist under
`infrastructure/local-media/listing-media/demo`. Hosted images use Cloudinary; local seed images do
not require Cloudinary.

### Map does not load

The default local substitute is intentional. For a real map, configure both frontend Mapbox values
as shown above and restart Next.js. Never put a secret token in a `NEXT_PUBLIC_*` variable.

### Session immediately appears expired

Confirm the frontend uses `http://localhost:4000/api/v1`, both processes are running, Redis is
healthy, and local cookies remain `COOKIE_SECURE=false`. Do not copy secure hosted cookie settings
into the local `.env`.

## Deployment

- Frontend and same-origin API proxy: Vercel
- API: Render
- PostgreSQL/PostGIS: Neon (London)
- Redis: Upstash
- Media: Cloudinary
- Maps: Mapbox

The demo intentionally uses fixed seller OTP and deterministic scanning; it is not suitable for real
customer traffic. Follow [docs/demo-deployment.md](docs/demo-deployment.md) for deployment and never
run hosted migration/seed commands without confirming the target.
