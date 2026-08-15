# Feature Specification: Arabic-first Marketplace Redesign

**Feature Branch**: `003-marketplace-redesign`  
**Created**: 2026-08-07  
**Status**: Approved for planning  
**Depends on**: `002-repair-mvp-foundation` completed foundation tasks T001–T034

## Objective

Turn Makaan from a technically repaired but basic application into a coherent, modern, functional Cairo
residential marketplace. Release one must let a buyer discover and contact listings, an owner or clearly
labelled agent submit a listing, and a moderator approve or reject it through complete Arabic-first browser
journeys. The product must feel credible enough for real stakeholder review, not like disconnected demo
screens.

## Release-one product boundary

### Included

- Cairo residential properties for sale and long-term rent.
- Arabic RTL as the default experience and complete English LTR switching.
- Responsive public home, search/filter results, list/map presentation, property detail, saved listings,
  and intentional phone/WhatsApp contact handoff.
- Three unambiguous public participation labels: verified owner, owner not verified, and declared agent.
- Owner/agent OTP sign-in, participation declaration, listing draft, media, exact private location, public
  precision choice, submission, status tracking, correction, sold, and withdrawn states.
- Second-factor moderator sign-in, review queue/detail, exact-versus-public location review, participation
  confirmation, approve/reject/unpublish, and clear bilingual feedback.
- Deterministic Cairo fixtures and account-free local providers so every release-one journey works locally.
- Accessibility, loading/error/empty states, privacy-safe public projections, and clean reset validation.

### Deferred until after the release-one checkpoint

- Full canonical-property operations, dispute workflows, explainable duplicate-signal workbenches, and
  self-service ownership-evidence case management.
- Paid placement, subscriptions, chat, payments, neighbourhood editorial content, comparisons, and
  recommendation models.
- Other governorates, commercial/short-stay/off-plan/developer inventory, and vehicles.
- Native applications and production-scale operational automation beyond what release-one journeys need.

Deferral does not permit unsafe public data, bearer-token storage, autonomous moderation, or unlabeled
agents. Those remain release-one boundaries.

## Experience direction

Makaan should feel trustworthy, calm, local, and contemporary rather than luxurious or corporate. The
visual language uses warm neutral surfaces inspired by Cairo stone, deep green/teal trust accents, strong
Arabic typography, restrained elevation, large property imagery, clear price hierarchy, and generous
mobile touch targets. The map supports discovery but never becomes the only way to understand results.

The approved second-pass reference is Foreal by Stacy More on the Framer Marketplace. Makaan may draw from
its immersive architectural photography, oversized editorial type, rounded framing, restrained navigation,
and image-led listing rhythm, but must not copy its brand, composition, assets, or agency positioning. The
adaptation remains an owner-first Cairo marketplace: functional area/purpose search is prominent in the hero,
trust and participation labels stay explicit, Arabic typography is designed rather than mirrored, and ordinary
residential inventory must feel as credible as premium homes.

Typography uses self-hosted Inter Tight for English and IBM Plex Sans Arabic for Arabic. Display hierarchy
comes from scale, spacing, and a restrained 400–500 weight range; 600 is reserved for exceptional emphasis.
Arabic display sizes and line heights are tuned independently to avoid dense, oversized blocks.

### Global experience requirements

- A consistent responsive header, locale switcher, saved-listing access, seller entry point, and footer.
- A tokenized visual system for color, typography, spacing, radius, elevation, focus, motion, and states.
- Mobile-first layouts at 375 px and composed desktop layouts at 1440 px without horizontal overflow.
- Arabic is server-rendered with `lang="ar"` and `dir="rtl"`; English uses `lang="en"` and `dir="ltr"`.
- Locale changes preserve the current route, listing, search parameters, and authentication state.
- WCAG 2.2 AA keyboard/focus/contrast semantics; required controls are at least 44×44 CSS pixels.
- Skeleton, empty, error, retry, offline/map-unavailable, success, and validation states use one shared
  pattern and never rely on color alone.

## User stories

### US1 — Enter and understand Makaan

A visitor opens Makaan and immediately understands that it is an owner-first Cairo residential
marketplace, can switch language, search an area, select sale or long-term rent, and browse featured or
recent approved properties.

**Acceptance**:

1. `/` renders Arabic RTL by default without a client-direction flash.
2. The primary search clearly captures area and transaction purpose.
3. Navigation, search, trust explanation, property content, and footer form one polished responsive page.
4. English switching retains the current route and search state.

### US2 — Discover suitable public properties

A buyer searches governed Cairo areas, applies useful residential filters, switches between list and map,
and opens only eligible approved listings without receiving exact private locations or seller contact data.

**Acceptance**:

1. Filters cover purpose, area, residential type, price, size, rooms, and owner/agent participation.
2. Cards show meaningful bilingual content, price, area, core facts, approved image, freshness, and exactly
   one participation label.
3. List and map represent the same result set; an area-only listing remains usable without a pin.
4. Public APIs and server-rendered markup omit exact coordinates/address, raw contacts, private IDs,
   moderation notes, sessions, storage keys, and internal scores.
5. Loading, no-results, API failure, and map failure preserve usable list discovery.
6. Valid filters and deterministic sort are reflected in the URL; reset, reload, browser back, and shared
   links reproduce the same result set. Invalid or unsupported query values are safely ignored with a
   recoverable user-facing state.
7. Results support bounded pagination or load-more without duplicating cards or changing earlier organic
   ordering.

### US3 — Inspect, save, and contact

A buyer opens a complete property detail, reviews the approved media and facts, saves it durably in the
same browser, and intentionally initiates phone or WhatsApp contact.

**Acceptance**:

1. Detail pages return 404 for every non-public state and expose only an approved public projection.
2. Anonymous saves survive reload, are idempotent, can be removed, and do not require authentication.
3. Contact requires an explicit action, records only accepted intent, and uses an opaque short-lived
   resolver; raw destinations never appear in listing payloads, markup, logs, or analytics.
4. The final native handoff may reveal the destination only to the requesting browser.

### US4 — Submit and manage a property

An owner or declared agent signs in using the local/test OTP journey, creates an Arabic residential
listing, adds compliant media, chooses an exact private location and public precision, submits it, and
tracks the moderation outcome.

**Acceptance**:

1. Login establishes an opaque cookie session and stores no bearer token in browser storage.
2. A draft can be saved and resumed; submission requires complete property data, 3–10 valid images,
   participation declaration, Cairo location, and public-location consent.
3. Submitted content remains private until moderator approval.
4. Dashboard statuses and moderator feedback are understandable in Arabic and English.
5. The seller can correct rejected content and can mark active content sold or withdrawn.
6. Agent participation is explicit and more strictly moderated; changing declaration invalidates earlier
   confirmation.
7. Arabic title and description are required. English title and description are optional and public
   English pages visibly fall back to the Arabic content when absent.
8. OTP resend/countdown, expired sessions, upload retry/reorder/delete, listing preview, edit, and resubmit
   are complete states rather than dead ends.

### US5 — Moderate marketplace supply

A second-factor-authenticated moderator reviews submitted listings and seller participation, compares exact
private versus approved public location, and makes a reasoned human approve or reject decision.

**Acceptance**:

1. Admin credentials and second factor establish a separate opaque admin session.
2. Queue and detail are private, paginated, and usable on desktop and mobile.
3. Approval requires complete data, clean media, public precision, participation outcome, and a reason.
4. Rejection uses a localized preset reason plus an optional seller-facing note; every approve/reject
   decision also retains a private internal reason. Approval publishes the safe projection immediately.
5. Moderation decisions are atomic and audited; blocking/suspension revokes relevant sessions.

### US6 — Reproduce and verify release one

A contributor can reset to governed fixtures, start the application, and complete the visitor, seller, and
moderator journeys with no paid accounts.

**Acceptance**:

1. One documented setup works from a clean clone.
2. One browser journey proves submit → review → approve → public discovery.
3. Lint, typecheck, builds, focused backend/frontend tests, and primary Playwright projects pass.
4. Known post-release work is recorded without leaving release-one routes partially implemented.

## Functional requirements

- **FR-001** Arabic is the default SSR locale and English is complete.
- **FR-002** The public marketplace returns Cairo residential sale/long-term-rent listings only.
- **FR-003** Search and detail use an explicit allowlisted public listing projection.
- **FR-004** Public location is approved approximate or area-only and never exact.
- **FR-005** Each public listing has exactly one owner/agent participation label.
- **FR-006** Anonymous saves are server-backed, idempotent, and scoped to an opaque anonymous subject.
- **FR-007** Contact destinations are resolved only after an accepted, scoped, expiring intent.
- **FR-008** Seller and admin browser authentication uses scoped opaque cookies and CSRF protection.
- **FR-009** Listing drafts, submissions, decisions, and terminal seller actions are persisted.
- **FR-010** Moderator approval/rejection is human, reasoned, atomic, and audited.
- **FR-011** Local fixtures exercise owner, agent, pending, rejected, and approved outcomes.
- **FR-012** The production UI uses a shared design system and shared asynchronous-state components.
- **FR-013** Primary journeys meet the stated responsive and accessibility requirements.
- **FR-014** Search filters, presentation, pagination, and deterministic sort are URL-backed and validated.
- **FR-015** Seller Arabic content is required; English content is optional with an explicit Arabic-only
  fallback in the English experience.

## Success criteria

- **SC-001** A clean local reset yields a usable Arabic marketplace with at least one approved owner and
  one clearly labelled agent listing.
- **SC-002** A product reviewer can complete search → detail → save → contact without developer tools.
- **SC-003** A reviewer can complete seller sign-in → draft → submit → admin review → approval → public
  discovery without database edits.
- **SC-004** Automated scans find no exact private location, raw contact, credential, or privileged token in
  public responses, rendered markup, browser storage, or application logs.
- **SC-005** Primary mobile and desktop Arabic/English browser journeys pass with no serious axe violation.
- **SC-006** Production builds, lint, typecheck, migration validation, seed/reset, and focused tests pass.
