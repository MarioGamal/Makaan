# Tasks: Repair MVP Foundation

**Input**: Design documents from `/specs/002-repair-mvp-foundation/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/api-contract.md`, `quickstart.md`

**Tests**: Required by the constitution. Tests are written before their corresponding implementation and
must demonstrate a failing assertion for the missing behavior before that behavior is added.

**Organization**: Tasks are grouped by independently testable user story. IDs are execution order; `[P]`
means the task may proceed concurrently after its phase prerequisites because its write scope does not
overlap another incomplete task.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish one explicit toolchain and test layout without changing product behavior.

- [x] T001 Pin Node.js 20/npm 10 and add root engine/toolchain declarations in `.nvmrc`, `.npmrc`, and `package.json`
- [x] T002 Add root development and validation dependencies/scripts scaffolding in `package.json` and `package-lock.json`
- [x] T003 [P] Add backend Jest/Supertest configuration and suite directories in `backend/jest.config.ts`, `backend/tests/unit/.gitkeep`, `backend/tests/contract/.gitkeep`, and `backend/tests/integration/.gitkeep`
- [x] T004 [P] Add frontend Vitest/Testing Library configuration and setup in `frontend/vitest.config.ts`, `frontend/src/test/setup.ts`, and `frontend/package.json`
- [x] T005 [P] Add Playwright/axe project matrix and root browser-test layout in `playwright.config.ts`, `tests/e2e/fixtures/.gitkeep`, `tests/e2e/pages/.gitkeep`, and `tests/e2e/specs/.gitkeep`
- [x] T006 [P] Add shared format-check, lint, and typecheck configuration in `.prettierignore`, `.prettierrc`, `eslint.config.mjs`, and root `package.json`
- [x] T007 Replace ambiguous environment examples with a validated local/test/production schema inventory in `.env.example` and `docs/configuration.md`
- [x] T008 Pin stateful service images, remove fixed container names, and make PgAdmin optional in `infrastructure/docker/docker-compose.yml`
- [x] T009 Add ignored namespaced local media and validation-artifact paths in `.gitignore` and `infrastructure/local-media/.gitkeep`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Repair shared schema, configuration, sessions, and policy primitives that every journey relies on.

**CRITICAL**: No user-story implementation begins until this phase passes its focused tests.

- [x] T010 [P] Add failing production fail-closed and local-adapter configuration tests in `backend/tests/unit/configuration.spec.ts`
- [x] T011 Implement discriminated `APP_MODE` configuration validation and trusted origin/proxy/TLS rules in `backend/src/config/environment.ts` and `backend/src/config/configuration.ts`
- [x] T012 [P] Add provider interfaces plus local OTP, media, scanner, and accessible-map metadata adapters in `backend/src/services/providers/otp.provider.ts`, `backend/src/services/providers/media.provider.ts`, `backend/src/services/providers/scanner.provider.ts`, and `backend/src/services/providers/local/`
- [x] T013 Wire provider selection to reject local substitutes/placeholders in production in `backend/src/services/providers/providers.module.ts`
- [x] T014 [P] Add failing schema/entity parity and migration up-down-up tests in `backend/tests/integration/migrations.spec.ts`
- [x] T015 Create one exported TypeORM entity registry and use it for runtime and CLI migrations in `backend/src/models/index.ts`, `backend/src/database/database.module.ts`, and `backend/src/database/data-source.ts`
- [x] T016 Reconcile missing listing description, views, inquiries, notifications, saves, and indexes without editing migrations 001–004 in `backend/src/database/migrations/1774200000000-005-schema-reconciliation.ts`
- [x] T017 Align baseline entities to migration 005 and remove runtime-only drift in `backend/src/models/listing.entity.ts`, `backend/src/models/view.entity.ts`, `backend/src/models/inquiry.entity.ts`, `backend/src/models/seller-notification.entity.ts`, and `backend/src/models/saved-listing.entity.ts`
- [x] T018 [P] Add failing opaque-session, separately scoped seller/admin/anonymous CSRF, revocation, role-matrix, trusted-proxy, and OTP/admin-login abuse-limit contract tests in `backend/tests/contract/session-security.spec.ts`
- [x] T019 Add session, anonymous subject, participation, verification/evidence, and append-only audit schema in `backend/src/database/migrations/1774300000000-006-security-audit-participation.ts`
- [x] T020 [P] Implement User-scoped AuthSession, CSRF-bound AnonymousSubject, VerificationCase, VerificationEvidence, EvidenceAccess, and AuditEvent entities in `backend/src/models/user.entity.ts`, `backend/src/models/auth-session.entity.ts`, `backend/src/models/anonymous-subject.entity.ts`, `backend/src/models/verification-case.entity.ts`, `backend/src/models/verification-evidence.entity.ts`, `backend/src/models/evidence-access.entity.ts`, and `backend/src/models/audit-event.entity.ts`
- [x] T021 Implement declared/effective participation, versioned agent-declaration confirmation, review state, verification state, and public-label derivation in `backend/src/models/seller-profile.entity.ts` and `backend/src/services/participation.service.ts`
- [x] T022 Implement opaque session issuance/rotation/revocation, separate seller/admin/anonymous cookie and CSRF scopes, origin checks, and exact-scope guards in `backend/src/services/session.service.ts`, `backend/src/services/anonymous-subject.service.ts`, `backend/src/middleware/session.guard.ts`, and `backend/src/middleware/csrf.guard.ts`
- [x] T023 Replace seller/admin bearer-token authentication contracts, add mandatory admin second factor, and enforce centrally configured fail-closed OTP request/verification, admin-login, listing-submission, upload, and contact abuse limits in `backend/src/api/auth/auth.controller.ts`, `backend/src/api/auth/auth.module.ts`, `backend/src/api/admin/admin-auth.controller.ts`, `backend/src/api/admin/dto/admin-login.dto.ts`, `backend/src/services/abuse-control.service.ts`, and `backend/src/config/abuse-limits.ts`
- [x] T024 Implement append-only transactional audit writes and protected-value log redaction in `backend/src/services/audit.service.ts`, `backend/src/utils/log-redaction.ts`, and `backend/src/middleware/correlation-id.middleware.ts`

**Checkpoint**: Clean schema, explicit modes, opaque sessions, CSRF, participation, and audit primitives pass.

---

## Phase 3: User Story 1 — Start Makaan From a Clean Environment (Priority: P1) — First Increment

**Goal**: A contributor reaches a healthy Arabic demo marketplace from a clean clone without paid accounts.

**Independent Test**: Follow `quickstart.md` from empty state; run migrations and seed twice; load Arabic
home/search fixtures while local substitutes work and production rejects them.

### Tests for User Story 1

- [x] T025 [P] [US1] Add failing clean-setup, seed idempotency, and reset safety integration tests in `backend/tests/integration/clean-setup.spec.ts`
- [x] T026 [P] [US1] Add failing local-provider journey and production-placeholder negative tests in `backend/tests/integration/provider-modes.spec.ts`
- [x] T027 [P] [US1] Add failing Arabic-default health/home smoke journey in `tests/e2e/specs/clean-start.spec.ts`

### Implementation for User Story 1

- [x] T028 [P] [US1] Add guarded local up/down scripts and disposable validation-service orchestration in `scripts/local-services.sh`, `scripts/validate-services.sh`, and root `package.json`
- [x] T029 [US1] Add migration run/revert/validate scripts with isolated database targeting in `scripts/validate-migrations.sh`, `backend/package.json`, and root `package.json`
- [x] T030 [P] [US1] Implement deterministic governed Cairo areas, bilingual accounts, listings, media metadata, and moderation fixtures in `backend/src/database/seed.ts` and `backend/src/database/fixtures/`
- [x] T031 [US1] Implement production-guarded idempotent demo/empty reset commands in `backend/src/database/reset.ts` and root `package.json`
- [x] T032 [P] [US1] Add API health/readiness reporting without secret/provider-value disclosure in `backend/src/api/health/health.controller.ts` and `backend/src/api/health/health.module.ts`
- [x] T033 [US1] Add one root development orchestrator for backend/frontend startup in `package.json`
- [x] T034 [US1] Update executable clean setup, fixture credentials, ports, and recovery notes in `README.md` and `specs/002-repair-mvp-foundation/quickstart.md`

**Checkpoint**: US1 passes from a clean database and clean browser with no external accounts.

---

## Phase 4: User Story 2 — Browse, Save, and Contact Active Listings Reliably (Priority: P1)

**Goal**: Buyers discover only eligible listings, understand seller participation/location precision, save
durably, and intentionally contact a seller without enumerable PII.

**Independent Test**: Search/filter/list/map in both locales, owners-only then all participation labels;
save/reload/unsave; perform accepted and rejected contact handoffs; scan payloads, markup, storage, and logs.

### Tests for User Story 2

- [ ] T035 [P] [US2] Add failing public search/detail contract and forbidden-field snapshot tests in `backend/tests/contract/public-listings.spec.ts`
- [ ] T036 [P] [US2] Add failing spatial privacy, bbox non-inference, Arabic normalization, and ranking-order integration tests in `backend/tests/integration/public-discovery.spec.ts`
- [ ] T037 [P] [US2] Add failing anonymous save uniqueness/concurrency and metric-source tests in `backend/tests/integration/saved-listings.spec.ts`
- [ ] T038 [P] [US2] Add failing contact intent rate/expiry/principal/privacy tests in `backend/tests/integration/contact-intents.spec.ts`
- [ ] T039 [P] [US2] Add failing Arabic/English mobile/desktop discovery, label, save, contact, keyboard, token-free local-map, and map-failure fallback browser journeys in `tests/e2e/specs/buyer-marketplace.spec.ts`

### Implementation for User Story 2

- [ ] T040 [US2] Add listing privacy/lifecycle, governed area alias, and stable public-location schema in `backend/src/database/migrations/1774400000000-007-listing-privacy-lifecycle-canonical.ts`
- [ ] T041 [US2] Add race-safe saves, view/contact events, intents, and protected media metadata schema after migration 007 in `backend/src/database/migrations/1774500000000-008-events-saves-media.ts`
- [ ] T042 [US2] Implement Cairo normalization/alias resolution and public-location generation constrained by area polygons in `backend/src/services/area-search.service.ts` and `backend/src/services/public-location.service.ts`
- [ ] T043 [US2] Implement allowlisted public projections, eligibility filters, public-only bbox filtering, and versioned lexicographic ranking in `backend/src/services/public-listing.service.ts` and `backend/src/api/listings/listings.controller.ts`
- [ ] T044 [US2] Implement anonymous CSRF issuance and User-or-anonymous idempotent server-backed save/unsave/list operations in `backend/src/services/anonymous-subject.service.ts`, `backend/src/services/saved-listing.service.ts`, and `backend/src/api/buyer/saved-listings.controller.ts`
- [ ] T045 [US2] Implement deduplicated views, accepted contact events, abuse limits, and short-lived resolver redirects in `backend/src/services/listing-event.service.ts`, `backend/src/services/contact-intent.service.ts`, and `backend/src/api/listings/contact-intents.controller.ts`
- [ ] T046 [P] [US2] Add typed Arabic/English catalogues, locale-aware formatters, and route-preserving switch utilities in `frontend/src/i18n/ar.ts`, `frontend/src/i18n/en.ts`, `frontend/src/i18n/index.ts`, and `frontend/src/utils/locale.ts`
- [ ] T047 [US2] Configure Arabic-default Pages Router SSR language/direction and client updates in `frontend/next.config.js`, `frontend/src/pages/_document.tsx`, and `frontend/src/pages/_app.tsx`
- [ ] T048 [US2] Repair search, filters, list/map parity, public location union, owner/agent labels, responsive states, and a token-free accessible local/test map adapter that production cannot select in `frontend/src/pages/index.tsx`, `frontend/src/components/search/AreaSearchBar.tsx`, `frontend/src/components/filters/FilterPanel.tsx`, `frontend/src/components/map/MarketplaceMap.tsx`, `frontend/src/components/map/ListingPin.tsx`, and `frontend/src/components/listing/PublicListingCard.tsx`
- [ ] T049 [US2] Replace local-only saves/direct contact links and sanitize detail rendering in `frontend/src/components/listing/SaveButton.tsx`, `frontend/src/components/listing/ContactButtons.tsx`, `frontend/src/pages/saved.tsx`, and `frontend/src/pages/listings/[id].tsx`

**Checkpoint**: US2 independently proves public privacy, deterministic discovery, durable saves, and contact.

---

## Phase 5: User Story 3 — Complete the Seller Listing Lifecycle (Priority: P1)

**Goal**: An owner or declared agent securely creates, submits, corrects, tracks, reconfirms, sells, or
withdraws a listing under the correct moderation and availability policy.

**Independent Test**: Exercise owner and agent limits/declaration, valid/invalid media, pending isolation,
material/non-material edit behavior, metrics, warning, expiry, reconfirmation, and concurrent expiry races.

### Tests for User Story 3

- [ ] T050 [P] [US3] Add failing seller ownership/authorization and lifecycle contract tests in `backend/tests/contract/seller-listings.spec.ts`
- [ ] T051 [P] [US3] Add failing submission limits, material revision, availability expiry, and race integration tests in `backend/tests/integration/listing-lifecycle.spec.ts`
- [ ] T052 [P] [US3] Add failing image byte/type/size/dimension/count/quarantine/scanner tests in `backend/tests/integration/media-pipeline.spec.ts`
- [ ] T053 [P] [US3] Add failing Arabic/English seller create/edit/status/reconfirm browser journeys in `tests/e2e/specs/seller-lifecycle.spec.ts`

### Implementation for User Story 3

- [ ] T054 [P] [US3] Implement ListingRevision, ListingMedia, lifecycle fields, and notification entity mappings in `backend/src/models/listing-revision.entity.ts`, `backend/src/models/listing-media.entity.ts`, `backend/src/models/listing.entity.ts`, and `backend/src/models/seller-notification.entity.ts`
- [ ] T055 [US3] Implement nullable never-submitted draft revision state, draft submission snapshots, and transaction-locked active-material-edit revision/pending transitions in `backend/src/services/listing-lifecycle.service.ts` and `backend/src/services/listing-revision.service.ts`
- [ ] T056 [US3] Enforce Cairo residential inputs, exact/private location, public consent, owner 3/agent 2 rolling limits, and current-version moderator-confirmed first-agent declaration in `backend/src/api/listings/dto/create-listing.dto.ts` and `backend/src/services/listing-submission.service.ts`
- [ ] T057 [US3] Implement fail-closed decode/size/dimension/metadata-strip/quarantine/scan/derivative media pipeline in `backend/src/services/media-pipeline.service.ts` and `backend/src/api/listings/photos.controller.ts`
- [ ] T058 [US3] Replace seller listing endpoints with own-resource session authorization, lock versions, submit/reconfirm/sold/withdraw transitions, and consistent metrics in `backend/src/api/listings/seller-listings.controller.ts`
- [ ] T059 [US3] Implement lock-safe seven-day warning, 30-day expiry, and evidence-retention worker commands in `backend/src/services/lifecycle-worker.service.ts` and `backend/src/commands/run-lifecycle-workers.ts`
- [ ] T060 [P] [US3] Replace token storage/client auth with cookie session and CSRF-aware request handling in `frontend/src/services/api.ts`, `frontend/src/hooks/useSession.ts`, and `frontend/src/components/auth/ProtectedRoute.tsx`
- [ ] T061 [US3] Repair bilingual seller create/edit validation, exact map entry, explicit public precision consent, and media progress/errors in `frontend/src/pages/listings/create.tsx`, `frontend/src/pages/listings/[id]/edit.tsx`, `frontend/src/components/listing/ListingCreateMap.tsx`, and `frontend/src/components/listing/PhotoUpload.tsx`
- [ ] T062 [US3] Repair seller dashboard/status/metrics/rejection/reconfirm/sold/withdraw presentation in `frontend/src/pages/seller/dashboard.tsx` and `frontend/src/components/seller/ListingStatusCard.tsx`
- [ ] T063 [US3] Add localized accessible seller notifications for pending, rejection, warning, expiry, and dispute states in `frontend/src/components/seller/SellerNotifications.tsx` and `frontend/src/i18n/ar.ts`
- [ ] T064 [US3] Run and document the independently passing seller lifecycle checkpoint in `specs/002-repair-mvp-foundation/evidence/us3-seller-lifecycle.md`

**Checkpoint**: US3 passes with pending content private and all state races producing one audited outcome.

---

## Phase 6: User Story 4 — Moderate Listings and Accounts Securely (Priority: P2)

**Goal**: A second-factor-authenticated moderator makes auditable human decisions using private evidence,
safe public precision, canonical identity, disputes, and participation controls.

**Independent Test**: Run the authorization matrix, approve/reject/unpublish, override classification,
suspend/revoke, inspect/access/delete evidence, handle duplicates/disputes, and verify audit immutability.

### Tests for User Story 4

- [ ] T065 [P] [US4] Add failing admin second-factor/session/CSRF/role/revocation contract tests in `backend/tests/contract/admin-security.spec.ts`
- [ ] T066 [P] [US4] Add failing canonical uniqueness, duplicate-signal, dispute, approval, and concurrency tests in `backend/tests/integration/moderation.spec.ts`
- [ ] T067 [P] [US4] Add failing audit immutability and evidence access/retention tests in `backend/tests/integration/audit-evidence.spec.ts`
- [ ] T068 [P] [US4] Add failing Arabic/English admin queue/review/decision/suspension browser journeys in `tests/e2e/specs/admin-moderation.spec.ts`

### Implementation for User Story 4

- [ ] T069 [P] [US4] Implement CanonicalProperty, DuplicateSignal, PropertyDispute, verification, and audit entity mappings in `backend/src/models/canonical-property.entity.ts`, `backend/src/models/duplicate-signal.entity.ts`, `backend/src/models/property-dispute.entity.ts`, and `backend/src/models/verification-case.entity.ts`
- [ ] T070 [US4] Implement explainable duplicate signals and human-only canonical linking with the active-purpose uniqueness guard in `backend/src/services/duplicate-review.service.ts` and `backend/src/services/canonical-property.service.ts`
- [ ] T071 [US4] Implement property dispute opening/resolution with transactional unpublication and audit in `backend/src/services/property-dispute.service.ts`
- [ ] T072 [US4] Implement participation override, suspension/session revocation, verification decisions, encrypted evidence object references/key versions, audited protected evidence access, transactional deletion deadlines, and retention holds in `backend/src/services/moderation.service.ts` and `backend/src/services/verification.service.ts`
- [ ] T073 [US4] Replace moderation endpoints with lock-versioned, reasoned, atomic approve/reject/unpublish/override/suspend/canonical/dispute contracts in `backend/src/api/admin/admin-moderation.controller.ts`
- [ ] T074 [US4] Add out-of-band audited administrator recovery and second-factor reset command in `backend/src/commands/recover-admin.ts` and `backend/package.json`
- [ ] T075 [P] [US4] Replace admin localStorage token handling with cookie session/CSRF handling in `frontend/src/components/auth/AdminProtectedRoute.tsx` and `frontend/src/services/admin-api.ts`
- [ ] T076 [US4] Repair bilingual private review queue/detail, exact-versus-public map distinction, revision history, evidence, and decision forms in `frontend/src/pages/admin/queue.tsx`, `frontend/src/pages/admin/listings/[id].tsx`, and `frontend/src/components/admin/ModerationDecisionForm.tsx`
- [ ] T077 [US4] Implement accessible duplicate/canonical/dispute/participation controls without autonomous actions in `frontend/src/components/admin/DuplicateHintsPanel.tsx` and `frontend/src/components/admin/ParticipationPanel.tsx`
- [ ] T078 [US4] Run and document the independently passing moderation/security checkpoint in `specs/002-repair-mvp-foundation/evidence/us4-moderation.md`

**Checkpoint**: US4 passes with no privileged browser token and every consequential outcome human-audited.

---

## Phase 7: User Story 5 — Prove Release Readiness Continuously (Priority: P1)

**Goal**: One command proves the repaired foundation locally and in CI with actionable, privacy-safe evidence.

**Independent Test**: Introduce a controlled failure in each stage to confirm fail-fast behavior, restore it,
then complete the full clean validation matrix and inspect protected-data scans/artifacts.

### Tests for User Story 5

- [ ] T079 [P] [US5] Add failing validation-orchestrator fail-fast and exit-code tests in `scripts/tests/validate-orchestrator.test.sh`
- [ ] T080 [P] [US5] Add failing translation completeness and untranslated-key tests in `frontend/src/i18n/catalogues.spec.ts`
- [ ] T081 [P] [US5] Add failing protected-data response/HTML/storage/log scan in `tests/e2e/specs/protected-data.spec.ts` and `scripts/scan-artifacts.ts`
- [ ] T082 [P] [US5] Add failing WCAG/keyboard/focus/live-region/target/reduced-motion/map-fallback matrix in `tests/e2e/specs/accessibility.spec.ts`

### Implementation for User Story 5

- [ ] T083 [US5] Implement fail-fast root validation orchestration for format/lint/type/build/migrations/seed/unit/contract/integration/browser stages in `scripts/validate.sh` and `package.json`
- [ ] T084 [P] [US5] Add deterministic Playwright authentication/listing/moderation fixtures and page objects in `tests/e2e/fixtures/marketplace.ts` and `tests/e2e/pages/`
- [ ] T085 [US5] Configure CI to invoke only the root validation contract with pinned PostGIS/Redis services and retained redacted artifacts in `.github/workflows/validate.yml`
- [ ] T086 [P] [US5] Add accessible loading/error/empty/live-region primitives and apply them to primary journeys in `frontend/src/components/ui/AsyncState.tsx` and `frontend/src/components/ui/LiveRegion.tsx`
- [ ] T087 [US5] Close every Arabic/English catalogue gap and enforce typed key parity in `frontend/src/i18n/ar.ts`, `frontend/src/i18n/en.ts`, and `frontend/src/i18n/index.ts`
- [ ] T088 [US5] Run the complete clean-environment matrix and record commands, versions, outcomes, and manual 200% zoom evidence in `specs/002-repair-mvp-foundation/evidence/release-readiness.md`
- [ ] T089 [US5] Reconcile all executable documentation with observed validation behavior in `README.md`, `docs/configuration.md`, and `specs/002-repair-mvp-foundation/quickstart.md`

**Checkpoint**: US5 passes locally and in CI; any failed required check returns nonzero with no secret leakage.

---

## Phase 8: Polish and Cross-Cutting Acceptance

**Purpose**: Conservative data adoption, performance, full traceability, and final orchestrator acceptance.

- [ ] T090 Add conservative legacy data backfill that returns insufficiently governed records to private review, revokes legacy sessions, HMAC/encrypts phones with explicit duplicate handling, and encrypts or forces reprovisioning before scrubbing legacy second-factor material in `backend/src/database/migrations/1774600000000-009-data-backfill-policy.ts`
- [ ] T091 [P] Add migration-009 backfill privacy and rollback evidence in `backend/tests/integration/legacy-backfill.spec.ts`
- [ ] T092 [P] Add representative 10,000-listing search/ranking and lifecycle-worker performance checks in `backend/tests/performance/foundation-performance.spec.ts`
- [ ] T093 Remove obsolete JWT/bearer authentication, authentication/save localStorage, direct-contact URL, and exact-public-location code without removing safe seller draft storage in `backend/package.json`, `frontend/package.json`, `backend/src/middleware/jwt-auth.guard.ts`, `backend/src/services/auth.service.ts`, `backend/src/services/admin-auth.service.ts`, `backend/src/services/listing-search.service.ts`, `frontend/src/services/admin-auth.service.ts`, `frontend/src/services/saved.service.ts`, `frontend/src/hooks/useAuth.tsx`, and `frontend/src/hooks/useAdminAuth.tsx`
- [ ] T094 Run a requirement-to-test traceability audit and record FR-001–FR-043/SC-001–SC-013 evidence links in `specs/002-repair-mvp-foundation/evidence/traceability.md`
- [ ] T095 Run orchestrator security/privacy review over migrations, serializers, cookies, CSRF, evidence, logs, storage, and production config and record findings in `specs/002-repair-mvp-foundation/evidence/security-review.md`
- [ ] T096 Execute `npm run validate` from a clean reset, resolve every failure, and record the final immutable handoff in `specs/002-repair-mvp-foundation/evidence/final-validation.md`
- [ ] T097 Separate migration-owner and application database roles, deny application DDL/update/delete/truncate over append-only ledgers, and verify grants in `backend/src/database/migrations/`, `backend/tests/integration/audit-evidence.spec.ts`, and deployment documentation

---

## Dependencies and Execution Order

### Phase Dependencies

- Phase 1 → Phase 2: toolchain before shared implementation.
- Phase 2 blocks all user stories because schema, modes, sessions, CSRF, participation, and audit are shared.
- After Phase 2, US1 and test authoring for US2–US5 can begin concurrently in non-overlapping files.
- US2 implementation depends on migrations 007–008; US3 shares those schemas and follows T040–T041.
- US4 depends on session/audit foundations and canonical schema T040, but not on the buyer UI.
- US5 can build its harness early; final matrix depends on all selected journeys.
- Phase 8 depends on all five stories; migration 009 lands only after new-policy code and tests exist.

### User Story Dependency Graph

```text
Setup → Foundation ┬→ US1 Clean start
                   ├→ US2 Buyer discovery ─┐
                   ├→ US3 Seller lifecycle ├→ US5 continuous proof → Final acceptance
                   └→ US4 Moderation ───────┘
```

US2, US3, and US4 remain independently testable through API fixtures even where they share foundational
entities. Do not run agents concurrently on shared migrations, entity registry, session middleware,
catalogues, root package files, or API client files.

## Parallel Execution Examples

- **Setup**: T003, T004, T005, and T006 have disjoint configs.
- **Foundation**: after T011, T012 and T014 may proceed; T018 test authoring may proceed separately from
  T015–T017, but T019–T023 are a single security integration lane.
- **US1**: T025–T027 tests may be authored concurrently; T028 and T030 use disjoint scopes.
- **US2**: T035–T039 tests are disjoint; after schema tasks, backend discovery (T042–T045) and i18n catalogue
  setup (T046) may proceed concurrently.
- **US3**: T050–T053 tests are disjoint; T054 and T060 may proceed concurrently before integration.
- **US4**: T065–T068 tests are disjoint; T069 and T075 may proceed concurrently.
- **US5**: T079–T082 tests are disjoint; T084 and T086 may proceed while T083 is integrated.

## Delegated Implementation Strategy

Use `delegation.md` as the assignment ledger. Lower-cost agents receive one bounded package with exact files,
prerequisites, acceptance commands, and a prohibition on expanding architecture. The main orchestrator owns
migrations, sessions/CSRF, privacy/ranking rules, security review, overlapping-file integration, task state,
and completion decisions.

Recommended increments:

1. T001–T034: clean, secure foundation and independently demonstrable US1.
2. T035–T049: privacy-safe buyer marketplace.
3. T050–T064: complete seller lifecycle.
4. T065–T078: human moderation and agent governance.
5. T079–T096: continuous evidence, conservative backfill, and release acceptance.

At every checkpoint, update completed checkboxes only after focused tests pass. Never mark a delegated task
complete solely because an agent reports success; inspect the diff and reproduce its acceptance command.
