# Base de datos

MySQL 8, `utf8mb4_unicode_ci`. Motor unico soportado: la analitica usa `DATE_FORMAT`.

## Migraciones

Agrupadas por fase, no una por tabla:

| Migracion | Contenido |
|---|---|
| `0001_01_01_*` | Laravel: `users`, `password_reset_tokens`, `cache`, `jobs` |
| `2026_07_08_000001_create_lumaflow_tables` | `sessions`, `gear_items`, `ai_analyses` |
| `2026_07_08_000002_upgrade_phase_two_schema` | Ampliacion de columnas de sesiones y equipo |
| `2026_07_08_000004_create_locations_table` | `locations` |
| `2026_07_08_000005_create_clients_and_deliveries_tables` | `clients`, `deliveries` |
| `2026_07_08_000006_upgrade_locations_for_leaflet_planning` | Coordenadas, acceso, clima |
| `2026_07_08_000008_create_ai_conversations_and_session_plans` | `ai_conversations`, `ai_messages`, `ai_analyses`, `ai_session_plans` |
| `2026_07_08_091226_create_personal_access_tokens_table` | Sanctum |
| `2026_07_08_000009_create_workflow_tables` | `tasks`, `checklists`, `checklist_items`, `activities`, `notifications` |
| `2026_07_09_000001_add_client_portal_features` | Portal, reservas y tokens publicos |
| `2026_07_16_000001_consolidate_raw_manager_features` | `quotes`, `quote_items`, `invoices`, `presets`, `delivery_images` |
| `2026_08_13_000001_add_onboarding_to_users_table` | Estudio, especialidades, pais, moneda, prioridad y finalizacion del onboarding |
| `2026_08_13_000002_add_activation_to_users_table` | Primer paso, muestra opcional y activacion de reservas |
| `2026_08_13_000003_create_jobs_domain` | Trabajos fotograficos, pipeline, contratos, equipo y enlaces con el resto del dominio |

## Modelo de dominio

```
users ──┬── photography_jobs ──┬── sessions ── checklists ── checklist_items
        │                      ├── tasks
        │                      ├── quotes ── invoice
        │                      ├── deliveries ── delivery_images
        │                      └── gear_items (N:M)
        ├── sessions ──┬── checklists ── checklist_items
        │              ├── tasks
        │              └── ai_session_plans
        ├── gear_items ── presets
        ├── locations
        ├── clients ──┬── deliveries ── delivery_images
        │             ├── quotes ── quote_items ── invoice
        │             └── invoices
        ├── ai_conversations ── ai_messages
        ├── ai_analyses
        ├── notifications
        └── activities   (morph: subject)
```

Toda tabla de dominio tiene `user_id` con `cascadeOnDelete`. Es la unica frontera de aislamiento entre usuarios.

La tabla fisica se llama `photography_jobs` para no colisionar con `jobs`, reservada por las colas de Laravel. `Job::$table` conserva el nombre de dominio y la API publica usa `/jobs`. Las relaciones existentes incorporan `job_id` nullable para migrar sin perder datos; la migracion agrupa entregas y sesiones anteriores en trabajos.

`users` conserva el nombre personal en `name` y la identidad comercial en `studio_name`. `photography_specialties` es JSON; `country` usa ISO 3166-1 alfa-2 y `currency` ISO 4217. Las cuentas anteriores a la migracion quedan verificadas y con onboarding completado para no perder acceso; las nuevas comienzan con ambos estados pendientes.

La activacion guarda `getting_started_choice`, `getting_started_completed_at`, `sample_workspace_activated_at` y `bookings_enabled_at`. Los datos demo se crean una sola vez. Las cuentas anteriores se marcan con acceso inicial completado y reservas habilitadas para no romper enlaces ya publicados.

## Tablas de la fase 9

**`tasks`** — `session_id` y `client_id` nullable con `nullOnDelete`. Enums `priority` (low, medium, high, urgent) y `status` (todo, in_progress, waiting, completed, cancelled). `completed_at` lo mantiene coherente el controlador, no el cliente. Indices: `(user_id, status)`, `(user_id, due_date)`, `(user_id, priority)`.

**`checklists` / `checklist_items`** — `session_id` con `cascadeOnDelete`. Tipos: gear, preparation, editing, delivery, custom. El orden es una columna `position` entera, reordenada en transaccion.

**`activities`** — `morphs('subject')`. Registra `type`, `description` y `properties` (JSON). Indices `(subject_type, subject_id)` via `morphs()`, mas `(user_id, created_at)` y `(user_id, type)`.

**`notifications`** — tabla propia de LumaFlow, no la de `Illuminate\Notifications`. `User::notifications()` sobrescribe deliberadamente la relacion del trait `Notifiable`.

## Relaciones morficas sin FK

`activities` no tiene clave foranea hacia su sujeto. Al borrar una Session, Task, Client o Delivery, el trait `Concerns\CleansUpWorkflowRelations` la limpia en el evento `deleting`.

**Consecuencia practica:** cualquier borrado debe pasar por el modelo. `BulkActionService::delete()` itera y llama a `$model->delete()` en vez de `whereIn()->delete()`, que saltaria el evento.

## Seeder

Un unico `DatabaseSeeder`. Crea `test@example.com` (password `password`) con dos sesiones, equipo, preset, dos localizaciones, cliente, entrega, presupuesto aceptado, factura, cuatro tareas, tres checklists, actividad y notificaciones.

```bash
php artisan migrate:fresh --seed --force
```

## Base de test

`phpunit.xml` usa SQLite en memoria. Si el PHP local no trae `pdo_sqlite`:

```sql
CREATE DATABASE lumaflow_studio_testing CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

```bash
DB_CONNECTION=mysql DB_DATABASE=lumaflow_studio_testing php artisan test
```
