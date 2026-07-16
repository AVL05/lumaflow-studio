# Arquitectura

LumaFlow Studio son dos aplicaciones independientes en un monorepo. No comparten codigo ni build: se comunican unicamente por HTTP contra la API REST.

```
lumaflow-studio/
├── backend/     API Laravel 13 (REST, Sanctum, MySQL, compatibilidad Ollama)
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

**La logica vive en servicios.** Los controladores son delgados. `CalendarService`, `AnalyticsService`, `SearchService`, `BulkActionService`, `ExportService`, `CommercialDocumentService`, `DeliveryGalleryService`, `ChecklistService`, `ActivityLogger`, `NotificationService`, `HealthService` y la cadena de IA concentran las reglas. Esto permite testear dominio sin HTTP y reutilizar reglas.

**Una entrega es tambien su galeria.** Las fotografias se relacionan con `Delivery` y reutilizan su token publico, aprobacion y portal. No existe un segundo agregado `Gallery` que pueda desincronizarse de la entrega comercial.

**Los modelos WebGPU no forman parte del precache PWA.** El shell es instalable y funciona offline, pero el chunk pesado de WebLLM se descarga solo al abrir el asistente.

**Relaciones morficas sin clave foranea.** `activities` apunta a Session, Task, Client o Delivery. Al no haber FK, el trait `Concerns\CleansUpWorkflowRelations` la limpia en el evento `deleting`. Por eso `BulkActionService::delete()` borra modelo a modelo: un `whereIn()->delete()` por query builder saltaria el evento y dejaria huerfanos.

**La agregacion ocurre en la base de datos.** `AnalyticsService` agrupa y cuenta en SQL en vez de cargar colecciones en memoria. El coste es acoplarse a MySQL (`DATE_FORMAT`), que es el unico motor soportado.

**La IA principal corre en WebGPU.** La SPA carga WebLLM bajo demanda y ejecuta la inferencia en el navegador. Ollama queda como compatibilidad backend opcional: si no responde, `HealthService` marca el sistema como `degraded`, nunca como `down`.

## Limites conscientes

- Sin streaming real de IA: `streamingAvailable()` devuelve `true` pero no hay chunked/SSE; la UI solo simula progresion.
- El exportador generico sigue limitado a CSV/JSON; presupuestos y facturas disponen de PDF especifico mediante Dompdf.

Ver [roadmap.md](roadmap.md).
