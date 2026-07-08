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
| POST | `/register` | no | `throttle:10,1`. Devuelve 201 con `{user, token}` |
| POST | `/login` | no | `throttle:10,1`. Mismo error exista o no el email |
| POST | `/logout` | si | Revoca el token en uso |
| GET | `/user` | si | Usuario autenticado |

## Salud y sistema

| Metodo | Ruta | Auth | Notas |
|---|---|---|---|
| GET | `/health` | no | Coarse. 200 si operativo, 503 si `down`. Solo expone `status` por sonda |
| GET | `/system` | si | Detalle: latencias, driver, version, modelo de IA |
| GET | `/up` | no | Sonda nativa de Laravel |

`status` global: `up` (todo bien), `degraded` (solo Ollama caido), `down` (alguna dependencia critica).

## Recursos

Todos los listados aceptan `page`, `per_page` (acotado) y devuelven `{data, links, meta}`. Los recursos ajenos responden **404, no 403**.

| Recurso | Rutas | Filtros de `index` |
|---|---|---|
| Sessions | `apiResource /sessions` | `search`, `status`, `type`, `sort`, `direction` |
| Gear | `apiResource /gear` | `search`, `category`, `condition`, `favorite` |
| Presets | `apiResource /presets` + `POST /presets/{preset}/duplicate` | `search`, `category`, `style`, `favorite` |
| Albums | `apiResource /albums` | `search` |
| Tags | `GET POST PUT DELETE /tags` | — |
| Locations | `apiResource /locations` | `search`, `city`, `type`, `access_difficulty`, `access_mode`, `favorite`, `latitude`, `longitude`, `radius_km` |
| Clients | `apiResource /clients` | `search`, `status`, `sort`, `direction` |
| Deliveries | `apiResource /deliveries` | `search`, `status`, `client_id` |
| Tasks | `apiResource /tasks` + `GET /tasks/summary` | `search`, `status`, `priority`, `due_from`, `due_to`, `session_id`, `client_id`, `open` |
| Reminders | `apiResource /reminders` | `search`, `status`, `type`, `from`, `to` |

### Fotos

| Metodo | Ruta | Notas |
|---|---|---|
| GET | `/photos`, `/gallery/photos` | `search`, `category`, `session_id`, `album_id`, `tag_id`, `camera`, `lens`, `iso`, `date`, `favorites` |
| POST | `/photos/upload` | `multipart/form-data`. `image`, `mimes:jpg,jpeg,png,webp`, `max:12288` |
| PUT | `/photos/{photo}` | Metadata, albumes y etiquetas |
| GET | `/photos/{photo}/metadata` | EXIF completo |
| DELETE | `/photos/{photo}` | Borra registro y archivo fisico |

### Checklists

| Metodo | Ruta |
|---|---|
| GET | `/checklists` (`session_id`, `type`), `/checklists/templates`, `/checklists/{checklist}` |
| POST | `/checklists` (`use_template` rellena desde plantilla), `/checklists/{checklist}/duplicate`, `/checklists/{checklist}/items` |
| PUT | `/checklists/{checklist}`, `/checklists/{checklist}/reorder` (`items: [id, ...]`), `/checklist-items/{item}` |
| PATCH | `/checklist-items/{item}/toggle` |
| DELETE | `/checklists/{checklist}`, `/checklist-items/{item}` |

### Workflow

| Metodo | Ruta | Notas |
|---|---|---|
| GET | `/dashboard` | Metricas, agenda del dia, tareas, recordatorios, progreso mensual, timeline |
| GET | `/calendar` | Requiere `from` y `to`. Opcional `sources=session,delivery,task,reminder` |
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

| Recurso | delete | status | tags | album | client |
|---|:-:|:-:|:-:|:-:|:-:|
| sessions | si | si | | | |
| photos | si | | si | si | |
| tasks | si | si | | | si |
| deliveries | si | si | | | si |
| clients | si | si | | | |
| gear, presets, locations | si | | | | |

Una combinacion no soportada devuelve 422.

**Recursos exportables**: `sessions`, `clients`, `deliveries`, `tasks`, `photos`, `gear`, `presets`, `locations`. Formatos `csv` y `json` (PDF esta en el roadmap).

### IA

`throttle:20,1` adicional sobre los endpoints de inferencia. Si Ollama no responde, devuelven **503** con `{message}`.

| Metodo | Ruta | Notas |
|---|---|---|
| GET | `/ai/status` | Disponibilidad y modelos. Cacheado 15 s |
| POST | `/ai/chat` | `{message, conversation_id?}`. El historial lo reconstruye el servidor |
| POST | `/ai/analyze` | `{photo_id, prompt?}` |
| POST | `/ai/preset` | Genera un preset editable |
| POST | `/ai/session-plan` | `{session_id, ...}` |
| POST | `/ai/recommend-gear` | Solo recomienda equipo existente |
| GET PATCH DELETE | `/ai/history`, `/ai/history/{conversation}` | Conversaciones persistidas |

## Codigos de error

| Codigo | Significado |
|---|---|
| 401 | Sin token, o token revocado |
| 404 | No existe **o no es tuyo** |
| 422 | Validacion fallida, o accion masiva no soportada |
| 429 | Rate limit |
| 503 | Ollama no disponible (solo en endpoints de IA) |
