# Backup & Recovery

Estrategia mínima y verificable para la beta (Issue #12). Sin costes obligatorios ni infraestructura nueva.

## Inventario de datos

**Críticos no regenerables** (backup de base de datos): `users`, `workspaces`, `workspace_memberships`, `workspace_invitations`, `clients`, `photography_jobs` (+ pivote `gear_item_job`), `sessions`, `tasks`, `checklists`, `checklist_items`, `activities`, `notifications`, `booking_requests`, `quotes`, `quote_items`, `invoices`, `presets`, `gear_items`, `locations`, `deliveries`, `ai_conversations`, `ai_messages`, `ai_session_plans`, `ai_analyses`, `contracts`, `contract_portal_links`, `personal_access_tokens`, configuración del estudio (columnas de `users`). Las tablas `cache*`, `jobs*` (colas) y `password_reset_tokens` viajan en el dump pero son efímeras.

**Regenerables** (excluidos de la estrategia): caché (incluida analytics), logs, builds, precache PWA, modelos WebGPU del navegador.

**Fuera de LumaFlow** (nunca en backup): fotografías originales en Drive/Dropbox/Pixieset/etc. e historial IA de IndexedDB (`lumaflow-ai:*`, solo navegador).

## Estado: implementado, NO activado

Runner GitHub Actions integrado en `main` (#34). Integración Backblaze B2 implementada con Laravel/Flysystem S3 existente, sin SDK nuevo. **Cuenta/bucket/key/config B2 reales NO creados ni verificados. `PRODUCTION_BACKUP_ENABLED` sigue sin configurar. Primera copia productiva y tres días consecutivos NO realizados. #24 sigue abierto (`Refs #24`).**

Sin Repository Variable `PRODUCTION_BACKUP_ENABLED=true`, schedule y dispatch quedan `skipped`: sin runner, acceso a Secrets/TiDB, dumps ni fallo rojo diario. Gate exige también repositorio original y `main`, sin bypass manual. Environment `production-backup` protege Secrets/config del job. Gate debe ser de repositorio: [Environment Variables solo llegan tras iniciar el job](https://docs.github.com/en/actions/reference/workflows-and-actions/variables#configuration-variable-precedence).

## Flujo y destino privado

TiDB → Actions → `data:backup --remote --prune` → `.sql.gz` + `.sha256` → B2 privado → download/verificación SHA-256 → retención remota → limpieza local.

Generación canónica #12 intacta: MySQL/TiDB `mysqldump --single-transaction`, contraseña vía `MYSQL_PWD`, CA y verificación de identidad TLS; SQLite sintético reutiliza dump existente. No añadimos fotos, IndexedDB, caches, logs ni builds.

Disk exclusivo `backup_s3`, namespace `BACKUP_S3_*`, independiente de `FILESYSTEM_DISK`. HTTPS regional B2 obligatorio, path-style, visibility privada, excepciones activadas, timeouts HTTP. [B2 admite path-style y virtual-host](https://www.backblaze.com/docs/cloud-storage-call-the-s3-compatible-api); endpoint sin bucket ni credenciales embebidas. Config vacía/inválida falla antes del dump, sin imprimir valores. [Opciones del SDK](https://docs.aws.amazon.com/sdk-for-php/v3/developer-guide/configuration.html) `request_checksum_calculation`/`response_checksum_validation=when_required` evitan checksums AWS opcionales; integridad propia siempre mediante download y SHA-256.

Objetos sin PII en bucket privado dedicado, sin website hosting:

```text
database/lumaflow-db-YYYYMMDD-HHMMSS-mysql.sql.gz
database/lumaflow-db-YYYYMMDD-HHMMSS-mysql.sql.gz.sha256
```

`BACKUP_PATH` sigue siendo staging: local por defecto `storage/backups`; Actions `$RUNNER_TEMP/lumaflow-backups`, efímero. Render también efímero y Compose solo persiste storage público: no son destino final. B2, cuando el operador lo provisione y verifique, conserva objetos independientemente del runner y proveedor DB.

Upload exige checksum local válido y rechaza overwrites. Sube ambos objetos privados, verifica existencia/tamaño de ambos, descarga mediante streams a directorio aleatorio 0700/archivos 0600, comprueba SHA-256 completo con sidecar y origen. ETag no se usa como SHA-256. Solo después reporta copia verificada. Fallo de upload/download/checksum/prune => exit 1, sin falso éxito. Staging se elimina también ante fallo; workflow añade cleanup `always()`, sin artifacts. Un upload parcial no es copia válida y se elimina en el próximo prune exitoso.

## Comandos y restore

```bash
# Local compatible con #12
php artisan data:backup --prune
php artisan data:restore <basename>
php artisan data:backup-status
# Remoto opt-in, B2 previamente configurado
php artisan data:backup --remote --prune --no-interaction
php artisan data:backup-status --remote
php artisan data:restore <basename> --remote
# Solo con autorización y tras drill
php artisan data:restore <basename> --remote --apply
```

Restore remoto exige basename reconocido, nunca key/path arbitrario (traversal/nesting rechazados), descarga SQL y checksum a temporal privado, verifica y reutiliza drill existente. Limpia temporal incluso ante fallo. Sin `--apply` no modifica DB configurada. Guards intactos: `--apply`, producción exige `--force-production`, confirmación salvo `--force`.

**Drill MySQL requiere DB aislada y permiso CREATE/DROP DATABASE**, además de cliente MySQL/CA. Ejecutarlo en entorno no productivo autorizado, no conceder esos permisos al usuario diario ni usar producción por comodidad. Nunca descargar datos reales al repo/PR/CI.

## Frecuencia, retención y versiones B2

Diario **03:00 UTC**, `0 3 * * *`; app/Scheduler UTC. Madrid 04:00 invierno/05:00 verano. Workflow llama directamente `php artisan data:backup --remote --prune --no-interaction`, evita 1.440 invocaciones diarias de `schedule:run`. Nadie ejecuta Scheduler en Render; otros scheduled commands no quedan automatizados.

Selección #12 reutilizada: último por día de los últimos 7 días + último por semana ISO de 4 semanas anteriores. Fuente de verdad **listado remoto**, no archivos anteriores del runner. Solo nombres reconocidos bajo `database/` y sidecars; ajenos/nested intactos. Parejas incompletas no cuentan como retenidas. `--dry-run` muestra selección sin borrar (todavía genera/sube nueva copia).

[B2 borrar por nombre añade delete marker; no libera versiones](https://www.backblaze.com/apidocs/s3-delete-objects). Prune usa cliente S3 YA instalado en el disk: ListObjectVersions paginado y DeleteObjects por **VersionId exacto**, lotes hasta 1.000. Purga todas las versiones de copias expiradas/incompletas, versiones no actuales y markers reconocidos; conserva actuales seleccionadas. Errores individuales también fallan. Nombres por timestamp y rechazo de sobrescritura minimizan versiones.

Aplicación controla 7+4; **no configuramos lifecycle ni permisos para administrarlo**. Mantener actuales sin expiración; no TTL que elimine semanales retenidos. Operador puede usar [lifecycle solo de versiones ocultas/no actuales](https://www.backblaze.com/docs/cloud-storage-lifecycle-rules) como safety net sin expirar actuales. No Object Lock/legal holds incompatibles con prune. Ante fallos repetidos revisar también multipart incompletos/cuota en consola. Borrar manualmente por nombre no equivale a liberar espacio.

Concurrencia: Actions `production-backup`, `cancel-in-progress: false`; lock local `flock` sin Redis. Scheduler conserva `withoutOverlapping(30)` en otros despliegues. Lock local no sincroniza escritores externos: no lanzar otro host independiente simultáneo.

## Application Key y configuración

Standard application key, nunca master (no soportada S3), restringida al único bucket y prefijo `database/`. Capacidades mínimas: `listFiles`, `readFiles`, `writeFiles`, `deleteFiles`, `listAllBucketNames` por compatibilidad SDK; `listBuckets` solo si herramienta comprueba/lista buckets. [Particularidades oficiales B2 S3](https://www.backblaze.com/docs/cloud-storage-s3-compatible-app-keys). Listar nombres de buckets no autoriza acceso a sus objetos.

Consola: bucket concreto, **Read and Write**, **Allow list all bucket names**, File name prefix `database/`. Revisar capabilities emitidas; no necesitamos administración de cuenta/buckets, `writeBuckets`, `writeKeys`, `listKeys`, `deleteKeys`, policies/retentions ni `bypassGovernance`. Si preset añade privilegios, operador puede crear manualmente standard key vía Native API con `bucketIds` del único bucket, `namePrefix=database/` y capabilities exactas anteriores. No se hace administración B2 desde LumaFlow. [Opciones UI y restricciones](https://www.backblaze.com/docs/cloud-storage-application-keys).

| GitHub | Nombres (nunca valores en repo/PR) |
| --- | --- |
| Environment Secrets `production-backup` | `BACKUP_DB_HOST`, `BACKUP_DB_PORT`, `BACKUP_DB_DATABASE`, `BACKUP_DB_USERNAME`, `BACKUP_DB_PASSWORD` |
| Environment Secrets `production-backup` | `BACKUP_S3_ACCESS_KEY_ID` (keyID), `BACKUP_S3_SECRET_ACCESS_KEY` (applicationKey) |
| Environment Variables `production-backup` | `BACKUP_S3_BUCKET`, `BACKUP_S3_ENDPOINT`, `BACKUP_S3_REGION` |
| Repository Variable, gate previo al job | `PRODUCTION_BACKUP_ENABLED`, ausente hasta activación aprobada |

Copiar endpoint HTTPS/región reales de B2, no fixtures; no usar AWS_* globales ni Secrets Render.

## Verificación y fallos

Para “¿Se hizo el backup de hoy?”:

1. Actions → **Production backup** → run del día → **Back up, verify B2 and prune remote retention**: conexión TLS, copia verificada, nombre/bytes, checksum/timestamp UTC, retención; run success y summary B2. `skipped` significa no copia.
2. Consola bucket privado: ambos objetos `database/`, tamaño/fecha y versiones antiguas purgadas.
3. Entorno privado autorizado: `php artisan data:backup-status --remote` descarga/verifica último objeto; muestra nombre, timestamp UTC, bytes, SHA-256 completo, edad y OK/STALE (>36h). Retorna 1 ante ausencia, checksum/IO fallido o STALE. Sin endpoint público; `/api/ready` independiente.
4. `php artisan data:restore <basename> --remote` en DB aislada; comprobar migrations/tablas/conteos sin subir datos productivos a CI/repo.

Ante fallo revisar logs mínimos, B2 endpoint/permisos/cuota y Secrets/TiDB TLS/allowlist en privado, corregir y dispatch. No abrir acceso global por comodidad. Mensajes SDK/driver se descartan (pueden contener URL firmada/secrets); stdout/excepciones/log/Sentry solo reciben error estático/clase, sin dumps, passwords o DATABASE_URL. Workflow no agrega DSN productivo. Summary texto estático solo tras éxito.

`php artisan test --filter=Backup` verifica backup SQLite real sintético, S3 fake, prune, download/SHA-256 y drill, errores/canaries/traversal y SDK mock para paginación/borrado exacto de versiones. CI no recibe Secrets productivos.

## Activación pendiente y recuperación

Pasos exactos en [deployment.md](deployment.md#activar-backup-privado-en-backblaze-b2): crear/verificar B2 privado → Secrets/Variables → aprobación y gate → primer dispatch → objeto durable/checksum y restore aislado → tres días UTC consecutivos y retención → cerrar #24. Registrar fecha/run URLs sin datos sensibles. Tres dispatches en un día NO cumplen tres días.

**Primera producción NO realizada; tres días NO observados.** No recursos facturables creados, prod dispatch ni gate activo. RPO orientativo tras activación ~24h, sin SLA; hoy depende de manual/proveedor. Incidente: detener escrituras si procede, elegir copia verificada, drill aislado, restore con guards, validar antes de reabrir tráfico.

## Coste y segunda capa TiDB

Verificado 2026-10-07: [primeros 10 GB B2 gratuitos](https://www.backblaze.com/cloud-storage/pricing), [registro sin tarjeta requerida](https://www.backblaze.com/sign-up/cloud-storage). Superar cuota/tráfico gratis puede generar coste; cuentan versiones y multipart. Download/verificación consume tráfico (backup verifica dump completo y status repite). No promesa gratis para siempre: comprobar cuota/egress y límites/avisos antes de activar; beta no debe depender de excederlos. No habilitamos facturación.

[TiDB Cloud Starter gratuito: snapshot automático diario, retención 1 día](https://docs.pingcap.com/tidbcloud/backup-and-restore-serverless/?plan=essential). Protección adicional, no reemplaza B2: sin 7+4 ni independencia DB. No hemos inspeccionado snapshots de la cuenta real.

[Render Cron](https://render.com/docs/cronjobs) de pago y [Render Free](https://render.com/docs/free) efímero no usados. [Actions estándar público](https://docs.github.com/en/billing/concepts/product-billing/github-actions) sin coste de minutos, sin artifacts productivos. [Schedules](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule) pueden retrasarse/descartarse y desactivarse tras 60 días inactivo: operador debe observar ejecuciones/cuota, sin SLA.

## Revalidación Sprint 1 — 29/10/2026

`php artisan test --filter=Backup`: **PASS, 32 tests, 264 assertions** después de actualizar Flysystem a 3.35.3. Se ejecuta generación/restauración SQLite sintética con checksum y verificación de datos; S3 fake y SDK mock comprueban descarga, retención, paginación, VersionId, objetos ajenos, checksums ausentes/corruptos, AccessDenied y limpieza ante fallo. Configuración/errores usan canarios, nunca credenciales reales. Los guards de restauración permanecen intactos.

**No ejecutado:** acceso B2 real, ACL/capacidades de una application key real, recuperación MySQL/TiDB y observación de tres días UTC. Los mocks no prueban esos permisos. chmod de tests Windows no acredita ACL/POSIX del host Linux. #24 sigue abierto; no se ha activado `PRODUCTION_BACKUP_ENABLED` ni ejecutado workflow productivo.

Ensayo pendiente de aprobación/infraestructura aislada:

1. Preparar una DB MySQL compatible exclusivamente sintética y un destino privado autorizado con cuota comprobada; guardar secretos fuera del repo y logs. No sustituir variables de producción.
2. Desde ese entorno, ejecutar `data:backup --remote`, verificar con `data:backup-status --remote` y confirmar objetos + sidecar, SHA-256, tamaño y timestamp. Revisar acceso mínimo y denegación de lectura anónima en el proveedor.
3. Ejecutar `data:restore <basename> --remote` contra entorno aislado (drill, sin `--apply`); confirmar integridad, tablas, conteos y aislamiento de dos workspaces sintéticos. Si se ensaya `--apply`, usar únicamente otra DB sintética dedicada y validar nuevamente; nunca la DB de origen ni producción.
4. Ensayar pérdida de permiso/checksum y recuperación del error sin registrar secretos. Antes de prune, inspeccionar selección con dry-run y datos sintéticos con fechas representativas. `--dry-run` aún genera/sube una copia: no usarlo contra producción como si fuera solo lectura.
5. Registrar evidencia privada y un resumen sin datos en #24. Activar automatización productiva solo mediante autorización separada; después verificar primera copia durable, restore aislado y tres días UTC consecutivos, junto a retención 7+4. El ensayo local no satisface esos criterios.

## Ensayo MySQL/B2 pendiente — Sprint 1.5

Sprint 4 añade `project_templates`, `postproduction_stages` y `project_template_applications` al inventario crítico, además de referencias/asignación/revisión en Task y contexto Job/etapa en Checklist. BackupRestoreTest recupera estos datos, incluidos responsables y fechas introducidos explícitamente. El dump es completo, no depende de una lista fija de tablas. Incluirlos en el ensayo sintético MySQL/TiDB/B2 pendiente. CI remoto, impresión física y tres días UTC no quedan acreditados por estos tests; #24 continúa abierto.

Sprint 3 añade `shots` y `gear_item_shot` al inventario crítico del dump completo, además de hora final, participantes e incidencias de Session. El drill SQLite de `BackupRestoreTest` comprueba restauración de toma/estado/notas/revisión, sesión, horario, participantes y equipo; no valida almacenamiento remoto ni motor MySQL. Añadir estas entidades sintéticas y relaciones al ensayo externo pendiente. No cerrar #24 ni aplicar migraciones/restauraciones a producción para comprobarlas.

Sprint 2 mantiene este ensayo **NOT RUN** y #24 abierto. El backup de BD completa incluye ahora también metadatos/briefing/revisión en `photography_jobs` y el pivot `job_location`; no hay nuevos archivos multimedia que copiar. `BackupRestoreTest` verifica recuperación de estos datos únicamente en SQLite temporal. En el ensayo externo, añadir proyecto personal con briefing y localización a las dos workspaces sintéticas, y comparar valores, revisión y pivots después de restaurar. No aplicar la migración ni restaurar sobre datos reales para validar este cambio.

**NOT RUN.** En el equipo de esta sesión no hay daemon Docker activo, clientes mysql/mysqldump disponibles ni variables de credenciales de ensayo autorizadas. No utilizar secretos productivos como alternativa. Las pruebas fake/SQLite existentes siguen verificando lógica, no conectividad externa.

Procedimiento reproducible para un operador con acceso autorizado:

1. Usar checkout privado aislado sin `.env` productivo ni configuración cacheada. Preparar MySQL/TiDB de ensayo con clientes mysql/mysqldump, PDO MySQL y CA/TLS compatibles. Crear dos bases vacías llamadas `lumaflow_recovery_test_source` y `lumaflow_recovery_test_target`; usar una cuenta temporal de ensayo con CREATE/DROP DATABASE para el drill, nunca la cuenta diaria productiva. Comprobar cuota/permisos antes de crear recursos; esta sesión no los provisiona.
2. Inyectar variables por entorno privado: `APP_ENV=testing`, `APP_DEBUG=false`, APP_KEY sintética, `DB_CONNECTION=mysql`, DB_DATABASE de ensayo, DB_HOST/PORT/USERNAME/PASSWORD autorizados y `MYSQL_ATTR_SSL_CA` cuando corresponda. No definir DB_URL; desactivar DSN Sentry y usar `MAIL_MAILER=array`, caché array y BACKUP_PATH privado fuera del repo. Configurar BACKUP_S3_* únicamente para bucket B2 privado de ensayo, sin objetos reales. No volcar configuración ni secretos por consola. Verificar explícitamente entorno, nombre de DB y bucket de ensayo antes de cualquier comando.
3. Desde backend, con source seleccionada y vacía:

```bash
php artisan migrate --no-interaction
php artisan db:seed --class='Database\Seeders\E2ESeeder' --no-interaction
php artisan data:backup --remote --no-interaction
php artisan data:backup-status --remote
```

El seeder actual crea cinco cuentas sintéticas y sus cinco estudios/memberships; no usa clientes reales. Añadir estas filas de dominio **solo en esa source sintética** mediante el cliente SQL privado:

```sql
INSERT INTO clients (user_id, workspace_id, name, status, created_at, updated_at)
SELECT id, current_workspace_id, CONCAT('Recovery synthetic ', id), 'active', NOW(), NOW() FROM users;
INSERT INTO photography_jobs (user_id, workspace_id, client_id, title, specialty, workflow_key, status, contract_status, created_at, updated_at)
SELECT user_id, workspace_id, id, 'Recovery synthetic project', 'general', 'general', 'lead', 'not_required', NOW(), NOW() FROM clients;
```

Generar otra copia con `data:backup --remote --no-interaction` y registrar su basename/sidecar/timestamp/checksum sin credenciales. No usar `--prune` durante este ensayo de conectividad ni contra un destino compartido.

4. Cambiar únicamente a target vacía y comprobar de nuevo DB/entorno/bucket. `php artisan data:restore <basename-sintético> --remote` debe completar el drill temporal. Solo en target sintética vacía, `php artisan data:restore <basename-sintético> --remote --apply` permite verificar la aplicación interactiva; no usar `--force-production` ni omitir confirmación. Comparar source/target: cinco usuarios, cinco workspaces, cinco memberships, cinco clientes y cinco trabajos, mismo conjunto de migraciones y cero relaciones incoherentes:

```sql
SELECT COUNT(*) FROM photography_jobs j JOIN clients c ON c.id = j.client_id WHERE j.workspace_id <> c.workspace_id;
SELECT COUNT(*) FROM workspace_memberships m JOIN workspaces w ON w.id = m.workspace_id WHERE m.role = 'owner' AND m.user_id = w.user_id;
```

Esperados: 0 y 5. Una discrepancia bloquea la validación. No afirmar que el chequeo genérico de tablas/usuarios del drill comprueba por sí solo estas relaciones.

5. Verificar en B2 privacidad, aplicación de permisos mínimos, lectura anónima denegada, descarga íntegra y denegación esperada al retirar permisos de una key de ensayo. Contrastar retención/borrado de versiones con fixtures sintéticas en bucket exclusivo y el dry-run del runbook; ese dry-run también sube una copia. Adjuntar únicamente resultados agregados a #24. Activación productiva y tres días UTC siguen siendo una validación separada.

Los comandos anteriores están preparados, **no ejecutados**. No cerrar #24 hasta disponer de la evidencia externa necesaria.

### Ampliación del ensayo sintético — Sprint 5

`BackupRestoreTest` incluye entrega personal, enlace original, segunda revisión, notas públicas, token y revocación, además de Activity. El dump completo recoge delivery_revisions automáticamente. El ensayo local recupera esos registros y sus relaciones en SQLite temporal; no hay material audiovisual. No ejecutar rollback de la migración de revisiones: su down está bloqueado para preservar historial y clientes nulos.

Sigue pendiente ejecutar este mismo escenario en MySQL/TiDB y el roundtrip privado B2 del runbook, con credenciales y entornos autorizados. Verificar números de revisión, URLs exactas, marcas de publicación, UUIDs, eventos, FK y revocación; no copiar datos reales a un ensayo ni publicar tokens. Esta ampliación local no completa #24 ni acredita permisos/retención B2.
