# Despliegue

## Beta publica gratuita

La beta publica usa servicios con limite de gasto cero mientras se valida el producto:

| Capa          | Servicio                                | URL                                  |
| ------------- | --------------------------------------- | ------------------------------------ |
| SPA           | Vercel                                  | `https://lumaflow.aleviclop.dev`     |
| API Laravel   | Render (free web service)               | `https://lumaflow-api.aleviclop.dev` |
| Base de datos | TiDB Cloud Starter, MySQL compatible    | Privada, TLS obligatorio             |

Las entregas no alojan originales: solo guardan enlace externo, proveedor, contraseña y
caducidad. No hay bucket S3 de galerias ni costes de almacenamiento/transferencia.

`render.yaml` define el servicio backend. Los valores marcados con `sync: false`
son secretos y se introducen en Render; nunca se guardan en Git. El limite mensual
de TiDB debe permanecer en `0` para impedir cargos. Render puede suspender el
servicio gratuito por inactividad, por lo que la primera peticion puede tardar.

La SPA se construye con:

```env
VITE_API_URL=https://lumaflow-api.aleviclop.dev/api
```

El backend usa `FILESYSTEM_DISK=public` en local. No se requiere S3: no hay originales que alojar.

## Despliegue automático y controles

Cada `push` o merge a `main` inicia el ciclo de entrega:

1. GitHub Actions instala las dependencias desde los lockfiles.
2. Ejecuta formato, lint, tests backend, tests frontend y build PWA.
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

| Servicio   | Puerto | Notas                                                              |
| ---------- | ------ | ------------------------------------------------------------------ |
| frontend   | 8080   | Build estatico servido por nginx, con fallback SPA                 |
| backend    | 8000   | `php artisan serve` tras esperar a MySQL, migrar y enlazar storage |
| mysql      | 3306   | Volumen `mysql-data`                                               |
| phpmyadmin | 8081   |                                                                    |
| ollama     | 11434  | Solo con `--profile ollama`                                        |

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

En local, los emails se escriben en `backend/storage/logs/laravel.log`. Tras registrarte, abre el enlace firmado que aparece en ese archivo para continuar con el onboarding.

Las variables locales se inyectan solo en los procesos iniciados. No se sobrescriben credenciales existentes de MySQL, Docker o producción.

Para empezar con una base limpia, abre `http://localhost:5173/register` y crea la primera cuenta.

### URLs locales

| Servicio    | URL                                |
| ----------- | ---------------------------------- |
| SPA con HMR | `http://localhost:5173`            |
| API Laravel | `http://localhost:8000/api`        |
| Salud       | `http://localhost:8000/api/health` |

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

MAIL_MAILER=smtp
MAIL_HOST=smtp.tu-proveedor.com
MAIL_PORT=587
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_FROM_ADDRESS=noreply@tu-dominio.com
MAIL_FROM_NAME="LumaFlow Studio"
```

`frontend/.env`:

```env
VITE_API_URL=https://api.tu-dominio.com/api
```

Nunca commitear `.env`. Solo los `.env.example`.

## Observability

Proveedor: **Sentry** (free tier suficiente en beta, SDKs oficiales React 19 + Laravel 13, sin infraestructura propia). Sin DSN no se envía nada y todo funciona igual: frontend arranca, backend responde, health/E2E verdes.

Variables (todas opcionales, vacías por defecto):

```env
# Backend
SENTRY_LARAVEL_DSN=
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=
# Frontend (build)
VITE_SENTRY_DSN=
VITE_SENTRY_ENVIRONMENT=
VITE_SENTRY_RELEASE=
```

`environment`: `APP_ENV` / `local|testing|production` (tests nunca reportan: sin DSN en CI). `release`: `SENTRY_RELEASE` o commit del proveedor (`RENDER_GIT_COMMIT`, `GITHUB_SHA`, `VERCEL_GIT_COMMIT_SHA`) o `unknown`; frontend y backend comparten el SHA cuando el proveedor lo expone. Trazas y replay desactivados (`sample rate 0`): solo error tracking.

**Correlación:** middleware `RequestCorrelationId` acepta `X-Request-ID` válido (UUID o alfanumérico ≤100) o genera UUID; lo devuelve en la respuesta (CORS lo expone), lo añade a logs y al tag de Sentry. El cliente Axios envía uno por request; en 5xx la UI muestra `Referencia del error: <id>`.

**Privacidad (redacción antes de enviar):** nunca `Authorization`/cookies/tokens, contraseñas, emails, teléfonos, contenido de contratos, notas privadas, `client_message`, prompts/respuestas IA ni cuerpos de petición. URLs con tokens públicos (`/public/*`, `/deliver/*`, `/contract/*`) se sanitizan a `[REDACTED]`. Identidad: solo ID interno pseudónimo. Sin IP completa, sin fingerprinting, sin replay, sin breadcrumbs con inputs o contenido.

**Qué sí viaja:** clase/mensaje de error (sin datos), fichero:línea, método, ruta sanitizada, `user_id`, `request_id`, `release`/`environment`.

### Procedimiento de investigación

1. El usuario reporta el fallo con su referencia (`Ref: …`) o el crash muestra su referencia.
2. Buscar el evento por request ID / referencia en Sentry.
3. Comprobar el evento frontend asociado (misma sesión/ventana temporal).
4. Correlacionar con el log backend (`api.exception` con igual `request_id`).
5. Revisar release/environment para reproducir en la versión correcta.
6. Reproducir, corregir y verificar que el evento deja de aparecer en ese release.

## Checklist antes de produccion

- [ ] `APP_DEBUG=false` y `APP_ENV=production`.
- [ ] `APP_KEY` generada y persistida.
- [ ] `FRONTEND_URLS` con el dominio real (CORS deniega el resto).
- [ ] `php artisan storage:link` ejecutado.
- [ ] `php artisan config:cache route:cache view:cache`.
- [ ] `composer install --no-dev --optimize-autoloader`.
- [ ] HTTPS terminado en el proxy: los tokens Bearer viajan en cabecera.
- [ ] Estrategia de backup activa según [backup-recovery.md](backup-recovery.md) (runner de `schedule:run` o equivalente).
- [ ] `CACHE_STORE` real (database o redis): el rate limiting depende de el.
- [ ] Rotacion de `storage/logs/lumaflow.log` (canal diario, 14 dias por defecto).
- [ ] SMTP configurado y entrega real de verificacion probada fuera de spam.

## Monitorizacion

- `GET /api/health` — sonda publica para orquestadores. 200 operativo, 503 caido. Solo expone el `status` de cada dependencia.
- `GET /api/system` — detalle autenticado (latencias, driver, versiones, modelo de IA). Lo consume la pagina `/app/system`.
- `GET /up` — sonda nativa de Laravel.

`degraded` significa que solo la compatibilidad Ollama backend esta caida. La SPA puede seguir usando WebGPU si el navegador lo soporta.

## Backup & Recovery

Ver [backup-recovery.md](backup-recovery.md): inventario, `data:backup`/`data:restore`, retención 7+4, drill reproducible y RPO/RTO orientativos. Los backups nunca forman parte del readiness.

### Activar el scheduler en producción

Runner: `.github/workflows/production-backup.yml`, Linux estándar de GitHub Actions, diario **03:00 UTC** y manual. No usa Render ni ejecuta `schedule:run`; llama directamente a `data:backup --prune`. Su incorporación en una rama/PR **no lo activa**. El repo público permite este runner sin coste de minutos; no hay artifacts de producción ni recursos de storage nuevos.

1. Tras revisión y merge realizado por el operador, crear/configurar el environment **production-backup** en Settings → Environments. Restringir deployment branches a `main`. El workflow también comprueba repo original y ref `main`; no tiene triggers de PR. No introducir estos secrets en CI general.
2. Añadir únicamente Secrets de ese environment: `BACKUP_DB_HOST`, `BACKUP_DB_PORT` (producción usa 4000), `BACKUP_DB_DATABASE`, `BACKUP_DB_USERNAME`, `BACKUP_DB_PASSWORD`. Nombres dedicados separan backup de test/deploy. GitHub no lee los secretos de Render. Usar endpoint público TLS TiDB existente y usuario de backup con lectura mínima verificada; confirmar la allowlist sin abrir acceso global por comodidad. Nunca copiar valores al chat/PR.
3. El workflow instala PHP 8.4/PDO MySQL, Composer con `--no-dev` y MySQL client solo si falta. CA: `/etc/ssl/certs/ca-certificates.crt`. `APP_KEY` es efímera generada para bootstrap; no se necesita la clave de cifrado de producción ni migraciones/seed. Preflight PDO valida TLS y `SELECT 1`, y ante fallo imprime solo mensaje estático.
4. **Bloqueo actual:** confirmar un destino privado duradero antes de considerar completo el sistema. No hay bucket verificado. `BACKUP_PATH` admite ruta privada; en Actions apunta a `$RUNNER_TEMP/lumaflow-backups`, efímera. Falta implementar/verificar upload, checksum y retención remota 7+4 una vez exista el destino. No activar R2/S3/Render de pago.
5. Para prueba autorizada: Actions → **Production backup** → **Run workflow** → rama `main`; o `gh workflow run production-backup.yml --ref main --repo AVL05/lumaflow-studio`. Dispatch requiere que el workflow exista en default branch. Revisar conexión, generación, SHA-256, bytes y timestamp. Hoy el job falla explícitamente por destino duradero pendiente y limpia el dump con `always()`: ese fallo es esperado y no acredita recuperación. No hay descarga de datos ni artifacts.
6. Al disponer de destino real y upload probado, registrar primera ejecución/fecha de activación en #24; observar **tres días UTC consecutivos** y comprobar objetos recuperables y rotación. Hasta entonces usar `Refs #24`, mantener issue abierto. En esta tarea no hay merge ni activación ni ejecución contra TiDB.
7. Logs: Actions → job → **Generate and verify temporary backup** y **Report missing durable destination**; los fallos previos impiden generar. El readiness no cambia. Ante error revisar Secrets/TLS/allowlist/storage en privado y reintentar mediante dispatch. Para detener el runner, Actions → workflow → Disable workflow; volver a Enable para reanudar. GitHub puede retrasar jobs y desactivarlos tras 60 días de inactividad del repo público.

No afirmar “backups automáticos” por `Schedule::command` ni por un workflow committed: hace falta una ejecución real con copia privada duradera. Render Free además carece de `mysqldump` en la imagen actual y de filesystem persistente; esta solución instala el cliente en Actions, sin modificar ni cobrar infraestructura Render.
