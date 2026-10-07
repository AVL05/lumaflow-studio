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

### Activar backup privado en Backblaze B2

Workflow `.github/workflows/production-backup.yml`, Actions Linux estándar, diario **03:00 UTC** y dispatch: `php artisan data:backup --remote --prune --no-interaction`. TiDB TLS → disk Laravel exclusivo `backup_s3` → B2 privado/verificado/retención remota. No cambia storage funcional/Render ni automatiza otros comandos Scheduler.

**NO activado.** Gate intacto `repo original && main && vars.PRODUCTION_BACKUP_ENABLED == 'true'`; variable ausente => ambos triggers skipped sin Secrets/TiDB/dumps/fallo diario. Código B2 listo, recursos/config reales NO provisionados/verificados. #24 abierto, `Refs #24`, primera producción/tres días pendientes.

El operador debe hacer manualmente, en este orden:

1. Crear cuenta Backblaze y activar **B2 Cloud Storage**. [Registro actual sin tarjeta](https://www.backblaze.com/sign-up/cloud-storage); no contratar ni habilitar facturación sin aprobación. Comprobar [primeros 10 GB gratis y límites vigentes](https://www.backblaze.com/cloud-storage/pricing), versiones/tráfico incluidos; beta no debe excederlos, sin promesa permanente.
2. Crear bucket **privado**, dedicado solo a backups LumaFlow, sin website hosting. Mantener actuales sin expiración lifecycle; no Object Lock/legal hold que impida prune. Aplicación controla 7+4 y elimina versiones exactas. Lifecycle opcional solo versiones ocultas, sin expirar actuales; no configurado automáticamente.
3. Crear **standard application key** para único bucket, prefijo `database/`. UI: **Read and Write**, **Allow list all bucket names**, File name prefix. Mínimos: `listFiles`, `readFiles`, `writeFiles`, `deleteFiles`, `listAllBucketNames`; `listBuckets` solo para herramientas que comprueben/listen buckets. No master key, administración cuenta/keys/otros buckets, `writeBuckets` ni governance. Revisar preset; si añade privilegios, crear manualmente Native API key con capabilities exactas, bucket/prefijo restringidos. [Permisos S3 B2](https://www.backblaze.com/docs/cloud-storage-s3-compatible-app-keys), [opciones UI](https://www.backblaze.com/docs/cloud-storage-application-keys). Listar nombres no permite objetos de otros buckets. Guardar keyID/applicationKey privadamente.
4. Copiar del bucket **endpoint S3 regional HTTPS** y región REALES, sin bucket/path/query ni credenciales en URL. Adapter usa path-style admitido B2. No inventar valores ni copiar fixtures.
5. GitHub Settings → Environments → **production-backup**, deployment branches restringidas a `main`. Añadir **Environment Secrets**: `BACKUP_DB_HOST`, `BACKUP_DB_PORT`, `BACKUP_DB_DATABASE`, `BACKUP_DB_USERNAME`, `BACKUP_DB_PASSWORD`, `BACKUP_S3_ACCESS_KEY_ID`, `BACKUP_S3_SECRET_ACCESS_KEY`. DB: endpoint público TLS TiDB/usuario lectura mínima; copiar puerto real (actual producción 4000), verificar allowlist autorizada sin abrir global. GitHub no lee Secrets Render. Añadir **Environment Variables**: `BACKUP_S3_BUCKET`, `BACKUP_S3_ENDPOINT`, `BACKUP_S3_REGION`. No compartir valores al chat/PR/repo.
6. Dejar **Repository Variable `PRODUCTION_BACKUP_ENABLED` ausente** hasta cuenta/bucket/permisos/config listos y prueba aprobada. No gate en environment: [variables llegan después de evaluar if del job](https://docs.github.com/en/actions/reference/workflows-and-actions/variables#configuration-variable-precedence).
7. Una vez listo/aprobado, Settings → Secrets and variables → Actions → Variables → **Repository variables**: `PRODUCTION_BACKUP_ENABLED=true`. Activa ambos triggers; hacerlo fuera de 03:00 UTC y probar inmediatamente. No bypass manual. Desactivar eliminando variable o `false`.
8. Tras revisión/merge del operador, Actions → **Production backup** → **Run workflow** → `main`, o `gh workflow run production-backup.yml --ref main --repo AVL05/lumaflow-studio`. Instala PHP 8.4/PDO MySQL, Composer no-dev y MySQL client si falta; APP_KEY temporal, CA `/etc/ssl/certs/ca-certificates.crt`, preflight config B2 antes de PDO TLS `SELECT 1`. No APP_KEY/DSN productivo, migraciones/seeds ni artifacts.
9. Verificar run success, logs **Back up, verify B2 and prune remote retention**, summary y objetos privados `database/lumaflow-db-YYYYMMDD-HHMMSS-mysql.sql.gz[.sha256]`. Comando verifica existencia/tamaños, download/SHA-256, prune remoto y cleanup; status vuelve a verificar. Desde entorno privado autorizado: `php artisan data:backup-status --remote` (nombre, fecha UTC, bytes, checksum, edad, OK/STALE, exit 1 ante fallo/>36h). Cleanup local en comando y always(), runner no destino final.
10. Drill `php artisan data:restore <basename> --remote` en **DB aislada no productiva**, clientes/CA y permisos CREATE/DROP DATABASE que drill MySQL requiere. Guards apply/force-production intactos; no dump real al repo/PR/CI. Registrar fecha activación/run y verificación durable/checksum/restore en #24 sin secretos.
11. Observar **tres días UTC consecutivos** y confirmar 7+4/versión antigua purgada; solo entonces cerrar #24. Mantener `Refs #24` hasta cumplirlo. No activación ni producción durante esta implementación.

Ante fallo: exit no cero, revisar B2 permisos/cuota/config y TiDB TLS/allowlist en privado; mensajes técnicos estáticos/clase sin secrets/contenido, Sentry opcional, readiness independiente. Github puede retrasar/descartar schedules y desactivarlos tras 60 días inactivo. [TiDB Starter snapshot diario, retención 1 día](https://docs.pingcap.com/tidbcloud/backup-and-restore-serverless/?plan=essential) es segunda capa, no sustituye B2 independiente 7+4; cuenta real no auditada. Ver [backup-recovery.md](backup-recovery.md) para inventario, versiones, límites y drill sintético reproducible.
