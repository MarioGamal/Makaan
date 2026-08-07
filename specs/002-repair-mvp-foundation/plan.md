# Implementation Plan: Repair MVP Foundation

> Remaining product delivery and the visual redesign continue in
> [`003-marketplace-redesign`](../003-marketplace-redesign/plan.md). This document retains the repaired
> foundation history and is no longer the execution order for unfinished marketplace journeys.

**Branch**: `002-repair-mvp-foundation` | **Date**: 2026-07-20 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification at `specs/002-repair-mvp-foundation/spec.md`

## Summary

Repair Makaan's existing Cairo residential marketplace into a trustworthy implementation baseline without
redesigning the product yet. The work reconciles migrations and runtime entities, introduces secure
server-side sessions, preserves exact locations privately while publishing only approved safe locations,
implements owner/agent participation and moderation, makes saves and analytics durable, completes listing
lifecycle/canonical-property controls, adds Arabic-first localization and accessible map alternatives, and
establishes one clean local/CI validation path.

The implementation remains an npm-workspace web application: NestJS owns policy and persistence, Next.js
Pages Router renders Arabic RTL by default and English LTR, PostgreSQL/PostGIS is authoritative, and Redis
supports abuse controls. Existing migrations remain immutable; ordered repair migrations and conservative
backfills bring the database to the new contract.

## Technical Context

**Language/Version**: TypeScript 5.6, Node.js 20 LTS, npm 10  
**Primary Dependencies**: NestJS 11, Next.js 16.2 Pages Router, React 19, TypeORM 0.3, Tailwind CSS 3,
React Hook Form/Zod, Mapbox GL production adapter, Sharp, ioredis  
**Storage**: PostgreSQL 16 with PostGIS 3.4; Redis 7; local namespaced media filesystem in local/test;
private object storage in production  
**Testing**: Jest/Supertest, Vitest 4/Testing Library, Playwright 1.61 with `@axe-core/playwright`, real disposable
PostGIS/Redis integration services  
**Target Platform**: Modern mobile and desktop browsers; Linux-compatible Node.js server runtime  
**Project Type**: npm-workspace web application with backend, frontend, and shared packages  
**Performance Goals**: 95% of representative search requests complete within 2 seconds; result-map
interactions remain responsive for representative Cairo fixtures; lifecycle workers process bounded,
lock-safe batches without blocking interactive traffic  
**Constraints**: Arabic RTL is the default; WCAG 2.2 AA; exact location and protected identity data cannot
enter public payloads, markup, logs, or analytics; production fails closed without real security providers;
all new schema evolution is migration-backed; first release remains Cairo residential sale/long-term rent  
**Scale/Scope**: First-release assumption of up to 10,000 active listings and 50–100 moderation decisions
per day, with primarily mobile buyer traffic; five end-to-end user stories and 43 functional requirements

## Constitution Check

_Gate result before research: PASS. Re-check after design: PASS._

- **First-release boundary — PASS**: Contracts admit Cairo residential sale and long-term rent only;
  off-plan, developer inventory, other governorates, short stays, and cars remain excluded.
- **Arabic/mobile first — PASS**: Arabic is the configured default; SSR direction, route-preserving locale
  changes, mobile viewport coverage, logical CSS, and reviewed catalogues are specified.
- **Owner advantage — PASS**: Participation labels are mandatory; agent listings are declared, moderated,
  filterable, and a deterministic owner tie-break remains in organic ordering.
- **Location integrity/privacy — PASS**: `exact_location` is private; public queries and payloads use only
  persisted approved `public_location` or governed area identity.
- **Moderated quality — PASS**: Initial publication, material edits, participation override, canonical
  identity, disputes, and verification decisions require human action.
- **Canonical listing — PASS**: Moderator-created canonical identity plus a partial unique constraint
  prevents concurrent active duplicates for the same transaction purpose.
- **Security/privacy — PASS**: Opaque HTTP-only sessions, CSRF binding, scoped authorization, retention,
  protected uploads, non-enumerable contact handoff, and masked diagnostics are designed.
- **Human accountability — PASS**: Automated signals can queue review but cannot independently classify,
  reject, merge, suspend, or verify a participant.
- **Evidence — PASS**: Migration, contract, integration, authorization, accessibility, locale/viewport, and
  clean-setup checks run through the same root validation entry point locally and in CI.
- **Future-category restraint — PASS**: Reusable primitives stay narrowly named around accounts, listings,
  moderation, location, and media; no generic vehicle/developer/off-plan domain is introduced.

## Project Structure

### Documentation (this feature)

```text
specs/002-repair-mvp-foundation/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── api-contract.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/{auth,buyer,listings,admin}/
│   ├── config/
│   ├── database/{data-source.ts,migrations/}
│   ├── middleware/
│   ├── models/
│   ├── services/
│   └── utils/
└── tests/{contract,integration,unit}/

frontend/
├── src/
│   ├── components/{auth,filters,layout,listing,map,search,seller,admin}/
│   ├── hooks/
│   ├── pages/{auth,listings,seller,admin}/
│   ├── services/
│   ├── styles/
│   └── utils/
└── tests/{unit,integration}/

shared/
├── constants/
└── types/

tests/
└── e2e/{fixtures,pages,specs}/

infrastructure/
└── docker/{docker-compose.yml,database/}
```

**Structure Decision**: Preserve the existing three-workspace structure. Backend modules own all security,
privacy, ranking, moderation, and lifecycle rules; frontend code consumes sanitized contracts and owns
presentation/accessibility; shared contains transport-safe types and constants only. Cross-application
browser journeys live at root so they exercise the built system rather than one workspace in isolation.

## Delivery Sequence

1. Establish root tooling, explicit application modes, pinned local services, config validation, and
   migration/seed validation harnesses.
2. Reconcile schema/entity drift through migration 005 and one canonical entity registry.
3. Implement opaque seller/admin sessions, CSRF, authorization, participation, verification, and the
   append-only audit ledger through migration 006.
4. Implement listing privacy, Arabic area normalization, lifecycle/revisions, canonical property, duplicate
   review, and disputes through migration 007.
5. Implement durable saves/events, private media processing, contact intents, and public-safe contracts
   through migration 008.
6. Apply conservative legacy backfill/policy migration 009 and idempotent governed fixtures.
7. Repair the Next.js journeys for Arabic-default SSR, English switching, server sessions, public location
   unions, accessible list/map parity, participation labels, and seller/admin flows.
8. Add backend/frontend/browser evidence and wire the single `npm run validate` gate into CI.

Each sequence ends with its focused tests. No later phase may work around an earlier contract by adding
frontend-only policy or untracked schema synchronization.

## Complexity Tracking

No constitution violations require exceptions. Two deliberate complexities are retained inside the normal
design: provider adapters are necessary to combine account-free local validation with fail-closed
production, and append-only audit/canonical-property records are necessary to prove human moderation and
one-active-listing guarantees. Both are direct constitutional requirements, not speculative abstraction.
