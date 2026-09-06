# Release-one API Contract

**Base path**: `/api/v1`  
**Locales**: `ar` (default), `en`  
**Content type**: `application/json` except media upload and native contact handoff

This contract freezes the browser-facing shapes for release one. Controllers return explicit transport
objects and never serialize database entities. Unknown request fields and invalid enum/query values receive
`400 VALIDATION_ERROR`; they are not silently passed to queries.

## Shared conventions

### Errors

```ts
type ApiError = {
  code:
    | 'VALIDATION_ERROR'
    | 'UNAUTHENTICATED'
    | 'FORBIDDEN'
    | 'NOT_FOUND'
    | 'CONFLICT'
    | 'RATE_LIMITED'
    | 'SESSION_EXPIRED'
    | 'CSRF_INVALID'
    | 'MEDIA_INVALID'
    | 'INTERNAL_ERROR';
  message: string;
  correlationId: string;
  fields?: Record<string, string>;
  retryAfterSeconds?: number;
};
```

Errors use the matching HTTP status. `404` is used for missing listings and every listing that is not
publicly eligible. Error messages are localized from `Accept-Language`; `code` remains stable.

### Pagination and ordering

```ts
type Page<T> = { items: T[]; page: number; pageSize: number; total: number; hasMore: boolean };
```

`page` starts at 1. `pageSize` defaults to 20 and is capped at 40. Public ordering is deterministic with
`listing.id` as the final tie-breaker. Supported public sorts are `newest` (default), `price_asc`, and
`price_desc`. Moderator queues use `submitted_oldest` by default.

### Sessions and CSRF

- Seller and admin sessions use separate opaque `HttpOnly`, production-`Secure`, `SameSite=Lax` cookies.
- Browser requests use `credentials: include`. Mutations additionally send `X-CSRF-Token`, issued by the
  matching session/bootstrap response. No endpoint returns a bearer token.
- Anonymous save/contact mutations use the anonymous subject cookie and anonymous CSRF token.
- Seller, admin, and anonymous cookies are not interchangeable. Expired sessions return
  `401 SESSION_EXPIRED`.

## Public marketplace

### Governed areas

`GET /areas?q=<text>&locale=ar|en`

Returns at most 12 active governed Cairo areas after normalized canonical-name and reviewed-alias matching.

```ts
type PublicArea = { id: string; nameAr: string; nameEn: string };
type AreaSearchResponse = { items: PublicArea[] };
```

### Search

`GET /listings`

Supported query fields: `locale`, `purpose`, repeated `areaId`, repeated `propertyType`, `priceMin`,
`priceMax`, `sizeMin`, `sizeMax`, `bedroomsMin`, `participation`, `bbox`, `sort`, `page`, and `pageSize`.
`purpose` is `sale|long_term_rent`; `participation` is
`verified_owner|owner_not_verified|declared_agent`. A bbox is `west,south,east,north`, is bounded to Cairo,
and filters approved approximate points only. Area-only listings remain in the area-filter result set but
are not invented as map pins.

```ts
type PublicLocation =
  | { mode: 'approximate'; latitude: number; longitude: number; radiusMeters: number }
  | { mode: 'area_only' };

type PublicListingCard = {
  id: string;
  purpose: 'sale' | 'long_term_rent';
  propertyType: string;
  priceEgp: number;
  sizeSqm: number;
  bedrooms: number;
  bathrooms: number;
  title: string;
  titleSourceLocale: 'ar' | 'en';
  area: PublicArea;
  participation: 'verified_owner' | 'owner_not_verified' | 'declared_agent';
  publicLocation: PublicLocation;
  coverImage: { url: string; width: number; height: number; alt: string } | null;
  publishedAt: string;
  availabilityConfirmedAt: string;
  saved: boolean;
};

type PublicListingSearchResponse = Page<PublicListingCard> & {
  applied: Record<string, string | string[] | number>;
  sort: 'newest' | 'price_asc' | 'price_desc';
};
```

### Detail

`GET /listings/:listingId?locale=ar|en`

Returns `PublicListingDetail`, which extends the card with localized description and its source locale,
finishing level, floor, amenities, ordered approved media, and safe related cards. It never includes seller
or admin IDs, exact/private address or coordinates, raw contact data, moderation notes, revision snapshots,
session/storage keys, scan metadata, or internal scores.

## Anonymous bootstrap, saves, and contact

- `POST /anonymous/session` → `{ csrfToken: string; expiresAt: string }`
- `GET /saved-listings` → `{ items: PublicListingCard[] }`
- `PUT /saved-listings/:listingId` → `{ saved: true }` (idempotent)
- `DELETE /saved-listings/:listingId` → `{ saved: false }` (idempotent)
- `POST /listings/:listingId/contact-intents` with
  `{ channel: 'phone' | 'whatsapp' }` → `201 { token: string; expiresAt: string }`
- `GET /contact-intents/:token/resolve` consumes the scoped single-use intent and responds with a short
  native redirect. Expired, reused, principal-mismatched, rejected, or ineligible intents never reveal the
  destination and do not increment accepted contact metrics.

## Assistant

`POST /assistant/messages` with `{ message: string; locale?: 'ar'|'en'; context?: AssistantFilters }`
→ `200 AssistantMessageResponse`

Uses the anonymous subject cookie and anonymous CSRF token, and is rate limited separately from
browsing. `message` is capped at 500 characters. `context` echoes `filters` from the previous reply so
follow-up questions keep the established purpose, area, and budget.

```ts
type AssistantIntent = 'search' | 'faq' | 'greeting' | 'help' | 'privacy_boundary' | 'out_of_scope';

type AssistantRelaxation =
  | { kind: 'price_ceiling_raised'; from: number; to: number }
  | { kind: 'price_ceiling_dropped'; from: number }
  | { kind: 'bedrooms_lowered'; from: number; to: number }
  | { kind: 'property_type_dropped'; from: string }
  | { kind: 'participation_dropped' }
  | { kind: 'size_dropped' }
  | { kind: 'area_dropped'; from: string };

type AssistantMessageResponse = {
  messageId: string;
  locale: 'ar' | 'en';
  intent: AssistantIntent;
  reply: string;
  generated: true;
  provider: string;
  listings: PublicListingCard[];
  totalMatches: number;
  filters: AssistantFilters;
  relaxations: AssistantRelaxation[];
  browseQuery: string;
  suggestions: string[];
  topics: string[];
};
```

Assistant invariants:

1. `listings` is produced by the same public search projection as `GET /listings`. The assistant has no
   other read path, so exact locations, seller contacts, and moderation data cannot reach a reply.
2. `AssistantFilters` mirrors the public search filters exactly; a question can never widen what is
   readable beyond what a visitor could select by hand.
3. `generated` is always `true` and interfaces must label the reply as machine generated.
4. When a search returns nothing, constraints are loosened one at a time and every loosened constraint
   is reported in `relaxations`. `purpose` is never relaxed.
5. A request for an exact address or a seller's contact returns `intent: 'privacy_boundary'` and no
   listings.

## Seller

### Authentication

- `POST /auth/otp/requests` with `{ phone: string }` → `{ accepted: true }`
- `POST /auth/otp/verifications` with `{ phone, code }` → `{ seller: SellerSessionUser }` plus seller cookie
- `GET /auth/session` → `{ seller, expiresAt }`
- `GET /auth/csrf` rotates the seller CSRF cookie and returns `{ csrfToken }`
- `DELETE /auth/session` → `204`

`SellerSessionUser` exposes only `{ id, role: 'seller', participation, createdAt }`.

### Listings

- `GET /seller/listings?page&pageSize&status` → `Page<SellerListingSummary>`
- `POST /seller/listings` → draft
- `GET /seller/listings/:id` → seller-owned editable detail
- `PATCH /seller/listings/:id` with `If-Match: <lockVersion>` → updated draft/rejected listing
- `POST /seller/listings/:id/submit` with `If-Match` → immutable revision and `pending_review`
- `POST /seller/listings/:id/withdraw` with `If-Match` → `inactive`
- `POST /seller/listings/:id/mark-sold` with `If-Match` → `sold`

Arabic title/description, residential facts, Cairo area, exact private point, public-precision consent,
participation declaration, and 3–10 clean ordered media are required for submission. English copy is
optional. A rejected listing is editable and may be resubmitted. Status values are `draft`,
`pending_review`, `active`, `rejected`, `sold`, `inactive`, and `expired`.

### Media

- `POST /seller/listings/:id/media` multipart upload → `SellerMedia`
- `PATCH /seller/listings/:id/media/order` with `{ mediaIds: string[] }` → ordered media
- `DELETE /seller/listings/:id/media/:mediaId` → `204`

`SellerMedia` includes `{ id, previewUrl, width, height, displayOrder, state }`. It never returns the private
storage key or original provider URL. Accepted formats, sizes, and dimensions are supplied in validation
errors and the UI supports retry.

## Moderator

### Authentication

- `POST /admin/sessions` with `{ email, password, secondFactorCode }` →
  `{ administrator }` plus separate admin cookie
- `GET /admin/session` → `{ administrator, expiresAt }`
- `GET /admin/csrf` rotates the admin CSRF cookie and returns `{ csrfToken }`
- `DELETE /admin/session` → `{ success: true }`

### Queue and decisions

- `GET /admin/listings?status=pending_review&page&pageSize&participation` →
  `Page<ModerationQueueItem>`
- `GET /admin/listings/:id` → private review detail with seller facts, exact and proposed public location,
  ordered media, revision, declaration, and decision history
- `POST /admin/listings/:id/approve` with
  `{ lockVersion, approvedPublicLocation, participationOutcome, internalReason }`
- `POST /admin/listings/:id/reject` with
  `{ lockVersion, reasonCode, sellerNote?, internalReason }`
- `POST /admin/listings/:id/unpublish` with `{ lockVersion, reasonCode, internalReason }`

Rejection reason codes are localized presets: `incomplete_data`, `inaccurate_location`, `media_issue`,
`participation_unconfirmed`, `duplicate`, and `spam_scam`. Decisions are atomic, audited, and return
`409 CONFLICT` on stale `lockVersion`. Blocking/suspension invalidates affected sessions.

## Contract invariants

1. Public records are Cairo residential, approved, available, unexpired, and owned by an eligible seller.
2. Exact location and contact destination never enter public JSON, SSR HTML, analytics metadata, or logs.
3. List and map consume the same search response; map failure does not trigger a different query.
4. Saves have exactly one principal and idempotent active membership semantics.
5. Contact metrics count accepted intents only.
6. All seller/admin mutations require the matching session, ownership/role authorization, and CSRF token.
7. Approval/rejection uses the submitted immutable revision and optimistic lock version in one transaction.
