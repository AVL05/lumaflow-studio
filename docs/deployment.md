# Despliegue

## Demo publica gratuita

La topologia de portfolio usa servicios con limite de gasto cero:

| Capa | Servicio | URL |
|---|---|---|
| SPA | Vercel | `https://lumaflow.aleviclop.dev` |
| API Laravel | Render (free web service) | `https://lumaflow-api.aleviclop.dev` |
| Base de datos | TiDB Cloud Starter, MySQL compatible | Privada, TLS obligatorio |
| Galerias | Storage S3 compatible con plan gratuito | Privada, servida por URL publica |

`render.yaml` define el servicio backend. Los valores marcados con `sync: false`
son secretos y se introducen en Render; nunca se guardan en Git. El limite mensual
de TiDB debe permanecer en `0` para impedir cargos. Render puede suspender el
servicio gratuito por inactividad, por lo que la primera peticion puede tardar.

La SPA se construye con:

```env
VITE_API_URL=https://lumaflow-api.aleviclop.dev/api
```

El backend usa `FILESYSTEM_DISK=s3`; las credenciales corresponden al proveedor
de almacenamiento gratuito y no al repositorio.

## Despliegue automático y controles

Cada `push` o merge a `main` inicia el ciclo de entrega:

1. GitHub Actions instala las dependencias desde los lockfiles.
2. Ejecuta formato, lint, 56 tests backend, 33 tests frontend y build PWA.
3. Construye las imágenes Docker de frontend y backend para detectar fallos del entorno de despliegue.
4. Vercel despliega automáticamente `frontend/` con Node 22.
5. Render espera a que los checks de GitHub terminen correctamente antes de desplegar la API.
6. Al finalizar un despliegue, y además cada seis horas, se comprueban el login público y `/api/health`.

Los workflows están en `.github/workflows/ci.yml` y
`.github/workflows/production-smoke.yml`. Un fallo queda visible en la pestaña
**Actions** del repositorio y evita que Render publique ese commit. Vercel mantiene
el último despliegue correcto si su build falla.

Configuración del proyecto Vercel:

- Root Directory: `frontend`
- Framework: Vite
- Node.js: 22.x
- Variable de producción: `VITE_API_URL=https://lumaflow-api.aleviclop.dev/api`

## Docker (recomendado)

```bash
cp .env.example .env
docker compose up --build
```

| Servicio | Puerto | Notas |
|---|---|---|
| frontend | 8080 | Build estatico servido por nginx, con fallback SPA |
| backend | 8000 | `php artisan serve` tras esperar a MySQL, migrar y enlazar storage |
| mysql | 3306 | Volumen `mysql-data` |
| phpmyadmin | 8081 | |
| ollama | 11434 | Solo con `--profile ollama` |

Con el perfil de IA:

```bash
docker compose --profile ollama up --build
docker compose exec ollama ollama pull llama3.1
```

Sin el perfil, el backend usa el Ollama del **host** a traves de `host.docker.internal`.

### Notas de los contenedores

- `backend/docker/entrypoint.sh` espera a que MySQL acepte conexiones (`depends_on` solo garantiza que el contenedor arranco), copia `.env` si falta, genera `APP_KEY` si no existe, hace `storage:link` y `migrate --force`. Con `SEED_DATABASE=true` siembra datos de ejemplo.
- `VITE_API_URL` se inyecta en **tiempo de build** del frontend: Vite la sustituye en el bundle. Cambiarla requiere reconstruir la imagen.
- El storage publico persiste en el volumen `backend-storage`.

```bash
docker compose down      # parar
docker compose down -v   # parar y borrar volumenes (destruye la BD)
```

## Desarrollo local con recarga inmediata

Requisitos: PHP 8.3+, Composer, Node 22+ y pnpm 10+. No requiere Docker ni MySQL.

```bash
pnpm run start
```

Este único comando ejecuta `scripts/start-local.mjs`, que:

1. comprueba que pnpm, PHP y Composer estén disponibles;
2. sincroniza dependencias JavaScript y PHP;
3. crea `backend/.env` y una `APP_KEY` solo si faltan;
4. crea y migra `backend/database/database.sqlite`;
5. aplica al proceso local `DB_CONNECTION=sqlite`, cache en archivos, cola síncrona y storage público;
6. inicia Laravel en `http://localhost:8000` y Vite en `http://localhost:5173`.

Vite aplica HMR a React, JavaScript y CSS. Laravel lee de nuevo los archivos PHP en cada petición. No hay que reconstruir ni reiniciar al editar. `Ctrl+C` detiene ambos procesos.

Las variables locales se inyectan solo en los procesos iniciados. No se sobrescriben credenciales existentes de MySQL, Docker o producción.

Para empezar con una base limpia, abre `http://localhost:5173/register` y crea la primera cuenta.

### URLs locales

| Servicio | URL |
|---|---|
| SPA con HMR | `http://localhost:5173` |
| API Laravel | `http://localhost:8000/api` |
| Salud | `http://localhost:8000/api/health` |

## Variables

`backend/.env`:

```env
APP_NAME="LumaFlow Studio"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.tu-dominio.com
APP_KEY=base64:...

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=lumaflow_studio
DB_USERNAME=lumaflow
DB_PASSWORD=

FRONTEND_URLS=https://tu-dominio.com
SESSION_DRIVER=file
FILESYSTEM_DISK=public
CACHE_STORE=database

OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.1
OLLAMA_TIMEOUT=30
OLLAMA_MAX_CONTEXT=12000
LUMAFLOW_LOG_LEVEL=info
```

`frontend/.env`:

```env
VITE_API_URL=https://api.tu-dominio.com/api
```

Nunca commitear `.env`. Solo los `.env.example`.

## Checklist antes de produccion

- [ ] `APP_DEBUG=false` y `APP_ENV=production`.
- [ ] `APP_KEY` generada y persistida.
- [ ] `FRONTEND_URLS` con el dominio real (CORS deniega el resto).
- [ ] `php artisan storage:link` ejecutado.
- [ ] `php artisan config:cache route:cache view:cache`.
- [ ] `composer install --no-dev --optimize-autoloader`.
- [ ] HTTPS terminado en el proxy: los tokens Bearer viajan en cabecera.
- [ ] Backup del volumen de MySQL y del storage publico.
- [ ] `CACHE_STORE` real (database o redis): el rate limiting depende de el.
- [ ] Rotacion de `storage/logs/lumaflow.log` (canal diario, 14 dias por defecto).

## Monitorizacion

- `GET /api/health` — sonda publica para orquestadores. 200 operativo, 503 caido. Solo expone el `status` de cada dependencia.
- `GET /api/system` — detalle autenticado (latencias, driver, versiones, modelo de IA). Lo consume la pagina `/app/system`.
- `GET /up` — sonda nativa de Laravel.

`degraded` significa que solo la compatibilidad Ollama backend esta caida. La SPA puede seguir usando WebGPU si el navegador lo soporta.
