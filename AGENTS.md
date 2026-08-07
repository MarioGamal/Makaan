# Makaan Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-08-07

## Active Technologies

- TypeScript 5.6, Node.js 20 LTS, npm 10 + NestJS 11, Next.js 16.2 Pages Router, React 19, TypeORM 0.3, Tailwind CSS 3, (002-repair-mvp-foundation)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.6, Node.js 20 LTS, npm 10: Follow standard conventions

## Product Guardrails

- Arabic RTL is the default; English LTR must remain complete.
- First-release scope is Cairo residential sale and long-term rent.
- Individual owners are prioritized; agents are allowed only with clear labels and stricter moderation.
- Exact listing locations are retained for validation but protected from default public disclosure.
- No work is complete without proportionate automated and clean-environment validation.

## Agent Orchestration

- The main orchestrator owns architecture, security, integration, and completion decisions.
- Delegate bounded mechanical tasks to lower-cost agents with exact files and acceptance criteria.
- Reserve stronger reasoning for ambiguity, architecture, migrations, security, and integration recovery.
- Do not run concurrent delegated edits against overlapping files without explicit coordination.

## Recent Changes

- 003-marketplace-redesign: Delivered the Arabic-first Cairo residential marketplace verticals: public discovery, save/contact intents, local media, seller owner/declared-agent workflow, and moderator review using scoped opaque cookie sessions and CSRF protection. Automated-test authoring and the browser matrix remain deferred for this delivery pass.
- 002-repair-mvp-foundation: Added TypeScript 5.6, Node.js 20 LTS, npm 10 + NestJS 11, Next.js 16.2 Pages Router, React 19, TypeORM 0.3, Tailwind CSS 3.

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
