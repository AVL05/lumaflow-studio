# Backend AGENTS.md

These rules extend the root `AGENTS.md` for work inside `backend/`.

## Stack and boundaries

The backend is a Laravel 13 REST API using PHP 8.3+, Sanctum and Eloquent with a MySQL-compatible production database.

Keep business logic out of controllers. The expected flow is:

```text
route -> controller -> FormRequest -> service -> model/scope -> resource
```

Controllers should orchestrate request/response work. Domain rules belong in services or appropriate domain abstractions.

## File placement

Use the existing Laravel layout:

- API controllers: `app/Http/Controllers/Api/`
- validation/request authorization: `app/Http/Requests/`
- API serialization: `app/Http/Resources/`
- policies: `app/Policies/`
- domain/application services: `app/Services/`
- models/scopes/relations: `app/Models/`
- migrations: `database/migrations/`
- factories/seeders: `database/factories/`, `database/seeders/`
- tests: `tests/Feature/`, `tests/Unit/`

Follow local model conventions, including the existing PHP attribute-based fillable declarations where used. Do not replace repository conventions with generic Laravel preferences during unrelated work.

## Ownership and authorization

Ownership isolation is a hard invariant.

- Query resources through the authenticated user ownership scope/policy pattern already used by the module.
- Never authorize ownership solely from IDs sent by the client.
- A foreign resource must not disclose its existence; expected behavior is `404`.
- Every new owned resource needs explicit ownership handling and tests.
- Public token routes must have clearly reviewed token generation, expiry and abuse controls.

Any change to ownership semantics requires dedicated tests and documentation.

## Validation and resources

Use Form Requests where the module architecture does so. Keep validation rules close to API boundaries and avoid duplicating them in controllers.

Return stable API Resources/serialized shapes rather than exposing arbitrary model internals.

When a response contract changes, coordinate the frontend and update `docs/api.md` in the same task.

## Services and side effects

Use existing services and support abstractions before creating another one.

Keep side effects explicit:

- notifications through the established notification layer;
- activities/audit events through the established activity/audit layer;
- exports through export/document services;
- analytics through the analytics service;
- calendar aggregation through the calendar service.

Do not use bulk query deletion when model events are required for cleanup. Respect existing cleanup traits/events for polymorphic workflow relations.

## Database migrations

- Never rewrite an already-applied production migration to alter behavior.
- Add a new migration.
- Foreign keys/indexes should match query/ownership patterns.
- Destructive operations require explicit issue approval and migration/rollback consideration.
- Seeders and fixtures must use fictitious data only.

Production supports MySQL-compatible behavior. Do not introduce database-specific SQL for another engine without an approved portability effort.

## Analytics and performance

Prefer database aggregation over loading entire datasets into PHP memory.

Avoid N+1 queries. Use eager loading intentionally and only for relationships actually needed.

Do not optimize speculatively, but when changing expensive endpoints inspect query behavior and preserve correctness before introducing caching.

Cached derived data requires an explicit invalidation strategy.

## AI backend compatibility

Ollama/backend AI support is optional compatibility, not a critical dependency. AI failure must not mark the core product unavailable.

Do not move local-first WebGPU functionality to a paid/server AI provider without explicit approval.

## Testing

Feature tests should cover API behavior, validation and authorization boundaries. Unit tests should cover isolated service/domain behavior where appropriate.

For bug fixes, add a regression test whenever practical.

For owned resources, test at least:

1. owner can access/modify as intended;
2. foreign authenticated user receives `404`;
3. invalid input receives the expected validation response.

Run, as applicable:

```bash
cd backend
php vendor/bin/pint --test
php artisan test
```

Use focused tests during iteration:

```bash
php artisan test --filter=<TestName>
```

Never weaken assertions merely to satisfy the implementation.
