# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

LumaFlow Studio: plataforma para fotógrafos. Monorepo de dos apps independientes:

- `backend/` — API Laravel 13 + Sanctum (tokens Bearer), MySQL, storage público, integración Ollama local. **API pura**: sin Blade, sin Vite, sin `resources/`.
- `frontend/` — SPA React 19 + Vite + Tailwind v4, **JavaScript/JSX puro** (no convertir a TypeScript salvo petición explícita).
- `docs/` — documentación técnica real, mantenerla al día con los cambios de contrato.

No mover código a través de la frontera backend/frontend salvo que la arquitectura lo exija.

## Comandos

Raíz: `npm run start` → backend en `127.0.0.1:8000` + frontend en `localhost:5173`, en una sola terminal (concurrently). También `npm run lint`, `npm run format`, `npm run test`, `npm run docker:up`.

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
npm run format   # prettier --write src
npm run test     # vitest
npm run build
```

## Arquitectura backend

Flujo por recurso: `routes/api.php` → `Api/XController` → `XRequest` (validación) → Model con scopes → `XResource` (serialización). La lógica de dominio va en `app/Services`, nunca en controllers.

Convenciones críticas:

- **Multi-tenancy por `user_id`.** Cada controller filtra con el scope `ownedBy(request()->user()->id)` en `index` y crea vía `request()->user()->relacion()->create(...)`. Para `show/update/destroy` hay dos variantes vivas, ambas devolviendo **404, no 403**: los recursos anteriores a la fase 9 usan un `ensureOwnership()` privado con `abort_unless(...)`; los de la fase 9 (tasks, checklists, reminders, notifications) usan `$this->authorizeOwnership('update', $model)` del `Controller` base, que consulta la policy correspondiente en `app/Policies` (todas extienden `OwnedResourcePolicy`, autodescubiertas por Laravel) y convierte el `false` en 404. Preferir la segunda en código nuevo.
- **Relaciones mórficas sin FK.** `activities` y `reminders` apuntan a Session/Task/Client/Delivery/Photo por morph. El trait `Concerns\CleansUpWorkflowRelations` las limpia en el evento `deleting`. Por eso `BulkActionService::delete()` borra modelo a modelo: un `->whereIn()->delete()` por query builder saltaría el evento y dejaría huérfanos.
- Los modelos declaran campos rellenables con el atributo PHP 8 de Laravel 13: `#[Fillable([...])]` sobre la clase, no `protected $fillable`.
- Filtros/búsqueda como scopes de Eloquent (`scopeSearch`, `scopeStatus`, `scopeType`), aplicados con `->when()`.
- Paginación: `paginate(min((int) request('per_page', N), MAX))`.
- `bootstrap/app.php` fuerza respuestas JSON en `api/*` y filtra el reporte de excepciones (validación, auth y 4xx no se registran). CORS en `config/cors.php` leyendo `FRONTEND_URLS`. `supports_credentials` es `false` — la SPA usa tokens Bearer, **no** cookies de sesión Sanctum.
- Migraciones agrupadas por fase (`2026_07_08_00000N_*`), no una por tabla. Un solo seeder: `DatabaseSeeder` (usuario `test@example.com` + datos de ejemplo).

### Seguridad y logging

- Rate limiting: `throttle:10,1` en `/register` y `/login`; `throttle:180,1` en la API autenticada; `throttle:20,1` extra sobre los endpoints de inferencia.
- Todo el logging de dominio pasa por `App\Support\AuditLog` (canal `lumaflow`). **Nunca** registrar passwords, tokens, emails en claro ni prompts/respuestas de IA. El email de un login fallido se guarda como `email_hash`.

### Observabilidad

- `GET /api/health` — público, coarse (solo `status` por sonda), 503 si `down`.
- `GET /api/system` — autenticado, con latencias y detalle. Lo consume `/app/system`.
- `HealthService` sondea API, MySQL, storage, cache y Ollama. Si solo falla Ollama el sistema es `degraded`, nunca `down`.

### Capa IA (Ollama)

`AiController` inyecta 8 servicios. Cadena típica: `AiContextService` (arma contexto compacto desde los datos del usuario y lo trunca a `ollama.max_context`) → `PromptBuilderService` (system prompt en español; para tareas estructuradas emite `jsonTask` con `required_schema`) → `OllamaService` (`chat()` texto libre; `json()` fuerza `format: json` y reintenta extraer el objeto por regex si el modelo mete ruido).

- `OllamaService` lanza `RuntimeException` cuando Ollama no responde; **cada endpoint IA lo captura y devuelve HTTP 503** con `{message}`. Mantener ese contrato.
- `status()` se cachea 15 s y usa un timeout propio de 3 s, no `OLLAMA_TIMEOUT`: el dashboard lo consulta en cada carga.
- Config en `config/ollama.php` (`OLLAMA_URL`, `OLLAMA_MODEL`, `OLLAMA_TIMEOUT`, `OLLAMA_MAX_CONTEXT`).
- El system prompt prohíbe inventar datos y salir del ámbito fotográfico. Al añadir tareas IA, seguir el patrón `jsonTask` + un Resource dedicado.
- **El historial no se acepta del cliente**: `AiChatRequest` solo valida `message` y `conversation_id`; los últimos 12 mensajes salen de la conversación persistida.
- Streaming: `streamingAvailable()` devuelve `true` pero no hay chunked/SSE real; la UI solo simula progresión.

### Capa workflow (fase 9)

- `ActivityLogger` es la única puerta al timeline: se inyecta en Session/Delivery/Photo/Ai/Task controllers y escribe en `activities` con `subject` mórfico. El timeline de una sesión se ancla en la propia `Session`, incluso para fotos y análisis IA (`$photo->session ?? $photo`).
- `NotificationService` escribe en la tabla `notifications`. **Ojo:** `User::notifications()` sobrescribe deliberadamente la relación mórfica de `Illuminate\Notifications\Notifiable`, que el proyecto no usa.
- `AnalyticsService` usa SQL exclusivo de MySQL (`DATE_FORMAT`, `JSON_EXTRACT`) y agrega en base de datos. «Equipo más utilizado» se deriva del EXIF real de las fotos cruzado con el inventario, no de un contador sintético.
- `CalendarService` normaliza cuatro fuentes (session, delivery, task, reminder) al mismo shape `{id: "source-N", source, source_id, date, time, status, meta, url}`. `move()` traduce ese shape al campo de fecha propio de cada modelo.
- `BulkActionService::MATRIX` define qué acción admite cada recurso; `ExportService::COLUMNS` qué columnas se exportan. Ambos son la fuente de verdad para la validación de sus Form Requests.
- `TaskSummaryService` lo comparten el dashboard y `GET /api/tasks/summary`. No volver a cargar el dashboard entero solo para leer totales de tareas.

## Arquitectura frontend

`src/main.jsx` → `app/providers.jsx` (Toast → Auth → Notifications) → `app/router.jsx`. Todas las rutas de producto cuelgan de `/app/*` bajo `ProtectedRoute` + `AppLayout`. Públicas: `/login`, `/register`, `/about-project`. `NotFoundPage` cubre `*` y hace de `errorElement`.

- `src/api/client.js` es el único axios: baseURL `VITE_API_URL` (default `http://localhost:8000/api`), interceptor que inyecta `Bearer` desde `localStorage["lumaflow_token"]` y borra el token en 401. Usar `getApiError(err)` para todos los mensajes de error.
- Un módulo por recurso en `src/api/` exportando `{ list, create, update, remove }`. Ojo al patrón de `list`: con `params` devuelve la respuesta completa (`{data, meta}`), sin `params` devuelve solo `res.data.data`.
- `usePaginatedResource(fetcher, initialFilters)` es la base de las páginas de listado: filtra valores vacíos, resetea a `page: 1` al cambiar filtro y expone `{items, meta, loading, error, updateFilter, setPage, refresh}`. Para recursos no paginados existe `useResource(fetcher)`. Otros hooks compartidos: `useSelection` (acciones masivas), `useHotkey` (`mod+k`, `shift+n`), `useDebouncedValue`, `usePersistedState` (filtros en localStorage bajo el prefijo `lumaflow:`).
- `NotificationsProvider` (dentro de `AuthProvider`) mantiene el contador global y sondea cada 60 s. Es distinto de `ToastContext`, que solo muestra avisos efímeros.
- `CalendarPage`, `AnalyticsPage` y `AboutProjectPage` se cargan con `lazyRoute()` (`app/lazyRoute.jsx`) para sacar Recharts y el calendario del bundle inicial. Mantener ese patrón al añadir páginas pesadas.
- Drag & drop es HTML5 nativo, sin librería: el calendario mueve eventos con el tipo de dato `application/lumaflow-event` (ver `DayDropZone`), y las checklists reordenan items con índices en refs.
- **`Button` no fija `type` a propósito**: varios formularios usan el botón sin `type` como submit implícito. Ponerle `type="button"` por defecto rompería todos los envíos.
- `TaskCard` y `PhotoCard` van envueltas en `memo`; los handlers que reciben deben ir en `useCallback` o la memoización no sirve de nada.
- `MapView` crea la instancia de Leaflet una sola vez por montaje. No meter `center`/`markers`/`zoom` en las dependencias del efecto de creación: destruye y recrea el mapa en cada render y rompe bajo StrictMode.
- `Modal` gestiona Escape, atrapa el foco y devuelve el foco previo al cerrar. Reutilizarlo en vez de montar diálogos a mano.
- Estructura: `components/ui` primitivos, `components/states` (Loading/Error/Empty), `components/layout`, `features/<dominio>` UI de dominio, `pages/` composición.
- Naming: componentes `PascalCase.jsx` (export nombrado, no default), hooks `useThing.js`, api modules por recurso.
- La UI está en español y sin tildes en muchos strings existentes; seguir el estilo del archivo que se toca.

## Tests

- Backend: `tests/Feature` (auth, CRUD, permisos, workflow, health) y `tests/Unit` (policies). 42 tests.
- Frontend: Vitest + Testing Library. Tests junto al código (`*.test.jsx`). 33 tests sobre hooks, `calendarUtils`, `Modal`, `TaskCard` y `ProtectedRoute`.

## Notas

- Los comentarios/copy del producto van en español. Identificadores en inglés.
- Tailwind v4 vía `@tailwindcss/vite` — no hay `tailwind.config.js`; los tokens viven en `src/styles/main.css`.
- Nunca commitear `.env`. `backend/.env` guarda DB/Ollama/storage; `frontend/.env` solo `VITE_API_URL`; el `.env` de la raíz es solo para docker compose.
- `photo_comparisons` (tabla + modelo) está reservado para la UI de comparación before/after del roadmap. No es código muerto.
