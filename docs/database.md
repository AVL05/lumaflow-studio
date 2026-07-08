# Base de datos

MySQL 8, `utf8mb4_unicode_ci`. Motor unico soportado: la analitica usa `DATE_FORMAT` y `JSON_EXTRACT`.

## Migraciones

Agrupadas por fase, no una por tabla:

| Migracion | Contenido |
|---|---|
| `0001_01_01_*` | Laravel: `users`, `password_reset_tokens`, `cache`, `jobs` |
| `2026_07_08_000001_create_lumaflow_tables` | `sessions`, `gear_items`, `presets`, `photos` |
| `2026_07_08_000002_upgrade_phase_two_schema` | Ampliacion de presets y fotos |
| `2026_07_08_000003_create_phase_three_tables` | `albums`, `tags`, pivotes, `photo_comparisons` |
| `2026_07_08_000004_create_locations_table` | `locations` |
| `2026_07_08_000005_create_clients_and_deliveries_tables` | `clients`, `deliveries` |
| `2026_07_08_000006_upgrade_locations_for_leaflet_planning` | Coordenadas, acceso, clima |
| `2026_07_08_000008_create_ai_conversations_and_session_plans` | `ai_conversations`, `ai_messages`, `ai_analyses`, `ai_session_plans` |
| `2026_07_08_091226_create_personal_access_tokens_table` | Sanctum |
| `2026_07_08_000009_create_workflow_tables` | `tasks`, `checklists`, `checklist_items`, `activities`, `reminders`, `notifications` |

## Modelo de dominio

```
users ──┬── sessions ──┬── photos ──┬── album_photo ── albums
        │              │            └── photo_tag ── tags
        │              ├── checklists ── checklist_items
        │              ├── tasks
        │              └── ai_session_plans
        ├── gear_items
        ├── presets
        ├── locations ── location_photo ── photos
        ├── clients ── deliveries ── sessions (nullable)
        ├── ai_conversations ── ai_messages
        ├── ai_analyses
        ├── notifications
        ├── activities   (morph: subject)
        └── reminders    (morph: remindable)
```

Toda tabla de dominio tiene `user_id` con `cascadeOnDelete`. Es la unica frontera de aislamiento entre usuarios.

## Tablas de la fase 9

**`tasks`** — `session_id` y `client_id` nullable con `nullOnDelete`. Enums `priority` (low, medium, high, urgent) y `status` (todo, in_progress, waiting, completed, cancelled). `completed_at` lo mantiene coherente el controlador, no el cliente. Indices: `(user_id, status)`, `(user_id, due_date)`, `(user_id, priority)`.

**`checklists` / `checklist_items`** — `session_id` con `cascadeOnDelete`. Tipos: gear, preparation, editing, delivery, custom. El orden es una columna `position` entera, reordenada en transaccion.

**`activities`** — `morphs('subject')`. Registra `type`, `description` y `properties` (JSON). Indices `(subject_type, subject_id)` via `morphs()`, mas `(user_id, created_at)` y `(user_id, type)`.

**`reminders`** — `nullableMorphs('remindable')`. `remind_date` (date) + `remind_time` (time nullable). El resource expone ademas `remind_at` combinado.

**`notifications`** — tabla propia de LumaFlow, no la de `Illuminate\Notifications`. `User::notifications()` sobrescribe deliberadamente la relacion del trait `Notifiable`.

## Relaciones morficas sin FK

`activities` y `reminders` no tienen clave foranea hacia su sujeto. Al borrar una Session, Task, Client, Delivery o Photo, el trait `Concerns\CleansUpWorkflowRelations` limpia ambas tablas en el evento `deleting`.

**Consecuencia practica:** cualquier borrado debe pasar por el modelo. `BulkActionService::delete()` itera y llama a `$model->delete()` en vez de `whereIn()->delete()`, que saltaria el evento.

## Seeder

Un unico `DatabaseSeeder`. Crea `test@example.com` (password `password`) con dos sesiones, equipo, presets, etiquetas, un album, dos localizaciones, un cliente, una entrega, cuatro tareas, tres checklists, dos recordatorios, actividad y notificaciones.

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

## Reservado

`photo_comparisons` existe con su modelo Eloquent, pero la UI de comparacion before/after aun no esta implementada. Ver [roadmap.md](roadmap.md).
