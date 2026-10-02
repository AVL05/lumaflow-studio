# AGENTS.md — LumaFlow Studio

This file is the primary operating contract for AI coding agents working in this repository. Follow it before making changes. More specific `AGENTS.md` files inside `frontend/` and `backend/` extend these rules for each stack.

## 1. Product mission

LumaFlow Studio is a public-beta workflow SaaS for photographers and small studios. It centralizes clients, jobs, bookings, sessions, tasks, quotes, invoices, deliveries, analytics and local AI without trying to replace Lightroom, Capture One, Pixieset or other photo editors/gallery hosts.

Core product principle: **LumaFlow organizes the business and workflow around photography; it does not become a photo editor or primary photo-storage provider.**

Do not add features merely because they are technically interesting. Every product change must map to a documented user problem or an approved GitHub issue.

## 2. Repository architecture

LumaFlow is a monorepo containing two independent applications communicating only through HTTP:

- `frontend/`: React 19 + Vite SPA, JavaScript/JSX, React Router, Tailwind CSS, PWA, WebGPU/WebLLM.
- `backend/`: Laravel 13 REST API, PHP 8.3+, Sanctum, Eloquent, MySQL-compatible production database.
- `docs/`: architecture, API, deployment, AI and roadmap documentation.
- `.github/`: CI, production smoke checks and collaboration templates.

Do not collapse frontend and backend into one framework. Do not migrate to Next.js, TypeScript, another backend framework, another ORM, or another database unless an issue explicitly authorizes that architectural change.

## 3. Source of truth and task intake

Work must start from a GitHub Issue except for trivial documentation or emergency fixes.

Before coding:

1. Read the full issue, acceptance criteria and linked context.
2. Inspect the relevant code and documentation before proposing changes.
3. Identify which existing patterns/services/components should be reused.
4. State assumptions in the PR when requirements are not explicit.
5. Keep scope limited to the issue. Do not silently implement adjacent roadmap work.

If the requested implementation conflicts with the repository architecture, security model, product scope or another accepted issue, stop and surface the conflict rather than working around it silently.

## 4. Branching and pull-request workflow

Never implement feature work directly on `main`.

Branch naming:

- `feat/<short-kebab-name>`
- `fix/<short-kebab-name>`
- `refactor/<short-kebab-name>`
- `docs/<short-kebab-name>`
- `test/<short-kebab-name>`
- `chore/<short-kebab-name>`

One branch should solve one coherent issue. Avoid unrelated cleanup.

Every non-trivial change finishes in a Pull Request. The PR must:

- link the issue (`Closes #123` when appropriate);
- summarize the user-visible and technical changes;
- identify migrations, API contract changes and security implications;
- list validation commands actually run;
- include screenshots/video for visible UI changes;
- call out follow-up work instead of sneaking it into the current scope.

Do not merge code with failing CI.

## 5. Commit convention

Use Conventional-Commit-style messages with an imperative, scoped subject:

- `feat(deliveries): add configurable gallery expiry`
- `fix(auth): hide foreign resources behind 404`
- `refactor(analytics): extract cache invalidation`
- `test(clients): cover cross-user access`
- `docs(workflow): document release process`

Prefer focused commits that represent meaningful checkpoints. Do not use vague messages such as `update`, `changes`, `fix stuff`, `wip` or generated summaries with no domain context.

## 6. Product invariants

Preserve these unless an approved architectural issue explicitly changes them:

- LumaFlow does not store photographers' original photo libraries as its product model.
- External galleries/storage remain first-class delivery providers.
- AI is optional; failure or absence of AI must not block core studio management.
- Main AI inference is local-first through WebGPU/WebLLM where supported.
- User data must remain isolated. Foreign resources must not leak existence.
- The UI and product copy are Spanish-first unless a localization issue says otherwise.
- Demo data must never mix with or expose production user data.
- Beta features should fail safely and communicate limitations clearly.

## 7. Security rules

Treat authorization and tenant isolation as release blockers.

- Never trust ownership IDs supplied by the client.
- Query domain resources through the authenticated owner scope/policy used by the existing module.
- Access to a resource owned by another user must resolve to `404`, not reveal that the resource exists.
- Validate all request input through Laravel validation/Form Requests when applicable.
- Never commit secrets, `.env` files, access tokens, personal client data or real production exports.
- Never log passwords, auth tokens, plaintext personal emails, AI prompts/responses containing user data, or other sensitive payloads.
- Domain/audit logging must use the repository's existing audit/logging abstractions.
- Public-token endpoints (booking, delivery portal, feeds) require explicit abuse, expiry and authorization review.
- Any database migration affecting ownership or authorization requires dedicated tests.

If a task weakens an authorization boundary, do not implement it without explicit issue approval and tests.

## 8. API and database compatibility

The backend API is a contract consumed by the SPA.

When changing API behavior:

1. update backend validation/resource serialization;
2. update the matching frontend API module/hook/component;
3. update tests on both sides where relevant;
4. update `docs/api.md` when the public contract changes.

Avoid breaking response shapes casually. Prefer additive changes where reasonable.

Database migrations must be forward-safe. Never edit an already-applied production migration to change behavior; add a new migration.

Do not invent synthetic analytics when source data no longer exists. Prefer removing or marking unavailable metrics over fabricating them.

## 9. Code-quality rules

Prefer existing abstractions over new parallel ones.

Before introducing a helper, hook, service, component or utility, search for an existing equivalent.

Keep domain logic out of presentation/controller layers:

- Laravel controllers orchestrate; services contain domain behavior.
- React pages compose features; reusable domain UI lives under `features/`; shared behavior belongs in hooks/utilities.

Avoid broad rewrites unless the issue is explicitly a refactor. Preserve public behavior during refactors.

Comments should explain non-obvious constraints or decisions, not restate code.

Identifiers are English. Product copy is Spanish.

## 10. Testing expectations

Tests are part of the implementation, not optional follow-up work.

Minimum expectations when an area changes:

- backend behavior: feature/unit tests as appropriate;
- authorization/ownership: success + foreign-user `404` coverage;
- validation: invalid-input coverage for meaningful constraints;
- frontend business logic: Vitest/Testing Library coverage for hooks, utilities and critical components;
- cross-stack critical user journeys: Playwright coverage in `e2e/` as described in `docs/testing.md`;
- regressions: add a test that would have failed before the fix whenever practical.

Do not delete or weaken tests merely to make CI green.

For cross-stack critical user journeys, prefer adding/maintaining E2E coverage in `e2e/`.

## 11. Required validation

Use pnpm from the repository root. The repository is pinned through `packageManager`.

Setup:

```bash
pnpm install
pnpm run setup
```

Development:

```bash
pnpm run start
```

Before a normal PR, run the checks relevant to the touched code. Before declaring a large/cross-stack task complete, run:

```bash
pnpm run lint
pnpm run test
pnpm run build
```

When the change affects a critical user journey, the frontend, or the API contract, also run the Playwright suite:

```bash
pnpm run test:e2e:install   # once per machine, downloads Chromium
pnpm run test:e2e
```

Backend-only focused checks may use:

```bash
cd backend
php artisan test --filter=<TestName>
php vendor/bin/pint --test
```

Frontend-only focused checks may use:

```bash
pnpm --dir frontend run lint
pnpm --dir frontend run test
pnpm --dir frontend run build
```

Never claim a command passed unless it was actually executed successfully. If a command cannot run in the environment, state that explicitly in the PR/response.

## 12. Documentation discipline

Documentation is part of the product.

Update the relevant docs in the same PR when changing:

- architecture or boundaries → `docs/architecture.md`;
- API contracts → `docs/api.md`;
- persistence/schema concepts → database docs/migrations documentation;
- AI behavior/models/privacy → `docs/ai.md`;
- test strategy, E2E suite or CI coverage → `docs/testing.md`;
- deployment/environment requirements → `docs/deployment.md` and `.env.example`;
- implemented roadmap state → `docs/roadmap.md`;
- contributor/agent workflow → `AGENTS.md`, `CONTRIBUTING.md`, `.github/` templates.

Do not document planned functionality as if it already exists.

## 13. Dependency policy

Do not add a dependency when the platform/framework already solves the problem adequately.

For every new runtime dependency, justify in the PR:

- what problem it solves;
- why current dependencies/platform APIs are insufficient;
- maintenance/security implications;
- bundle/runtime impact where relevant.

Do not perform opportunistic major dependency upgrades inside feature PRs.

## 14. Definition of Done

A task is done only when all applicable items are true:

- acceptance criteria are satisfied;
- implementation follows existing architecture;
- authorization and privacy implications are reviewed;
- tests cover new behavior/regressions;
- lint/tests/build relevant to the change pass;
- documentation is synchronized;
- no debug code, placeholder copy, dead code or exposed secrets remain;
- UI changes handle loading, empty, error and responsive states where applicable;
- PR contains verification evidence and links the issue.

"Code written" is not equivalent to "done".

## 15. Things agents must not do autonomously

Without an explicit issue/approval, do not:

- migrate frameworks/languages/databases;
- introduce payments or production billing;
- change legal/privacy claims;
- change ownership/multi-tenancy semantics;
- delete user data or migrations;
- change production domains/deployment providers;
- replace the local-first AI strategy with a paid external provider;
- add speculative features outside the current issue;
- disable CI/test/security checks.

When in doubt, choose the smallest reversible change that satisfies the issue.
