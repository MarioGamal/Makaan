# Makaan Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-22

## Active Technologies

- (001-makaan-mvp)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

# Add commands for 

## Code Style

: Follow standard conventions

## Product Guardrails

- Arabic RTL is the default experience; English LTR must remain complete.
- First-release scope is Cairo residential sale and long-term rent only.
- Individual owners are prioritized. Agents are permitted only when clearly labelled and more heavily moderated.
- Store accurate listing locations for search and moderation while protecting exact private locations publicly.
- Require human approval for publication and consequential automated moderation outcomes.
- Do not mark features complete without proportionate tests and reproducible validation.

## Agent Orchestration

- The main orchestrator owns product interpretation, architecture, integration, security review, and completion.
- Delegate bounded mechanical work to lower-cost agents with exact scope and acceptance criteria.
- Reserve stronger reasoning for ambiguity, architecture, migrations, security, and cross-cutting review.
- Avoid concurrent edits to overlapping files.

## Recent Changes

- 001-makaan-mvp: Added

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
