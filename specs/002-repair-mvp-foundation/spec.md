# Feature Specification: Repair MVP Foundation

**Feature Branch**: `002-repair-mvp-foundation`  
**Created**: 2026-07-20  
**Status**: Ready for Planning  
**Input**: Repair the existing Makaan MVP so it can be set up from a clean environment and its existing
buyer, seller, and admin journeys operate securely, consistently, and with repeatable evidence.

## Product Fit and Scope _(mandatory)_

**Constitution alignment**: This feature restores the existing MVP to the Makaan Constitution v2.0.0
baseline. It preserves Cairo residential sale and long-term rent, owner-first participation with clearly
labelled agents, accurate internal location data with protected public precision, manual publication,
Arabic RTL as the default experience, complete English LTR behavior, and evidence-backed completion.

**In scope**:

- A single accurate clean-environment setup path for application dependencies and local services.
- Reversible, complete data-schema evolution that matches the application data model.
- Realistic bilingual Cairo areas and residential demonstration listings that require no paid provider.
- Repair of the existing buyer browse, save, contact, seller, and admin moderation journeys.
- Secure session handling, authorization, public location protection, rate limits, and upload safeguards
  already required by the governing product rules.
- Consistent anonymous saved-listing tracking so displayed seller analytics reflect actual saves.
- Automated contract, integration, browser, migration, localization, accessibility, and security-negative
  evidence for the repaired journeys.
- Accurate contributor documentation and continuous validation from a clean state.

**Out of scope**:

- Marketplace UI redesign, new branding, or a new component design system.
- Self-service document upload, automated ownership verification, or a full verification operations
  workflow. This repair supports a manually assigned verified-owner state based on approved offline
  evidence so public labels comply with the constitution; the richer workflow is deferred.
- New property attributes, amenities, payment plans, neighbourhood guides, or comparison tools.
- New governorates, short-term rent, commercial property, off-plan inventory, developer projects, or cars.
- Paid placement, subscriptions, monetization, or new ranking products.
- Native mobile applications or in-app buyer/seller chat.

## Localization, Accessibility, Trust, and Privacy _(mandatory)_

- **Arabic RTL**: Arabic is the default locale for all repaired public, seller, authentication, and admin
  screens. Existing controls, statuses, validation errors, moderation reasons, empty states, and local
  demonstration data MUST have reviewed Arabic text and correct RTL direction.
- **English LTR**: Users MUST be able to switch to a complete English equivalent without losing their
  current journey, selected filters, or authenticated state.
- **Accessibility**: Repaired journeys MUST meet WCAG 2.2 AA for keyboard operation, visible focus,
  semantic names, status announcements, contrast, reduced motion, and 200% zoom. Required mobile controls
  MUST have at least a 44×44 CSS-pixel target. Map-only information MUST have a list-based equivalent.
- **Trust signals**: Existing generic seller verification MUST not imply ownership verification. Public
  seller labels are verified owner, self-declared owner (not verified), and declared agent. Under-review
  accounts and listings remain private. Agents remain filterable and subject to stricter moderation.
- **Location/privacy**: Sellers and authorized moderators can access the submitted exact pin. Anonymous
  and buyer-facing responses MUST obey the seller's approved public-precision consent: a stable approximate
  pin suitable for neighbourhood discovery or a more-private area-only result. Exact public precision is
  unavailable in the first release.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Start Makaan From a Clean Environment (Priority: P1)

A contributor can clone the repository, follow one current guide, start all required local services,
prepare the database, load representative Cairo data, and open a working application without discovering
missing scripts, undocumented manual steps, conflicting ports, or required paid accounts.

**Why this priority**: No other repaired journey is trustworthy or delegable until every contributor and
validation environment can reproduce the same starting state.

**Independent Test**: Begin with no application dependencies, database volume, cache state, or private
provider credentials; follow only the documented path and verify the health check, Arabic homepage,
English switch, seeded search results, seller test login, and admin test login.

**Acceptance Scenarios**:

1. **Given** a supported clean development machine, **When** the contributor follows the quickstart,
   **Then** all required dependencies and local services become ready without undocumented intervention.
2. **Given** an empty database, **When** all schema changes and seed operations run, **Then** the current
   schema is created once, representative bilingual Cairo areas and listings are loaded, and rerunning the
   documented idempotent operations does not corrupt or duplicate data.
3. **Given** no paid SMS, media-storage, or map-provider credentials, **When** local mode is started,
   **Then** documented local substitutes allow every primary journey to be exercised without sending
   real messages or uploading private data externally.
4. **Given** a fully prepared local environment, **When** the documented reset path is used, **Then** the
   application can return to a known empty or demonstration state without deleting unrelated data.

---

### User Story 2 - Browse, Save, and Contact Active Listings Reliably (Priority: P1)

An anonymous buyer can browse active approved Cairo residential listings in Arabic or English, use area
and map discovery, filter owner and agent results, open a complete listing, save it, and initiate a direct
contact action without seeing private seller data or an exact private-unit location.

**Why this priority**: Buyer discovery is the core marketplace value and exercises the schema, seeded
geography, public contracts, privacy boundary, analytics, and localization together.

**Independent Test**: Starting with demonstration data, search a bilingual Cairo area, apply sale/rent and
owners-only filters, select a result from list and map views, save it, reload the browser, open its detail,
and initiate WhatsApp and call actions while inspecting public responses for protected fields.

**Acceptance Scenarios**:

1. **Given** approved owner and agent listings in the current map area, **When** the buyer enables owners
   only, **Then** only declared-owner results remain and each displayed seller label is unambiguous.
   Cards and details distinguish verified owner from self-declared owner not verified; selecting agents
   only returns listings clearly labelled agent.
2. **Given** a public search or detail request, **When** listing data is returned, **Then** it contains a
   stable approved approximate location or area-only location and contains no phone number, exact private
   pin, identity evidence, session token, or internal moderation signal.
3. **Given** an anonymous buyer saves a listing, **When** they reload or visit saved listings in the same
   browser, **Then** the save persists, remains removable, and contributes exactly once to seller save
   analytics.
4. **Given** an active listing, **When** the buyer initiates call or WhatsApp contact within allowed usage,
   **Then** the action is recorded once and the browser receives a safe contact intent without rendering
   the raw phone number in public page content.
5. **Given** an inactive, rejected, pending, sold, or unknown listing, **When** a buyer searches, requests,
   saves, or contacts it, **Then** it is not disclosed as an available public property.
6. **Given** Arabic and English area-name variants, **When** the buyer searches either variant, **Then**
   the same governed Cairo area can be selected and the map/list results agree.
7. **Given** Arabic input containing diacritics, tatweel, common Alef/Ya variants, or an approved Cairo-area
   alias, **When** the buyer searches, **Then** it resolves to the same governed area as its canonical name.
8. **Given** an active listing approaching 30 days since its latest availability confirmation, **When**
   the owner or agent does not reconfirm it by the deadline, **Then** it expires from public discovery and
   its seller dashboard explains how to reconfirm or update it.
9. **Given** multiple otherwise-eligible results, **When** the buyer views the default organic order,
   **Then** ordering is deterministic and uses only the declared relevance, geographic fit, completeness,
   verification, freshness, policy-compliance, and owner-priority inputs.

---

### User Story 3 - Complete the Seller Listing Lifecycle (Priority: P1)

An individual owner or declared agent can authenticate in local validation, create a structured Cairo
residential listing with photos and an exact pin, submit it for human review, see its status and real
engagement metrics, respond to rejection, and mark an approved listing sold or inactive.

**Why this priority**: Marketplace supply and data quality depend on a reliable private seller lifecycle;
the current implementation cannot be trusted while its schema and analytics are disconnected.

**Independent Test**: Authenticate with the documented local OTP, declare a seller type, create and submit
a listing with the minimum valid media, approve or reject it through the admin journey, return to the
seller dashboard, edit and resubmit if rejected, then mark an active sale listing sold.

**Acceptance Scenarios**:

1. **Given** a valid Egyptian phone number in local validation mode, **When** the seller requests and
   verifies an OTP within the allowed limits, **Then** a secure session is established without placing a
   privileged token in browser storage or logs.
2. **Given** a seller creating a listing, **When** any required property field, exact Cairo location, or
   minimum valid photo set is missing, **Then** submission is blocked with localized field-level feedback.
3. **Given** a complete listing, **When** the seller submits it, **Then** it remains private in the pending
   state until an authorized moderator decides it.
4. **Given** a rejected listing, **When** the seller reads its localized reason, corrects it, and resubmits,
   **Then** prior moderation history remains auditable and the listing returns to pending.
5. **Given** buyer views, unique saves, and contact actions, **When** the seller opens the dashboard,
   **Then** the displayed counts match recorded events and do not count duplicate anonymous saves.
6. **Given** an active sale or rent listing owned by the authenticated seller, **When** it is marked sold
   or inactive as allowed, **Then** it immediately leaves public discovery and the transition is recorded.
7. **Given** an agent declaration or suspicious undeclared commercial behavior, **When** the account is
   reviewed, **Then** agent status is clearly represented and no automated signal alone blocks the user.
8. **Given** an active listing, **When** its seller changes price, exact location, seller declaration,
   purpose, property type, size, bedrooms, or bathrooms, **Then** the edit is audited, the prior public
   version is removed, and the changed listing returns to pending moderation.
9. **Given** an active listing with no material changes, **When** its seller reconfirms availability before
   or after expiry, **Then** its 30-day confirmation period restarts and the action is audited.
10. **Given** a seller submitting or editing location visibility, **When** they consent to an approximate
    pin or choose area-only privacy, **Then** the moderator can see that choice, may require the more-private
    option, and cannot approve a less-private setting than the seller selected.

---

### User Story 4 - Moderate Listings and Accounts Securely (Priority: P2)

An authorized administrator can sign in with strong authentication, review pending listings with exact
locations and duplicate evidence, approve or reject them, unpublish active listings, and suspend abusive
accounts while all actions remain auditable and inaccessible to ordinary users.

**Why this priority**: Manual moderation is constitutionally required before publication, but it depends
on the repaired listing and authentication foundations.

**Independent Test**: Sign in using documented local admin credentials plus a second factor; review a
pending owner listing and a potential duplicate, reject one with a localized reason, approve the other,
unpublish it, and verify that a seller session cannot invoke any of those actions.

**Acceptance Scenarios**:

1. **Given** valid admin credentials without a valid second factor, **When** login is attempted, **Then**
   no privileged session is issued and the failed attempt contributes to abuse protection.
2. **Given** an authenticated seller or anonymous user, **When** any admin operation or private moderation
   data is requested, **Then** access is denied without revealing whether sensitive targets exist.
3. **Given** a pending listing, **When** an admin reviews it, **Then** exact location, seller declaration,
   submitted data, media, history, and explainable duplicate evidence are available privately.
4. **Given** an approval, rejection, unpublication, seller-type override, or suspension, **When** the action
   succeeds, **Then** actor, target, prior state, resulting state, reason, and timestamp are recorded.
5. **Given** a blocked or logged-out admin, **When** a previously issued session is reused, **Then** the
   operation is denied.
6. **Given** two submissions that may represent the same physical property and transaction, **When** the
   moderator confirms the match or receives competing ownership claims, **Then** at most one can become
   active and the others remain privately held for an explicit reject, merge-reference, or dispute action.
7. **Given** an administrator who loses the configured second factor, **When** authorized recovery occurs,
   **Then** a new factor can be provisioned out of band, all prior admin sessions are revoked, and the
   recovery is audited without revealing the factor secret.
8. **Given** a self-declared owner and approved offline ownership evidence, **When** a moderator assigns
   verified-owner status, **Then** the precise badge meaning becomes public, evidence access is audited,
   and removing the status later preserves the prior decision history.

---

### User Story 5 - Prove Release Readiness Continuously (Priority: P1)

A maintainer can run one documented validation command locally and in continuous integration to receive
clear evidence that contracts, schema evolution, primary journeys, localization directions, and security
boundaries remain intact.

**Why this priority**: The feature is specifically intended to replace unsupported completion claims with
repeatable evidence and prevent the foundation from drifting again.

**Independent Test**: Introduce a controlled violation in a temporary validation run—such as exposing an
exact pin, omitting a migration-created table, breaking RTL direction, or allowing seller access to an
admin operation—and verify that the appropriate suite fails with an actionable message.

**Acceptance Scenarios**:

1. **Given** the repository at a candidate revision, **When** the standard validation command runs,
   **Then** formatting, static checks, builds, schema tests, automated journeys, and security checks run in
   a deterministic order and produce a non-zero result for any failure.
2. **Given** a newly created empty database, **When** schema validation runs forward, backward where safe,
   and forward again, **Then** the resulting schema matches the current data model without manual repair.
3. **Given** the primary browser journeys, **When** they run in Arabic RTL and English LTR at mobile and
   desktop sizes, **Then** direction, navigation, state preservation, and required accessible names pass.
4. **Given** a validation failure, **When** a contributor reads the output, **Then** the failing journey or
   contract and the reproduction command are identifiable without inspecting CI internals.

### Edge Cases

- An interrupted schema operation must leave a recoverable state and produce an actionable failure.
- Seed operations must not create duplicate users, areas, photos, events, or listings when rerun.
- A demonstration listing near an area boundary must resolve consistently to its governed area.
- Approximate-pin responses must be stable, identify their precision, omit the exact point, and remain
  between 100 and 500 metres from the exact point inside the governed area; if those constraints cannot
  both be satisfied, or the seller selects greater privacy, public presentation must use an area-only
  result without a pin.
- Concurrent saves from the same anonymous browser must produce one active save, while unsaving and
  resaving must remain consistent.
- Concurrent views or contacts must not lose events or produce negative aggregate values.
- Expired, revoked, malformed, blocked-user, seller, and admin sessions must fail closed.
- Missing optional third-party credentials in local mode must use documented substitutes; production mode
  must fail startup rather than silently using insecure substitutes.
- Unsupported upload type, misleading extension, oversized file, corrupt image, and excessive photo count
  must be rejected before publication.
- Switching language during an authenticated multi-step journey must preserve safe form state and return
  the user to the equivalent step.
- Map failure must leave list discovery and essential listing information usable.
- Seller-type risk signals that conflict with a moderator override must not silently undo the override.
- Reposting through another account, changing minor attributes, or reusing media must not bypass a
  confirmed canonical-property decision.
- A competing ownership claim must prevent either claimant from becoming public until a moderator resolves
  the dispute; automation cannot choose the claimant.
- Expiry and reconfirmation occurring concurrently must produce one valid resulting state and audit event.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The project MUST provide one current clean-environment setup and reset path whose commands,
  ports, required tools, environment values, and expected results agree with the repository.
- **FR-002**: Local validation MUST support every primary journey without paid-provider credentials or
  external transmission of demonstration personal data.
- **FR-003**: All application data structures MUST be represented by ordered, reversible schema changes,
  including listing descriptions, views, inquiries, saved listings, moderation records, and current user
  security fields.
- **FR-004**: A newly prepared database MUST match the application data model, and schema commands MUST
  discover every entity required by runtime services.
- **FR-005**: Demonstration data MUST include governed Arabic/English Cairo areas, active and pending sale
  and long-term rent listings, owner and agent sellers, photos safe for reuse, saves, views, contacts, and
  moderation examples.
- **FR-006**: Demonstration and reset operations MUST be idempotent or explicitly guard against accidental
  duplicate execution and MUST target only documented Makaan development data.
- **FR-007**: Public listing discovery MUST return only approved active Cairo residential listings.
- **FR-008**: Public search MUST support map bounds, governed area, sale/rent, price, property type,
  bedrooms, bathrooms, and seller type, including an owners-only result set.
- **FR-009**: Public listing contracts MUST expose only a stable approximate location; exact submitted
  coordinates MUST remain available only to the listing owner and authorized moderators. Sellers MUST
  consent to either an approximate pin or the more-private area-only mode. An approximate pin MUST be
  labelled, remain 100–500 metres from the exact point within the governed area, and fall back to area-only
  when a compliant point cannot be produced. Moderators MAY require more privacy but MUST NOT approve less
  privacy than the seller selected. Exact public precision is prohibited in this release.
- **FR-010**: Public responses and rendered public content MUST not expose raw phone numbers, identity or
  ownership evidence, authentication material, private exact locations, or internal risk signals.
- **FR-011**: Anonymous saves MUST persist within the same browser, support save/unsave, prevent duplicate
  active saves from that browser, avoid collecting unnecessary identity data, and update seller analytics
  consistently.
- **FR-012**: View, save, and contact analytics MUST be derived consistently from recorded events or from
  a documented transactional aggregate that cannot silently diverge from those events.
- **FR-013**: Contact actions MUST validate method and active-listing availability, apply abuse limits,
  record one event per accepted action, and return a safe contact intent without placing the raw contact
  value in public listing data.
- **FR-014**: Seller and admin authentication MUST establish secure HTTP-only sessions and MUST NOT store
  privileged access tokens in browser local storage.
- **FR-015**: OTP request and verification, admin login, listing submission, uploads, and contact actions
  MUST enforce documented limits and fail with localized, non-sensitive responses.
- **FR-016**: Authorization MUST ensure sellers can read and mutate only their own private listings and
  metrics, while admin data and actions require an active administrator session.
- **FR-017**: Blocked or deactivated accounts and revoked or expired sessions MUST lose access immediately.
- **FR-018**: Listing creation and resubmission MUST require purpose, residential property type, size,
  bedrooms, bathrooms, finishing level, a positive transaction-appropriate EGP price, an exact point
  inside a governed Cairo boundary, and 3–10 valid photos before pending status. Numeric policy bounds
  MUST be documented, localized, and consistent across client and server.
- **FR-019**: Listing media MUST be limited to 5 MB per source image, validated by actual JPEG, PNG, or
  WebP content, meet an 800×600 minimum source resolution, be stripped of metadata, safely transformed,
  limited to 3–10 items per listing, and checked for malicious content before publication.
- **FR-020**: Submitted listings and material corrections MUST remain non-public until human approval.
- **FR-021**: Seller participation MUST represent verified owner, self-declared owner not verified,
  declared agent, and private under-review states. Only a moderator may assign or remove verified-owner
  status based on approved evidence; automated risk signals may open review but may not alone suspend,
  block, verify ownership, or conclusively classify.
- **FR-022**: Agent listings MUST be clearly labelled in public results and details, removable through an
  owners-only filter, and subject to stricter policy than owners. The first-release default MUST allow no
  more than 3 owner submissions and 2 agent submissions per rolling 24 hours; an agent's first publication
  additionally requires a moderator-confirmed agent declaration. Limits remain configurable but an agent
  limit MUST NOT exceed the corresponding owner limit without a later approved specification.
- **FR-023**: Moderators MUST be able to inspect exact location, seller declaration, complete submitted
  data, media, history, and explainable duplicate evidence before deciding publication.
- **FR-024**: Approval, rejection, unpublication, seller-type override, suspension, and material listing
  status changes MUST create an immutable audit record with actor, target, prior state, resulting state,
  reason, and timestamp.
- **FR-025**: Seller rejection feedback and all repaired system-controlled UI copy MUST be available in
  reviewed Arabic and English.
- **FR-026**: Arabic MUST be the default locale and direction; switching to English and back MUST preserve
  the equivalent route and safe journey state.
- **FR-027**: Every essential map result and interaction MUST have a usable list-based equivalent.
- **FR-028**: Dynamic loading, result changes, validation, errors, and status updates MUST be announced or
  labelled accessibly and meet WCAG 2.2 AA with keyboard input, visible focus, reduced motion, 200% zoom,
  and 44×44 CSS-pixel targets for required mobile controls.
- **FR-029**: Public contracts, authorization boundaries, schema evolution, and each primary journey MUST
  have automated evidence that fails when the requirement is violated.
- **FR-030**: Browser evidence MUST cover Arabic RTL and English LTR variants at 375×667 and 1440×900
  CSS-pixel viewports, including the 200% zoom checks applicable to SC-008.
- **FR-031**: The standard local and continuous validation paths MUST run the same required categories of
  checks and fail the overall result when any required check fails.
- **FR-032**: Documentation MUST not claim a command, endpoint, environment variable, provider behavior,
  or feature that is absent from the validated repository.
- **FR-033**: Production configuration MUST fail closed when a required security-sensitive provider or
  secret is missing and MUST never activate development substitutes.
- **FR-034**: Duplicate evaluation MUST consider exact-location proximity, governed area, property
  attributes, reused media, seller/contact patterns, prior canonical decisions, and minor-edit history;
  evidence shown to moderators MUST state which signals matched.
- **FR-035**: No more than one active listing may represent the same physical property and transaction.
  Confirmed duplicates, competing ownership claims, cross-account reposts, and minor-edit circumvention
  MUST remain private until a moderator records an explicit reject, canonical reference, or dispute
  resolution. Automation MUST NOT choose the canonical claimant.
- **FR-036**: Every active listing MUST require availability confirmation at least every 30 days. Sellers
  MUST see a localized dashboard warning during the final 7 days; an unconfirmed listing MUST expire from
  public discovery, and confirmation without material edits MUST restore or retain eligibility and be
  audited.
- **FR-037**: Changes to price, exact location, seller declaration, purpose, property type, size, bedrooms,
  or bathrooms MUST record previous and new values, remove the prior public version, and return the changed
  listing to pending moderation. Non-material availability confirmation MUST NOT require renewed content
  moderation.
- **FR-038**: Logs and validation artifacts MUST mask phone numbers and MUST exclude OTPs, passwords,
  session tokens, second-factor secrets, exact private locations, identity documents, and document content.
  Security-event logs MUST identify the event category and actor or anonymous rate-limit identity without
  exposing those protected values.
- **FR-039**: Any identity or ownership evidence used for manual verified-owner assignment MUST be
  encrypted, access-controlled, access-audited, excluded from public and model inputs, and deleted after
  30 days from the final review decision unless an active dispute or legal hold requires longer retention.
  Account deactivation MUST revoke sessions, unpublish listings, and anonymize non-required personal data
  while preserving legally or operationally required audit facts.
- **FR-040**: Area search MUST normalize Arabic diacritics, tatweel, common Alef and Ya variants, and a
  governed alias list without changing the authoritative Arabic and English area names shown to users.
- **FR-041**: Administrator authentication MUST require a configured second factor. Local validation MUST
  provide a non-production factor through the documented setup; production MUST require independent
  provisioning, and authorized factor recovery MUST revoke existing sessions and create an audit record.
- **FR-042**: Default organic ordering MUST use only query relevance, geographic fit, listing completeness,
  named verification signals, latest availability confirmation, policy compliance, and an owner-first
  tie-break before final deterministic freshness and listing-identity tie-breaks. The product MUST disclose
  these input categories, MUST NOT include paid placement, and MUST produce the same order for unchanged
  data and query conditions.
- **FR-043**: Every public listing card and detail MUST show exactly one participation label: verified
  owner, owner not verified, or agent. Seller-type filters MUST offer all sellers, owners only (both owner
  labels), and agents only, and each option MUST return only its defined participation states.

### Key Entities

- **Schema Version**: Ordered record of an applied data-model change and its reversible transition.
- **Cairo Area**: Governed bilingual area name, hierarchy, boundary, and map-centering information.
- **User and Session**: Buyer, seller, or administrator identity; account status; secure active session;
  expiry and revocation state.
- **Seller Profile**: Declared participation type, risk-review state, moderator override, policy limits,
  and explicitly named verification signals.
- **Property Listing**: Cairo residential sale or long-term rent offer, structured property data, exact
  private point, seller-selected and moderator-approved public precision, approximate public point where
  allowed, lifecycle status, availability confirmation, canonical-property reference, and moderation history.
- **Photo**: Validated and processed listing media with order and safe storage reference.
- **View Event**: A recorded qualifying listing view with source and optional opaque viewer identity.
- **Saved Listing**: One active buyer or anonymous-browser relationship to an active listing.
- **Contact Event**: An accepted WhatsApp or call intent associated with an active listing and rate-limit
  identity.
- **Moderation Action**: Immutable administrator decision or override with previous and resulting state.
- **Demonstration Dataset**: Repeatable, non-sensitive Cairo areas and marketplace examples for local and
  automated validation.

## Assumptions and Dependencies _(mandatory)_

### Assumptions

- Supported contributor environments provide a current long-term-support runtime and container engine.
- Anonymous saved listings remain browser-specific in this feature; cross-device buyer accounts are out
  of scope.
- Public pins use the product bounds defined by FR-009. The technical plan will research a method that
  keeps the result stable without allowing public clients to derive the private point.
- Seller declaration is self-reported and moderator-overridable. This repair supports manual verified-owner
  assignment from approved offline evidence; self-service submission and full verification operations are
  later features.
- Demonstration photos use repository-owned or permissively reusable assets and contain no real personal
  or property-identifying information.
- Existing sale/rent, property-type, status, and moderation concepts remain unless schema repair proves a
  contradiction that must be documented during planning.

### Dependencies

- Makaan Constitution v2.0.0.
- The existing buyer, seller, authentication, admin, map, media, and persistence implementation.
- Existing capabilities for persistent geographic data, temporary rate-limit/session state,
  browser-accessible journeys, and application contracts.
- Local substitutes for OTP, listing media storage, malicious-content scanning, and map behavior where
  a real provider is not necessary to validate the journey.
- Production deployments will require separately managed credentials for chosen external providers.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A new contributor can reach a healthy Arabic homepage with searchable demonstration
  listings by following one guide in 30 minutes or less, excluding dependency download time.
- **SC-002**: A clean database can migrate from empty to current, reverse every newly introduced reversible
  change in a validation environment, and migrate forward again with zero schema differences.
- **SC-003**: All five independently defined user stories pass through one documented local validation
  entry point and the continuous validation environment.
- **SC-004**: Every documented public search, saved-listing, listing-detail, and contact contract is
  validated against an explicit forbidden-field set containing raw phone, exact location, authentication,
  identity evidence, and internal moderation fields; all return only an approximate or area-only location.
- **SC-005**: Repeated save attempts from one anonymous browser produce exactly one active save and seller
  analytics agree with active save records in all automated cases.
- **SC-006**: An authorization matrix covering anonymous, active seller, other seller, active admin,
  blocked user, deactivated user, expired session, and revoked session against every protected seller and
  admin operation passes with no privileged-token browser storage.
- **SC-007**: The system-controlled translation catalogue has an Arabic and English value for every key,
  and the defined primary-journey route inventory renders each route with correct RTL or LTR direction and
  no untranslated catalogue key.
- **SC-008**: Primary buyer and seller journeys complete at 375×667 and 1440×900 CSS-pixel viewports,
  at 200% zoom where applicable, with zero automated critical accessibility violations, no inaccessible
  required control, and no map-only blocker.
- **SC-009**: Any failed required check causes both local validation and continuous validation to return a
  failing result that identifies the relevant suite and reproduction command.
- **SC-010**: Every executable command in the clean quickstart completes in a clean validation run, and an
  automated documentation check confirms that documented ports, environment names, scripts, schema
  operations, and local-provider modes exist in the repository configuration it references.
- **SC-011**: Duplicate-policy evidence covers same-account, cross-account, reused-media, nearby-property,
  minor-attribute-change, and competing-claim cases; no case can produce more than one active canonical
  listing without a recorded moderator resolution.
- **SC-012**: Time-controlled lifecycle evidence confirms the 7-day warning, 30-day expiry, non-material
  reconfirmation, and every enumerated material-edit reapproval transition with exactly one audit record
  per accepted state change.
- **SC-013**: Public-card, detail, filter, and ordering evidence covers all three public seller labels, both
  public-precision consent modes, the moderator privacy constraint, every declared organic-order input,
  owner-first tie-breaking, stable unchanged ordering, and the absence of paid inputs.
