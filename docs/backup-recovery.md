# Backup & Recovery

Estrategia mínima y verificable para la beta (Issue #12). Sin costes obligatorios ni infraestructura nueva.

## Inventario de datos

**Críticos no regenerables** (backup de base de datos): `users`, `workspaces`, `workspace_memberships`, `workspace_invitations`, `clients`, `photography_jobs` (+ pivote `gear_item_job`), `sessions`, `tasks`, `checklists`, `checklist_items`, `activities`, `notifications`, `booking_requests`, `quotes`, `quote_items`, `invoices`, `presets`, `gear_items`, `locations`, `deliveries`, `ai_conversations`, `ai_messages`, `ai_session_plans`, `ai_analyses`, `contracts`, `contract_portal_links`, `personal_access_tokens`, configuración del estudio (columnas de `users`). Las tablas `cache*`, `jobs*` (colas) y `password_reset_tokens` viajan en el dump pero son efímeras.

**Regenerables** (excluidos de la estrategia): caché (incluida analytics), logs, builds, precache PWA, modelos WebGPU del navegador.

**Fuera de LumaFlow** (nunca en backup): fotografías originales en Drive/Dropbox/Pixieset/etc. e historial IA de IndexedDB (`lumaflow-ai:*`, solo navegador).

## Motor y mecanismo

MySQL/MariaDB compatible en Docker y producción (TiDB Cloud): `mysqldump --single-transaction` vía `MYSQL_PWD` por entorno (nunca en argv ni logs). Con CA configurada (`MYSQL_ATTR_SSL_CA`, obligatorio en TiDB) se pasa `--ssl-ca` y se verifica legible antes de ejecutar. PostgreSQL: `pg_dump` con `PGPASSWORD`. SQLite local: snapshot `VACUUM INTO` + dump SQL portable (sin binarios). Salida `storage/backups/lumaflow-db-YYYYMMDD-HHMMSS-{motor}.sql.gz` + sidecar `.sha256`, sin PII en nombres.

## Comandos

```bash
php artisan data:backup [--prune] [--keep-daily=7] [--keep-weekly=4] [--dry-run]
php artisan data:restore <basename> [--apply] [--force] [--force-production]
php artisan data:backup-status
```

`data:backup` falla con exit 1 y mensaje claro si falta binario/config, y reporta a Sentry cuando existe. `data:restore` por defecto solo hace drill en destino temporal aislado; `--apply` restaura de verdad; producción exige `--force-production` (+ confirmación sin `--force`). `data:backup-status` responde “¿Se hizo el backup de hoy?” (último archivo, edad, checksum, aviso STALE >36h).

## Frecuencia y retención

Beta: **diario 03:00 UTC** (`0 3 * * *` en GitHub Actions; app y Scheduler también `UTC`) con `--prune`, 7 diarios + 4 semanales (el más nuevo por día/semana ISO; solo archivos `lumaflow-db-*.sql.gz`, nunca rutas arbitrarias, con `--dry-run` disponible). En Madrid equivale a 04:00 en invierno y 05:00 en verano. Actions puede retrasar o descartar ejecuciones bajo carga: no es un SLA.

La retención local solo funciona sobre archivos presentes. **En un runner efímero no conserva 7+4 entre ejecuciones**: falta implementar y verificar la persistencia y rotación del destino duradero. El comando usa `flock` (sin Redis); Actions serializa los jobs con `concurrency: production-backup`, sin cancelar el job activo. Scheduler conserva `withoutOverlapping(30)` para otros despliegues; ese mutex local no es un lock entre runners distintos.

## Runner: estado y decisión

Runner elegido y preparado para #24: **GitHub Actions**, `.github/workflows/production-backup.yml`, con `schedule` diario y `workflow_dispatch`. Ejecuta directamente `php artisan data:backup --prune --no-interaction`: un job diario evita 1.440 invocaciones de `schedule:run` por día. Nadie ejecuta `schedule:run` en Render; los demás scheduled commands no quedan automatizados por este workflow.

Opciones evaluadas:

- **Cron nativo de Render**: requiere plan de pago → NO activado (coste sin aprobación).
- **GitHub Actions**: autorizado expresamente para esta tarea; credenciales dedicadas en el environment `production-backup`, no en CI de PRs. Solo repositorio original y `main`, permisos `contents: read`, sin artefactos ni cache de dumps.
- **Ping/cron externo a un endpoint HTTP**: no existe trigger seguro (crear uno abriría superficie de abuso) → rechazado.
- **Sidecar cron en Docker**: solo sirve a self-hosted, no a Render → documentado, no implementado.

**Estado auditado el 2026-10-07: implementación parcial, no activada en producción.** El workflow aún está en el PR (sin merge), no se han encontrado Secrets de backup en el repositorio y no existe evidencia verificable de storage privado duradero provisionado. `render.yaml` y el adapter S3 instalado son configuración, no prueba de un bucket accesible. No se ha consultado ningún valor secreto ni creado recurso facturable.

El workflow comprueba configuración y conexión TLS con `SELECT 1` sin imprimir errores del driver; genera el dump con el comando canónico, verifica SHA-256 con `sha256sum --check --strict` y muestra nombre, bytes y timestamp. Después **termina con fallo operativo explícito por falta de destino duradero**, incluso si el dump temporal fue válido. `always()` limpia el directorio temporal; no publica datos de producción como artifact. No se considera backup automático completo.

## Destino y privacidad

Desarrollo/test: `storage/backups/` (ignorado por Git). `BACKUP_PATH` permite elegir un directorio privado fuera del checkout/webroot, reutilizado por backup, restore, status y prune; sin configurar conserva el destino local existente. En Actions usa `${{ runner.temp }}/lumaflow-backups`: **efímero, eliminado al terminar**. En Render sería `/app/storage/backups`, también efímero. Compose persiste `/app/storage/app/public`, no el directorio de backups. Nunca usar ese volumen público para dumps.

Destino final: **pendiente de confirmar/provisionar con aprobación**. El adapter S3-compatible ya instalado puede reutilizarse más adelante con un disk dedicado privado, upload tras checksum, verificación del objeto, retención remota y fallo no cero si falla upload. No se implementa upload hacia un recurso inexistente ni se habilita facturación. `FILESYSTEM_DISK=s3` no cambia por sí solo el destino del comando.

## Restore drill (reproducible)

```bash
# 1. DB temporal con datos sintéticos (ver BackupRestoreTest)
php artisan data:backup
# 2. destruir/recrear la DB de prueba
php artisan data:restore lumaflow-db-<fecha>.sql.gz            # drill aislado
php artisan data:restore lumaflow-db-<fecha>.sql.gz --apply --force  # solo no-prod
```

Verificación: archivo existe, tamaño >0, checksum coincide, dump legible, tabla `migrations` presente y conteos esperados.

## Incidente real

Para responder “¿Se hizo el backup de hoy?”: abrir **Actions → Production backup → ejecución del día** y comprobar conexión, exit del comando, bytes >0, SHA-256 y timestamp UTC. Mientras figure el fallo de destino duradero, la respuesta es **no hay backup recuperable**, aunque se haya generado un dump temporal. Los logs no contienen dumps ni contraseñas. `data:backup-status` sirve en un host con el mismo destino persistente; no puede consultar los dumps eliminados de Actions. `/api/ready` no depende de este historial.

Ante fallo: revisar logs técnicos del job; verificar privadamente Secrets, CA, conectividad y allowlist TiDB; corregir y ejecutar `workflow_dispatch`. No abrir rangos globales ni crear un endpoint HTTP para evitar la allowlist. Falta de checksum se muestra como `FALLO`, nunca `OK`. Sentry recibe un error de clase sin el mensaje sensible si está configurado; el workflow no añade un DSN de producción.

Primera ejecución de producción: **NO realizada** (workflow fuera de `main`, credenciales y destino pendientes). El drill real reproducible usa SQLite sintético en `BackupRestoreTest` e incluye `--prune`, tamaño, checksum y restauración. **Tres días consecutivos NO observados**. #24 permanece abierto; PR usa `Refs #24`. Al activar, registrar fecha/run URL y tres fechas UTC distintas con objeto duradero verificado; tres dispatches el mismo día no satisfacen el criterio.

1. Detener escrituras si procede (mantenimiento).
2. Elegir último backup con checksum válido.
3. Provisionar DB limpia y restaurar con `data:restore --apply` (producción: `--force-production` + confirmación).
4. Validar migraciones al día y datos críticos.
5. Cambiar la conexión solo tras verificar; monitorizar; documentar el incidente.

## RPO/RTO orientativos (sin SLA)

Con backup diario automatizado: RPO ~24h, RTO procedimental ~1h. Hoy (manual): RPO = último backup manual. Un backup histórico puede contener datos borrados hasta que expire la retención; después desaparecen con la rotación (sin borrado instantáneo).

## Limitaciones del free tier

Auditoría: [Render Cron](https://render.com/docs/cronjobs) exige mínimo 1 USD/mes y no permite discos persistentes; [Render Free](https://render.com/docs/free) pierde archivos al reiniciar/redeploy/suspenderse, no permite discos, shell ni one-off jobs. No activados. Repositorio público confirmado con `gh repo view`: [Actions estándar](https://docs.github.com/en/billing/concepts/product-billing/github-actions) gratuito, sin artifacts ni storage contratado. TiDB debe mantener límite de gasto cero (no verificado en su consola en esta tarea); permisos, tráfico y conexión reales requieren verificación antes de activación. [Schedules GitHub](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule) solo corren desde default branch, pueden retrasarse y en repos públicos se desactivan tras 60 días sin actividad. No se afirma que estos comandos cubran recuperación de producción hasta disponer de destino duradero.
