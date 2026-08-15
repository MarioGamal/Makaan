# Tasks: Arabic-first Marketplace Redesign

**Input**: [spec.md](./spec.md), [plan.md](./plan.md), and the feature-002 foundation artifacts.  
**Rule**: Check a task only after the orchestrator inspects the implementation and reproduces its focused
acceptance command. By product direction, new automated-test authoring and browser-matrix tasks remain
unchecked for this delivery pass; implementation tasks may use the recorded typecheck/lint/build and
runtime smoke evidence in `evidence/release-one.md`.

## Phase A — Reconcile and freeze release-one contracts

- [x] T001 Audit unfinished feature-002 migrations 007–008, red US2 tests, entity drift, and route contracts; record keep/simplify/defer decisions in `specs/003-marketplace-redesign/reconciliation.md`
- [x] T002 Simplify migrations 007–008 to release-one listing privacy/lifecycle, governed areas, saved membership, contact intents, and protected media without making deferred canonical/dispute/evidence operations a journey blocker
- [x] T003 Preserve and revalidate release-one entities, shared enums, fixtures, reset behavior, and migration parity against the simplified schema
- [x] T004 Freeze typed public, seller, and moderator contracts in `specs/003-marketplace-redesign/contracts/api.md` and shared transport types
- [x] T005 Revalidate the existing green foundation checkpoint after reconciliation: migration up/down/up, seed twice, demo/empty reset, lint, typecheck, unit/contract tests, and production builds

## Phase B — Visual foundation and Arabic shell

- [x] T006 [P] Define visual tokens and responsive foundations in `frontend/src/styles/globals.css` and `frontend/tailwind.config.js`
- [x] T007 [P] Add typed Arabic/English catalogues, formatters, and route-preserving locale utilities in `frontend/src/i18n/` and `frontend/src/utils/locale.ts`
- [x] T008 Add SSR default locale/direction and locale persistence in `frontend/src/pages/_document.tsx`, `frontend/src/pages/_app.tsx`, and Next configuration
- [x] T009 [P] Build accessible Button, Input, Select, Badge, Card, Skeleton, AsyncState, Modal/Drawer, and LiveRegion primitives in `frontend/src/components/ui/`
- [x] T010 Redesign `AppShell`, responsive header/navigation, locale switcher, seller CTA, saved access, and footer
- [x] T011 Build shared seller/admin cookie-session and CSRF clients/hooks, then redesign functional Arabic/English OTP and moderator login with resend/countdown and session-expiry recovery
- [ ] T012 Add frontend unit tests for catalogue parity, locale direction, primitives, navigation, focus, and responsive shell states
- [ ] T013 Run the shell checkpoint at Arabic/English mobile/desktop viewports and resolve accessibility/overflow failures

## Phase C — Public marketplace vertical slice

- [x] T014 Add governed Arabic/English area normalization and reviewed alias resolution in `backend/src/services/area-search.service.ts`
- [x] T015 Add privacy-safe approximate/area-only public location generation and validation in `backend/src/services/public-location.service.ts`
- [x] T016 Implement allowlisted eligibility-filtered public search/detail projections and deterministic organic ordering in `backend/src/services/public-listing.service.ts`
- [x] T017 Replace public listing/area controllers with the frozen release-one contracts and bounded validated filters
- [ ] T018 Add passing public projection, eligibility, Arabic alias, bbox privacy, ranking, and forbidden-field tests
- [x] T019 Redesign the home route with owner-first value proposition, governed area/purpose search, trust explanation, and real featured listings
- [x] T020 Redesign URL-backed validated filters, drawer/sidebar, active chips, pagination/load-more, deterministic sort, reset/back restoration, property cards, and responsive loading/error/empty layouts
- [x] T021 Implement token-free local map adapter, production adapter boundary, list/map parity, area-only handling, selection, and failure fallback
- [x] T022 Redesign listing detail with approved gallery, facts, participation/location trust, description, freshness, save/contact actions, safe related listings, 404, broken-image, Arabic-only fallback, and contact-unavailable states
- [ ] T023 Run passing Arabic/English mobile/desktop public marketplace browser journeys

## Phase D — Save and contact vertical slice

- [x] T024 Implement exactly-one-principal saved membership entity/service with idempotent save/reactivate/unsave/list and active membership counts
- [x] T025 Replace buyer saved endpoints with authenticated-or-anonymous cookie/CSRF contracts and public projections
- [x] T026 Implement rate-limited, scoped, expiring, single-use contact intent creation/resolution and accepted contact metrics
- [x] T027 Replace frontend localStorage saves/direct contacts with server-backed state and intentional resolver handoff
- [x] T028 Redesign saved listings with shared cards, empty/error states, and locale-complete actions
- [ ] T029 Add passing concurrency, reload persistence, expiry/principal mismatch, accepted-only metric, and PII-negative tests
- [ ] T030 Run the save/contact browser checkpoint in Arabic/English mobile/desktop projects

## Phase E — Seller vertical slice

- [ ] T031 Add seller ownership/authorization and opaque cookie/CSRF contract tests for every seller route
- [x] T032 Align listing lifecycle/revision/media entity mappings and seller DTOs to sale/long-term-rent residential release-one fields
- [ ] T033 Implement transactional draft create/update, participation declaration, completeness validation, submit/re-submit, and audit behavior
- [ ] T034 Implement the minimal local/private media pipeline: upload, MIME/size/dimension validation, deterministic scan paths, retry, reorder, delete, approved derivatives, broken-image fallback, and no source URL leakage
- [x] T035 Implement seller dashboard/detail, accurate metrics, moderator feedback, sold, and withdraw operations
- [x] T036 Integrate the shared seller cookie-session/CSRF state with route protection and verify no bearer/localStorage auth remains
- [x] T037 Redesign seller login, dashboard, listing status cards, feedback, expired-session recovery, edit, and resubmit states
- [x] T038 Redesign the multi-section listing editor for property facts, required Arabic and optional English copy, preview, media, exact private location, public precision, declaration, draft, and submit
- [x] T039 Add unsaved-change protection, autosaved draft feedback, accessible validation summary, and mobile sticky actions
- [ ] T040 Run passing owner and declared-agent browser journeys from sign-in through submitted/rejected/corrected/terminal states

## Phase F — Moderator vertical slice

- [ ] T041 Add admin role/session/CSRF/revocation and atomic approve/reject/unpublish contract tests
- [x] T042 Implement transactional moderation service for queue/detail, participation confirmation, safe public location, approve/reject/unpublish, feedback, audit, and affected-session revocation
- [x] T043 Replace legacy moderation controller contracts with lock-versioned reasoned release-one endpoints
- [x] T044 Integrate the shared admin cookie-session/CSRF state with route protection and verify no bearer/localStorage auth remains
- [x] T045 Redesign moderator login, expired-session recovery, private queue, filters, responsive review cards/table, and pagination
- [x] T046 Redesign review detail with seller/listing facts, exact-versus-public location, media, participation, history, and approve/reject forms
- [x] T047 Add localized preset rejection reasons, optional seller note, required private internal reason, stale-write handling, success/error announcements, and navigation back to the queue
- [ ] T048 Run the browser submit → review → approve → public discovery journey plus reject/correct and suspension/revocation checks

## Phase G — Release-one acceptance

- [x] T049 Remove obsolete JWT/bearer, auth/save localStorage, exact-public-location, direct-contact, and dead legacy route code while preserving safe seller draft storage
- [ ] T050 Complete Arabic/English catalogue parity and remove inline untranslated release-one strings
- [ ] T051 Close WCAG 2.2 AA keyboard, focus, semantic, contrast, target-size, reduced-motion, live-region, map-fallback, and 200% zoom issues
- [ ] T052 Add protected-data scans across public responses, SSR HTML, browser storage, logs, and retained test artifacts
- [ ] T053 Add one fail-fast root validation command and CI workflow for release-one required stages
- [x] T054 Reconcile README, configuration, fixtures, and clean setup documentation with observed commands
- [ ] T055 Execute clean reset and all release-one browser journeys; record evidence in `specs/003-marketplace-redesign/evidence/release-one.md`
- [x] T056 Move canonical property, duplicate/dispute, evidence operations, retention automation, performance scale, and database-role hardening into `specs/003-marketplace-redesign/post-release.md`

## Phase H — Foreal-inspired editorial UI evolution

- [x] T057 Record the approved Foreal-inspired visual direction and its Makaan-specific adaptation boundaries in the feature specification and plan
- [x] T058 Redesign the public header, Cairo hero, integrated purpose/area search, listings heading, property-card rhythm, and trust panels with original local imagery
- [ ] T059 Extend the editorial image-led system to public listing detail, gallery, save/contact presentation, and mobile layout
- [ ] T060 Extend the visual system to seller authentication, dashboard, editor steps, success, error, and moderation-feedback states
- [ ] T061 Extend the visual system to moderator queue and review detail without reducing information density or decision clarity
- [ ] T062 Perform Arabic/English desktop/mobile visual review for crop behavior, text wrapping, contrast, focus, reduced motion, empty images, and 200% zoom

## Dependency order

```text
A contract freeze
  → B visual shell
  → C public marketplace
  → D save/contact
  → E seller
  → F moderator
  → H editorial UI evolution
  → G acceptance
```

Backend contract work for the next phase may begin while the current phase's frontend is being integrated,
but shared migrations, entity registry, authentication middleware, API clients, catalogues, and root config
have only one writer at a time.
