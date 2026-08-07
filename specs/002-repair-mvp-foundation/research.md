# Research: Repair MVP Foundation

**Feature**: `002-repair-mvp-foundation`  
**Date**: 2026-07-20  
**Status**: Complete — no unresolved technical clarifications

## R01 — Preserve the Existing Stack, Repair Its Boundaries

**Decision**: Retain the npm-workspace monorepo, NestJS backend, Next.js Pages Router frontend,
PostgreSQL/PostGIS, Redis, and TypeORM migrations. Introduce one exported entity registry used by runtime
configuration and the migration datasource.

**Rationale**: The product code already expresses the required journeys. The primary failure is drift
between entities, migrations, setup, and contracts, not an unsuitable framework. A rewrite would enlarge
scope and delay the Arabic marketplace work.

**Alternatives considered**:

- Framework or App Router rewrite: rejected as unrelated to foundation repair.
- Automatic schema synchronization: rejected because it cannot prove reversible production evolution.
- Separate entity lists: rejected because they caused the current missing-table drift.

## R02 — One Root-Owned Local Environment

**Decision**: Keep Node.js 20 LTS/npm 10 on the host and use Docker Compose only for pinned PostGIS, Redis,
and optional local provider services. Use the root lockfile, root `.env`, root scripts, and one quickstart.
PgAdmin moves to an optional profile.

**Rationale**: This matches npm workspaces, avoids unnecessary application containers, and makes local and
CI commands identical. Compose project names and no fixed container names permit isolated validation runs.

**Alternatives considered**:

- Containerize both applications: reproducible but adds watch/build complexity without fixing schema drift.
- Install per workspace: rejected because the root lockfile is authoritative.
- Retain the 001 quickstart: rejected because its paths, ports, scripts, providers, and endpoints are stale.

## R03 — Explicit Application Modes and Provider Adapters

**Decision**: Validate `APP_MODE=local|test|production` before application startup. Local/test modes use a
non-logging fixed OTP, local media storage, deterministic test malware scanner, and a token-free accessible
map substitute. Production requires configured SMS, object storage, malware scanning, encryption, map,
cookie, database TLS, cache, and origin settings and rejects local adapters or placeholders.

**Rationale**: Branching only on `NODE_ENV` is fail-open. Explicit discriminated configuration lets a
clean environment exercise all journeys without paid accounts while preventing substitute activation in
production.

**Alternatives considered**:

- Free-tier external providers: still require accounts, network, and external fixture transmission.
- Logging local OTPs: violates protected-log requirements.
- No-op local scanner: rejected; the test adapter must prove clean, malicious, and scanner-failure paths.

## R04 — Ordered Transactional Migration Repair

**Decision**: Do not edit applied migrations 001–004. Add migrations 005–009:

1. `005-schema-reconciliation`: missing description, view/contact tables, current constraints/indexes.
2. `006-security-audit-participation`: opaque sessions, CSRF, participation, verification, audit ledger.
3. `007-listing-privacy-lifecycle-canonical`: private/public location, revisions, expiry, canonical/disputes.
4. `008-events-saves-media`: anonymous subjects, saved membership, events, media security metadata.
5. `009-data-backfill-policy`: conservative backfill; old active records return to private review until
   privacy, canonical identity, availability, and seller participation are approved.

Seed/reset remains an idempotent application command, not a migration or Compose-init SQL. Validation uses
an isolated database and proves empty → up → safe down → up plus an explicit schema snapshot.

**Rationale**: Existing deployed migration history must remain immutable. Conservative backfill avoids
fabricating verification, public pins, or canonical decisions.

**Alternatives considered**:

- Modify old migrations: breaks databases that already recorded them.
- `synchronize: true`: bypasses auditable migration evidence.
- Seed SQL on volume initialization: ordering and idempotency are unreliable.

**Qualification**: Destructive production rollback cannot preserve arbitrary new writes. Down migrations
are validated in disposable databases; production rollback policy is forward-fix or backup restore when a
safe structural down is impossible.

Primary reference: [TypeORM migrations](https://typeorm.io/docs/advanced-topics/migrations/).

## R05 — Opaque Server-Side Sessions With CSRF Binding

**Decision**: Replace browser bearer tokens with random opaque seller/admin session cookies. Persist only
peppered token hashes, role at issue, CSRF hash, idle/absolute expiry, rotation and revocation metadata.
Use separate seller/admin cookies and session lifetimes. Unsafe requests require an origin allowlist and
`X-CSRF-Token` matching a separately issued readable CSRF value whose hash is bound to the session.

**Rationale**: Opaque sessions provide immediate logout, block, recovery, and deactivation revocation and
remove privileged tokens from JavaScript storage. Separate admin scope reduces confused-deputy risk.

**Alternatives considered**:

- JWT returned in JSON or local storage: violates the constitution and remains vulnerable to script theft.
- JWT cookie plus database record: workable but retains complexity without an offline-token benefit.
- SameSite alone: defense-in-depth still requires explicit CSRF and origin checks.

## R06 — Persistent Privacy-Minimal Anonymous Subjects

**Decision**: Issue an opaque anonymous browser cookie and store only its hash/record. Use it for anonymous
saves, contact/view attribution, and rate limiting. Saved listings become active membership with exactly
one principal (buyer or anonymous subject), partial unique indexes, and upsert/reactivation semantics.

**Rationale**: This gives race-safe unique saves and explainable seller metrics without fingerprinting or
caller-supplied listing IDs. Active saved membership is the save-count source of truth.

**Alternatives considered**:

- Local-storage-only saves: cannot update seller analytics consistently.
- Browser fingerprinting: unnecessary personal-data collection.
- Nullable composite unique constraints: PostgreSQL permits duplicate rows involving nulls.

## R07 — Persisted Public Location Separate From Exact Location

**Decision**: Store `exact_location`, seller consent, approved effective precision, and nullable
`public_location`. At approval, generate the public point once with cryptographic randomness, 100–500 m
from exact, and accept only a point covered by the governed area. After bounded attempts, use area-only.
Public bbox queries use only `public_location`; public area queries use governed `area_id`.

**Rationale**: A persisted random point is stable without a derivable formula. Merely masking response
coordinates is insufficient because exact-point bbox queries permit binary-search inference.

**Alternatives considered**:

- HMAC-derived offset: creates key-rotation/recovery coupling with no need when the point is stored.
- Grid snap, fixed offset, or area centroid: predictable or falsely precise.
- Per-request jitter: unstable, leaks a distribution over repeated reads, and harms map usability.

Primary references: [PostGIS ST_Project](https://postgis.net/docs/ST_Project.html),
[ST_Covers](https://postgis.net/docs/ST_Covers.html).

## R08 — Governed Arabic Search and Pages Router i18n

**Decision**: Preserve authoritative `name_ar`/`name_en`, add normalized keys and governed aliases, and use
NFKC, Arabic mark/tatweel removal, Alef folding, Ya folding, Latin lowercase, whitespace/punctuation
normalization. Do not fuzzy-match or accept user aliases. Configure Pages Router locales `ar` then `en`,
disable locale detection, set SSR/client `lang` and `dir`, use typed reviewed catalogues and locale-aware
formatters, and preserve route/query state with the locale switch.

**Rationale**: Arabic is the constitutional default. Display strings must not be mutated to achieve search,
and controlled aliases avoid selecting a wrong Cairo area.

**Alternatives considered**:

- `ILIKE` raw names: fails required Arabic variants.
- Generic fuzzy matching: ungoverned and hard to audit.
- Parallel Arabic route tree: duplicates existing Pages Router pages.

Primary references: [Unicode Arabic](https://www.unicode.org/versions/Unicode16.0.0/core-spec/chapter-9/),
[Next.js Pages Router i18n](https://nextjs.org/docs/pages/building-your-application/routing/internationalization).

## R09 — Versioned Lexicographic Organic Ordering

**Decision**: Order by declared fields in this precedence: query relevance, geographic fit, completeness,
named verification, latest availability confirmation, policy compliance, owner priority, approval
freshness, stable listing ID. Use fixed auditable expressions; views, saves, contacts, paid inputs, and
hidden model scores cannot affect order.

**Rationale**: Lexicographic precedence is deterministic and testable. Owner priority remains a tie-break
after relevance and quality instead of hiding irrelevant owner listings above better matches.

**Alternatives considered**:

- One weighted score: obscures precedence and tie behavior.
- Popularity: creates feedback loops and is not a declared constitutional input.
- Current approval-time-only order: ignores all required inputs and lacks a stable final tie-break.

## R10 — Human-Created Canonical Property and Disputes

**Decision**: Automation writes explainable duplicate signals. A moderator creates/links canonical property
identity before activation. A partial unique index on canonical property plus transaction purpose prevents
two active listings. Competing claims enter a private dispute state until an explicit human resolution.

**Rationale**: Similarity cannot establish ownership. Human identity plus a final database concurrency
constraint implements one canonical listing without autonomous rejection.

**Alternatives considered**:

- Confidence-based automatic merge/reject: constitutionally prohibited.
- Location-only uniqueness: apartment buildings contain many legitimate properties.
- Application-only check: races permit duplicate activation.

## R11 — Append-Only Lifecycle, Revision, Audit, and Evidence History

**Decision**: Use listing revisions for private snapshots and a unified append-only audit ledger for seller,
admin, session, evidence, expiry, canonical, and system actions. Material changes atomically remove public
eligibility and return to review. A lock/versioned transition service handles expiry/reconfirm races.
Evidence is encrypted, access-audited, excluded from model inputs, and removed 30 days after decision
unless a recorded hold applies.

**Rationale**: Extending mutable `admin_actions` cannot record seller/system activity and cascade deletion
would destroy history. Row locking plus one transition service produces one state and audit event.

**Alternatives considered**:

- Mutable current-state fields only: cannot prove prior/new values.
- Independent audit writes after a state transaction: may lose one side on failure.
- Risk automation overwriting seller type: violates moderator-override requirements.

## R12 — Secure Media Pipeline and Contact Handoff

**Decision**: Abstract storage/scanning. Decode bytes rather than trust names, cap source at 5 MB, enforce
800×600 and 3–10 photos, strip metadata through re-encoding, quarantine until fail-closed scan, use random
keys, and store digests/perceptual hashes for duplicate signals. Local mode uses namespaced local storage
and deterministic scanning; production requires private object storage and a real scanner.

For direct contact, create a rate-limited, accepted event and short-lived opaque intent before server-side
redirect. Raw numbers never enter listing APIs, SSR, markup, logs, or analytics; the final user-initiated
native destination necessarily discloses its target to the user's browser/device.

**Rationale**: Direct `tel:`/WhatsApp cannot function while literally hiding the destination from the
device. The privacy boundary is disclosure only at the accepted intentional handoff, not enumerable data.

**Alternatives considered**:

- Global Cloudinary client: prevents local operation and bypasses storage abstraction.
- Scanner fail-open: permits unverified media publication.
- Promise that the browser never receives a number: infeasible without call relay or in-app chat, both
  outside scope.

## R13 — Testing and One Validation Orchestrator

**Decision**: Use Jest/Supertest for backend unit/contract/integration tests, Vitest and Testing Library for
frontend units, Playwright projects plus axe for Arabic/English browser evidence, and real PostGIS/Redis for
integration. Root `npm run validate` executes format-check, lint, typecheck, build, migration validation,
idempotent seed, backend/frontend suites, and browser suites; CI invokes the same command.

**Rationale**: These are first-party-supported patterns for the existing frameworks and cover actual HTTP,
cookies, guards, spatial behavior, locale/viewport matrices, and browser storage.

**Alternatives considered**:

- Mock database for integration: cannot prove PostGIS, indexes, uniqueness, or migrations.
- Axe only: cannot prove focus, keyboard flows, zoom, target size, or direction.
- CI-only orchestration: local failures would remain difficult to reproduce.

Primary references: [Nest testing](https://docs.nestjs.com/fundamentals/testing),
[Next.js Vitest](https://nextjs.org/docs/pages/guides/testing/vitest),
[Playwright projects](https://playwright.dev/docs/test-projects),
[Playwright accessibility](https://playwright.dev/docs/accessibility-testing),
[WCAG 2.2](https://www.w3.org/TR/WCAG22/).

## R14 — Start From a Security-Maintained Dependency Baseline

**Decision**: Before building the repaired foundation, move the compatible framework family to the current
Node 20-supported security baseline: NestJS 11, Next.js 16.2, TypeORM 0.3.30, Playwright 1.61, Vitest 4,
ESLint 9.39, and their matching first-party adapters. Keep TypeORM on the 0.3 line to avoid an unrelated
persistence API migration. Lock exact tool/framework versions and review future changes through the normal
validation gate.

**Rationale**: A 2026-07-20 registry audit found known high-severity issues in the prior Nest 10 transitive
HTTP/upload stack, Next 16.1, Playwright 1.54, and older tooling. Building security/session/upload work on
that baseline would create immediate remediation debt. The selected releases declare support for the
constitutionally pinned Node 20.19 runtime.

**Alternatives considered**:

- `npm audit fix --force`: rejected because it proposed incoherent/breaking downgrades as well as majors.
- Keep Nest 10 and rely on transitive overrides: rejected because the framework advisory requires the
  maintained Nest release and overrides would form an unsupported dependency graph.
- TypeORM 1.x: deferred because 0.3.30 provides the needed patched line without a speculative ORM rewrite.
