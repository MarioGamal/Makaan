# Delegation Ledger: Arabic-first Marketplace Redesign

The primary orchestrator owns architecture, migration decisions, privacy/security boundaries, integration,
task completion, and release evidence. Lower-cost agents receive bounded implementation or test packages
only after the relevant contract is frozen.

## Work packages

| Package                      |                Tasks | Model fit                           | Allowed scope                                                        | Acceptance                                                 |
| ---------------------------- | -------------------: | ----------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------- |
| R01 Reconciliation inventory |                 T001 | Lower-cost read-only                | Current migrations/entities/tests/routes; reconciliation report only | Every unfinished artifact has keep/simplify/defer decision |
| R02 Schema/contracts         |            T002–T005 | Primary                             | Migrations, entities, shared transport, fixtures                     | Green migration/seed/build checkpoint                      |
| R03 Visual tokens/primitives |           T006, T009 | Lower-cost after direction approval | Styles and UI primitives                                             | Focused component test matrix passes                       |
| R04 Locale/SSR shell         | T007–T008, T010–T013 | Lower-cost with primary integration | i18n, document/app, shell/navigation                                 | Arabic/English mobile/desktop shell passes                 |
| R05 Public backend           |            T014–T018 | Primary                             | Area/location/public listing services/controllers/tests              | Privacy-safe public contracts pass                         |
| R06 Public frontend          |            T019–T023 | Lower-cost after API freeze         | Home/search/filter/cards/map/detail                                  | Public browser checkpoint passes                           |
| R07 Saves/contact backend    |      T024–T026, T029 | Strong/primary review               | Saved/contact services/controllers/tests                             | Concurrency/TTL/privacy pass                               |
| R08 Saves/contact frontend   |            T027–T030 | Lower-cost after API freeze         | Save/contact/saved UI                                                | Reload and handoff browser journey passes                  |
| R09 Seller backend/tests     |            T031–T035 | Strong/primary review               | Seller DTO/service/controller/media/tests                            | Full ownership/lifecycle tests pass                        |
| R10 Seller frontend          |            T036–T040 | Lower-cost after API freeze         | Seller auth/pages/components                                         | Owner and agent browser journeys pass                      |
| R11 Moderator backend/tests  |            T041–T043 | Primary                             | Moderation/audit/controller/tests                                    | Atomic authorization matrix passes                         |
| R12 Moderator frontend       |            T044–T048 | Lower-cost after API freeze         | Admin auth/pages/components                                          | Submit/review/publish browser journey passes               |
| R13a Code cleanup            |                 T049 | Lower-cost after journey completion | Assigned legacy route/client files only                              | Forbidden legacy patterns absent                           |
| R13b Experience polish       |            T050–T052 | Lower-cost in non-overlapping lanes | Catalogue parity, accessibility, protected-data scans                | UX and privacy checks pass                                 |
| R13c Delivery polish         |            T053–T054 | Lower-cost after command freeze     | Root validation, CI, README/config/setup docs                        | Clean documented validation passes                         |
| R14 Acceptance               |            T055–T056 | Primary                             | Repository-wide evidence and backlog                                 | Clean release-one evidence recorded                        |

## Handoff rules

- Every assignment names exact files, prerequisites, acceptance commands, and forbidden overlaps.
- Delegates never edit migrations, authentication middleware, shared API clients, catalogues, root package
  files, or task state unless that exact file is assigned.
- A reported pass is not accepted until the orchestrator reviews the diff and reproduces validation.
- Red tests are introduced immediately before their implementation lane; the default branch is not left
  broadly red for several future phases.
- Frontend packages must use real frozen APIs or deterministic test adapters matching them—no page-local
  fake marketplace state.
- Updates to the user report completed, current, next visible checkpoint, and blockers.
