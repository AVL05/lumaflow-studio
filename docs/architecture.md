# Arquitectura

LumaFlow Studio son dos aplicaciones independientes en un monorepo. No comparten codigo ni build: se comunican unicamente por HTTP contra la API REST.

```
lumaflow-studio/
├── backend/     API Laravel 13 (REST, Sanctum, MySQL, Ollama)
├── frontend/    SPA React 19 (Vite, Tailwind 4)
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
   ├─► Modelo + scopes    ownedBy(), search(), status()
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

**Multi-tenancy por `user_id`.** No hay tabla de tenants ni middleware de scoping global. Cada consulta parte del scope `ownedBy(request()->user()->id)`, y cada creacion cuelga de la relacion del usuario (`$request->user()->sessions()->create(...)`). Es explicito y auditable en cada controlador.

**404 en lugar de 403.** Devolver 403 sobre un recurso ajeno confirma que existe. Las policies de `app/Policies` extienden `OwnedResourcePolicy` y devuelven `false`; el metodo `authorizeOwnership()` del controlador base traduce ese `false` en un 404. Los recursos anteriores a la fase 9 hacen lo mismo con un `ensureOwnership()` privado.

**La logica vive en servicios.** Los controladores son delgados. `CalendarService`, `AnalyticsService`, `SearchService`, `BulkActionService`, `ExportService`, `ChecklistService`, `ActivityLogger`, `NotificationService`, `HealthService` y la cadena de IA concentran las reglas. Esto permite testear dominio sin HTTP y reutilizar (el resumen de tareas lo consumen el dashboard y la pagina de tareas a traves de `TaskSummaryService`).

**Relaciones morficas sin clave foranea.** `activities` y `reminders` apuntan a Session, Task, Client, Delivery o Photo. Al no haber FK, el trait `Concerns\CleansUpWorkflowRelations` las limpia en el evento `deleting`. Por eso `BulkActionService::delete()` borra modelo a modelo: un `whereIn()->delete()` por query builder saltaria el evento y dejaria huerfanos.

**La agregacion ocurre en la base de datos.** `AnalyticsService` agrupa y cuenta en SQL en vez de cargar colecciones en memoria. El coste es acoplarse a MySQL (`DATE_FORMAT`, `JSON_EXTRACT`), que es el unico motor soportado.

**Ollama es opcional y degrada.** Si el modelo local no responde, `OllamaService` lanza `RuntimeException`, los endpoints de IA devuelven 503 y el resto de la aplicacion sigue funcionando. `HealthService` marca el sistema como `degraded`, nunca como `down`, cuando solo falla la IA.

## Limites conscientes

- Sin colas ni jobs: los recordatorios se muestran, no se envian.
- Sin streaming real de IA: `streamingAvailable()` devuelve `true` pero no hay chunked/SSE; la UI solo simula progresion.
- Sin exportacion PDF: `ExportService` solo acepta `csv` y `json`.
- `photo_comparisons` existe en el esquema y tiene modelo, pero la UI de comparacion before/after esta en el roadmap.

Ver [roadmap.md](roadmap.md).
