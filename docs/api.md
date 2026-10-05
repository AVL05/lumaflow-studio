# API

Base: `http://localhost:8000/api`. Todas las respuestas son JSON.

## Autenticacion

Sanctum con **tokens Bearer**, no cookies de sesion. El token se obtiene en `register` o `login` y viaja en cada peticion:

```http
Authorization: Bearer <token>
```

Un `login` invalida los tokens anteriores del usuario (sesion unica). Un 401 indica token ausente, revocado o invalido. La SPA solo destruye la sesion local ante 401; ante 5xx, red o throttling conserva el token y muestra estado degradado con reintento.

| Metodo | Ruta | Auth | Notas |
|---|---|---|---|
| POST | `/register` | no | Crea una cuenta sin verificar, envia el email y devuelve `{user, token}` |
| POST | `/login` | no | `throttle:10,1`. Mismo error exista o no el email |
| POST | `/logout` | si | Revoca el token en uso |
| GET | `/user` | si | Estado de verificacion, onboarding y preferencias del usuario |
| GET | `/email/verify/{id}/{hash}` | firma temporal | Verifica el email y redirige a la SPA |
| POST | `/email/verification-notification` | si | Reenvia el enlace, `throttle:6,1` |
| POST | `/onboarding` | si, email verificado | Guarda estudio, especialidades, pais, moneda y primera prioridad |
| POST | `/getting-started` | si | Elige `create_first_job`, `sample_workspace`, `import_clients` o `later` |

Los recursos de producto requieren email verificado y onboarding completado. Una cuenta pendiente puede usar `/user`, `/logout`, el reenvio de verificacion y `/onboarding` cuando corresponda. El enlace de email caduca a los 60 minutos y su firma impide alterar el usuario o el hash.

`sample_workspace` crea de forma idempotente clientes, trabajos, sesiones, tareas, localizacion y entrega ficticios marcados con `is_demo`. No genera estados entregados, no activa reservas y no cuenta como progreso de activación: el checklist solo cuenta recursos reales (`is_demo = false`) y la UI los distingue con la insignia «Ejemplo». No falsea el hito operativo.

## Salud y sistema

| Metodo | Ruta | Auth | Notas |
|---|---|---|---|
| GET | `/health` | no | Coarse. 200 si operativo, 503 si `down`. Solo expone `status` por sonda |
| GET | `/system` | si | Detalle: latencias, driver, version, modelo de IA |
| GET | `/up` | no | Sonda nativa de Laravel |

`status` global: `up` (todo bien), `degraded` (solo compatibilidad Ollama backend caida), `down` (alguna dependencia critica).

## Recursos

Todos los listados aceptan `page`, `per_page` (acotado) y devuelven `{data, links, meta}`. Los recursos ajenos responden **404, no 403**.

La frontera de autorizacion es la **membership del workspace** (`WorkspaceAuthorizer`): un usuario accede a un recurso solo si pertenece a su workspace, aunque no sea quien lo creo. `user_id` se conserva como creador/compatibilidad. Las notificaciones siguen siendo bandeja personal por `user_id`.

### Estudio compartido

| Metodo | Ruta | Quien | Notas |
|---|---|---|---|
| GET | `/workspace/members` | miembro+ | Miembros del workspace actual con rol |
| PUT | `/workspace/current` | miembro+ | Cambia el workspace actual (solo con membership, ajeno → 404) |
| DELETE | `/workspace/members/{user}` | segun reglas | Owner retira admin/member; admin retira member; member nada |
| GET | `/workspace/invitations` | owner/admin | Pendientes del workspace actual |
| POST | `/workspace/invitations` | owner/admin | `{email, role: admin\|member}`; owner invita admin/member, admin solo member. Devuelve el token una sola vez en `meta.token` |
| DELETE | `/workspace/invitations/{invitation}` | owner/admin | Revoca pendientes |
| POST | `/workspace/invitations/accept` | miembro potencial | `{token}`; crea la membership una sola vez, exige email coincidente |

Permisos: **owner** accede, lista, invita (admin/member), revoca y retira; **admin** accede, lista, invita (member), revoca y retira member (nunca al owner, sin auto-elevacion); **member** trabaja con los recursos sin administrar miembros. Invitaciones con token aleatorio de 64 caracteres (hash SHA-256 en base), caducidad de 7 dias, un solo uso y estados `pending/accepted/revoked/expired`. El email de aviso queda como follow-up: el token se comparte desde la UI de configuracion.

| Recurso | Rutas | Filtros de `index` |
|---|---|---|
| Jobs | `apiResource /jobs`, `GET /jobs/workflows` | `search`, `status`, `specialty` |
| Sessions | `apiResource /sessions` | `search`, `status`, `type`, `sort`, `direction` |
| Gear | `apiResource /gear` | `search`, `category`, `condition`, `favorite` |
| Locations | `apiResource /locations` | `search`, `city`, `type`, `access_difficulty`, `access_mode`, `favorite`, `latitude`, `longitude`, `radius_km` |
| Clients | `apiResource /clients` | `search`, `status`, `sort`, `direction` |
| Deliveries | `apiResource /deliveries` | `search`, `status`, `client_id` |
| Quotes | `apiResource /quotes`, `PATCH /quotes/{quote}/status`, `GET /quotes/{quote}/pdf` | `search`, `status`, `sort`, `direction` |
| Contracts | `apiResource /contracts`, `PATCH /contracts/{contract}/status` | `search`, `status`, `job_id`, `sort`, `direction` |
| Invoices | `GET/POST /invoices`, `PATCH /invoices/{invoice}/status`, `GET /invoices/{invoice}/pdf` | `status` |
| Presets | `apiResource /presets` sin `show` | `search`, `category` |
| Tasks | `apiResource /tasks` + `GET /tasks/summary` | `search`, `status`, `priority`, `due_from`, `due_to`, `session_id`, `client_id`, `open` |

### Entregas por enlace externo

`Delivery` no aloja originales. Guarda `gallery_url` (max 2048), `gallery_provider` (Pixieset,
Pic-Time, Lightroom, Drive, Dropbox, OneDrive, WeTransfer u otro), `gallery_password` opcional y
`gallery_expires_at` opcional, junto a estado, `client_message` y `client_responded_at` para la
aprobacion. El portal publico (`/public/deliveries/{token}`) muestra el enlace y la contraseña
para que el cliente revise en su galeria y vuelva a aprobar o pedir cambios.

Los PDF de presupuestos y facturas son documentos descargables autenticados. No forman parte del exportador generico CSV/JSON.

### Contratos

`Contract` es la fuente canónica del acuerdo con el cliente (trabajo + cliente + presupuesto opcional). Lifecycle `draft → sent → accepted|rejected|expired`, sin retornos y con terminales protegidos; solo transiciones explícitas por `PATCH /contracts/{contract}/status`, nunca `status` arbitrario por CRUD.

- Borrador editable y eliminable; enviado solo admite caducidad con el resto idéntico; terminales inmutables.
- Al enviar se congela `content_snapshot` y sube `version`; numeración `CON-AAAA-####` por workspace.
- Contenido Markdown controlado (sin HTML; se rechazan `script/iframe/object/embed/form` e imágenes/enlaces HTML). Si se deja vacío, se genera contenido neutro editable desde trabajo/cliente/presupuesto, sin valor jurídico.
- Aceptar sincroniza el espejo legacy del trabajo (`contract_status=signed`, `contract_signed_at`); rechazar marca `declined`. Los campos legacy `contract_*` de `photography_jobs` se conservan por compatibilidad y podrán eliminarse en un Issue posterior; `contract_url` sigue siendo un enlace externo manual.
- Actividad `created` + `status_changed` sobre el contrato. Sin portal público, firma electrónica ni pagos: llegarán en el #8.

### Portal público de contratos

Enlace opaco por contrato (`/contract/{token}` en la SPA): el token plano de 64 caracteres solo se muestra al generar/regenerar; en base vive su hash SHA-256 con caducidad (30 días por defecto, configurable) y revocación. Regenerar invalida el anterior de inmediato; revocar bloquea todo sin cambiar el estado del contrato.

| Metodo | Ruta | Notas |
|---|---|---|
| GET | `/public/contracts/{token}` | Vista del snapshot congelado; uniforme 404 si desconocido, revocado, expirado o borrador |
| POST | `/public/contracts/{token}/accept` | Solo `sent` → `accepted`; doble envío idempotente (`meta.already_processed`) |
| POST | `/public/contracts/{token}/reject` | `{message?}` máx. 2000, sin HTML; → `rejected` con comentario visible interno |

El portal expone solo número, título, snapshot, estado, versión, estudio, cliente, servicio, fechas y decisión. Nunca IDs internos, workspace, emails, notas privadas ni tokens. Rate limiting `throttle:30,1` como el resto de superficie pública. La aceptación/rechazo reutiliza `ContractService` (misma máquina de estados), notifica al estudio y registra actividad. Estados terminales: lectura final sin acciones.

Auditoría mínima: timestamps de envío/decisión/uso y comentario de rechazo. Sin IP, user-agent ni fingerprinting. Se registra una aceptación simple, no una firma electrónica certificada.

### Checklists

| Metodo | Ruta |
|---|---|
| GET | `/checklists` (`session_id`, `type`), `/checklists/templates`, `/checklists/{checklist}` |
| POST | `/checklists` (`use_template` rellena desde plantilla), `/checklists/{checklist}/duplicate`, `/checklists/{checklist}/items` |
| PUT | `/checklists/{checklist}`, `/checklists/{checklist}/reorder` (`items: [id, ...]`), `/checklist-items/{item}` |
| PATCH | `/checklist-items/{item}/toggle` |
| DELETE | `/checklists/{checklist}`, `/checklist-items/{item}` |

### Workflow

`/jobs` es el agregado central. Su detalle incluye cliente, localizacion, equipo, sesiones, presupuestos, facturas, tareas, entregas y timeline. Pipeline: `lead → quoted → contract_pending → confirmed → preparation → shoot → editing → review → delivered → closed`; `cancelled` queda fuera del avance normal. Aceptar un presupuesto avanza a contrato, pagar una factura confirma el trabajo y los estados de sesion/entrega adelantan produccion sin permitir regresiones automaticas.

| Metodo | Ruta | Notas |
|---|---|---|
| GET | `/dashboard` | Metricas, agenda del dia, tareas, progreso mensual, timeline |
| POST | `/activation/bookings` | Activa el enlace publico de reservas y devuelve el checklist actualizado |
| POST | `/activation/sample-workspace` | Carga una unica vez los datos ficticios opcionales |
| POST | `/clients/import` | Importa hasta 250 clientes y omite emails existentes |
| GET | `/calendar` | Requiere `from` y `to`. Opcional `sources=session,delivery,task` |
| PATCH | `/calendar/move` | `{source, source_id, date, time?}`. Reprogramacion por drag & drop |
| GET | `/activities` | Feed global. Filtro `type` |
| GET | `/sessions/{session}/timeline` | Timeline cronologico de una sesion |
| GET | `/notifications`, `/notifications/unread-count` | `type`, `unread=1` |
| PATCH | `/notifications/read-all`, `/notifications/{notification}/read` | |
| DELETE | `/notifications/clear` (`only=read`), `/notifications/{notification}` | |
| GET | `/search` | `q` (min 2), `groups`, `per_group`. Resultados agrupados |
| GET | `/analytics` | `from`, `to`. KPIs y series (contrato sin cambios; respuesta agregada cacheada, ver nota) |
| POST | `/bulk-actions` | `{resource, action, ids, ...payload}` |

### Caché de analytics

La base de datos es canónica. `GET /api/analytics` cachea el agregado final en `AnalyticsCache`: miss calcula y guarda, hit devuelve, mutación relevante invalida y la siguiente lectura recalcula. Sin cambios de JSON, métricas, filtros ni comportamiento.

- Key: `lumaflow:analytics:v1:ws:{ids-ordenados}:{from}:{to}` (rango determinista `YYYY-MM-DD`). Sin claves globales: dos workspaces nunca comparten datos.
- Alcance: memberships del usuario (`accessibleBy`, misma semántica que antes, no solo el workspace actual).
- TTL 300 s configurable (`ANALYTICS_CACHE_TTL`, `config/analytics.php`); funciona con cualquier store de Laravel Cache (tests `array`, local `file/database`), sin Redis obligatorio.
- Invalidan: sesiones, entregas, clientes, tareas, análisis/planes/conversaciones de IA y localizaciones (únicas entidades consultadas). Quotes, invoices, bookings, jobs, contratos y resto no invalidan porque no alimentan ningún KPI.
- Mecanismo: `AnalyticsInvalidationObserver` (create/update/delete) con el `workspace_id` de la entidad, sincrónico (el peor caso tras rollback es caché fría, nunca datos erróneos). Sin `Cache::forget` dispersos.
- Demo: analytics incluye demo como antes (sin filtro `is_demo`); la caché no mezcla nada por sí misma.
- Limitación conocida: carrera recalcula/muta acotada por TTL, sin locking portable.
| GET POST | `/exports/{resource}` | `format=csv\|json`, `ids` opcional |

**Acciones masivas soportadas** (`BulkActionService::MATRIX`):

| Recurso | delete | status | client |
|---|:-:|:-:|:-:|
| sessions | si | si | |
| tasks | si | si | si |
| deliveries | si | si | si |
| clients | si | si | |
| gear, locations | si | | |

Una combinacion no soportada devuelve 422.

**Recursos exportables**: `sessions`, `clients`, `deliveries`, `tasks`, `gear`, `locations`. Formatos genericos `csv` y `json`.

### IA

`throttle:20,1` adicional sobre los endpoints backend de inferencia. La SPA usa WebGPU en navegador; si se llaman los endpoints legacy y Ollama no responde, devuelven **503** con `{message}`.

| Metodo | Ruta | Notas |
|---|---|---|
| GET | `/ai/status` | Disponibilidad y modelos. Cacheado 15 s |
| POST | `/ai/chat` | `{message, conversation_id?}`. El historial lo reconstruye el servidor |
| POST | `/ai/session-plan` | `{session_id, ...}` |
| POST | `/ai/recommend-gear` | Solo recomienda equipo existente |
| GET PATCH DELETE | `/ai/history`, `/ai/history/{conversation}` | Conversaciones persistidas |

## Codigos de error

| Codigo | Significado |
|---|---|
| 401 | Sin token, o token revocado |
| 403 | Email sin verificar o firma invalida |
| 404 | No existe **o no es tuyo** |
| 409 | Onboarding pendiente (`code: onboarding_required`) |
| 422 | Validacion fallida, o accion masiva no soportada |
| 429 | Rate limit |
| 503 | Ollama no disponible (solo en endpoints backend legacy de IA) |
