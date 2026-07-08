# Repository Guidelines

## Project Structure & Module Organization

LumaFlow Studio is split into two applications:

- `backend/`: Laravel 13 REST API with Sanctum auth, controllers, form requests, resources, services, models, policies, migrations, seeders, storage, and PHPUnit tests. It serves no HTML: there is no Blade, no Vite and no `resources/` directory.
- `frontend/`: React 19 + Vite SPA written in JavaScript, with pages in `src/pages/`, API clients in `src/api/`, shared providers/router in `src/app/`, reusable feature UI in `src/features/`, hooks in `src/hooks/`, styles in `src/styles/`, and Vitest tests next to the code they cover.
- `docs/`: technical documentation (architecture, api, database, frontend, backend, ai, deployment, roadmap). Keep it in sync with contract changes.
- Root `README.md`: setup, modules, scripts and Docker reference.

Keep backend and frontend concerns separated. Do not move code across these boundaries unless the architecture explicitly requires it.

## Build, Test, and Development Commands

Root (single terminal):

- `npm install && npm run setup`: install everything and prepare the database.
- `npm run start`: run backend on `:8000` and frontend on `:5173` concurrently.
- `npm run lint` / `npm run format` / `npm run test`: run both stacks.
- `npm run docker:up`: full stack with MySQL and phpMyAdmin.

Backend:

- `cd backend && composer install`
- `php artisan migrate --seed`, `php artisan storage:link`
- `php artisan test`, `php artisan test --filter=AuthTest`
- `vendor/bin/pint`: format PHP. Mandatory before submitting.

If the local PHP lacks `pdo_sqlite`, run the suite against MySQL:
`DB_CONNECTION=mysql DB_DATABASE=lumaflow_studio_testing php artisan test`

Frontend:

- `cd frontend && npm install`
- `npm run dev`, `npm run lint` (oxlint), `npm run format` (Prettier), `npm run test` (Vitest), `npm run build`

## Coding Style & Naming Conventions

Use JavaScript/JSX in the frontend; do not convert files to TypeScript unless requested. Keep React components in `PascalCase.jsx` with named exports, hooks as `useThing.js`, and API modules named after resources. Follow the existing Tailwind utility style and the `components/` + `features/` split.

For Laravel, follow framework conventions: controllers in `app/Http/Controllers/Api`, requests in `app/Http/Requests`, resources in `app/Http/Resources`, policies in `app/Policies`, and domain logic in `app/Services`. Models declare fillable fields with the PHP 8 attribute `#[Fillable([...])]`, not `protected $fillable`.

Product copy and comments are in Spanish; identifiers in English.

## Testing Guidelines

Backend tests live in `backend/tests/Feature` and `backend/tests/Unit`. Cover API behavior, authorization (foreign resources must answer 404, not 403), validation, and service logic when those areas change.

Frontend tests use Vitest and Testing Library, colocated as `*.test.jsx`. Prioritize hooks, pure utilities and critical components over full-page coverage.

## Commit & Pull Request Guidelines

Use imperative commit messages scoped by area: `feat(calendar): ...`, `fix(auth): ...`, `release(v1): ...`. PRs should explain the change, list the validation commands run, link related issues, and include screenshots for visible UI updates.

## Security & Configuration Tips

Never commit `.env` files or credentials; only `.env.example`. Frontend origin lives in `frontend/.env` (`VITE_API_URL`); Laravel auth/storage/Ollama settings in `backend/.env`; the root `.env` is only for docker compose.

All domain logging goes through `App\Support\AuditLog`. Never log passwords, tokens, plaintext emails, or AI prompts and responses.
