# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION]  
**Primary Dependencies**: [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]  
**Storage**: [if applicable, e.g., PostgreSQL, CoreData, files or N/A]  
**Testing**: [e.g., pytest, XCTest, cargo test or NEEDS CLARIFICATION]  
**Target Platform**: [e.g., Linux server, iOS 15+, WASM or NEEDS CLARIFICATION]
**Project Type**: [e.g., library/cli/web-service/mobile-app/compiler/desktop-app or NEEDS CLARIFICATION]  
**Performance Goals**: [domain-specific, e.g., 1000 req/s, 10k lines/sec, 60 fps or NEEDS CLARIFICATION]  
**Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory, offline-capable or NEEDS CLARIFICATION]  
**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify this feature complies with the Makaan Constitution (`.specify/memory/constitution.md`):

**Core Principles Compliance:**
- [ ] **I. Map-First Architecture**: Does feature maintain map as primary interface? Are all location-related features tied to geographic boundaries?
- [ ] **II. Admin-Approved Quality Gate**: Does feature respect manual approval workflow? No automated publishing paths?
- [ ] **III. Data Quality Over Volume**: Does feature enforce required fields and data completeness? No shortcuts that compromise quality?
- [ ] **IV. One Canonical Listing Per Property**: Does feature prevent or detect duplicates? No mechanisms that enable spam?
- [ ] **V. Transparent Seller Identity**: Does feature correctly identify and display seller type? No masking of agent status?
- [ ] **VI. Security & Privacy by Default**: Does feature protect PII, enforce rate limits, and follow security requirements?
- [ ] **VII. AI as Silent Assistant**: If using AI, is it internal-only? No autonomous decisions or user-facing predictions?

**Security & Privacy Requirements:**
- [ ] Authentication flows use phone OTP with proper rate limiting and expiry
- [ ] Authorization enforces RBAC (users modify only their resources, admin-only endpoints protected)
- [ ] No PII exposed in public APIs
- [ ] File uploads follow security requirements (format validation, size limits, EXIF stripping)
- [ ] Rate limits applied to user actions (OTP, submissions, contacts)
- [ ] Logging masks sensitive data (phone numbers, no OTP logging)

**Data Quality Standards:**
- [ ] Required fields enforced (client and server validation)
- [ ] Duplicate detection mechanisms in place where applicable
- [ ] Cairo geographic boundary validation for map pins

**Development Workflow:**
- [ ] Feature aligns with all 7 Core Principles
- [ ] Mobile-first design (feature works on iOS Safari, Chrome Android)
- [ ] Testing strategy includes contract/integration/security tests as needed
- [ ] Admin capacity impact assessed (manual review features < 5 min per item)

**Complexity Justification** (fill only if introducing new complexity):
- Document in Complexity Tracking table below if deviating from constitution or adding significant complexity

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
