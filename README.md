# LumaFlow Studio

LumaFlow Studio es una plataforma full-stack para fotografos y creadores visuales. La base actual incluye autenticacion, API REST, dashboard con datos reales, CRUD profesional de sesiones, inventario de equipo, sistema avanzado de presets, albumes, etiquetas, biblioteca fotografica con EXIF, localizaciones fotograficas, clientes, entregas y una estructura preparada para modulos futuros.

## Stack

- Frontend: React + Vite + JavaScript
- Estilos: Tailwind CSS
- Backend: Laravel API
- Base de datos: MySQL
- Auth: Laravel Sanctum con tokens Bearer para la SPA
- Storage: Laravel Storage public disk
- IA: Ollama local
- Mapas: Leaflet
- Graficas: Recharts

## Estructura

```txt
frontend/   SPA React con router, auth provider, layout y modulos de producto
backend/    API Laravel con Sanctum, requests, resources, controllers, services y seeders
scripts/    utilidades locales, incluido arranque conjunto backend/frontend
README.md   guia principal del proyecto
```

## Funcionalidades implementadas

- Auth: registro, login, logout y `GET /api/user`
- Dashboard: metricas reales, proximas sesiones, sesiones por estado y actividad reciente
- Sessions: CRUD protegido por usuario con busqueda, filtros, ordenacion, paginacion, detalle y confirmacion de borrado
- Gear: CRUD protegido por usuario con categorias, favoritos, estado, compra, filtros y busqueda
- Presets: CRUD profesional, filtros, favoritos, duplicado, versionado, color identificativo y sliders de simulacion visual
- Albums: colecciones con color, portada preparada y relacion many-to-many con fotos
- Tags: taxonomia visual por usuario con relacion many-to-many con fotos
- Photos: subida segura, EXIF automatico, storage publico, grid/lista, preview, edicion de metadata, albumes, tags, filtros avanzados y borrado fisico
- Locations: CRUD protegido por usuario con mapa Leaflet, coordenadas seleccionables, portada, galeria, rating, favoritos, acceso, permisos, coste, links externos, clima, estaciones, tags y equipo recomendado
- Planning: sesiones asociadas a localizaciones guardadas con mapa e informacion del spot
- Clients: CRUD protegido por usuario con estados, contacto, empresa, notas, busqueda, filtros y detalle
- Deliveries: CRUD protegido por usuario con cliente, sesion opcional, presupuesto, fecha, URL de galeria, notas privadas, busqueda, filtros y detalle
- IA: asistente fotografico con Ollama local, contexto compacto desde datos del usuario, historial persistente, analisis avanzado de fotos, generacion de presets, recomendador de equipo, planificador de sesiones e insights en dashboard
- Calendar: vistas mes, semana, dia, agenda y lista con drag & drop para reprogramar sesiones, entregas, tareas y recordatorios
- Tasks: CRUD protegido con prioridad, estado, fecha limite, relacion con sesion y cliente, resumen de vencidas y acciones masivas
- Checklists: checklists tipadas por sesion con plantillas, items reordenables por drag & drop, progreso en porcentaje y duplicado
- Timeline: actividad automatica por sesion (creacion, edicion, cambio de estado, subida de fotos, analisis IA, entrega, checklist completada)
- Reminders: recordatorios con fecha, hora, tipo y estado, asociables a sesion, cliente, entrega o tarea
- Notifications: centro de notificaciones persistido en BD con contador global, marcado de leidas y limpieza
- Search: buscador global unificado con atajo `Ctrl/Cmd + K`, resultados agrupados y navegacion por teclado
- Analytics: pagina `/app/analytics` con KPIs, ocho graficas Recharts sobre datos reales, tablas comparativas y rangos de fechas
- Bulk actions: borrado, cambio de estado, etiquetado, mover a album, asignar cliente y exportar seleccion
- Export: descarga CSV y JSON de sesiones, clientes, entregas, tareas, fotos, equipo, presets y localizaciones
- UX: toasts globales, modales, confirmaciones, estados loading/error/empty, skeletons, atajos de teclado, filtros persistidos y componentes reutilizables

## Endpoints principales

- `GET /api/dashboard`
- `apiResource /api/sessions`
- `apiResource /api/gear`
- `apiResource /api/presets`
- `POST /api/presets/{preset}/duplicate`
- `apiResource /api/albums`
- `GET|POST|PUT|DELETE /api/tags`
- `apiResource /api/locations`
- Filtros en `GET /api/locations`: `search`, `city`, `type`, `access_difficulty`, `access_mode`, `favorite`, `latitude`, `longitude`, `radius_km`
- `apiResource /api/clients`
- `apiResource /api/deliveries`
- `GET /api/gallery/photos`
- `GET /api/photos`
- `POST /api/photos/upload`
- `PUT /api/photos/{photo}`
- `GET /api/photos/{photo}/metadata`
- `DELETE /api/photos/{photo}`
- `GET /api/ai/status`
- `POST /api/ai/chat`
- `POST /api/ai/analyze`
- `POST /api/ai/preset`
- `POST /api/ai/session-plan`
- `POST /api/ai/recommend-gear`
- `GET /api/ai/history`
- `GET|PATCH|DELETE /api/ai/history/{id}`
- `apiResource /api/tasks`
- `apiResource /api/reminders`
- `apiResource /api/checklists`
- `GET /api/checklists/templates`
- `POST /api/checklists/{checklist}/duplicate`
- `PUT /api/checklists/{checklist}/reorder`
- `POST /api/checklists/{checklist}/items`
- `PUT|PATCH|DELETE /api/checklist-items/{item}` (`PATCH .../toggle`)
- `GET /api/activities`
- `GET /api/sessions/{session}/timeline`
- `GET /api/notifications`, `GET /api/notifications/unread-count`
- `PATCH /api/notifications/read-all`, `PATCH /api/notifications/{notification}/read`
- `DELETE /api/notifications/clear`, `DELETE /api/notifications/{notification}`
- `GET /api/calendar` (`from`, `to`, `sources`)
- `PATCH /api/calendar/move`
- `GET /api/search` (`q`, `groups`, `per_group`)
- `GET /api/analytics` (`from`, `to`)
- `POST /api/bulk-actions`
- `GET|POST /api/exports/{resource}` (`format=csv|json`)

## Requisitos

- PHP 8.3+
- Composer
- Node.js 22+
- npm
- MySQL 8+

## Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan storage:link
php artisan migrate --seed
php artisan serve
```

Variables relevantes en `backend/.env`:

```env
APP_NAME="LumaFlow Studio"
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
FRONTEND_URLS=http://localhost:5173,http://127.0.0.1:5173
SANCTUM_STATEFUL_DOMAINS=
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.1
OLLAMA_TIMEOUT=30
OLLAMA_MAX_CONTEXT=12000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=lumaflow_studio
DB_USERNAME=root
DB_PASSWORD=

SESSION_DRIVER=file
FILESYSTEM_DISK=public
```

Antes de migrar, crea la base de datos MySQL:

```sql
CREATE DATABASE lumaflow_studio CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Variables opcionales en `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000/api
```

## Comandos utiles

Backend:

```bash
php artisan route:list --path=api
php artisan migrate:fresh --seed --force
php artisan test
vendor/bin/pint
```

Frontend:

```bash
npm run lint
npm run build
```

Arranque conjunto desde la raiz:

```bash
npm run start
```

Este comando levanta Laravel en `http://127.0.0.1:8000` y Vite en `http://localhost:5173`.

## Estado del proyecto

Fase 9 implementada: ecosistema de workflow enterprise con calendario, tareas, checklists, timeline de actividad, recordatorios, notificaciones persistidas, busqueda global, acciones masivas, exportacion CSV/JSON y analitica real con Recharts. El proyecto sigue como release privada de portfolio. No incluye facturacion, comparacion visual interactiva, streaming HTTP incremental real ni exportacion PDF.

## Testing

Las pruebas de `phpunit.xml` apuntan a SQLite en memoria. Si tu PHP no tiene `pdo_sqlite`, crea una base MySQL de test y sobrescribe la conexion:

```sql
CREATE DATABASE lumaflow_studio_testing CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

```bash
DB_CONNECTION=mysql DB_DATABASE=lumaflow_studio_testing php artisan test
```

La analitica usa SQL especifico de MySQL (`DATE_FORMAT`, `JSON_EXTRACT`), asi que MySQL es el motor de referencia tambien en pruebas.

## Roadmap

- Usar EXIF para recomendaciones mas precisas y busqueda inteligente
- Activar streaming HTTP incremental real con respuestas chunked/SSE
- UI de comparacion before/after sobre `photo_comparisons`
- Conectar clientes con contratos, entregas publicas y aprobacion formal
- Exportacion PDF dedicada para planes, conversaciones IA e informes de analitica
- Recordatorios con envio real (cola + notificaciones push o email)
- Kanban de tareas con drag & drop entre columnas de estado

## Capturas

Pendiente de anadir capturas del dashboard, sesiones, equipo y biblioteca cuando se prepare el material visual del portfolio.
