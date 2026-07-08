# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

LumaFlow Studio: plataforma para fotógrafos. Monorepo de dos apps independientes:

- `backend/` — API Laravel 13 + Sanctum (tokens Bearer), MySQL, storage público, integración Ollama local.
- `frontend/` — SPA React 19 + Vite + Tailwind v4, **JavaScript/JSX puro** (no convertir a TypeScript salvo petición explícita).
- `scripts/start.ps1` — arranca ambos.

No mover código a través de la frontera backend/frontend salvo que la arquitectura lo exija.

## Comandos

Raíz (Windows/PowerShell): `npm run start` → Laravel en `127.0.0.1:8000` + Vite en `localhost:5173`.

Backend (`cd backend`):

```bash
composer install
php artisan migrate --seed          # requiere DB MySQL `lumaflow_studio` ya creada
php artisan storage:link            # imprescindible para servir fotos subidas
php artisan serve
php artisan test                    # PHPUnit — falla si el PHP local no trae pdo_sqlite
php artisan test --filter=NombreTest

# Este entorno no tiene pdo_sqlite: las pruebas se corren contra MySQL.
DB_CONNECTION=mysql DB_DATABASE=lumaflow_studio_testing php artisan test
vendor/bin/pint                     # formateo PHP, obligatorio antes de entregar
php artisan route:list --path=api
php artisan migrate:fresh --seed --force
```

Frontend (`cd frontend`):

```bash
npm install
npm run dev
npm run lint     # oxlint (no ESLint)
npm run build
```

No hay test runner en frontend: validar con `npm run lint` + `npm run build`.

## Arquitectura backend

Flujo por recurso: `routes/api.php` → `Api/XController` → `XRequest` (validación) → Model con scopes → `XResource` (serialización). La lógica de dominio va en `app/Services`, nunca en controllers.

Convenciones críticas:

- **Multi-tenancy por `user_id`.** Cada controller filtra con el scope `ownedBy(request()->user()->id)` en `index` y crea vía `request()->user()->relacion()->create(...)`. Para `show/update/destroy` hay dos variantes vivas, ambas devolviendo **404, no 403**: los recursos anteriores a la fase 9 usan un `ensureOwnership()` privado con `abort_unless(...)`; los de la fase 9 (tasks, checklists, reminders, notifications) usan `$this->authorizeOwnership('update', $model)` del `Controller` base, que consulta la policy correspondiente en `app/Policies` (todas extienden `OwnedResourcePolicy`, autodescubiertas por Laravel) y convierte el `false` en 404. Preferir la segunda en código nuevo.
- **Relaciones mórficas sin FK.** `activities` y `reminders` apuntan a Session/Task/Client/Delivery/Photo por morph. El trait `Concerns\CleansUpWorkflowRelations` las limpia en el evento `deleting`. Por eso `BulkActionService::delete()` borra modelo a modelo: un `->whereIn()->delete()` por query builder saltaría el evento y dejaría huérfanos.
- Los modelos declaran campos rellenables con el atributo PHP 8 de Laravel 13: `#[Fillable([...])]` sobre la clase, no `protected $fillable`.
- Filtros/búsqueda como scopes de Eloquent (`scopeSearch`, `scopeStatus`, `scopeType`), aplicados con `->when()`.
- Paginación: `paginate(min((int) request('per_page', N), MAX))`.
- `bootstrap/app.php` fuerza respuestas JSON en `api/*`. Middleware vacío; CORS se resuelve en `config/cors.php` leyendo `FRONTEND_URLS` (lista separada por comas). `supports_credentials` es `false` — la SPA usa tokens Bearer, **no** cookies de sesión Sanctum.
- Migraciones agrupadas por fase (`2026_07_08_00000N_*`), no una por tabla. Un solo seeder: `DatabaseSeeder` (usuario `test@example.com` + datos de ejemplo).

### Capa IA (Ollama)

`AiController` inyecta 7 servicios. Cadena típica: `AiContextService` (arma contexto compacto desde los datos del usuario y lo trunca a `ollama.max_context`) → `PromptBuilderService` (system prompt en español; para tareas estructuradas emite `jsonTask` con `required_schema`) → `OllamaService` (`chat()` texto libre; `json()` fuerza `format: json` y reintenta extraer el objeto por regex si el modelo mete ruido).

- `OllamaService` lanza `RuntimeException` cuando Ollama no responde; **cada endpoint IA lo captura y devuelve HTTP 503** con `{message}`. Mantener ese contrato.
- Config en `config/ollama.php` (`OLLAMA_URL`, `OLLAMA_MODEL`, `OLLAMA_TIMEOUT`, `OLLAMA_MAX_CONTEXT`).
- El system prompt prohíbe inventar datos y salir del ámbito fotográfico. Al añadir tareas IA, seguir el patrón `jsonTask` + un Resource dedicado.
- **`AiAssistantService` sigue siendo un mock legacy** (`provider => 'mock'`) y ya no lo usa `AiController`. Las rutas `POST /api/ai/analyze-photo` y `POST /api/ai/assistant` son alias legacy que sí van por Ollama.
- Streaming: `streamingAvailable()` devuelve `true` pero no hay chunked/SSE real; la UI solo simula progresión.

### Capa workflow (fase 9)

- `ActivityLogger` es la única puerta al timeline: se inyecta en Session/Delivery/Photo/Ai/Task controllers y escribe en `activities` con `subject` mórfico. El timeline de una sesión se ancla en la propia `Session`, incluso para fotos y análisis IA (`$photo->session ?? $photo`).
- `NotificationService` escribe en la tabla `notifications`. **Ojo:** `User::notifications()` sobrescribe deliberadamente la relación mórfica de `Illuminate\Notifications\Notifiable`, que el proyecto no usa.
- `AnalyticsService` usa SQL exclusivo de MySQL (`DATE_FORMAT`, `JSON_EXTRACT`) y agrega en base de datos. «Equipo más utilizado» se deriva del EXIF real de las fotos cruzado con el inventario, no de un contador sintético.
- `CalendarService` normaliza cuatro fuentes (session, delivery, task, reminder) al mismo shape `{id: "source-N", source, source_id, date, time, status, meta, url}`. `move()` traduce ese shape al campo de fecha propio de cada modelo.
- `BulkActionService::MATRIX` define qué acción admite cada recurso; `ExportService::COLUMNS` qué columnas se exportan. Ambos son la fuente de verdad para la validación de sus Form Requests.

## Arquitectura frontend

`src/main.jsx` → `app/providers.jsx` (Auth + Toast) → `app/router.jsx`. Todas las rutas de producto cuelgan de `/app/*` bajo `ProtectedRoute` + `AppLayout`.

- `src/api/client.js` es el único axios: baseURL `VITE_API_URL` (default `http://localhost:8000/api`), interceptor que inyecta `Bearer` desde `localStorage["lumaflow_token"]` y borra el token en 401. Usar `getApiError(err)` para todos los mensajes de error.
- Un módulo por recurso en `src/api/` exportando `{ list, create, update, remove }`. Ojo al patrón de `list`: con `params` devuelve la respuesta completa (`{data, meta}`), sin `params` devuelve solo `res.data.data`.
- `usePaginatedResource(fetcher, initialFilters)` es la base de las páginas de listado: filtra valores vacíos, resetea a `page: 1` al cambiar filtro y expone `{items, meta, loading, error, updateFilter, setPage, refresh}`. Para recursos no paginados existe `useResource(fetcher)`. Otros hooks compartidos: `useSelection` (acciones masivas), `useHotkey` (`mod+k`, `shift+n`), `useDebouncedValue`, `usePersistedState` (filtros en localStorage bajo el prefijo `lumaflow:`).
- `NotificationsProvider` (dentro de `AuthProvider`) mantiene el contador global y sondea cada 60 s. Es distinto de `ToastContext`, que solo muestra avisos efímeros.
- `CalendarPage` y `AnalyticsPage` se cargan con `lazyRoute()` (`app/lazyRoute.jsx`) para sacar Recharts y el calendario del bundle inicial. Mantener ese patrón al añadir páginas pesadas.
- Drag & drop es HTML5 nativo, sin librería: el calendario mueve eventos con el tipo de dato `application/lumaflow-event` (ver `DayDropZone`), y las checklists reordenan items con índices en refs.
- `CrudWorkspace` genera CRUD completo (formulario + grid) a partir de `{api, fields, renderCard, defaults}`. Usarlo para recursos simples; las páginas ricas (locations, clients, deliveries) usan componentes propios en `src/features/<dominio>/`.
- Estructura: `components/ui` primitivos, `components/states` (Loading/Error/Empty), `components/layout`, `features/<dominio>` UI de dominio, `pages/` composición.
- Naming: componentes `PascalCase.jsx` (export nombrado, no default), hooks `useThing.js`, api modules por recurso.
- La UI está en español y sin tildes en muchos strings existentes; seguir el estilo del archivo que se toca.

## Notas

- Los comentarios/copy del producto van en español. Identificadores en inglés.
- Tailwind v4 vía `@tailwindcss/vite` — no hay `tailwind.config.js`; los tokens viven en `src/styles/main.css`.
- Nunca commitear `.env`. `backend/.env` guarda DB/Ollama/storage; `frontend/.env` solo `VITE_API_URL`.
