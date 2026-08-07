# API Contract: Repair MVP Foundation

**Base path**: `/api/v1`  
**Representation**: JSON unless a successful contact resolver performs a redirect  
**Locales**: `ar` (default), `en`

This document fixes behavioral and privacy boundaries. Implementation DTOs may add non-sensitive fields
only when they do not weaken these rules. Standard errors contain `code`, localized `message`, optional
field errors, and `correlationId`; they never expose stack traces or protected values.

## Session and Request Rules

- Seller and admin login responses return subject/session state, never bearer tokens or session IDs.
- Server sets separately named opaque HttpOnly cookies. Unsafe methods require an allowed `Origin` and an
  `X-CSRF-Token` matching the CSRF cookie/value bound to the exact seller, admin, or anonymous cookie scope
  used by that request. A request with multiple scopes cannot substitute one scope's CSRF token for another.
- Authentication failure is `401`; authenticated but forbidden is `403`; stale `lockVersion` is `409`.
- Logout is idempotent and revokes the current session. Block, deactivation, admin recovery, and privileged
  role changes revoke all affected sessions.
- Mutating endpoints accept an `Idempotency-Key` where duplicate submission/contact/payment-like behavior
  would otherwise be harmful; repeated keys return the original compatible outcome.

## Authentication

| Method | Path                      | Access            | Contract                                                           |
| ------ | ------------------------- | ----------------- | ------------------------------------------------------------------ |
| POST   | `/auth/otp/requests`      | public            | `{phone, locale}`; rate-limited; neutral accepted response         |
| POST   | `/auth/otp/verifications` | public            | `{phone, code}`; sets seller session; returns `{seller}`           |
| GET    | `/auth/session`           | seller            | Current seller and effective participation/session expiry          |
| GET    | `/auth/csrf`              | seller            | Rotates/issues seller-scoped readable CSRF value; no session token |
| DELETE | `/auth/session`           | seller            | CSRF required; revokes seller session and clears cookies           |
| POST   | `/admin/sessions`         | public            | `{email,password,secondFactorCode}`; sets admin session            |
| GET    | `/admin/session`          | admin             | Current administrator/role/session expiry                          |
| GET    | `/admin/csrf`             | admin             | Rotates/issues admin-scoped readable CSRF value                    |
| DELETE | `/admin/session`          | admin             | CSRF required; revokes admin session and clears cookies            |
| GET    | `/anonymous/csrf`         | anonymous subject | Issues/binds anonymous cookie and separate readable CSRF value     |

Local mode accepts the documented fixed OTP through the adapter but never prints it. Admin second factor is
mandatory in every mode; local uses a documented fixture secret/account.

## Public Discovery

### `GET /areas`

Returns governed active Cairo areas: `{id,nameAr,nameEn}`. Query `q` applies reviewed Arabic/English
normalization and aliases. It does not use generic fuzzy matching.

### `GET /listings`

Allowed filters: `q`, `areaId`, `bbox`, `purpose`, `propertyType`, min/max price, min/max size, bedroom and
bathroom counts, amenities, seller participation, `ownersOnly`, cursor/page size. `bbox` operates only on
persisted `public_location`; `areaId` operates on the governed area.

Returns only approved, active, available Cairo residential listings. Ordering follows ranking version
`organic-v1`; response includes the ranking version but no hidden score. Page size is bounded.

### `GET /listings/{listingId}`

Returns public detail only while the listing remains eligible. Otherwise `404` prevents status inference.

### Public Listing Projection

Required fields include listing ID, localized title/description, purpose, residential property type, price,
size, bedrooms/bathrooms, amenities, governed area, approved media, freshness/availability date, and exactly
one participation label:

```json
{
  "sellerParticipation": "verified_owner | owner_not_verified | agent",
  "location": {
    "precision": "approximate",
    "lat": 30.044,
    "lng": 31.236,
    "label": "موقع تقريبي"
  }
}
```

or:

```json
{
  "location": {
    "precision": "area",
    "area": { "id": "uuid", "nameAr": "...", "nameEn": "..." }
  }
}
```

Forbidden public/SSR fields include exact coordinates/address, raw or encoded phone/email, identity or
ownership evidence, private seller/admin IDs, internal notes, session/CSRF values, scanner/storage keys,
duplicate signals, risk scores, and audit metadata. Public payloads may not provide a resolver URL until a
contact intent is accepted.

## Saves and Contact

| Method | Path                                     | Access                                  | Contract                                                                                                     |
| ------ | ---------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| GET    | `/saved-listings`                        | authenticated user or anonymous subject | Active saved public projections                                                                              |
| PUT    | `/saved-listings/{listingId}`            | same                                    | Idempotent save/reactivation; server resolves principal                                                      |
| DELETE | `/saved-listings/{listingId}`            | same                                    | Idempotent unsave                                                                                            |
| POST   | `/listings/{listingId}/views`            | same                                    | Records deduplicated eligible view; `204`                                                                    |
| POST   | `/listings/{listingId}/contact-intents`  | same                                    | `{method}`; verifies active listing/rate; records event; returns opaque short-lived `intentToken` and expiry |
| GET    | `/contact-intents/{intentToken}/resolve` | same browser/session                    | One-time/short-lived server redirect to accepted native destination                                          |

PUT/DELETE saves and POST view/contact-intent requests require the CSRF value for the principal scope the
server selects. Authenticated user scope takes precedence only with its matching CSRF token; otherwise the
request is rejected rather than silently falling back to anonymous scope.

The final intentional redirect necessarily reveals the destination to the user's device. It must never be
pre-rendered, returned by listing APIs, logged, or emitted to analytics. Invalid method, inactive listing,
expired token, principal mismatch, or rate rejection does not reveal the contact target.

## Seller Listing Lifecycle

| Method | Path                                              | Contract                                                                                                                                            |
| ------ | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/seller/listings`                                | Seller's private listings only                                                                                                                      |
| POST   | `/seller/listings`                                | Create draft with declaration/public-location consent; enforces rolling submission limits                                                           |
| GET    | `/seller/listings/{id}`                           | Own private listing, revisions, status/rejection message                                                                                            |
| PATCH  | `/seller/listings/{id}`                           | `{lockVersion,...changes}`; draft edits remain working state, while an active material edit atomically creates a revision and enters pending review |
| POST   | `/seller/listings/{id}/media`                     | Multipart source; quarantined/decoded/scanned/re-encoded before eligibility                                                                         |
| DELETE | `/seller/listings/{id}/media/{mediaId}`           | Own draft/revision media; CSRF; server evaluates materiality                                                                                        |
| POST   | `/seller/listings/{id}/submit`                    | Validates completeness/media/limits; creates immutable revision; moves to pending                                                                   |
| POST   | `/seller/listings/{id}/availability-confirmation` | Reconfirms unchanged active/expired listing; material changes require review                                                                        |
| POST   | `/seller/listings/{id}/mark-sold`                 | Active own listing to sold                                                                                                                          |
| POST   | `/seller/listings/{id}/withdraw`                  | Own nonterminal listing to inactive                                                                                                                 |
| GET    | `/seller/listings/{id}/metrics`                   | Counts from documented views, active saves, accepted contacts only                                                                                  |

Create/update inputs permit only Cairo area, `sale|long_term_rent`, supported residential types, validated
price/size/rooms/amenities, 3–10 media items, exact map selection, and `approximate|area_only` public consent.
Owner submission limit is 3 and agent limit is 2 per rolling 24 hours. First agent publication requires
the current participation declaration version to have a persisted moderator confirmation; a later
declaration change invalidates the earlier confirmation. The server—not the client—determines effective
participation and materiality.

## Administration and Moderation

All endpoints require an active admin session, second-factor-authenticated role, CSRF for unsafe methods,
explicit authorization, a reason where consequential, and append-only audit in the same transaction.

| Method | Path                                                   | Contract                                                                                                      |
| ------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| GET    | `/admin/review/listings`                               | Private queue with filters and pagination                                                                     |
| GET    | `/admin/review/listings/{id}`                          | Exact location, submitted revision, declaration, signals, media scan, history                                 |
| POST   | `/admin/review/listings/{id}/approve`                  | `{lockVersion,publicLocationMode,canonicalPropertyId,reason}`; activates only if all invariants hold          |
| POST   | `/admin/review/listings/{id}/reject`                   | `{lockVersion,reasonCode,messageAr,messageEn}`                                                                |
| POST   | `/admin/review/listings/{id}/unpublish`                | `{lockVersion,reason}`; removes public eligibility atomically                                                 |
| POST   | `/admin/sellers/{id}/participation-override`           | `{participation,reason}`; human-only, auditable                                                               |
| POST   | `/admin/sellers/{id}/suspension`                       | `{reason}`; revokes sessions and unpublishes/queues affected content by policy                                |
| DELETE | `/admin/sellers/{id}/suspension`                       | `{reason}`; does not auto-republish listings                                                                  |
| POST   | `/admin/verification-cases`                            | Starts evidence-controlled owner verification case                                                            |
| POST   | `/admin/verification-cases/{id}/evidence`              | Moderator-only multipart attachment of approved offline evidence; private, encrypted, scanned, access-audited |
| POST   | `/admin/verification-cases/{id}/decision`              | `{decision,reason,retentionHold?}`; human-only                                                                |
| GET    | `/admin/verification-cases/{id}/evidence/{evidenceId}` | Purpose-bound, access-audited, short-lived private read                                                       |
| POST   | `/admin/canonical-properties`                          | Creates moderator-owned canonical identity                                                                    |
| POST   | `/admin/canonical-properties/{id}/listings`            | Links candidate listing after review                                                                          |
| GET    | `/admin/duplicate-signals`                             | Explainable candidate signals; no autonomous outcome                                                          |
| POST   | `/admin/property-disputes`                             | Opens competing-claim dispute and removes affected public eligibility                                         |
| POST   | `/admin/property-disputes/{id}/resolve`                | Explicit human outcome/reason                                                                                 |
| GET    | `/admin/audit-events`                                  | Authorized filtered append-only history; protected values redacted                                            |

Moderators may change public location precision only from approximate to area-only, never toward greater
precision and never to exact. Approval generates/persists a stable public point once when approximate mode
is valid; bounded generation failure falls back to area-only.

## Lifecycle Worker Contract

Internal scheduled commands:

- warn listings once when current confirmation enters its final seven days;
- expire listings at 30 days without confirmation;
- delete verification evidence 30 days after decision unless a recorded hold applies;
- expire unresolved contact intent material;
- claim bounded rows with skip-locked semantics and append audit/notification events transactionally.

Workers are idempotent. Redis/scanner/security-provider outages fail closed for protected actions and expose
health status without secrets.

## Compatibility and Versioning

This repair intentionally replaces old bearer-token and exact-location contracts. Frontend and backend
land in the same release; stale clients receive explicit `401/409` or validation errors, never a silent
privacy downgrade. Any future public-field, ordering, normalization, or lifecycle change requires a named
contract/ranking/policy version and updated evidence.
