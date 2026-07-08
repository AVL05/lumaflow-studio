# LumaFlow Studio

LumaFlow Studio es una plataforma full-stack para fotografos y creadores visuales. La base actual incluye autenticacion, API REST, dashboard con datos reales, CRUD profesional de sesiones, inventario de equipo, sistema avanzado de presets, albumes, etiquetas, biblioteca fotografica con EXIF, localizaciones fotograficas, clientes, entregas y una estructura preparada para modulos futuros.

## Stack

- Frontend: React + Vite + JavaScript
- Estilos: Tailwind CSS
- Backend: Laravel API
- Base de datos: MySQL
- Auth: Laravel Sanctum con tokens Bearer para la SPA
- Storage: Laravel Storage public disk
- IA futura: Ollama local
- Mapas futuros: Leaflet
- Graficas futuras: Recharts

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
- Locations: CRUD protegido por usuario con coordenadas, tipo, mejor hora, dificultad, tags, equipo recomendado y preview preparado para Leaflet
- Clients: CRUD protegido por usuario con estados, contacto, empresa, notas, busqueda, filtros y detalle
- Deliveries: CRUD protegido por usuario con cliente, sesion opcional, presupuesto, fecha, URL de galeria, notas privadas, busqueda, filtros y detalle
- IA: asistente fotografico con Ollama local, contexto construido desde datos del usuario, status endpoint y analisis JSON guardado en `ai_analyses`
- UX: toasts globales, modales, confirmaciones, estados loading/error/empty y componentes reutilizables

## Endpoints principales

- `GET /api/dashboard`
- `apiResource /api/sessions`
- `apiResource /api/gear`
- `apiResource /api/presets`
- `POST /api/presets/{preset}/duplicate`
- `apiResource /api/albums`
- `GET|POST|PUT|DELETE /api/tags`
- `apiResource /api/locations`
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

Fase 6 implementada con clientes y entregas. El proyecto esta preparado como release privada de portfolio. No incluye facturacion, mapa interactivo real ni comparacion visual interactiva.

## Roadmap

- Usar EXIF para recomendaciones y busqueda inteligente
- Activar streaming cuando el backend incorpore respuesta incremental compatible
- Integrar Leaflet en `LocationMapPreview`
- UI de comparacion before/after sobre `photo_comparisons`
- Agregar mapa interactivo con Leaflet
- Conectar clientes con contratos, entregas publicas y aprobacion formal
- Incorporar graficas con Recharts
- Construir recomendaciones IA con datos reales del usuario

## Capturas

Pendiente de anadir capturas del dashboard, sesiones, equipo y biblioteca cuando se prepare el material visual del portfolio.
