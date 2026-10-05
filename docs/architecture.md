# Arquitectura

LumaFlow Studio son dos aplicaciones independientes en un monorepo. No comparten codigo ni build: se comunican unicamente por HTTP contra la API REST.

```
lumaflow-studio/
├── backend/     API Laravel 13 (REST, Sanctum, MySQL, compatibilidad Ollama)
├── frontend/    SPA React 19 (Vite, Tailwind 4)
├── e2e/         recorrido criticos con Playwright sobre ambos servicios
├── docs/        esta documentacion
└── docker-compose.yml
```

## Flujo de una peticion

```
Navegador
   │  Authorization: Bearer <token>
   ▼
routes/api.php            middleware auth:sanctum + throttle
   │
   ▼
Api\XController           orquesta, no contiene logica de dominio
   │
   ├─► XRequest           validacion y autorizacion de entrada
   │
   ├─► App\Services\*     logica de dominio
   │
   ├─► Modelo + scopes    accessibleBy(), search(), status() (`ownedBy()` solo legacy)
   │
   ▼
XResource                 serializacion estable hacia el cliente
```

En el frontend el flujo es simetrico:

```
pages/XPage.jsx  ──uses──►  hooks (usePaginatedResource, useResource, useSelection)
       │                             │
       │                             ▼
       └──renders──► features/<dominio>/*   ──calls──►  api/x.js  ──►  api/client.js (axios)
```

## Principios que sostienen el diseño

**Multi-tenancy por workspace con memberships.** `workspaces` es el propietario logico: cada usuario accede solo a workspaces con membership (`owner/admin/member`). La fuente unica es `WorkspaceAuthorizer` (pertenencia, rol, invitacion, retirada); los scopes de lectura usan `accessibleBy($user)` y las policies resuelven por workspace con 404 ante lo ajeno. `user_id` se conserva como creador/compatibilidad; las notificaciones siguen personales.

**404 en lugar de 403.** Devolver 403 sobre un recurso ajeno confirma que existe. Las policies de `app/Policies` extienden `OwnedResourcePolicy` y devuelven `false`; el metodo `authorizeOwnership()` del controlador base traduce ese `false` en un 404. Los recursos anteriores a la fase 9 hacen lo mismo con un `ensureOwnership()` privado.

**La logica vive en servicios.** Los controladores son delgados. `CalendarService`, `AnalyticsService`, `SearchService`, `BulkActionService`, `ExportService`, `CommercialDocumentService`, `ChecklistService`, `ActivityLogger`, `NotificationService`, `HealthService` y la cadena de IA concentran las reglas. Esto permite testear dominio sin HTTP y reutilizar reglas.

**Una entrega es un enlace externo + seguimiento.** LumaFlow no aloja originales: `Delivery` guarda `gallery_url`, `gallery_provider`, `gallery_password` y `gallery_expires_at` junto a estado, aprobacion y portal del cliente. Tus fotografías siguen donde tú decides; LumaFlow guarda bytes, no gigabytes.

**Los modelos WebGPU no forman parte del precache PWA.** El shell es instalable y funciona offline, pero el chunk pesado de WebLLM se descarga solo al abrir el asistente.

**Relaciones morficas sin clave foranea.** `activities` apunta a Session, Task, Client, Delivery o Contract. Al no haber FK, el trait `Concerns\CleansUpWorkflowRelations` la limpia en el evento `deleting`. Por eso `BulkActionService::delete()` borra modelo a modelo: un `whereIn()->delete()` por query builder saltaria el evento y dejaria huerfanos.

**Los contratos (`contracts`) son la fuente canónica del acuerdo**: pertenecen al workspace (más creador por compatibilidad), cuelgan de cliente y trabajo con coherencia validada, y su lifecycle vive en `ContractService` con actividad trazada. Los `contract_*` de `photography_jobs` son espejo legacy unidireccional.

**El portal público de contratos (`contract_portal_links`) separa acceso y contenido**: hash de token + caducidad + revocación con historial; el cliente solo ve el snapshot y responde una vez; el estudio gestiona el enlace desde el detalle con las mismas reglas de membership.

**La agregacion ocurre en la base de datos.** `AnalyticsService` agrupa y cuenta en SQL en vez de cargar colecciones en memoria. Los buckets mensuales usan `DATE_FORMAT` en MySQL y `strftime` equivalente en SQLite. El agregado final se cachea por workspace (`AnalyticsCache`, TTL 300 s) y se invalida por mutación de las entidades que alimentan los KPIs.

**La IA principal corre en WebGPU.** La SPA carga WebLLM bajo demanda y ejecuta la inferencia en el navegador. Ollama queda como compatibilidad backend opcional: si no responde, `HealthService` marca el sistema como `degraded`, nunca como `down`. El historial de conversaciones WebGPU persiste en IndexedDB (`lumaflow-ai:{userId}:{workspaceId}`), nunca en el backend.

**Observabilidad opcional.** Sentry solo si hay DSN; `X-Request-ID` correlaciona cada request API con logs y eventos, con redacción de tokens, PII y contenido IA. Sin DSN todo funciona igual.

**Backups verificables.** `data:backup` / `data:restore` con checksum, retención y drill; nunca en el readiness. Sin runner de cron activo en producción actualmente.

## Mapa del sistema

**Frontend.** React 19 + Vite + JS/JSX + React Router + Tailwind 4 + PWA. WebGPU/WebLLM bajo demanda; historial IA en IndexedDB; Sentry opcional.

**Backend.** Laravel 13 + Sanctum + Eloquent. Autorización por workspace/membership; contratos con lifecycle; caché de analítica; comandos `data:backup` / `data:restore`; Sentry opcional.

**Persistencia.** MySQL compatible como base principal (+ SQLite local/test); Laravel Cache para agregados; IndexedDB del navegador para historial IA; las fotografías originales viven siempre en almacenamiento externo (Drive/Dropbox/Pixieset), nunca en LumaFlow.

**Fronteras de seguridad.** Memberships (`owner/admin/member`); aislamiento por workspace con 404 ante lo ajeno; tokens públicos opacos con hash + caducidad + revocación (portales, invitaciones, calendario); snapshots de contrato congelados; `user_id` conservado como creador.

**Despliegue real.** SPA en Vercel, API en Render (web service, sin cron activo), MySQL compatible en TiDB Cloud. Sin Redis obligatorio, sin APM, sin session replay.

## Limites conscientes

- Sin streaming real de IA: `streamingAvailable()` devuelve `true` pero no hay chunked/SSE; la UI solo simula progresion.
- El exportador generico sigue limitado a CSV/JSON; presupuestos y facturas disponen de PDF especifico mediante Dompdf.

Ver [roadmap.md](roadmap.md).
