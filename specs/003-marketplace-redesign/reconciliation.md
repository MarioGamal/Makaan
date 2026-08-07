# Reconciliation Register

**Status**: In progress  
**Purpose**: Decide what unfinished feature-002 work is retained, simplified, or deferred before redesign
implementation proceeds.

| Area                                  | Current state                                                       | Release-one decision                                                 | Evidence required                              |
| ------------------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------- |
| Migrations 005–006                    | Live up/down/up validated; foundation tests pass                    | Keep                                                                 | Re-run after reconciliation                    |
| Migration 007 draft                   | Mixes needed location/lifecycle fields with canonical/dispute scope | Simplify                                                             | Up/down/up, entity parity, governed fixtures   |
| Migration 008 draft                   | Mixes needed saves/contact/media with broad event schema            | Simplify                                                             | Principal/TTL/media constraints and seed/reset |
| Public US2 tests                      | Useful privacy intent but authored far ahead of services            | Keep focused cases; prevent unrelated default-suite noise            | Each turns green with Phase C/D                |
| Buyer Playwright draft                | Broad 72-test matrix before routes/contracts exist                  | Keep scenarios; initially run a small Chromium Arabic/English subset | Phase C/D browser checkpoint                   |
| Legacy public serializer              | Returns entity-shaped fields and exact coordinates                  | Replace                                                              | Forbidden-field contract                       |
| Frontend map                          | Requires Mapbox token and dominates home layout                     | Replace local/test path; retain production adapter boundary          | Token-free local and failure fallback          |
| Saves                                 | Browser localStorage IDs                                            | Replace with anonymous server membership                             | Reload/concurrency tests                       |
| Seller/admin auth UI                  | Legacy bearer/localStorage assumptions remain                       | Replace with scoped cookie/CSRF clients                              | Storage-negative browser checks                |
| Canonical/dispute/evidence operations | Partially designed; no complete browser journey                     | Defer operational UI/services after release one                      | Post-release backlog                           |

## Migration 007 decision

### Keep for release one

- Governed area normalized keys, reviewed aliases, active/order metadata.
- `sale|long_term_rent` purpose and the release-one listing lifecycle statuses.
- `exact_location`, seller public-precision consent, approved precision, stable approximate point or
  area-only presentation, availability, lock version, and moderator provenance.
- Bilingual title/description, amenities, private address storage, and seller working fields.
- Immutable submitted listing revisions needed for reject/correct/approve behavior.
- Geography constraints ensuring exact/approximate points stay within the governed Cairo area and public
  approximate points differ from exact coordinates.

### Simplify or defer

- Remove canonical property, duplicate signal, and property dispute tables from migration 007; they belong
  to the post-release operations migration.
- Remove canonical identity as an activation prerequisite. Release one still requires human duplicate
  screening and audited approval but does not pretend the deferred canonical workbench is functional.
- Keep active eligibility focused on approved revision, moderator provenance, valid availability, and
  approved public precision.

## Migration 008 decision

### Keep for release one

- Exactly-one-principal saved membership with partial active uniqueness and deactivation history.
- Privacy-minimal deduplicated listing views where needed for displayed metrics.
- Scoped contact intents with accepted/rejected rate decision, hashed opaque resolver, expiry, one-time
  resolution, and no destination column.
- Accepted contact event and protected listing-media metadata required by public/seller journeys.

### Simplify or defer

- Retain only events displayed as release-one seller metrics; do not build a general analytics platform.
- Legacy `views`/`inquiries` compatibility is removed only after new services and metrics are live.
- Retention/warehouse/event-export infrastructure is post-release.

## Test disposition

- Migration, clean setup, session, provider, unit, and build tests remain required and green throughout.
- Public discovery, saves/contact, and buyer Playwright drafts are retained as pending contract assets but
  excluded from the default green suite until their corresponding Phase C/D implementation begins.
- When a phase starts, its pending tests are enabled first, observed red for the missing behavior, then made
  green before the browser checkpoint is accepted.

## Route and authentication disposition

- `/api/v1` is the only release-one API base.
- New cookie-session/CSRF authentication controllers are retained.
- Legacy JWT guards, bearer-returning clients, seller/admin localStorage authentication, browser-only save
  IDs, direct contact URLs, and exact-coordinate public serializers are compatibility debt scheduled for
  removal as soon as their replacement vertical slice lands; none may survive T049.
