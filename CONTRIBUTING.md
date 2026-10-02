# Contributing to LumaFlow Studio

LumaFlow Studio is developed with an issue-driven workflow. This repository is both a real public-beta product and a professional engineering project, so changes should be traceable from problem to implementation and validation.

## Development workflow

1. **Open or select a GitHub Issue.**
   - Describe the user/problem context.
   - Define scope and non-goals.
   - Add measurable acceptance criteria.
   - Note security, migration or API-contract implications.

2. **Create a focused branch.**

   ```text
   feat/<name>
   fix/<name>
   refactor/<name>
   docs/<name>
   test/<name>
   chore/<name>
   ```

3. **Implement only the agreed scope.**
   - Follow root and nested `AGENTS.md` instructions.
   - Reuse existing architecture and abstractions.
   - Add/update tests alongside behavior.
   - Keep documentation synchronized.

4. **Validate locally.**

   For large/cross-stack changes:

   ```bash
   pnpm run lint
   pnpm run test
   pnpm run build
   ```

   Use focused frontend/backend commands during iteration.

5. **Open a Pull Request.**
   - Link the issue.
   - Explain behavior and architecture changes.
   - List the commands actually run.
   - Add screenshots/video for UI work.
   - Highlight migrations, breaking API changes and security considerations.

6. **Merge only after CI is green.**

## Issue quality

A good issue answers:

- What problem are we solving?
- Who experiences it?
- What is in scope?
- What is explicitly out of scope?
- How will we know the task is complete?
- Does it affect ownership/security?
- Does it change database/API contracts?
- Does it require UI states or migration work?

Avoid implementation-only issues such as "add library X" unless the problem and expected outcome are clear.

## Pull request size

Prefer small, reviewable PRs. A PR should normally solve one issue or one coherent slice of a larger issue.

Split work when independent pieces can be reviewed and deployed safely on their own. Do not split changes so aggressively that intermediate commits/PRs leave the product in a broken state.

## Commit messages

Use scoped Conventional-Commit-style subjects:

```text
feat(bookings): add availability validation
fix(deliveries): prevent expired portal access
refactor(calendar): extract event mapping
test(auth): cover foreign-resource lookup
docs(api): document booking endpoint
```

## Product principles

Contributions should preserve these principles:

- LumaFlow manages the photography workflow, not photo editing.
- Original photo storage remains external-first.
- AI is optional and local-first.
- Core workflows must remain useful without AI.
- User data isolation and privacy are non-negotiable.
- Features should be validated against real photographer workflows rather than feature count.

## Frontend

The SPA uses React 19, Vite, JavaScript/JSX, React Router and Tailwind CSS 4.

Do not introduce TypeScript, Next.js or another state/data framework as incidental cleanup. Follow `frontend/AGENTS.md`.

## Backend

The API uses Laravel 13, PHP 8.3+, Sanctum and Eloquent. Follow the established Controller → FormRequest → Service → Model/Resource architecture and `backend/AGENTS.md`.

Foreign resources should resolve to `404` to avoid leaking existence.

## Documentation

Documentation changes belong in the same PR as the behavior they describe. Never document roadmap functionality as already implemented.

## Security

Never commit secrets, `.env` files, tokens, real customer data or production exports. If you discover a security vulnerability, do not publish exploit details in a public issue; report it privately to the repository owner.
