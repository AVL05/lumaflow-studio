# API

Base: `http://localhost:8000/api`. Todas las respuestas son JSON.

## Autenticacion

Sanctum con **tokens Bearer**, no cookies de sesion. El token se obtiene en `register` o `login` y viaja en cada peticion:

```http
Authorization: Bearer <token>
```

Un `login` invalida los tokens anteriores del usuario (sesion unica). Un 401 indica token ausente, revocado o invalido.

| Metodo | Ruta | Auth | Notas |
|---|---|---|---|
| POST | `/register` | no | Crea una cuenta sin verificar, envia el email y devuelve `{user, token}` |
| POST | `/login` | no | `throttle:10,1`. Mismo error exista o no el email |
| POST | `/logout` | si | Revoca el token en uso |
| GET | `/user` | si | Estado de verificacion, onboarding y preferencias del usuario |
| GET | `/email/verify/{id}/{hash}` | firma temporal | Verifica el email y redirige a la SPA |
| POST | `/email/verification-notification` | si | Reenvia el enlace, `throttle:6,1` |
| POST | `/onboarding` | si, email verificado | Guarda estudio, especialidades, pais, moneda y primera prioridad |
| POST | `/getting-started` | si | Elige `create_first_job`, `sample_workspace` o `import_clients` |

Los recursos de producto requieren email verificado y onboarding completado. Una cuenta pendiente puede usar `/user`, `/logout`, el reenvio de verificacion y `/onboarding` cuando corresponda. El enlace de email caduca a los 60 minutos y su firma impide alterar el usuario o el hash.

`sample_workspace` crea de forma idempotente clientes, trabajos, sesiones, tareas, localizacion y entrega ficticios. No genera estados entregados ni activa reservas, por lo que no falsea el hito operativo.

## Salud y sistema

| Metodo | Ruta | Auth | Notas |
|---|---|---|---|
| GET | `/health` | no | Coarse. 200 si operativo, 503 si `down`. Solo expone `status` por sonda |
| GET | `/system` | si | Detalle: latencias, driver, version, modelo de IA |
| GET | `/up` | no | Sonda nativa de Laravel |

`status` global: `up` (todo bien), `degraded` (solo compatibilidad Ollama backend caida), `down` (alguna dependencia critica).

## Recursos

Todos los listados aceptan `page`, `per_page` (acotado) y devuelven `{data, links, meta}`. Los recursos ajenos responden **404, no 403**.

| Recurso | Rutas | Filtros de `index` |
|---|---|---|
| Jobs | `apiResource /jobs`, `GET /jobs/workflows` | `search`, `status`, `specialty` |
| Sessions | `apiResource /sessions` | `search`, `status`, `type`, `sort`, `direction` |
| Gear | `apiResource /gear` | `search`, `category`, `condition`, `favorite` |
| Locations | `apiResource /locations` | `search`, `city`, `type`, `access_difficulty`, `access_mode`, `favorite`, `latitude`, `longitude`, `radius_km` |
| Clients | `apiResource /clients` | `search`, `status`, `sort`, `direction` |
| Deliveries | `apiResource /deliveries` | `search`, `status`, `client_id` |
| Quotes | `apiResource /quotes`, `PATCH /quotes/{quote}/status`, `GET /quotes/{quote}/pdf` | `search`, `status`, `sort`, `direction` |
| Invoices | `GET/POST /invoices`, `PATCH /invoices/{invoice}/status`, `GET /invoices/{invoice}/pdf` | `status` |
| Presets | `apiResource /presets` sin `show` | `search`, `category` |
| Tasks | `apiResource /tasks` + `GET /tasks/summary` | `search`, `status`, `priority`, `due_from`, `due_to`, `session_id`, `client_id`, `open` |

### Galeria de entregas

| Metodo | Ruta | Notas |
|---|---|---|
| POST | `/deliveries/{delivery}/images` | Multipart `images[]`, maximo 50 JPEG/PNG/WebP de 15 MB |
| DELETE | `/deliveries/{delivery}/images/{image}` | Elimina registro y archivo del disco publico |
| POST | `/public/deliveries/{token}/images/{image}/favorite` | Alterna la seleccion del cliente mediante token opaco |

Los PDF de presupuestos y facturas son documentos descargables autenticados. No forman parte del exportador generico CSV/JSON.

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
| GET | `/analytics` | `from`, `to`. KPIs y series |
| POST | `/bulk-actions` | `{resource, action, ids, ...payload}` |
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
