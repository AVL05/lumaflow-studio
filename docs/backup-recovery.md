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

`data:backup` falla con exit 1 y mensaje claro si falta binario/config, y reporta a Sentry cuando existe. `data:restore` por defecto solo hace drill en destino temporal aislado; `--apply` restaura de verdad; producción exige `--force-production` (+ confirmación sin `--force`).

## Frecuencia y retención

Beta: **diario 03:00 UTC** (`dailyAt`, timezone de app `UTC`) con `--prune`, 7 diarios + 4 semanales (el más nuevo por día/semana ISO; solo archivos `lumaflow-db-*.sql.gz`, nunca rutas arbitrarias, con `--dry-run` disponible). El comando usa lock de archivo (sin Redis) y omite la ejecución si otro backup está en curso.

## Runner: estado y decisión

`routes/console.php` declara el backup diario, pero **hoy no existe runner de producción**: Render free solo ofrece web service (los cron jobs requieren plan de pago, no activado sin aprobación), Compose no define servicio cron y CI no programa tareas.

Opciones evaluadas y descartadas:

- **Cron nativo de Render**: requiere plan de pago → NO activado (coste sin aprobación).
- **GitHub Actions schedule contra producción**: exigiría credenciales de prod en CI → rechazado por seguridad.
- **Ping/cron externo a un endpoint HTTP**: no existe trigger seguro (crear uno abriría superficie de abuso) → rechazado.
- **Sidecar cron en Docker**: solo sirve a self-hosted, no a Render → documentado, no implementado.

Estrategia adoptada: comandos listos + verificación manual + `data:backup-status` como observabilidad mínima. Para activar la automatización (sin coste nuevo si el proveedor lo permite en el futuro): servicio cron que ejecute `php artisan schedule:run` cada minuto, o llamada directa diaria a `php artisan data:backup --prune`. Ver `docs/deployment.md` para los pasos exactos.

## Destino y privacidad

Desarrollo/test: `storage/backups/` (ignorado por Git). Producción: mismo directorio del contenedor a corto plazo (efímero) o disco privado dedicado; S3 solo si se provisiona (hoy no hay objetos no regenerables que lo exijan). Backups con datos operativos: acceso restringido, nunca en Git/issues/PRs/artefactos públicos, retención limitada y borrado al expirar. Sin contenido en logs.

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

1. Detener escrituras si procede (mantenimiento).
2. Elegir último backup con checksum válido.
3. Provisionar DB limpia y restaurar con `data:restore --apply` (producción: `--force-production` + confirmación).
4. Validar migraciones al día y datos críticos.
5. Cambiar la conexión solo tras verificar; monitorizar; documentar el incidente.

## RPO/RTO orientativos (sin SLA)

Con backup diario automatizado: RPO ~24h, RTO procedimental ~1h. Hoy (manual): RPO = último backup manual. Un backup histórico puede contener datos borrados hasta que expire la retención; después desaparecen con la rotación (sin borrado instantáneo).

## Limitaciones del free tier

Render free no ofrece cron ni snapshots gestionados visibles; TiDB Starter sin PITR documentado en el proyecto. El mecanismo propio (`mysqldump` + retención) cubre la beta sin coste; reevaluar al salir del free tier.
