<!--
SYNC IMPACT REPORT
==================
Version change: 1.0.0 -> 2.0.0
Modified principles:
  - I. Map-First Architecture -> I. Arabic-First, Mobile-First Marketplace
  - II. Admin-Approved Quality Gate + III. Data Quality Over Volume -> IV. Moderated Quality Before Publication
  - IV. One Canonical Listing Per Property -> V. One Canonical Listing Per Property
  - V. Transparent Seller Identity -> II. Owner-First, Transparent Participation
  - VI. Security & Privacy by Default -> VI. Security and Privacy by Default
  - VII. AI as Silent Assistant -> VII. Human-Accountable Automation
Added principles:
  - III. Location Integrity With Public Privacy
  - VIII. Evidence Before Completion
Added sections:
  - First-Release Product Boundary
  - Marketplace Participation and Ranking
  - Localization and Accessibility Standards
  - Architecture and Future Categories
  - Agent Orchestration and Delegation
Removed sections:
  - Standalone Data Quality Standards (consolidated into principles and standards)
Templates requiring updates:
  - ✅ .specify/templates/plan-template.md
  - ✅ .specify/templates/spec-template.md
  - ✅ .specify/templates/tasks-template.md
  - ✅ .specify/templates/agent-file-template.md
  - ✅ CLAUDE.md
Follow-up TODOs: None
==================
-->

# Makaan Constitution

## Core Principles

### I. Arabic-First, Mobile-First Marketplace (NON-NEGOTIABLE)

Arabic and right-to-left presentation MUST be the default product experience. English MUST be a
complete secondary experience rather than a partial translation. All buyer, owner, agent, and admin
journeys MUST work on common mobile browsers before they are considered complete.

**Rules:**
- New user-facing requirements MUST define Arabic and English content behavior.
- Layout, navigation, forms, maps, galleries, and icons MUST be validated in RTL and LTR.
- Cairo place names MUST retain authoritative Arabic and English forms.
- Text MUST remain readable without relying on machine translation at display time.
- Primary controls MUST meet accessible touch-target, keyboard, focus, contrast, and label standards.

**Rationale:** The first market is Cairo and the primary audience is Arabic-speaking and mobile-led.
Localization and mobile usability are product behavior, not post-release polish.

### II. Owner-First, Transparent Participation (NON-NEGOTIABLE)

Makaan exists to give individual property owners a credible direct route to buyers and tenants.
Professional agents MAY participate, but MUST be declared or detected for review, clearly labelled,
more heavily moderated, and easy for buyers to exclude.

**Rules:**
- Seller identity shown to buyers MUST distinguish verified owner, declared agent, and unverified seller.
- Buyers MUST have an owners-only filter wherever seller-type filtering is available.
- Owner listings MUST receive the standard marketplace experience without paid visibility requirements.
- Agent listings MUST NOT masquerade as owner listings or receive undisclosed ranking advantages.
- Commercial participation MUST be subject to stricter limits, verification, and moderation policies.
- Automated classification signals MAY trigger review but MUST NOT be the sole basis for punitive action.
- Suspected undeclared commercial activity MUST enter manual review with an auditable outcome.
- Repeated false declarations, duplicate posting, or account circumvention MUST support suspension.

**Rationale:** Broker impersonation, reposting, and information asymmetry are central problems Makaan
is designed to reduce. Agents are allowed for inventory breadth, but owner leverage remains the product
priority.

### III. Location Integrity With Public Privacy (NON-NEGOTIABLE)

Every listing MUST have an accurate geographic location stored for validation, search, moderation, and
duplicate detection. Public presentation MUST protect residents and owners from unnecessary disclosure
of an exact private address.

**Rules:**
- No listing can be submitted or published without a valid location inside the supported boundary.
- Search by area, map viewport, and future drawn boundary MUST resolve to geographic data.
- Admins MUST be able to review the submitted exact pin and its declared area.
- Public maps MUST show an approved precision level appropriate to the property and seller's consent.
- Exact private-unit location MUST NOT be exposed by default in public APIs, metadata, or analytics.
- Location changes after approval MUST return the listing to moderation.

**Rationale:** Accurate geography differentiates Makaan, but accuracy must not create a safety or privacy
risk. The system can retain an exact source of truth while presenting an approximate public pin.

### IV. Moderated Quality Before Publication (NON-NEGOTIABLE)

All listings require explicit admin approval before public visibility. Structured, complete, current,
and truthful listings take priority over inventory volume.

**Rules:**
- Submitted listings MUST remain private until approved by an authorized moderator.
- Required fields MUST be validated on both the client and server.
- Moderation MUST assess location, seller declaration, completeness, photo relevance, duplicate risk,
  prohibited content, and scam indicators.
- Rejection and correction requests MUST use clear reasons visible to the seller.
- Published listings MUST expire or require periodic availability reconfirmation.
- Material edits to location, price, seller identity, purpose, or property identity MUST be auditable and
  MAY require renewed approval.
- Moderation decisions and status transitions MUST be logged.

**Rationale:** Existing volume-led classifieds create buyer fatigue and distrust. Makaan competes through
consistent information and accountable publication.

### V. One Canonical Listing Per Property

Each physical property MUST have no more than one active canonical listing for the same transaction at
a time.

**Rules:**
- Duplicate checks MUST consider location, media, property attributes, contact patterns, and history.
- Potential duplicates MUST be surfaced to moderators with explainable evidence.
- Automation MUST NOT merge, reject, or transfer a listing without human confirmation.
- Competing ownership claims MUST suspend publication until reviewed.
- Reposting, multi-account circumvention, and small attribute changes MUST NOT bypass duplicate policy.

**Rationale:** Repeated broker copies make search misleading and prevent buyers from identifying the
actual source of a property.

### VI. Security and Privacy by Default (NON-NEGOTIABLE)

Authentication, authorization, contact data, identity evidence, location, and uploaded media MUST be
protected throughout their lifecycle.

**Rules:**
- User and admin sessions MUST use secure HTTP-only cookies; privileged tokens MUST NOT be stored in
  browser local storage.
- Authorization MUST be enforced at the API and data-access layers.
- Public APIs MUST NOT expose phone numbers, exact private locations, identity documents, or internal
  moderation signals.
- OTP, authentication, listing submission, uploads, and contact actions MUST be rate limited.
- Uploaded media MUST be validated, metadata stripped, safely transformed, and malware checked.
- Identity and ownership evidence MUST be encrypted, access logged, and retained only as long as needed.
- Logs MUST mask phone numbers and MUST NOT contain OTPs, tokens, passwords, or document contents.
- Account deactivation, session revocation, and appropriate data anonymization MUST be supported.

**Rationale:** Trust cannot be built by exposing owners to identity theft, unsolicited harvesting,
account takeover, or exact-location risks.

### VII. Human-Accountable Automation

Automation and AI MAY help with duplicate detection, risk triage, content quality, translation drafting,
and moderation efficiency, but consequential decisions MUST remain explainable and subject to human
review.

**Rules:**
- Automation MUST expose reasons or evidence to authorized reviewers.
- AI MUST NOT autonomously approve, reject, suspend, price, or classify a seller conclusively.
- User-facing generated content MUST be identified and reviewable before publication.
- Sensitive documents MUST NOT be sent to a model or third party without an approved privacy design.
- Model cost and latency MUST be proportionate; deterministic logic is preferred when sufficient.

**Rationale:** Automation should reduce administrative work without creating opaque or unaccountable
decisions for owners, buyers, or agents.

### VIII. Evidence Before Completion (NON-NEGOTIABLE)

No feature, task, or user story may be marked complete solely because code exists. Completion requires
proportionate automated tests and an independently repeatable validation path.

**Rules:**
- Public contracts MUST have contract tests.
- Authentication, authorization, listing lifecycle, moderation, search, saving, and contact journeys MUST
  have integration coverage.
- Critical buyer and seller journeys MUST have browser coverage in Arabic RTL and English LTR.
- Security-sensitive changes MUST include negative tests for unauthorized and abusive behavior.
- Database changes MUST include reversible migrations and clean-database validation.
- Quickstart instructions MUST be executed from a clean environment before a release candidate.
- Known gaps MUST be recorded explicitly and MUST NOT be represented as completed work.

**Rationale:** The original MVP checklist overstated readiness because implementation lacked a
reproducible environment and tests. Evidence is required to restore reliable delivery status.

## First-Release Product Boundary

- Geography: Cairo only, using governed boundaries and bilingual area names.
- Category: residential property only.
- Transactions: property sale and long-term rent.
- Primary supply: individual owners; clearly labelled professional agents are permitted.
- Default experience: Arabic RTL; complete English LTR is required.
- Currency: Egyptian Pounds.
- Discovery: area search, list results, map results, and consistent filters.
- Contact: direct call and WhatsApp intents; no in-app chat is required.
- Excluded: other governorates, short-term stays, commercial property, off-plan inventory, developer
  projects, vehicles, and paid ranking products.

Adding an excluded market requires its own specification and constitution check. It MUST NOT be added
through unrelated implementation work.

## Marketplace Participation and Ranking

- Relevance, geographic fit, data completeness, verification, freshness, and policy compliance MUST be
  the declared ranking inputs for the first release.
- Seller type MUST be visible on cards and detail pages and available as a filter.
- Agents MAY be ranked below otherwise-equivalent owner listings, but this MUST be documented and tested.
- Paid placement, if introduced later, MUST be visibly labelled and MUST NOT conceal organic relevance.
- Verification badges MUST describe what was verified; one ambiguous "verified" label is prohibited.
- Seller classification history and moderator overrides MUST be auditable.

## Localization and Accessibility Standards

- Product copy, messages, errors, moderation reasons, and SEO metadata MUST have Arabic and English
  variants before release.
- User descriptions MAY remain in their submitted language; unreviewed translations MUST NOT be silently
  published.
- Search MUST support normalized Arabic spelling and common Cairo-area variants.
- Currency, number, date, pluralization, and direction formatting MUST be locale-aware.
- Acceptance criteria MUST cover keyboard operation, focus, labels, contrast, reduced motion, zoom,
  screen-reader announcements, and accessible touch targets.

## Architecture and Future Categories

Shared marketplace capabilities—identity, seller participation, moderation, listing lifecycle, media,
location, saves, contacts, and audit history—SHOULD remain category-neutral where this does not add
premature complexity. Property attributes and workflows MUST remain property-specific.

Future vehicle support MUST use a separate category specification and vehicle-specific data model. The
current release MUST NOT generalize property code merely to anticipate vehicles without a concrete need.
New governorates, off-plan inventory, developers, or cars require explicit migrations, search behavior,
moderation policy, and UX acceptance criteria.

## Development Workflow

### SpecKit Delivery Sequence

1. Amend the constitution when a governing product or engineering rule changes.
2. Create a bounded feature specification describing user value, scope, assumptions, and measurable
   outcomes without implementation choices.
3. Clarify only decisions that materially change scope, privacy, security, or user experience.
4. Produce research, data model, contracts, migration strategy, quickstart, and implementation plan.
5. Create dependency-ordered tasks with tests and independent checkpoints.
6. Analyze cross-artifact consistency before implementation.
7. Implement, integrate, and validate each story before marking it complete.

### Review Gates

- Product: owner advantage, agent transparency, scope boundary, and trust signals.
- Localization: Arabic RTL and English LTR completeness.
- Security/privacy: authentication, authorization, uploads, PII, exact location, and evidence.
- Data quality: creation, verification, search, duplicate detection, and moderation.
- Performance: map rendering, media loading, and result updates on representative mobile devices.
- Release: clean setup, migrations, automated suites, and primary journey evidence.

### Agent Orchestration and Delegation

- The main orchestrator owns product interpretation, architecture, task boundaries, integration,
  security review, and final completion decisions.
- Lower-cost agents SHOULD handle bounded mechanical work, isolated components, fixtures, routine tests,
  documentation synchronization, and well-specified refactors.
- Stronger reasoning models SHOULD be reserved for ambiguous decisions, architecture, migrations,
  security/privacy, complex debugging, cross-cutting reviews, and failed integration recovery.
- Delegated tasks MUST state scope, allowed files, dependencies, acceptance criteria, and verification.
- Agents MUST NOT edit overlapping files concurrently unless explicitly coordinated.
- Delegated output is untrusted until reviewed and integrated by the orchestrator.
- Parallel work MUST follow dependencies; token cost alone MUST NOT justify unsafe or duplicated work.

## Governance

This constitution supersedes conflicting specifications, plans, tasks, documentation, and implementation
preferences. Every feature and release MUST pass its applicable constitutional gates.

### Amendment Process

1. Document the amendment, rationale, affected principles, and migration impact.
2. Obtain product-owner approval; security/privacy changes also require explicit technical review.
3. Increment the version using semantic versioning:
   - MAJOR: removes or incompatibly redefines a principle or product invariant.
   - MINOR: adds a principle or materially expands enforceable guidance.
   - PATCH: clarifies wording without changing obligations.
4. Update dependent SpecKit templates and active feature artifacts.
5. Audit existing implementation for non-compliance and create remediation tasks.

### Compliance Review

- Plans MUST include pre-design and post-design Constitution Checks.
- Specifications MUST identify assumptions, dependencies, exclusions, localization, trust, and privacy.
- Tasks MUST preserve requirement traceability and include validation work.
- Exceptions MUST be explicit in Complexity Tracking and approved by the product owner.
- Quarterly audits SHOULD identify drift, stale documentation, and obsolete policy thresholds.

**Version**: 2.0.0 | **Ratified**: 2026-02-22 | **Last Amended**: 2026-07-20
