# Consolidación de ramas y evaluación de publicación — 06/11/2026

Rama local: `chore/consolidate-lumaflow` (sin upstream; no se ha hecho push). Base: `origin/main` `03676ea`. Esta evaluación no ejecuta merge, push, despliegue, migraciones remotas ni cambios en proveedores, credenciales o datos productivos.

## 1. Estado remoto verificado

Tras `git fetch --all --prune` el estado coincidía con el esperado: `main` `03676ea`, `feat/backup-b2-storage` `5525b04` (11 commits por delante, 0 por detrás) y `feat/seo-geo-public-pages` `76c52dd` (4 por delante, 0 por detrás). Ambas parten directamente de `main`.

## 2. Trabajo recuperado

| Origen | Contenido |
| --- | --- |
| `feat/backup-b2-storage` `efd6ef5` | Backup privado en Backblaze B2 (`RemoteBackupService`, `--remote`, workflow programado) — **desactivado** |
| Sprint 1 / 1.5 (`22a2eb8`…`a46c72c`) | Fronteras de asociación por workspace, portales transaccionales e idempotentes, redacción de logs y guardas de correo, parches de dependencias, gate de auditoría con excepción acotada, LF en frontend |
| `5525b04` "global changes" | Sprints 2–6: Creative Workspace y briefing, planificación de producción/tomas, plantillas y postproducción, revisiones de entrega, apoyo voluntario (sin activar), cuatro migraciones aditivas, tests y E2E. Incluye una copia anterior de casi todo el SEO |
| `feat/seo-geo-public-pages` | Exclusivos: `e2e/pwa/upgrade.spec.js`, `playwright.preview.config.js` + `preview/seo.spec.js`, capturas SEO, §15–16 de `SEO_GEO_AUDIT.md` (decisión NO-GO), checkout con historial completo en CI |

Ya presente en `main` y no duplicado: hardening V1, Sentry opcional, backup local/drill (#23), scheduler protegido (#34), conservación de sesión (#33).

## 3. Integración y conflictos

Orden: merge `--no-ff` de la rama de backups y después de la SEO (`5c9165c`, `abd9166`). 41 de 46 archivos compartidos eran idénticos byte a byte.

| Archivo | Resolución |
| --- | --- |
| `.github/workflows/ci.yml` | Se conservan auditorías pnpm/Composer y la prueba de proveedores de apoyo; se adoptan los nombres de paso SEO y `fetch-depth: 0` |
| `package.json` | Overrides de Sprint 5.5 (glob 14.0.3, minimatch 11.0.4) y parche de deepmerge; se descarta `brace-expansion@2` (ya no existe en el árbol) y la clave `test:pwa` duplicada que generó el auto-merge |
| `pnpm-lock.yaml` | Lock de la línea de backups; `pnpm install --frozen-lockfile` lo valida contra los manifiestos fusionados |
| `docs/SEO_GEO_AUDIT.md` | Versión SEO (superconjunto, con §15–16) |
| `docs/testing.md`, `docs/deployment.md` | Contenido de sprints + sección de Preview/actualización PWA |
| Conflictos semánticos sin marca | Secciones SEO duplicadas en `api.md`, `architecture.md` y `roadmap.md` (`1cd2fdc`); `test_plan.md`, archivo genérico no versionado arrastrado por "global changes", retirado (`15373bd`) |

## 4. Defectos corregidos

| Commit | Defecto confirmado | Corrección |
| --- | --- | --- |
| `7955b79` | CI de `5525b04` falló por timeout de 5 s en el primer test de `DeliveryReviewPanel` y `JobDetailPage` (<1 s en local) | `testTimeout: 15000`; aserciones intactas |
| `24cfe7e` | `composer audit --locked` falló en CI: 7 avisos Symfony publicados el 04/11 (incl. CVE-2026-118514/118516) | Actualización 8.1.x/3.x/1.x de filesystem, http-foundation, http-kernel, routing y dependencias; `composer.json` sin cambios |
| `4550980` | El entrypoint esperaba a MySQL indefinidamente y descartaba stderr | Espera acotada (`DB_WAIT_TIMEOUT`, 180 s) y salida con clase/código PDO, sin host/usuario/contraseña |
| `d9ed3bc` | El smoke productivo se ejecutaba tras despliegues `Preview` contra el dominio productivo (falsos fallos 41513813116, 41523623975, 42045469155) | Se excluye `environment == Preview`; producción/Render/schedule conservan todas las aserciones; en fallo imprime el resumen público de salud |

## 5. Incidencias productivas: hechos, hipótesis y límites

**Confirmado (GitHub API, sondas HTTP públicas de solo lectura):**

- Smoke programado verde hasta 03/11 06:55 UTC; desde 03/11 19:32 todos los runs fallan con **503 en `/api/health`** tras 13 reintentos, sin cambio de código en `main`.
- 03/11 13:52 UTC: redeploy en Render de `main` `03676ea`, estado `failure` a las 14:10 (~18 min).
- 03/11 13:56 UTC: Vercel creó un deployment **`Production` desde `76c52dd`** (rama SEO no fusionada). El frontend productivo sirve hoy HTML prerenderizado con H1 (entrada `index-BV5zAgjO.js`), es decir, la rama con decisión NO-GO. La API sigue en `main`.
- 06/11: `https://lumaflow-api.aleviclop.dev/api/health`, `/up` y `https://lumaflow-studio-api.onrender.com/api/health` no devuelven ningún byte en 110 s; `/login` del frontend responde 200.

**Hipótesis más compatible (no confirmada):** la instancia no llega a servir porque el arranque queda bloqueado o falla antes de `serve`: espera infinita a MySQL (TiDB inalcanzable, credenciales o cuota), o `migrate --force` fallando. Encaja con el deploy fallido por tiempo, los 503 del proxy y las peticiones colgadas. Alternativa: dependencia `down` en la sonda (DB, caché o disco `s3`; ninguna funcionalidad usa el disco por defecto, pero su fallo da 503). Sin logs de Render no se puede distinguir.

**500 en portales públicos** (02/11, `SEO_GEO_AUDIT.md` §15–16): siguen sin diagnóstico. El código resuelve ausencias con `firstOrFail`/404 y `SearchIndexingTest` lo confirma en local; posible deriva de esquema productivo, no demostrada.

**Evidencia no disponible:** logs de Render, Sentry, consola de TiDB/R2/Vercel. No se inventa una causa raíz. Siguiente paso del operador: logs del deploy del 03/11 y del arranque actual, estado/cuota de TiDB, credenciales del bucket `s3`, request IDs `seo-release-negative-20261102` y `seo-final-evaluation-20261102`, y cómo se creó el deployment de producción de Vercel.

## 6. Seguridad y compatibilidad

- Aislamiento por workspace y 404 ajenos: cubiertos por `WorkspaceAssociationSecurityTest` y las suites de cada sprint; sin cambios de semántica en esta consolidación.
- API: cambios aditivos de sprints documentados en `docs/api.md`; frontend y backend se integran desde la misma rama.
- BD: cuatro migraciones nuevas (Sprints 2–5), aditivas salvo `add_delivery_revisions`: `deliveries.client_id` pasa a nullable con `->change()` sobre una columna con clave foránea y hace backfill de todas las entregas. **No ensayado en MySQL/TiDB.**
- Dependencias: `pnpm audit --prod` 0 avisos; `composer audit --locked` 0 avisos; auditoría pnpm completa: solo deepmerge 4.3.1 (bajo, parche local verificado, gate `check-security-audit.mjs` PASS con warning).
- Backups: código integrado y desactivado (`--remote` opt-in, workflow condicionado a `vars.PRODUCTION_BACKUP_ENABLED`, runs `skipped`, sin runner de scheduler en Render).

## 7. Validación ejecutada (Windows, Node 24.22.2, pnpm 10.34.1, PHP 8.4.27 portátil)

| Comprobación | Resultado |
| --- | --- |
| `pnpm install --frozen-lockfile` | PASS |
| Formato frontend | PASS con `prettier --check --end-of-line auto` (`format:check` literal marca CRLF de la copia Windows; los blobs son LF) |
| `pnpm --dir frontend run lint` (oxlint) | PASS |
| Vitest | PASS, 42 archivos / 228 tests |
| `pnpm run build` | PASS (29 entradas precache) |
| `pnpm run test:pwa` (SEO + offline + actualización desde `03676ea`) | PASS, 11/11 |
| `pnpm run test:support` | PASS, 1/1 |
| `pnpm run test:audit` | PASS, 9/9 |
| `pnpm audit --prod` / `composer audit --locked` | PASS, 0 avisos |
| `php vendor/bin/pint --test` | PASS |
| `php artisan test` (SQLite en memoria) | PASS, 249 tests / 2363 aserciones |
| `pnpm run test:e2e` (SQLite temporal aislada) | **19/21 PASS, 2 FAIL** (`ai-history` no muestra la conversación sembrada; `onboarding` agota 30 s). Ambos fallan igual en aislamiento y **también en el head original `5525b04`**, que en CI Linux pasó 21/21 sin reintentos (run 42045414965). Fallo propio de este entorno Windows (suite de 8,4 min frente a 3,6 min en CI), anterior a la integración; causa no diagnosticada y tests sin modificar |
| Entrypoint | Stub de `php`: aborta a los 4 s con BD caída y continúa con BD disponible; PHP real contra puerto cerrado: `PDOException code 2002`, sin credenciales |

No ejecutado: CI remoto del nuevo SHA (requiere push), imágenes Docker/Nginx (sin Docker local), MySQL/TiDB y B2 reales, smoke del Preview protegido, validadores YAML/actionlint.

## 8. Bloqueos de producción y decisión

**NO-GO para fusionar en `main`.** El código consolidado es coherente y pasa las suites locales, pero fusionar despliega frontend y API y aplica migraciones de forma automática, y:

1. La API productiva no responde y la causa no está diagnosticada.
2. No hay backup recuperable activo ni ensayo de las cuatro migraciones (en especial `client_id` nullable + backfill) sobre una copia MySQL/TiDB.
3. El frontend productivo ya sirve una rama no fusionada; hay que confirmar la rama de producción de Vercel y cómo se creó ese deployment.
4. Siguen pendientes de 16.6: los 500 de portales, el login real y el registro de la PWA en un entorno QA autorizado.
5. Falta CI verde del SHA final.

**Condiciones para un GO condicionado:** restaurar la API con diagnóstico registrado; backup verificado (local o B2) y drill de restauración; ensayo de migraciones en un clon TiDB sintético o autorizado; rama de producción de Vercel = `main`; CI verde del SHA exacto; smoke de producción verde; operador disponible para rollback; autorización expresa.

## 9. Procedimiento de merge y rollback (preparado, no ejecutado)

1. `git fetch`; si `main` avanzó, rebasar o fusionar y repetir la validación completa.
2. Push de `chore/consolidate-lumaflow` y PR hacia `main`, con CI completo verde.
3. Backup verificado de la BD productiva y anotar los IDs de deployment actuales de Vercel y Render.
4. Merge (merge commit, sin squash, para conservar la trazabilidad de ambas ramas). Vigilar el deploy de Render (migraciones) y el de Vercel.
5. Smoke inmediato: seis páginas SEO, robots/sitemap, login sintético, 401/404, portales con ID inexistente → 404 y actualización de la PWA.
6. **Rollback:** Vercel Instant Rollback al deployment anterior; Render rollback al deploy anterior. Las migraciones son aditivas: no ejecutar `migrate:rollback`, sino una corrección hacia delante o restaurar el backup. Un service worker ya instalado no se revierte al instante.

## 10. Antes de borrar las ramas remotas originales

- `chore/consolidate-lumaflow` fusionada en `main` mediante una PR con CI verde.
- `git branch -r --contains 5525b04` y `--contains 76c52dd` incluyen `origin/main` (es decir, `git merge-base --is-ancestor` devuelve 0 para ambas).
- Producción estable tras el release, con el smoke verde al menos 24 h.
- Vercel ya no apunta su producción a `feat/seo-geo-public-pages` ni a ninguna otra rama distinta de `main`.
- Autorización expresa del responsable. Opcional: etiquetar ambos heads (`archive/…`) antes de borrarlas.
