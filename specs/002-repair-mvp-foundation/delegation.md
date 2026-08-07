# Delegation Ledger: Repair MVP Foundation

The primary orchestrator assigns and accepts work. This ledger packages low-ambiguity tasks for lower-cost
models while keeping architecture, migrations, security, privacy, integration recovery, and final evidence
under primary-agent control.

## Agent Handoff Template

Every assignment must include:

```text
Package: Wxx
Tasks: Txxx–Tyyy
Read first: AGENTS.md, spec.md sections ..., plan.md, relevant contract/data-model sections
Allowed writes: exact file list/glob
Do not change: migrations/security/privacy contracts/root shared files not listed
Acceptance: exact commands and observable behavior
Return: summary, changed files, test output, assumptions, remaining risks
```

Agents do not mark `tasks.md`, commit, amend architecture, install unapproved alternatives, or edit outside
their allowlist. Stop and report when a contract cannot be met without an out-of-scope change.

## Work Packages

| Package                   |                 Tasks | Suitable model                         | Allowed scope                                                                                                  | Acceptance                                                                 |
| ------------------------- | --------------------: | -------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| W01 Tooling configs       |             T003–T006 | Lower-cost                             | Jest, Vitest, Playwright, lint/format config only                                                              | Configs load; focused empty-suite commands exit as documented              |
| W02 Local services        |       T008–T009, T028 | Lower-cost                             | Compose, ignore paths, local service scripts                                                                   | Pinned services become healthy; parallel project names do not collide      |
| W03 Config tests/docs     |            T007, T010 | Lower-cost                             | Env inventory and config tests only                                                                            | Tests distinguish local/test/production and assert fail-closed cases       |
| W04 Entity reconciliation |             T014–T017 | Strong/primary review                  | Registry, migration 005, baseline entities/tests                                                               | Empty up/down/up and entity parity pass; 001–004 unchanged                 |
| W05 Provider adapters     |       T012–T013, T026 | Lower-cost after interface approval    | Provider interface/local implementations/tests                                                                 | Local journeys work without accounts; production placeholders fail         |
| W06 Session security      |             T018–T024 | Primary/high reasoning                 | Migration 006, sessions, scoped CSRF, centralized abuse limits, trusted-proxy handling, auth, audit, redaction | Full auth matrix plus negative CSRF/revocation/rate-limit/log tests pass   |
| W07 Fixtures/reset        |       T025, T029–T034 | Lower-cost with migration freeze       | Seed/reset/health/docs scripts and fixtures                                                                    | Seed twice is identical; guarded resets and clean smoke pass               |
| W08 Public contract tests |             T035–T039 | Lower-cost                             | Tests/fixtures only                                                                                            | Tests fail for the intended missing behavior and cover forbidden fields    |
| W09 Privacy schema/search |       T040, T042–T043 | Primary/high reasoning                 | Migration 007 and public search/location services                                                              | Spatial privacy, bbox, eligibility, ranking, aliases pass                  |
| W10 Saves/events/contact  |       T041, T044–T045 | Strong/primary review                  | Migration 008 and buyer/event services                                                                         | Concurrency, dedupe, rate, expiry, privacy tests pass                      |
| W11 Frontend i18n/map     |             T046–T048 | Lower-cost after API freeze            | Next locale config, catalogues, search/filter UI, token-free local map adapter                                 | Arabic default SSR plus local-map and locale/viewport tests pass           |
| W12 Frontend save/contact |                  T049 | Lower-cost after API freeze            | Listed buyer pages/components only                                                                             | Reload persistence and intentional privacy-safe handoff pass               |
| W13 Seller tests          |             T050–T053 | Lower-cost                             | Seller contract/integration/browser tests only                                                                 | Tests fail for precise lifecycle/media/authorization gaps                  |
| W14 Seller backend        |             T054–T059 | Strong/primary review                  | Seller models/services/controllers/workers                                                                     | Lifecycle, race, authorization, media tests pass                           |
| W15 Seller frontend       |             T060–T063 | Lower-cost after contract freeze       | Listed session/seller UI files                                                                                 | Bilingual mobile/desktop seller journey passes without token storage       |
| W16 Admin tests           |             T065–T068 | Lower-cost                             | Admin security/moderation/audit/browser tests only                                                             | Tests fail for precise missing controls                                    |
| W17 Admin backend         |             T069–T074 | Primary/high reasoning                 | Canonical/dispute/verification/moderation/recovery                                                             | Concurrency, human-decision, audit, evidence tests pass                    |
| W18 Admin frontend        |             T075–T077 | Lower-cost after contract freeze       | Listed admin API/pages/components only                                                                         | Second-factor cookie session and accessible moderation journey pass        |
| W19 Validation harness    |             T079–T085 | Lower-cost with root-file coordination | Validation tests/scripts/CI/e2e fixtures                                                                       | Controlled stage failure propagates; CI calls root contract                |
| W20 Accessibility/i18n    | T080, T082, T086–T089 | Lower-cost                             | Catalogue/UI/a11y tests/docs                                                                                   | Locale parity, axe, keyboard, focus, viewports, manual zoom evidence pass  |
| W21 Backfill/performance  |             T090–T092 | Primary/high reasoning                 | Migration 009 and focused tests                                                                                | Legacy data cannot become public by inference; representative targets pass |
| W22 Final acceptance      |             T093–T096 | Primary only                           | Repository-wide inspection/evidence                                                                            | Full clean validation and traceability/security reviews pass               |

## Integration Rules

- Only one active writer may touch a migration, `package.json`/lockfile, entity registry, API client,
  catalogue, or authentication middleware at a time.
- Test-only packages can run ahead of implementation and should return a clearly observed red state.
- After each package, the orchestrator inspects `git diff`, rejects unrelated edits, runs focused acceptance,
  updates task checkboxes, then runs the nearest completed-story regression.
- Agents must not weaken tests, snapshot protected data, use exact location in public filtering, restore
  bearer/localStorage auth, infer seller classification from risk signals, or automate consequential
  moderation outcomes.
- Any contract change first updates `spec.md`/design artifacts and receives orchestrator approval; it is not
  smuggled into implementation as a convenience fix.
