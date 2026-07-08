# Repository Guidelines

## Project Structure & Module Organization

LumaFlow Studio is split into two applications:

- `backend/`: Laravel 13 API with Sanctum auth, controllers, form requests, resources, services, models, migrations, seeders, storage, and PHPUnit tests.
- `frontend/`: React 19 + Vite SPA written in JavaScript, with pages in `src/pages/`, API clients in `src/api/`, shared providers/router in `src/app/`, reusable feature UI in `src/features/`, hooks in `src/hooks/`, and styles in `src/styles/`.
- Root `README.md`: main setup, endpoint, and roadmap reference.

Keep backend and frontend concerns separated. Do not move code across these boundaries unless the architecture explicitly requires it.

## Build, Test, and Development Commands

Backend:

- `cd backend && composer install`: install PHP dependencies.
- `php artisan migrate --seed`: prepare the MySQL database with seed data.
- `php artisan serve`: run the API on `localhost:8000`.
- `php artisan test`: run PHPUnit feature/unit tests.
- `vendor/bin/pint`: format PHP code.

Frontend:

- `cd frontend && npm install`: install SPA dependencies from `package-lock.json`.
- `npm run dev`: run Vite on `localhost:5173`.
- `npm run lint`: run Oxlint.
- `npm run build`: create the production frontend build.

## Coding Style & Naming Conventions

Use JavaScript/JSX in the frontend; do not convert files to TypeScript unless requested. Keep React components in `PascalCase.jsx`, hooks as `useThing.js`, and API modules named after resources, such as `sessions.js` or `photos.js`. Follow the existing Tailwind utility style and shared feature/component structure.

For Laravel, follow framework conventions: controllers in `app/Http/Controllers`, requests in `app/Http/Requests`, resources in `app/Http/Resources`, and domain logic in `app/Services`. Run Pint before submitting PHP changes.

## Testing Guidelines

Backend tests live in `backend/tests/Feature` and `backend/tests/Unit`; add coverage for API behavior, authorization, validation, and service logic when those areas change. The frontend currently has lint/build validation but no test runner configured, so verify UI changes with `npm run lint` and `npm run build`.

## Commit & Pull Request Guidelines

This repository currently has no commit history to infer conventions from. Use short imperative commit messages, for example `Add photo metadata filters` or `Fix session deletion state`. PRs should explain the change, list validation commands run, link related issues when available, and include screenshots for visible UI updates.

## Security & Configuration Tips

Do not commit `.env` files or credentials. Keep API origin values in `frontend/.env` via `VITE_API_URL=http://localhost:8000/api`, and keep Laravel auth/storage/Ollama settings in `backend/.env`.
