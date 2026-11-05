# Base de datos

MySQL 8, `utf8mb4_unicode_ci`. Motor de produccion: la analitica agrupa por mes con `DATE_FORMAT` en MySQL y `strftime` equivalente en SQLite (tests/E2E), con identica semantica `YYYY-MM`.

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
| `2026_07_16_000001_consolidate_raw_manager_features` | `quotes`, `quote_items`, `invoices`, `presets` |
| `2026_09_16_000001_delivery_external_gallery` | Elimina `delivery_images`; `deliveries` suma `gallery_provider`, `gallery_password`, `gallery_expires_at` y amplia `gallery_url` a 2048 |
| `2026_08_13_000001_add_onboarding_to_users_table` | Estudio, especialidades, pais, moneda, prioridad y finalizacion del onboarding |
| `2026_08_13_000002_add_activation_to_users_table` | Primer paso, muestra opcional y activacion de reservas |
| `2026_08_13_000003_create_jobs_domain` | Trabajos fotograficos, pipeline, contratos, equipo y enlaces con el resto del dominio |
| `2026_10_03_000001_create_workspaces_table` | `workspaces` + `users.current_workspace_id`, backfill de estudio personal |
| `2026_10_03_000002_add_workspace_id_to_domain_tables` | `workspace_id` aditivo nullable en 18 tablas raiz, backfill desde el propietario |
| `2026_10_05_000001_add_is_demo_to_domain_tables` | `is_demo` en localizaciones, clientes, trabajos, sesiones, entregas y tareas, con backfill de filas de ejemplo |
| `2026_10_06_000001_create_contracts_table` | `contracts` con workspace, cliente, trabajo, presupuesto opcional, snapshot y lifecycle |
| `2026_10_07_000001_create_contract_portal_links_table` | `contract_portal_links` (hash, caducidad, revocación) + `client_message`/`client_responded_at` en contratos |

## Modelo de dominio

```
users ──┬── photography_jobs ──┬── sessions ── checklists ── checklist_items
        │                      ├── tasks
        │                      ├── quotes ── invoice
        │                      ├── deliveries (enlace externo, sin originales)
        │                      └── gear_items (N:M)
        ├── sessions ──┬── checklists ── checklist_items
        │              ├── tasks
        │              └── ai_session_plans
        ├── gear_items ── presets
        ├── locations
        ├── clients ──┬── deliveries (enlace externo, sin originales)
        │             ├── quotes ── quote_items ── invoice
        │             └── invoices
        ├── ai_conversations ── ai_messages
        ├── ai_analyses
        ├── notifications
        └── activities   (morph: subject)
```

Toda tabla de dominio raiz tiene `user_id` con `cascadeOnDelete` y `workspace_id` aditivo nullable con `nullOnDelete`. Durante la transicion (Issue #4) `user_id` sigue siendo la frontera de aislamiento aplicada; `workspace_id` se rellena de forma consistente (trait `BelongsToWorkspace`, backfill en migracion) para preparar el corte completo del Issue #5. `quote_items` y `checklist_items` heredan ownership y no llevan `workspace_id` directo.

La tabla fisica se llama `photography_jobs` para no colisionar con `jobs`, reservada por las colas de Laravel. `Job::$table` conserva el nombre de dominio y la API publica usa `/jobs`. Las relaciones existentes incorporan `job_id` nullable para migrar sin perder datos; la migracion agrupa entregas y sesiones anteriores en trabajos.

`users` conserva el nombre personal en `name` y la identidad comercial en `studio_name`. `photography_specialties` es JSON; `country` usa ISO 3166-1 alfa-2 y `currency` ISO 4217. Las cuentas anteriores a la migracion quedan verificadas y con onboarding completado para no perder acceso; las nuevas comienzan con ambos estados pendientes.

La activacion guarda `getting_started_choice`, `getting_started_completed_at`, `sample_workspace_activated_at` y `bookings_enabled_at`. Los datos demo se crean una sola vez. Las cuentas anteriores se marcan con acceso inicial completado y reservas habilitadas para no romper enlaces ya publicados.

## Workspaces (fundacion, Issue #4)

`workspaces`: `id`, `user_id` propietario (unique, `cascadeOnDelete`), `name`, `slug` unique. `users.current_workspace_id` apunta al estudio activo (nullable, `nullOnDelete`).

Estrategia: migraciones aditivas, sin borrar `user_id` ni datos; `UserObserver::created` + `WorkspaceService::ensureForUser()` (idempotente) para altas; backfill en migracion para cuentas y recursos existentes (`UPDATE ... SET workspace_id = (SELECT current_workspace_id FROM users WHERE ...)` solo en NULL). Tests en `tests/Feature/WorkspaceOwnershipTest.php`.

## Colaboracion (Issue #5)

`workspace_memberships`: `workspace_id` + `user_id` + `role` (`owner/admin/member`), unique por pareja. Todo workspace conserva un owner (backfill desde `workspaces.user_id`). `workspace_invitations`: email, rol, hash SHA-256 del token (plano de 64 caracteres mostrado una sola vez), caducidad de 7 dias y estados `pending/accepted/revoked/expired`.

La numeracion comercial (`quote_number`, `invoice_number`) es por workspace con uniques `(workspace_id, numero)`. `users.current_workspace_id` siempre apunta a un workspace con membership (reparacion al login, en `/user`, al aceptar y al retirar; `PUT /workspace/current` solo entre memberships). Sin selector general visible: la UI solo gestiona miembros del estudio actual.

## Tablas de la fase 9

**`tasks`** — `session_id` y `client_id` nullable con `nullOnDelete`. Enums `priority` (low, medium, high, urgent) y `status` (todo, in_progress, waiting, completed, cancelled). `completed_at` lo mantiene coherente el controlador, no el cliente. Indices: `(user_id, status)`, `(user_id, due_date)`, `(user_id, priority)`.

**`checklists` / `checklist_items`** — `session_id` con `cascadeOnDelete`. Tipos: gear, preparation, editing, delivery, custom. El orden es una columna `position` entera, reordenada en transaccion.

**`activities`** — `morphs('subject')`. Registra `type`, `description` y `properties` (JSON). Indices `(subject_type, subject_id)` via `morphs()`, mas `(user_id, created_at)` y `(user_id, type)`.

**`notifications`** — tabla propia de LumaFlow, no la de `Illuminate\Notifications`. `User::notifications()` sobrescribe deliberadamente la relacion del trait `Notifiable`.

## Relaciones morficas sin FK

`activities` no tiene clave foranea hacia su sujeto. Al borrar una Session, Task, Client o Delivery, el trait `Concerns\CleansUpWorkflowRelations` la limpia en el evento `deleting`.

**Consecuencia practica:** cualquier borrado debe pasar por el modelo. `BulkActionService::delete()` itera y llama a `$model->delete()` en vez de `whereIn()->delete()`, que saltaria el evento.

## Creative Workspace — Sprint 2

Migración aditiva `2026_10_30_000001_add_creative_workspace_to_jobs.php`: mantiene `photography_jobs`, IDs, `client_id` nullable y columnas históricas. Añade `project_type` (varchar 20, `photography` por defecto), `participants`, `external_links`, `briefing` (JSON nullable), `start_date`, `end_date`, `delivery_due_date` (date nullable), `briefing_revision` (unsigned integer, 0 por defecto). Sin backfill del texto de `description`, que conserva su contenido.

Nuevo pivot `job_location`: `job_id` → `photography_jobs`, `location_id` → `locations`, clave primaria compuesta y cascadas al borrar la entidad. No sustituye `location_id` ni `gear_item_job`. La validación y la relación Eloquent exigen coincidencia de workspace; la FK por sí sola no garantiza ese aislamiento.

El briefing 1:1 usa JSON acotado en Job y control optimista de revisión, sin otra tabla de ownership. Los participantes son nombres/roles descriptivos, no cuentas ni permisos. Las fases se derivan del estado existente, sin segunda columna de pipeline.

El test de migración recrea una fila anterior en SQLite sintético y comprueba ID, descripción, estado y presupuesto. El ensayo MySQL/TiDB sigue pendiente: antes de aplicar fuera de tests, ejecutar sobre una copia sintética aislada, verificar defaults/JSON/FKs y recuperación según [runbook](backup-recovery.md). La sesión no ejecuta migraciones de desarrollo ni producción. No usar `down()` como rollback de datos tras guardar metadatos nuevos: retiraría esas columnas; conservar copia recuperable y preferir corrección hacia delante.

## Seeder de desarrollo

Un unico `DatabaseSeeder`. Crea `test@example.com` (password `password`) con dos sesiones, equipo, preset, dos localizaciones, cliente, entrega, presupuesto aceptado, factura, cuatro tareas, tres checklists, actividad y notificaciones.

```bash
php artisan migrate:fresh --seed --force
```

## Producción — Sprint 3

Migración aditiva `2026_10_30_000002_add_production_planning.php`: añade `end_time` (time nullable), `participants` (JSON nullable) e `incidents` (text nullable) a `sessions`, manteniendo IDs, datos, estados y relaciones existentes.

Nueva tabla `shots`: creador/workspace/proyecto con FK; sesión y localización nullable con `nullOnDelete`; escena, descripción, plano, movimiento, focal, segundos estimados, hora prevista, notas, estado, posición y revisión. Índices `(job_id,position,id)` y `(session_id,scheduled_time)`. `gear_item_shot` tiene PK compuesta y FKs con cascada. Borrar una sesión conserva las tomas; borrar proyecto elimina sus tomas. Ni FK simple ni pivot garantizan por sí solos el mismo estudio/proyecto: validación, scopes y guard de traslado de Session completan la integridad.

Los tests ensayan up/down exclusivamente en SQLite sintético y conservan una sesión anterior con notas y Job. Backup/restore también recupera toma, estado, revisión, jornada y equipo. MySQL/TiDB y B2 siguen pendientes según runbook; no usar down como rollback tras incorporar datos reales. Se conserva la estrategia de copia recuperable y corrección hacia delante.

## Plantillas y etapas — Sprint 4

Migración aditiva `2026_11_01_000001_add_project_workflows.php`: `project_templates` (workspace/creador, nombre, descripción, definición JSON, revisión), `postproduction_stages` (workspace/creador/Job, clave única por proyecto, nombre, estado, responsable User nullable, vencimiento/observaciones, orden y revisión) y `project_template_applications` (recibo único por Job/clave de plantilla con nombre, versión, hash y fecha).

Task conserva IDs y campos; añade `stage_id` nullable, `assigned_user_id` nullable, `workflow_phase` nullable y `revision` default 0. Checklist añade `job_id` y `stage_id` nullable: las checklists anteriores siguen ligadas a su sesión. FKs de etapa/responsable son `nullOnDelete`; las checklists de proyecto y etapas se eliminan con el Job. No se publica aquí ninguna operación de borrado de etapas/plantillas; omitir una etapa conserva su contenido.

La integridad entre estudio/proyecto/etapa/sesión se comprueba en Request/modelo y scopes, no solo en FKs simples. Los recibos sobreviven a la edición de una plantilla y conservan la aplicación anterior; no son snapshots completos de todas sus versiones. El dump completo incluye estas tablas automáticamente. El ensayo SQLite recupera definición, recibo, etapas, asignaciones, fechas, tareas y checks. MySQL/TiDB y B2 siguen pendientes; up/down solo se ensaya sobre datos sintéticos. No ejecutar down tras guardar datos reales; requiere copia recuperable y migración hacia delante.

## Base de pruebas

`phpunit.xml` usa SQLite en memoria. Si el PHP local no trae `pdo_sqlite`:

```sql
CREATE DATABASE lumaflow_studio_testing CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

```bash
DB_CONNECTION=mysql DB_DATABASE=lumaflow_studio_testing php artisan test
```

## Revisiones de entrega — Sprint 5

Migración aditiva `2026_11_02_000001_add_delivery_revisions.php`: conserva Delivery, IDs, enlaces y estados comerciales; `client_id` nullable permite entregas personales. Añade `version`, `revision_number`, `review_state` y `portal_revoked_at`. `delivery_revisions` guarda snapshot inmutable de enlace/proveedor/contraseña/fecha/notas, número, autor opcional, UUID/hash de solicitud y marcas legacy/publicación. Únicos por entrega/número y entrega/UUID; FK con borrado en cascada de la entrega, autor nullable al eliminar User. No aloja medios.

El backfill recorre bloques de 100 mediante Query Builder, sin eventos de negocio: captura versión inicial, último comentario y fecha de respuesta anteriores sin cambiar URLs, tokens ni estados. `recorded_at` es la fecha de captura, no una fecha de envío histórica inventada; autor desconocido permanece null. Los borradores históricos no se publican en el portal. Activity conserva el historial de acciones existente y añade número/acción/responsable; no se crea otra tabla de eventos.

La migración es exclusivamente hacia delante: `down()` se niega a eliminar revisiones o imponer NOT NULL sobre clientes. Antes de cualquier activación: copia verificada, ensayo de `up` y restore en MySQL/TiDB aislado, recuentos antes/después e integridad de asociaciones. SQLite sintético valida backfill y recuperación; no acredita MySQL/TiDB. Un rollback de código necesita conservar el esquema aditivo y los datos; no ejecutar down en producción. Tokens y contraseñas externas conservan el almacenamiento legacy: copias y accesos a BD siguen siendo sensibles.
