# Arquitectura

LumaFlow Studio son dos aplicaciones independientes en un monorepo. No comparten codigo ni build: se comunican unicamente por HTTP contra la API REST.

## HTML comercial y SPA privada — implementación local SEO P0/P1

El frontend conserva React/Vite y React Router. `src/app/seo.js` define seis páginas indexables: `/`, `/features`, `/pricing`, `/privacy`, `/about-project` y `/support`. `scripts/publicSeo.mjs` renderiza sus componentes durante `vite build`, con el mismo árbol inicial de providers y rutas, y emite metadatos, robots y sitemap. No hay servidor SSR en ejecución ni consultas de negocio durante el render de build.

Las páginas marcadas `data-prerendered` se hidratan; acceso, CRM, demo y portales usan `app-shell.html` con raíz vacía, sin canonical y con `noindex`. `RouteMetadata` actualiza head al navegar. Las guardias, tokens y autorización Laravel conservan su comportamiento. El sitemap nunca se obtiene de registros del CRM.

El HTML definitivo se emite antes de que Workbox calcule sus revisiones. Su fallback de navegación apunta al shell operativo solo para rutas conocidas; páginas comerciales usan los documentos precacheados y las desconocidas conservan su 404 online. La respuesta de API no se cachea. Vercel/Nginx separan archivos públicos, alias, shell y 404. Evidencia y límites: [auditoría SEO/GEO](SEO_GEO_AUDIT.md#13-implementación-local-p0p1).

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

`BelongsToWorkspace` valida las referencias al guardar y aplica el scope global de integridad al leer, con subconsultas EXISTS por clave relacionada. También protege registros anteriores mal asociados sin migrarlos ni borrarlos. Las actividades comprueban el workspace de su sujeto y el equipo del trabajo comprueba el pivot. Esto complementa las policies y `accessibleBy`, no los sustituye. Las escrituras SQL directas pueden eludir eventos del modelo: no utilizarlas para asociaciones de dominio sin validación equivalente.

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

## Creative Workspace y briefing manual — Sprint 2

Job sigue siendo el agregado, con la misma tabla y API. `JobRequest` valida metadatos y asociaciones del workspace; `JobController` persiste organización y pivots en transacción. `JobWorkflowService::phaseFor()` deriva preparación/producción/postproducción/entrega del pipeline existente. Los proyectos personales no requieren cliente; los audiovisuales/personales con workflow general reciben tareas de preparación genéricas, conservando las plantillas fotográficas.

`ProjectBriefingRequest` autoriza y valida un esquema cerrado; `ProjectBriefingService` usa actualización condicional por revisión y transacción para impedir sobreescrituras de un briefing obsoleto. Se utiliza JSON en Job por su relación 1:1 y tamaño limitado, evitando una segunda frontera de ownership. `ActivityLogger` recibe solo el evento constante, nunca los textos privados. Description permanece independiente. Sin IA, adjuntos, procesamiento ni almacenamiento de medios.

La SPA conserva `/app/jobs` y el API histórico. El listado usa paginación opt-in; los selectores específicos de proyecto consultan candidatos paginados del workspace correspondiente. El detalle separa resumen, briefing, planificación, entregas y gestión comercial. Reutiliza sesiones, tareas, equipo, localizaciones, contratos, presupuestos, facturas y entregas. Los borradores se mantienen entre pestañas y ante errores; la navegación confirma su descarte. El briefing añade control de revisión; la edición general mantiene el comportamiento de actualización anterior y no incorpora edición colaborativa en tiempo real.

## Componentes del sistema

**Frontend.** React 19 + Vite + JS/JSX + React Router + Tailwind 4 + PWA. WebGPU/WebLLM bajo demanda; historial IA en IndexedDB; Sentry opcional.

**Backend.** Laravel 13 + Sanctum + Eloquent. Autorización por workspace/membership; contratos con lifecycle; caché de analítica; comandos `data:backup` / `data:restore`; Sentry opcional.

**Persistencia.** MySQL compatible como base principal (+ SQLite local/test); Laravel Cache para agregados; IndexedDB del navegador para historial IA; las fotografías originales viven siempre en almacenamiento externo (Drive/Dropbox/Pixieset), nunca en LumaFlow.

**Fronteras de seguridad.** Memberships (`owner/admin/member`); aislamiento por workspace con 404 ante lo ajeno; contratos e invitaciones con tokens hasheados. Entregas y calendario conservan sus tokens legacy en base de datos por compatibilidad: no afirmar que todos los tokens públicos están hasheados. Las entregas limitan acceso por estado/caducidad; los contratos conservan snapshot congelado y revocación explícita. `user_id` se conserva como creador.

**Respuestas públicas transaccionales.** `PublicDeliveryService` aplica actualizaciones condicionales; `ContractPortalService` adquiere bloqueo antes de resolver el estado. La decisión y sus actividades/notificaciones son atómicas e idempotentes. Tests con dos procesos reales SQLite cubren seis carreras; la validación con MySQL/TiDB queda pendiente de un entorno aislado.

**Despliegue real.** SPA en Vercel, API en Render (web service, sin cron activo), MySQL compatible en TiDB Cloud. Sin Redis obligatorio, sin APM, sin session replay.

## Limites conscientes

- Sin streaming real de IA: `streamingAvailable()` devuelve `true` pero no hay chunked/SSE; la UI solo simula progresion.
- El exportador genérico sigue limitado a CSV/JSON; presupuestos, facturas y planes de producción disponen de PDF específico mediante Dompdf.

## Producción — Sprint 3

`Shot` es el único modelo de dominio nuevo: pertenece a Job y opcionalmente a Session/Location, con equipo mediante pivot. Reutiliza `BelongsToWorkspace` y filtra también integridad sesión/proyecto. `ShotRequest` autoriza antes de validar; `ShotResource` limita campos. `ProductionService` serializa escrituras de lista con bloqueo de Job; revisión del contenido de toma evita pérdida de notas. En SQLite se adquiere primero bloqueo de escritura (FOR UPDATE se ignora allí); pruebas con dos procesos cubren orden, altas y conflicto de notas. Falta verificar semántica nativa MySQL/TiDB en entorno autorizado.

Las jornadas reutilizan Session, calendario, tareas y checklists. Crear jornada añade checklists mínimas de preparación/recogida a través de `ChecklistService`; editar reutiliza `SessionController` para conservar lifecycle comercial. Las sesiones no se pueden trasladar con tomas asignadas. Los participantes son snapshots descriptivos del equipo humano del proyecto, no memberships ni notificaciones.

La hora final se valida también en el modelo para proteger rutas existentes como el drag del calendario. `CalendarService` añade `meta.end_time` e incluye el último día completo del rango (regresión reproducida en SQLite). `IcsFeedService` usa la hora final cuando existe y mantiene una hora para sesiones antiguas; no exporta notas ni amplía el permiso del token.

`ProductionWorkspace` se importa dinámicamente cuando se abre «Tomas y rodaje», conservando borradores al cambiar de sección y conectando su guardia de salida con el detalle existente. Listas paginadas, botones táctiles/teclado para orden y estados rápidos, sin librería DnD nueva. `ProductionDocumentService` reutiliza Dompdf, renderizado escapado, recursos remotos desactivados y rate limit separado. Sin uploads, IA ni servicios nuevos. Planes impresos son snapshots; no se sincronizan solos.

Ver [roadmap.md](roadmap.md).

## Plantillas y postproducción — Sprint 4

`JobWorkflowService` conserva seeding/catálogo legacy y añade previsualización/aplicación de plantillas y operaciones de etapas. Dos modelos nuevos necesarios: `ProjectTemplate` (definición reutilizable privada por workspace) y `PostproductionStage` (seguimiento del Job). Task y Checklist se amplían, no se reemplazan. El recibo único `(job_id,template_key)` evita aplicaciones duplicadas incluso concurrentes. No se crean participantes, equipo, sesiones, tomas, fechas o contenidos de briefing al aplicar.

Las nueve definiciones iniciales viven en `config/project_templates.php`. Sus tareas se agrupan en las fases creativas existentes; las etapas de postproducción son seguimiento interno, independiente del estado comercial y de la aprobación pública del cliente. Las plantillas propias se guardan en DB con revisión; guardarlas no modifica proyectos anteriores. Aplicar es aditivo: clave de etapa/título normalizado/nombre de checklist permiten reutilizar datos sin reiniciar estados o fechas. Un fingerprint de previsualización detecta cambios que alteran lo que se creará; un cambio obsoleto devuelve 409.

Las checklists reutilizadas reciben solo controles faltantes por título normalizado; se conserva su ubicación y los controles completados. La previsualización distingue acciones por control y contempla el contenido existente en su fingerprint. Las aplicaciones usan límite específico de peticiones y un presupuesto de definición para contener el coste en infraestructura gratuita.

Mutaciones serializadas mediante el bloqueo de proyecto ya utilizado en producción. Las tareas admiten revisión optimista opcional por compatibilidad; los módulos frontend la envían al editar. Etapas y plantillas la exigen. Task/ChecklistItem invalidan progreso/revisión de etapa; reabrir trabajo pendiente reabre una etapa completada. La finalización comprueba pendientes y hace actualización condicional por revisión. Las asignaciones se validan contra memberships del estudio. El trait de integridad compartido protege etapa/proyecto y sesión/proyecto para los recursos vinculados a etapas.

`PostproductionWorkspace` se carga dinámicamente; el catálogo se consulta al abrir Plantillas. Reutiliza TaskForm, APIs/servicios de tareas/checklists, Modal y la guardia de salida del detalle. Los endpoints anidados de alta derivan workspace y proyecto de la ruta autorizada, sin depender del estudio activo del creador. La interfaz no promete sincronización offline, cronograma automático ni versionado histórico completo de plantillas.

## Revisiones y portal — Sprint 5

Delivery continúa como agregado de entrega. DeliveryRevision contiene únicamente snapshots de metadatos y enlaces externos; Activity registra acciones y sus responsables. DeliveryRevisionService centraliza edición compatible, publicación, respuestas, acceso al portal e integración con postproducción; PublicDeliveryService conserva resolución y métodos legacy delegados. Los controladores y DeliveryReviewRequest solo orquestan/validan. No se añade proveedor ni proceso de medios.

Se conserva el estado comercial y se separa review_state. Escrituras toman el bloqueo de Job antes de Delivery; la versión evita sobrescrituras del estudio y la revisión consultada evita aprobar un enlace sustituido. Token/expiración/revocación se verifican de nuevo dentro de la transacción. Contenido de revisiones inmutable, historial paginado, acciones idempotentes y notificaciones atómicas. Borradores internos no se serializan al portal. Tras existir una revisión publicada, su contexto de proyecto/cliente/sesión queda fijo, incluso tras volver a borrador.

La vista de seguimiento se reutiliza entre detalle privado y portal y se carga mediante import dinámico. El portal conserva sus URLs, muestra recepción explícita y distingue fallos de conexión de enlaces inexistentes. La caducidad controla LumaFlow, nunca la disponibilidad del proveedor. La sincronización solo modifica etapas ya existentes y no completa tareas/checks pendientes; no se generan etapas ni recursos ficticios.
