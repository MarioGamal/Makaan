# Release-one delivery-pass evidence

**Recorded**: 2026-08-07  
**Scope**: implementation checkpoint, not release acceptance.

## Observed validation

The following commands completed successfully after the marketplace redesign integration:

- `npm run typecheck`
- `npm run lint` (the frontend lint run reports existing Next.js `<img>` advisories only)
- shared, backend, and frontend production builds (the frontend build required running outside the restricted
  sandbox because Turbopack starts a local CSS worker)

Migration and fixture reconciliation was also exercised against a disposable UTF-8 PostgreSQL database:
migration up/down/up, seed twice, demo reset, and empty reset completed successfully. This was a local
disposable environment, not a production deployment.

## Runtime smoke checkpoints

With a seeded disposable Postgres instance and the API running locally, the following were exercised:

- `GET /api/v1/health` returned healthy.
- Public area search, listing search, and listing detail returned only eligible approved Cairo residential
  records and did not expose exact private coordinates or seller contact data.
- Seller cookie-session/CSRF protection and dashboard were exercised against the real API. A real Arabic
  draft was created, retrieved, updated from lock version 1 to 2, and a repeated stale version-1 update was
  rejected with HTTP 409. Full media-backed submit and declared-agent runtime journeys remain in the
  deferred browser checkpoint.
- Moderator cookie-session/CSRF flow, queue/detail review, reasoned moderation decision, and the resulting
  public-listing eligibility path were exercised against the real API.
- Anonymous save bootstrap, save, and saved-listing retrieval were exercised against the real API.
- The rebuilt backend was restarted after integration, `GET /api/v1/health` returned healthy, and the approved
  listing detail still exposed only its moderated approximate public point. Structured request logs used route
  templates and key names rather than request bodies, tokens, identifiers, or SQL parameters.

Redis was not present in that disposable runtime. Contact-intent creation correctly failed closed with
`abuse_control_unavailable`; a successful rate-limited contact-resolution smoke must be rerun with the
documented Redis service running.

## Explicitly deferred

- Authoring additional backend/frontend automated tests.
- Running the focused and full Arabic/English, mobile/desktop browser matrix.
- Clean release-acceptance evidence, including the full submit → review → publish browser journey.

Accordingly, test and browser tasks remain unchecked in `tasks.md`, and this document must not be read as
a release-readiness or production-security sign-off.
