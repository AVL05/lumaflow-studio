# Frontend AGENTS.md

These rules extend the root `AGENTS.md` for work inside `frontend/`.

## Stack and boundaries

The frontend is a React 19 + Vite SPA written in JavaScript/JSX. Keep it that way unless an approved issue explicitly changes the stack.

Primary structure:

- `src/pages/`: route-level composition.
- `src/features/`: reusable domain UI and feature-specific components.
- `src/api/`: HTTP clients grouped by resource/domain.
- `src/hooks/`: reusable state/data behavior.
- `src/app/`: providers, router and application-wide wiring.
- `src/styles/`: shared styling foundations.

Do not move backend/domain persistence logic into the SPA. The API remains the source of truth for persisted business data.

## React conventions

- Components: `PascalCase.jsx`.
- Hooks: `useThing.js`.
- API modules: domain/resource-oriented names.
- Prefer named exports for reusable components/utilities unless the local file pattern clearly differs.
- Keep page components thin; extract reusable domain UI into `features/`.
- Reuse existing hooks before introducing new data-fetching/state abstractions.
- Avoid global state for local UI state.
- Do not introduce TypeScript as incidental cleanup.

## UI behavior

Every meaningful user-facing flow must consider:

- loading state;
- empty state;
- recoverable error state;
- disabled/submitting state;
- mobile/responsive behavior;
- keyboard/focus behavior for interactive controls;
- accessible labels for non-text controls.

Do not hide backend failures behind fake success states.

Product copy is Spanish-first and should be concise, professional and photography-domain appropriate.

## API usage

All HTTP calls must go through the established API client/modules. Do not scatter raw `fetch`/Axios configuration across components.

When backend response shapes change, update the frontend consumer and tests in the same task.

Treat `401`, `403/404`, `422` and `5xx` as distinct UX cases when they materially affect user action.

## Local AI / WebGPU

- Keep AI optional and lazy-loaded.
- Do not include large model artifacts in the PWA precache.
- Do not send private context to third-party AI providers unless an approved product/security issue explicitly authorizes it.
- Unsupported WebGPU or model-loading failure must degrade gracefully without breaking the rest of LumaFlow.
- Do not claim streaming if the transport is not actually streaming.

## Styling

Use the existing Tailwind CSS 4 conventions and design language. Reuse existing primitives/components before creating variants.

Avoid page-specific CSS duplication where Tailwind/utilities or an existing component solve the problem.

Visible changes require screenshots or video in the PR.

## Testing and validation

Use Vitest and Testing Library.

Prioritize tests for:

- hooks with business behavior;
- form validation/interactions;
- critical reusable components;
- regressions;
- data transformations and calendar/analytics utilities.

Prefer behavior assertions over implementation-detail assertions.

Run, as applicable:

```bash
pnpm --dir frontend run format:check
pnpm --dir frontend run lint
pnpm --dir frontend run test
pnpm --dir frontend run build
```

For substantial frontend work, all four should pass before the task is considered complete.
