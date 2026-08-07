# Implementation Plan: Arabic-first Marketplace Redesign

**Branch**: `003-marketplace-redesign` | **Date**: 2026-08-07 | **Spec**: [spec.md](./spec.md)  
**Foundation**: [002 repair plan](../002-repair-mvp-foundation/plan.md)

## Summary

Build release one as browser-usable vertical slices. The repaired configuration, migrations 005–006,
opaque-session primitives, local providers, deterministic fixtures, health endpoint, and test tooling are
retained. Unfinished migrations 007–008 are reviewed and reduced to the fields actually needed for public
location, listing lifecycle, saves, contact intents, and media. Canonical/dispute/evidence operations are
not allowed to block the public, seller, or moderation journeys.

The redesign starts with tokens, application shell, Arabic SSR, and reusable states. Backend contracts are
then frozen immediately before their consuming UI slice. Every phase ends in a usable route and focused
browser checkpoint.

## Technical context

- TypeScript 5.6, Node.js 20, npm workspaces
- NestJS 11, TypeORM 0.3, PostgreSQL/PostGIS, Redis
- Next.js 16 Pages Router, React 19, Tailwind CSS 3, SWR
- Jest/Supertest, Vitest/Testing Library, Playwright/axe
- Arabic RTL default, English LTR, mobile-first responsive web

## Architecture decisions

### 1. Vertical delivery over subsystem completion

Work is ordered by usable journeys. A schema or service is implemented only when its next browser slice
needs it. Advanced operational tables may remain documented, but unfinished code cannot keep the release
build or validation suite red.

### 2. Design system before page-by-page styling

CSS variables and small React primitives define color, typography, spacing, radius, shadow, focus, buttons,
inputs, badges, cards, dialogs/drawers, and asynchronous states. Pages compose these primitives. Arabic and
English use logical CSS properties; separate duplicated layouts are prohibited.

### 3. Arabic route and direction strategy

Arabic is the root/default locale. Locale selection is persisted in a non-sensitive cookie and reflected
in SSR `lang`/`dir`. The switch retains pathname and query state. Copy lives in typed, parity-checked
catalogues rather than inline page strings.

### 4. Public contract boundary

`PublicListingService` is the only source for anonymous search/detail/save projections. It allowlists fields,
checks approval/availability/seller state, and filters bbox by approved public location only. Controllers do
not return TypeORM entities.

### 5. Functional local map without paid credentials

Local/test uses an accessible, token-free schematic Cairo map/list adapter based on approved public
locations and governed areas. Production may select its configured map adapter. A failed map never removes
the result list.

### 6. Complete seller and moderation loop

The release checkpoint is not reached until an authenticated seller submission can be reviewed by an
authenticated moderator and become visible through the public contract. Controller-only or frontend-only
mock state does not count.

### 7. Delivery-pass validation boundary

For the current delivery pass, feature implementation is validated with the observed typecheck, lint,
production-build, migration/seed, and runtime API smoke checkpoints recorded in
`evidence/release-one.md`. At the product owner's direction, writing additional automated tests and
executing the full Arabic/English browser matrix are deferred; their task items remain open and must be
completed before a release-acceptance claim.

## Delivery sequence

### Phase A — Reconcile and freeze release-one contracts

- Review unfinished migration/test work created under feature 002.
- Keep only release-one listing privacy/lifecycle, media, save, and contact fields.
- Restore a green baseline; intended-red tests become tracked tasks, not default-suite failures.
- Freeze public, seller, and moderator transport shapes.

**Delivery-pass exit**: migrations up/down/up, seed twice, reset, lint, typecheck, builds, and focused
runtime smoke checks pass. Focused and browser test expansion remains deferred as described above.

### Phase B — Visual foundation and Arabic shell

- Implement tokens, typography, focus/motion rules, UI primitives, shared async states, header/footer, mobile
  navigation, locale catalogue, and SSR direction.
- Add shared seller/admin cookie-session, CSRF clients, and session-state hooks before authentication screens.
- Restyle authentication entry points into functional OTP/second-factor journeys using the same shell.

**Deferred release exit**: polished Arabic and English shell at 375×667 and 1440×900; no direction flash
or overflow. The browser viewport matrix is deferred for the current delivery pass.

### Phase C — Public marketplace vertical slice

- Implement governed area search, allowlisted discovery/detail APIs, URL-backed validated filters,
  pagination/load-more, deterministic sorts, participation labels, public location union, responsive
  card/grid, list/map toggle, and map fallback.
- Build the redesigned home and listing detail pages against real seeded APIs.

**Delivery-pass exit**: a visitor can search, filter, switch presentation, and open an approved listing
through the real API. Locale/browser-matrix acceptance remains deferred.

### Phase D — Save and contact vertical slice

- Implement anonymous subject CSRF, server-backed save/list/unsave, accepted contact intents, and resolver.
- Replace localStorage saves and direct destination links.

**Delivery-pass exit**: server-backed saves and privacy-preserving contact intent contracts are implemented;
full Redis-backed contact and browser acceptance remains deferred until local services are available.

### Phase E — Seller vertical slice

- Integrate the shared cookie-session frontend auth, participation declaration, structured draft form,
  media, private exact
  location, public precision, submission, dashboard, feedback, correction, sold, and withdraw.

**Delivery-pass exit**: owner and declared-agent journeys operate through real cookie/CSRF APIs without
bearer/localStorage authentication; browser-matrix acceptance remains deferred.

### Phase F — Moderator vertical slice

- Integrate the shared cookie-session admin frontend, queue/detail, participation confirmation,
  media/location review,
  approve/reject/unpublish, seller feedback, audit, and session revocation.

**Delivery-pass exit**: seller submission, moderator review, and public eligibility are connected through
real APIs; browser end-to-end acceptance remains deferred.

### Phase G — Release-one acceptance

- Close accessibility/i18n gaps, responsive states, protected-data scans, clean setup docs, and CI path.
- Record deferred advanced operations separately.

**Exit**: clean submit → review → publish journey and buyer journey pass from governed reset.

## Parallel delivery policy

Parallel work is limited to lanes whose files and contracts do not overlap. Within each phase, backend
services/tests may proceed independently from visual components only after their shared transport contract
is frozen. Checkpoint browser runs use a focused Arabic-mobile and English-desktop Chromium pair; the full
locale/viewport/browser matrix runs only at release acceptance.

## Progress reporting

Each orchestrator update reports four items:

1. completed since the previous update;
2. currently being implemented;
3. next browser-visible checkpoint;
4. blockers or decisions.

Task completion requires focused validation and an observable route/API outcome. A schema-only or
component-only change is reported as partial progress, not a completed product milestone.

## Deferred architecture backlog

After release one: canonical-property workbench, duplicate signals, disputes, verification evidence,
retention workers, database role separation, representative-scale performance, and broader marketplace
categories. Security/privacy defects discovered in release-one code are never deferred merely because they
belong to these topics.
