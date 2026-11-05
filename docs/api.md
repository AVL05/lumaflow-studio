# API

Base: `http://localhost:8000/api`. Todas las respuestas son JSON.

## Exclusión de indexación — SEO P0/P1 local

El middleware global `ExcludeSearchIndexing` añade `X-Robots-Tag: noindex, nofollow, nosnippet` y `Referrer-Policy: no-referrer` a respuestas Laravel. Las rutas `/api/*` usan `Cache-Control: private, no-store`, también en errores. Son controles de rastreo/caché; no sustituyen autenticación, scopes, permisos, revocación o caducidad. No cambian endpoints, payloads ni códigos de estado de dominio; PDF/ICS conservan su tipo de contenido.

`SearchIndexingTest` cubre éxito, 401, identificadores públicos desconocidos 404 y un fallo inesperado 500 sin detalles privados. Los 500 observados en producción siguen pendientes de diagnóstico del despliegue: no se convierten en 404 mediante captura genérica. Ver [auditoría SEO/GEO](SEO_GEO_AUDIT.md#13-implementación-local-p0p1).

## Autenticacion

Sanctum con **tokens Bearer**, no cookies de sesion. El token se obtiene en `register` o `login` y viaja en cada peticion:

```http
Authorization: Bearer <token>
```

Un `login` invalida los tokens anteriores del usuario (sesion unica). Un 401 indica token ausente, revocado o invalido. La SPA solo destruye la sesion local ante 401; ante 5xx, red o throttling conserva el token y muestra estado degradado con reintento.

| Metodo | Ruta                               | Auth                 | Notas                                                                    |
| ------ | ---------------------------------- | -------------------- | ------------------------------------------------------------------------ |
| POST   | `/register`                        | no                   | Crea una cuenta sin verificar, envia el email y devuelve `{user, token}` |
| POST   | `/login`                           | no                   | `throttle:10,1`. Mismo error exista o no el email                        |
| POST   | `/logout`                          | si                   | Revoca el token en uso                                                   |
| GET    | `/user`                            | si                   | Estado de verificacion, onboarding y preferencias del usuario            |
| GET    | `/email/verify/{id}/{hash}`        | firma temporal       | Verifica el email y redirige a la SPA                                    |
| POST   | `/email/verification-notification` | si                   | Reenvia el enlace, `throttle:6,1`                                        |
| POST   | `/onboarding`                      | si, email verificado | Guarda estudio, especialidades, pais, moneda y primera prioridad         |
| POST   | `/getting-started`                 | si                   | Elige `create_first_job`, `sample_workspace`, `import_clients` o `later` |

Los recursos de producto requieren email verificado y onboarding completado. Una cuenta pendiente puede usar `/user`, `/logout`, el reenvio de verificacion y `/onboarding` cuando corresponda. El enlace de email caduca a los 60 minutos y su firma impide alterar el usuario o el hash.

`sample_workspace` crea de forma idempotente clientes, trabajos, sesiones, tareas, localizacion y entrega ficticios marcados con `is_demo`. No genera estados entregados, no activa reservas y no cuenta como progreso de activación: el checklist solo cuenta recursos reales (`is_demo = false`) y la UI los distingue con la insignia «Ejemplo». No falsea el hito operativo.

## Salud y sistema

| Metodo | Ruta      | Auth | Notas                                                                   |
| ------ | --------- | ---- | ----------------------------------------------------------------------- |
| GET    | `/health` | no   | Coarse. 200 si operativo, 503 si `down`. Solo expone `status` por sonda |
| GET    | `/system` | si   | Detalle: latencias, driver, version, modelo de IA                       |
| GET    | `/up`     | no   | Sonda nativa de Laravel                                                 |

`status` global: `up` (todo bien), `degraded` (solo compatibilidad Ollama backend caida), `down` (alguna dependencia critica).

## Recursos

Todos los listados aceptan `page`, `per_page` (acotado) y devuelven `{data, links, meta}`. Los recursos ajenos responden **404, no 403**.

Las asociaciones se validan contra el workspace del recurso en una actualización y contra el workspace actual autorizado en una creación. Una membership en otro estudio no permite mezclar sus entidades. La autorización del recurso precede a la validación de asociaciones. Registros históricos con referencias entre estudios quedan excluidos de lecturas/listados/relaciones, sin borrarlos; corregirlos requiere revisión privada y copia recuperable.

La frontera de autorizacion es la **membership del workspace** (`WorkspaceAuthorizer`): un usuario accede a un recurso solo si pertenece a su workspace, aunque no sea quien lo creo. `user_id` se conserva como creador/compatibilidad. Las notificaciones siguen siendo bandeja personal por `user_id`.

### Estudio compartido

| Metodo | Ruta                                  | Quien             | Notas                                                                                                                        |
| ------ | ------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/workspace/members`                  | miembro+          | Miembros del workspace actual con rol                                                                                        |
| PUT    | `/workspace/current`                  | miembro+          | Cambia el workspace actual (solo con membership, ajeno → 404)                                                                |
| DELETE | `/workspace/members/{user}`           | segun reglas      | Owner retira admin/member; admin retira member; member nada                                                                  |
| GET    | `/workspace/invitations`              | owner/admin       | Pendientes del workspace actual                                                                                              |
| POST   | `/workspace/invitations`              | owner/admin       | `{email, role: admin\|member}`; owner invita admin/member, admin solo member. Devuelve el token una sola vez en `meta.token` |
| DELETE | `/workspace/invitations/{invitation}` | owner/admin       | Revoca pendientes                                                                                                            |
| POST   | `/workspace/invitations/accept`       | miembro potencial | `{token}`; crea la membership una sola vez, exige email coincidente                                                          |

Permisos: **owner** accede, lista, invita (admin/member), revoca y retira; **admin** accede, lista, invita (member), revoca y retira member (nunca al owner, sin auto-elevacion); **member** trabaja con los recursos sin administrar miembros. Invitaciones con token aleatorio de 64 caracteres (hash SHA-256 en base), caducidad de 7 dias, un solo uso y estados `pending/accepted/revoked/expired`. El email de aviso queda como follow-up: el token se comparte desde la UI de configuracion.

| Recurso    | Rutas                                                                                   | Filtros de `index`                                                                                             |
| ---------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Jobs       | `apiResource /jobs`, `GET /jobs/workflows`                                              | `search`, `status`, `specialty`                                                                                |
| Sessions   | `apiResource /sessions`                                                                 | `search`, `status`, `type`, `sort`, `direction`                                                                |
| Gear       | `apiResource /gear`                                                                     | `search`, `category`, `condition`, `favorite`                                                                  |
| Locations  | `apiResource /locations`                                                                | `search`, `city`, `type`, `access_difficulty`, `access_mode`, `favorite`, `latitude`, `longitude`, `radius_km` |
| Clients    | `apiResource /clients`                                                                  | `search`, `status`, `sort`, `direction`                                                                        |
| Deliveries | `apiResource /deliveries`                                                               | `search`, `status`, `client_id`                                                                                |
| Quotes     | `apiResource /quotes`, `PATCH /quotes/{quote}/status`, `GET /quotes/{quote}/pdf`        | `search`, `status`, `sort`, `direction`                                                                        |
| Contracts  | `apiResource /contracts`, `PATCH /contracts/{contract}/status`                          | `search`, `status`, `job_id`, `sort`, `direction`                                                              |
| Invoices   | `GET/POST /invoices`, `PATCH /invoices/{invoice}/status`, `GET /invoices/{invoice}/pdf` | `status`                                                                                                       |
| Presets    | `apiResource /presets` sin `show`                                                       | `search`, `category`                                                                                           |
| Tasks      | `apiResource /tasks` + `GET /tasks/summary`                                             | `search`, `status`, `priority`, `due_from`, `due_to`, `session_id`, `client_id`, `open`                        |

### Entregas por enlace externo

`Delivery` no aloja originales. Guarda `gallery_url` (HTTPS nuevo; HTTP histórico sin modificar; sin credenciales en la URL, max 2048), `gallery_provider` (Pixieset,
Pic-Time, Lightroom, Drive, Dropbox, OneDrive, WeTransfer u otro), `gallery_password` opcional y
`gallery_expires_at` opcional, junto a estado, `client_message` y `client_responded_at` para la
aprobacion. `gallery_expires_at` limita el **portal de LumaFlow**, hasta el fin del día UTC indicado; no caduca archivos del proveedor. El portal público (`/public/deliveries/{token}`) muestra el enlace y la contraseña para revisar externamente y volver a responder.

El portal solo admite `pending`, `delivered` y `approved`, sin revocación y sin caducidad o con `gallery_expires_at` desde hoy inclusive. Borrador, archivada, revocada, caducada, token desconocido o asociaciones inválidas devuelven 404. Archivar retira el acceso al portal; no cambia los permisos del proveedor externo. Se conservan enlaces HTTP históricos, pero protocolos distintos de HTTP/HTTPS o URLs con credenciales no se publican.

`POST /public/deliveries/{token}/approve` repetido devuelve la entrega aprobada sin alterar la fecha ni crear otra actividad/notificación. `request-changes` repetido con el mismo comentario es idempotente; tras aprobación devuelve 422. Un comentario concurrente diferente basado en datos obsoletos devuelve 409: recargar antes de reintentar. Los cambios aceptados conservan su actividad histórica. Estado, actividad y notificación se confirman en la misma transacción. Contratos conservan `meta.already_processed`, calculado dentro de la transacción.

Los enlaces de contrato legacy de trabajos admiten también únicamente HTTP/HTTPS sin credenciales. Calendario público y nuevas solicitudes de reserva usan el estudio propio del publicador; otras memberships o cambiar el workspace actual no amplían ese permiso público.

#### Revisiones y recepción — Sprint 5 (#44), implementación local

`client_id` pasa a nullable. Los recursos conservan sus campos y añaden `revision_number`, `version` (control de concurrencia) y `review_state`: `sent`, `received`, `in_review`, `changes_requested`, `approved` o null para borrador/archivada. `status` comercial conserva su enum anterior. El recurso privado añade `portal_revoked_at`. Un GET nunca confirma recepción ni crea actividades.

| Método | Ruta autenticada                          | Contrato                                                                                                                                        |
| ------ | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/jobs/{job}/deliveries`                  | Mismo formulario de entrega; deriva proyecto/workspace del Job autorizado, incluso si no es el workspace activo                                 |
| POST   | `/deliveries/{delivery}/revisions`        | `version`, `request_id` UUID y `gallery_url` HTTPS obligatorios; proveedor, contraseña externa, fecha y `notes` opcionales                      |
| POST   | `/deliveries/{delivery}/actions/{action}` | Acciones `receive`, `review`, `request-changes`, `approve`, `comment`; mismas reglas de revisión que el portal; registra al usuario del estudio |
| GET    | `/deliveries/{delivery}/history`          | `{revisions: paginator(12), events: paginator(24)}`; páginas `revision_page` y `event_page`                                                     |
| POST   | `/deliveries/{delivery}/portal`           | `version` y `action: revoke\|rotate\|expiry`; `expires_on` nullable para expiry; quitar caducidad no reactiva un token revocado                 |

Portal público: `GET /public/deliveries/{token}/history` y `POST /public/deliveries/{token}/{action}` para las mismas cinco acciones. Se mantiene el throttle existente de 30/minuto. El historial público omite borradores internos, configuración del portal, notas privadas, IDs de usuario y emails. Usa «Estudio»/«Portal del cliente» como responsable: un token no autentica una identidad civil. El historial contiene enlaces y contraseñas de las revisiones publicadas; compártelo únicamente con sus destinatarios.

Toda respuesta nueva envía `revision_number`; por compatibilidad se admite su ausencia solo en revisión inicial. Una respuesta sobre otra revisión devuelve 409; omitirla tras publicar versiones sucesivas devuelve 422. `message` es obligatorio (máximo 2000, texto sin etiquetas) para cambios/comentarios. Un comentario general requiere `request_id` UUID: repetirlo no duplica efectos; otro UUID permite otra observación idéntica legítima. La solicitud de cambios legacy puede omitir UUID y deduplica el último mensaje idéntico. Tras aprobación solo se admiten comentarios generales, no nuevas solicitudes de cambios. Confirmar recepción después de iniciar revisión/aprobar es un no-op, nunca retrocede el estado.

Publicar preserva snapshots y actividades anteriores, incrementa número/versión, reinicia la revisión y requiere nueva aprobación. Mismo UUID y contenido devuelve estado actual; reutilizar UUID con otro contenido o una versión obsoleta devuelve 409. Un PUT legacy que sustituye contenido publicado genera versión en vez de sobrescribirlo; conserva borrador/archivo y no reabre una aprobación al editar solo datos comerciales. Sustituir el enlace de una entrega aprobada reabre revisión. Después de publicar no se puede reasignar Job/cliente/sesión, ni pasando por borrador ni mediante bulk: crear otra entrega evita compartir un historial ajeno.

La transacción bloquea Job antes de Delivery y vuelve a comprobar token, revisión y expiración. Actividad y notificación interna son atómicas. El email de nueva versión enviada es best-effort después del commit: no se reenvía al repetir la publicación y no garantiza entrega SMTP. Revocar conserva el historial; rotar invalida el URL anterior y genera 40 caracteres aleatorios. Por compatibilidad los tokens antiguos continúan almacenados en claro; proteger copias y acceso a BD, no atribuirles hashing ni privacidad sobre los proveedores.

La sincronización reutiliza `client_review`, `corrections` y `delivered`: abre la etapa pertinente y reabre entrega final ante otra revisión. Aprobar no completa tareas/checks; la etapa final solo se completa con entregas relevantes aprobadas y etapas restantes resueltas/omitidas. Los estados comerciales históricos de Job conservan su avance monotónico. No hay importación, miniaturas, descarga ni almacenamiento de medios.

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

| Metodo | Ruta                               | Notas                                                                                    |
| ------ | ---------------------------------- | ---------------------------------------------------------------------------------------- |
| GET    | `/public/contracts/{token}`        | Vista del snapshot congelado; uniforme 404 si desconocido, revocado, expirado o borrador |
| POST   | `/public/contracts/{token}/accept` | Solo `sent` → `accepted`; doble envío idempotente (`meta.already_processed`)             |
| POST   | `/public/contracts/{token}/reject` | `{message?}` máx. 2000, sin HTML; → `rejected` con comentario visible interno            |

El portal expone solo número, título, snapshot, estado, versión, estudio, cliente, servicio, fechas y decisión. Nunca IDs internos, workspace, emails, notas privadas ni tokens. Rate limiting `throttle:30,1` como el resto de superficie pública. La aceptación/rechazo reutiliza `ContractService` (misma máquina de estados), notifica al estudio y registra actividad. Estados terminales: lectura final sin acciones.

Auditoría mínima: timestamps de envío/decisión/uso y comentario de rechazo. Sin IP, user-agent ni fingerprinting. Se registra una aceptación simple, no una firma electrónica certificada.

### Checklists

| Metodo | Ruta                                                                                                                         |
| ------ | ---------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/checklists` (`session_id`, `type`), `/checklists/templates`, `/checklists/{checklist}`                                     |
| POST   | `/checklists` (`use_template` rellena desde plantilla), `/checklists/{checklist}/duplicate`, `/checklists/{checklist}/items` |
| PUT    | `/checklists/{checklist}`, `/checklists/{checklist}/reorder` (`items: [id, ...]`), `/checklist-items/{item}`                 |
| PATCH  | `/checklist-items/{item}/toggle`                                                                                             |
| DELETE | `/checklists/{checklist}`, `/checklist-items/{item}`                                                                         |

### Workflow

`/jobs` es el agregado central. Su detalle incluye cliente, localizacion, equipo, sesiones, presupuestos, facturas, tareas, entregas y timeline. Pipeline: `lead → quoted → contract_pending → confirmed → preparation → shoot → editing → review → delivered → closed`; `cancelled` queda fuera del avance normal. Aceptar un presupuesto avanza a contrato, pagar una factura confirma el trabajo y los estados de sesion/entrega adelantan produccion sin permitir regresiones automaticas.

### Creative Workspace y briefing manual (#40, #41)

Implementados en el checkout del Sprint 2; requieren la nueva migración aditiva antes de utilizar este código. No están desplegados por esta sesión. Se conservan `/api/jobs`, IDs, estados y campos comerciales anteriores. `client_id` sigue admitiendo `null`.

`POST /jobs` y `PUT /jobs/{job}` aceptan además:

| Campo                                         | Contrato                                                                                                                  |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `project_type`                                | `photography` (por defecto), `audiovisual`, `personal`                                                                    |
| `participants`                                | Hasta 25 objetos, solo `name` (obligatorio, 120 caracteres) y `role` (opcional, 120); descriptivos, sin conceder acceso   |
| `start_date`, `end_date`, `delivery_due_date` | Fechas nullable `YYYY-MM-DD`; fin no anterior a inicio, también en actualizaciones parciales                              |
| `location_ids`                                | Hasta 25 IDs distintos del workspace del proyecto; adicionales a `location_id`                                            |
| `external_links`                              | Hasta 20 objetos, solo `label` (obligatorio, 120 caracteres) y `url` (HTTP/HTTPS sin credenciales, hasta 2048 caracteres) |

Equipo continúa en `gear_item_ids`. Los campos nuevos son opcionales: omitirlos al actualizar conserva los valores existentes; arrays vacíos retiran sus selecciones. Ninguno admite archivos audiovisuales. Las referencias externas no cambian los permisos del proveedor.

La respuesta añade `project_type`, fechas y `production_phase`: `preparation` para los estados anteriores a `shoot`, `production` para `shoot`, `postproduction` para `editing/review`, `delivery` para `delivered/closed`; `null` para `cancelled`. No se escribe la fase directamente. El detalle incluye `locations`, `participants`, `external_links`, `briefing` (objeto) y `briefing_revision`. El listado omite briefing, participantes y enlaces externos para reducir el payload.

- `GET /jobs` conserva `{data: [...]}` sin paginación por defecto para consumidores anteriores. `paginate=1` activa `meta/links`, `per_page` 1–48 (12 por defecto), `page` 1–100000. Admite filtro `project_type` además de los anteriores.
- `GET /jobs/options?resource=clients|locations|gear&search=...&page=...`: candidatos del workspace actual, páginas de 24 objetos `{id,name}`; búsqueda hasta 120 caracteres.
- `GET /jobs/{job}/options`: mismo contrato, pero del workspace del proyecto autorizado, incluso si el estudio activo es otro. Los IDs de otros estudios no son asociaciones válidas aunque el usuario tenga ambas memberships.
- `PUT /jobs/{job}/briefing`: `{briefing: {...}, revision: 0}`. Es un reemplazo completo del briefing; no modifica `description`. Solo permite `objectives`, `references`, `technical_requirements`, `scenes`, `locations`, `risks`, `notes`, `open_questions`, texto nullable hasta 4000 caracteres por campo. Se permite objeto vacío. `revision` entero obligatorio entre 0 y 2147483646.

Participantes, enlaces y `location_ids` deben ser listas JSON; se rechazan objetos con claves para mantener un contrato consistente con la SPA.

El briefing solo se guarda con ese endpoint. La actualización comprueba atómicamente `briefing_revision`, incrementa su valor y devuelve el detalle actualizado. Una revisión antigua devuelve **409**, sin cambios ni actividad adicional. El cliente conserva el borrador y confirma antes de descartarlo para recargar. La actividad registra únicamente «Briefing actualizado.», sin contenido. No existe historial de versiones del texto ni intervención de IA.

Se aplican las memberships owner/admin/member existentes; participantes no son miembros. Lecturas/escrituras sobre proyectos ajenos devuelven **404**, antes de validar su briefing. Asociaciones no válidas dentro de un proyecto autorizado devuelven **422**.

| Metodo | Ruta                                                                  | Notas                                                                                     |
| ------ | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| GET    | `/dashboard`                                                          | Metricas, agenda del dia, tareas, progreso mensual, timeline                              |
| POST   | `/activation/bookings`                                                | Activa el enlace publico de reservas y devuelve el checklist actualizado                  |
| POST   | `/activation/sample-workspace`                                        | Carga una unica vez los datos ficticios opcionales                                        |
| POST   | `/clients/import`                                                     | Importa hasta 250 clientes y omite emails existentes                                      |
| GET    | `/calendar`                                                           | Requiere `from` y `to`. Opcional `sources=session,delivery,task`                          |
| PATCH  | `/calendar/move`                                                      | `{source, source_id, date, time?}`. Reprogramacion por drag & drop                        |
| GET    | `/activities`                                                         | Feed global. Filtro `type`                                                                |
| GET    | `/sessions/{session}/timeline`                                        | Timeline cronologico de una sesion                                                        |
| GET    | `/notifications`, `/notifications/unread-count`                       | `type`, `unread=1`                                                                        |
| PATCH  | `/notifications/read-all`, `/notifications/{notification}/read`       |                                                                                           |
| DELETE | `/notifications/clear` (`only=read`), `/notifications/{notification}` |                                                                                           |
| GET    | `/search`                                                             | `q` (min 2), `groups`, `per_group`. Resultados agrupados                                  |
| GET    | `/analytics`                                                          | `from`, `to`. KPIs y series (contrato sin cambios; respuesta agregada cacheada, ver nota) |
| POST   | `/bulk-actions`                                                       | `{resource, action, ids, ...payload}`                                                     |

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

| Recurso         | delete | status | client |
| --------------- | :----: | :----: | :----: |
| sessions        |   si   |   si   |        |
| tasks           |   si   |   si   |   si   |
| deliveries      |   si   |   si   |   si   |
| clients         |   si   |   si   |        |
| gear, locations |   si   |        |        |

Una combinacion no soportada devuelve 422.

**Recursos exportables**: `sessions`, `clients`, `deliveries`, `tasks`, `gear`, `locations`. Formatos genericos `csv` y `json`.

### Tomas y jornadas de producción — Sprint 3 (#42)

Rutas autenticadas aditivas en `/api/jobs/{job}`. Mantienen las memberships owner/admin/member y devuelven 404 para proyecto ajeno o toma/sesión de otro proyecto, antes de validar escritura. No hay rutas públicas nuevas, adjuntos ni generación IA.

| Método         | Ruta relativa                | Contrato                                                                                           |
| -------------- | ---------------------------- | -------------------------------------------------------------------------------------------------- |
| GET / POST     | `/shots`                     | Listado paginado (24) / crear toma                                                                 |
| PATCH / DELETE | `/shots/{shot}`              | Editar / eliminar toma y su pivot, sin borrar medios externos                                      |
| POST           | `/shots/{shot}/duplicate`    | Copia planificación/equipo, reinicia estado a pendiente, notas, hora prevista y revisión           |
| PUT            | `/shots/{shot}/move`         | `{direction: up\|down}`; mueve respecto al vecino global, incluso entre páginas                    |
| GET / POST     | `/production-days`           | Listado paginado (24) / crear una Session del proyecto con checklists de preparación/recogida      |
| PUT            | `/production-days/{session}` | Reutiliza actualización de sesiones, incluidas sus transiciones comerciales                        |
| GET            | `/production/pdf`            | PDF completo del proyecto o `session_id` de su jornada; 5/minuto por usuario con contador separado |

GET de tomas acepta `page` (1–100000), `session_id` y `status`; jornadas acepta `page` y `session_id`. El orden global de tomas es `position,id`. `id` identifica la toma; no depende de posición ni escena. La UI desactiva movimientos con filtros, sin ocultar tomas de otras páginas. Cada movimiento intercambia dos posiciones dentro de una transacción con bloqueo de Job, compartido por altas/bajas y duplicaciones; no reemplaza listas completas enviadas desde un cliente obsoleto.

Crear toma exige `description` (texto, 2000 caracteres). Opcionales: `scene`, `shot_type`, `camera_movement`, `focal_length` (nullable, 120 cada uno), `estimated_seconds` (1–86400), `scheduled_time` (`HH:mm`), `notes` (4000), `status` (`pending`, `ready`, `done`, `discarded`, por defecto pending), `session_id`, `location_id`, `gear_item_ids` (lista de hasta 50 enteros distintos). Equipo/localización deben pertenecer al workspace del proyecto, aunque el usuario tenga otras memberships; sesión además al mismo proyecto. Escena y duración no son obligatorias en fotografía.

PATCH requiere `revision` entera 0–2147483646; revisión desactualizada devuelve 409 sin escribir. Cambios reales incrementan revisión; petición sin cambios no añade actividad. Movimientos no alteran revisión de contenido. Respuesta `{data: ShotResource}`: campos anteriores, `id`, `job_id`, `position`, `revision`, `location` y `gear_items` reducidos a id/nombre. No expone creador/workspace. La actividad solo contiene eventos constantes e IDs, sin notas/descripción de tomas.

Las jornadas son sesiones existentes, no otro modelo. POST/PUT usa el contrato Session: `name`, `date`, `session_type`, `status` obligatorios; `time`, `end_time` nullable `HH:mm`, dentro del mismo día (fin no anterior a inicio). `participants` opcional: hasta 25 objetos con name (120) y role nullable (120), descriptivos y sin permisos; `incidents` y `notes` hasta 3000. `location_id` se valida contra el estudio del proyecto. El proyecto se toma de la ruta; `job_id` en payload está prohibido. Las sesiones antiguas aparecen automáticamente y no reciben checklists duplicadas al editar. No se puede trasladar una sesión con tomas a otro proyecto: primero retirar asignaciones. Borrar una sesión por el endpoint existente conserva tomas y deja `session_id=null`.

El PDF usa Blade escapado y Dompdf sin recursos remotos/PHP, sin guardar archivos en el servidor. Incluye jornadas, participantes, notas/incidencias, checklists y tomas con equipo. Ignora filtro de estado/paginación de la pantalla; la selección de jornada sí limita el documento. Hasta 500 tomas por PDF por coste de renderizado; por encima devuelve 422 y solicita exportar por jornadas. La UI permite descargarlo o abrirlo en el visor para impresión nativa. La API no envía a impresoras. Sin cálculo automático de horarios, duración total ni detección de solapamientos; horas locales del proyecto y jornada nocturna dividida en fechas separadas.

Calendario conserva su contrato y añade `meta.end_time` cuando existe, mostrado como rango en la SPA. El feed ICS reutiliza ese fin; sesiones antiguas conservan la duración de una hora anterior. Su alcance público sigue siendo el estudio propio del publicador, sin notas, participantes ni contenido de tomas. Se rechaza mover un inicio más allá del fin guardado; ajustar primero el horario desde la jornada. El límite superior de fechas del calendario incluye el día completo también en SQLite.

### Plantillas y postproducción — Sprint 4 (#43)

Base `/api/jobs/{job}/workflow`, autenticada y autorizada por membership del estudio del proyecto. Tipos nuevos vinculados al Job existente; no cambian `/jobs`, IDs ni estados comerciales. Requiere migración aditiva antes de activar este código fuera de tests. Esta sesión no lo publica ni despliega.

| Método | Ruta relativa              | Comportamiento                                                                                                                        |
| ------ | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/`                        | `{data:{stages,tasks,checklists,members,applications}}`; tareas/checklists sin etapa se devuelven aparte; miembros solo ID/nombre/rol |
| POST   | `/initialize`              | `{confirmed:true}`; crea las ocho etapas iniciales que falten, sin tareas ni fechas                                                   |
| POST   | `/stages`                  | Crea etapa personalizada con `label` obligatorio                                                                                      |
| PUT    | `/stages/{stage}`          | Edita nombre/estado/responsable/fecha/notas, con `revision` obligatoria                                                               |
| PUT    | `/stages/{stage}/move`     | `{direction:up\|down,revision}`; intercambio adyacente transaccional                                                                  |
| POST   | `/tasks`, `/checklists`    | Reutiliza los contratos y controladores existentes, derivando Job y workspace de la ruta autorizada                                   |
| GET    | `/templates?page=1`        | `{builtins:[...9],data:[...propias],meta}`; propias paginadas a 12, del workspace del proyecto                                        |
| POST   | `/templates`               | Guarda plantilla propia con nombre, descripción y definición                                                                          |
| PUT    | `/templates/{key}`         | Edita propia con `revision`; las iniciales son inmutables y se pueden copiar mediante POST                                            |
| GET    | `/templates/{key}/preview` | `{data:{template,plan,already_applied,hash}}`; no escribe datos                                                                       |
| POST   | `/templates/{key}/apply`   | `{confirmed:true,preview_hash}`; aplicación aditiva, transaccional e idempotente, 5/minuto por usuario con contador separado          |

Claves iniciales: `portrait`, `product`, `wedding`, `event`, `music_video`, `commercial`, `interview`, `documentary`, `vertical`. Propias: `custom-{id}`; solo se resuelven en el estudio del Job, aunque el actor tenga otras memberships. El catálogo y la copia conservan definiciones, sin IDs de personas/equipo, fechas relativas, URLs de pago ni generación de contenido.

Etapa: `label` hasta 120 caracteres, `status` pending/in_progress/completed/skipped, `assigned_user_id` nullable (miembro actual del estudio), `due_date` nullable YYYY-MM-DD y `notes` hasta 4000. Clave estable y posición son del servidor. Hasta 32 etapas por proyecto; configurar mediante nombre, orden, adición u omisión conserva el historial. No se implementa borrado de etapas. `revision` entero 0–2147483646; un valor obsoleto devuelve 409 sin sobrescribir. Completar exige que no queden tareas abiertas ni controles pendientes; las tareas canceladas se consideran resueltas. Reabrir una tarea/control reabre la etapa completada. El progreso deriva de tareas completadas/canceladas y checks marcados; no mide procesamiento de medios. La media del panel es progreso de etapas, no aprobación de entregas ni cierre comercial.

Task añade `stage_id`, `assigned_user_id`, `workflow_phase` y `revision` a su respuesta. Admite asignación nullable a un miembro del mismo estudio y revisión opcional en el endpoint legacy; los formularios actuales la envían al editar y reciben 409 ante conflicto. Los clientes antiguos que la omitan conservan su semántica de actualización anterior. Checklist añade `job_id` y `stage_id`; los contratos de sesiones anteriores continúan funcionando. Las referencias de etapa/sesión/proyecto se validan al escribir y se filtran en lecturas ante filas incoherentes. Recursos ajenos o de otro proyecto devuelven 404 antes de validar una edición de etapa/plantilla; asociaciones inválidas dentro de un recurso autorizado devuelven 422.

Definición cerrada de plantilla:

```json
{
  "tasks": [{ "title": "Revisar briefing", "phase": "preparation" }],
  "checklists": [
    { "name": "Preparación", "items": ["Comprobar equipo disponible"] }
  ],
  "stages": [
    {
      "key": "editing",
      "label": "Edición",
      "tasks": ["Editar selección"],
      "checklists": []
    }
  ]
}
```

`name` obligatorio hasta 120, `description` opcional hasta 1000. Arrays JSON list: hasta 24 tareas generales; 16 etapas con key distinta (`[a-z][a-z0-9_-]{0,59}`), label hasta 120 y hasta 16 tareas cada una; hasta 4 checklists por ámbito, con 20 controles cada una. Títulos de tareas/controles hasta 180 y nombres de checklist hasta 120. `phase`: preparation/production/postproduction/delivery. Presupuesto técnico total de 300 elementos por definición; superar límites devuelve 422 y requiere dividirla. No se aceptan fechas, responsables, archivos ni referencias de inventario en la definición.

La previsualización lista elementos a crear/reutilizar y acciones individuales de controles (`item_actions`). Su hash incluye versión/definición y los elementos existentes relevantes; cambiar lo que se creará exige previsualizar de nuevo (409). Las etapas se reutilizan por clave; tareas por título normalizado (pueden vincularse si aún no tenían etapa, sin reiniciar fechas/estado); checklists por nombre normalizado. Se añaden controles faltantes conservando ubicación y controles anteriores, incluidos los completados. Nunca se eliminan elementos para ajustarlos a una plantilla.

El recibo único por proyecto/clave hace que solicitudes repetidas o simultáneas no dupliquen el contenido. Una plantilla editada no se reaplica a proyectos donde esa misma clave ya se aplicó: crear una copia/variante o añadir trabajo manualmente. Se conserva la aplicación materializada y su recibo, no un historial completo de todas las versiones de la definición. No hay sincronización automática, fechas inventadas, importación de archivos ni IA.

### Inferencia existente

`throttle:20,1` adicional sobre los endpoints backend de inferencia. La SPA usa WebGPU en navegador; si se llaman los endpoints legacy y Ollama no responde, devuelven **503** con `{message}`.

| Metodo           | Ruta                                        | Notas                                                                  |
| ---------------- | ------------------------------------------- | ---------------------------------------------------------------------- |
| GET              | `/ai/status`                                | Disponibilidad y modelos. Cacheado 15 s                                |
| POST             | `/ai/chat`                                  | `{message, conversation_id?}`. El historial lo reconstruye el servidor |
| POST             | `/ai/session-plan`                          | `{session_id, ...}`                                                    |
| POST             | `/ai/recommend-gear`                        | Solo recomienda equipo existente                                       |
| GET PATCH DELETE | `/ai/history`, `/ai/history/{conversation}` | Conversaciones persistidas                                             |

## Codigos de error

| Codigo | Significado                                                                                                      |
| ------ | ---------------------------------------------------------------------------------------------------------------- |
| 401    | Sin token, o token revocado                                                                                      |
| 403    | Email sin verificar o firma invalida                                                                             |
| 404    | No existe **o no es tuyo**                                                                                       |
| 409    | Onboarding pendiente (`code: onboarding_required`), revisión obsoleta o previsualización de plantilla modificada |
| 422    | Validacion fallida, o accion masiva no soportada                                                                 |
| 429    | Rate limit                                                                                                       |
| 503    | Ollama no disponible (solo en endpoints backend legacy de IA)                                                    |
