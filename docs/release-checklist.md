# Checklist de release

Procedimiento reutilizable para fusionar en `main`. **Fusionar en `main` despliega y migra producción automáticamente** (Render con `autoDeployTrigger: checksPass`, Vercel desde `main`), así que cada release se registra en una PR de release con la plantilla [`release.md`](../.github/PULL_REQUEST_TEMPLATE/release.md) (`?template=release.md` al abrir la PR). Parte del [informe de consolidación](plans/2026-11-06-consolidation-release-assessment.md) §9. No automatiza el despliegue.

## Antes del merge

1. **Sincronizar.** `git fetch`; si `main` avanzó, rebasar o fusionar y repetir la validación completa.
2. **CI verde del SHA exacto** que se va a fusionar (frontend, backend, E2E, contenedores). Anotar el SHA.
3. **Revisar el contenido**: migraciones nuevas (¿aditivas? ¿ensayadas en MySQL?), cambios de contrato en `docs/api.md`, variables de entorno nuevas en `.env.example` y `docs/deployment.md`, cambios de seguridad.
4. **Estado actual de producción**: `/up`, `/api/health` y login sintético en verde. Si ya está caída, no fusionar sin entender la causa.
5. **Backup verificado** de la base de datos productiva ([backup-recovery.md](backup-recovery.md)): `data:backup --remote` + comprobación de checksum SHA-256. Anotar objeto y hora. Sin backup verificado, no se fusiona una release con migraciones.
6. **Anotar los IDs de deployment actuales** de Vercel y de Render (destino del rollback).
7. **Variables en los proveedores**: las nuevas ya existen en Render y Vercel.

## Merge

8. Merge commit (sin squash si se integran ramas con historia que conservar). Anotar el SHA resultante.
9. Vigilar el deploy de Render (arranque y `migrate --force`) y el de Vercel. Anotar los nuevos IDs de deployment.

## Smoke posterior

10. `/up` y `/api/health` (`database`, `storage` y `cache` en `up`).
11. Login sintético y una operación de lectura autenticada.
12. Páginas públicas: landing, `/features`, `/pricing`, `/privacy`, `/about-project`, `/support`; `robots.txt` y `sitemap.xml`.
13. 401 sin token, 404 en ruta desconocida y portales (`/deliver/…`, `/contract/…`, `/book/…`) con identificador inexistente → 404.
14. PWA: una instalación previa se actualiza sin perder estado.
15. Cabeceras de seguridad y consola sin violaciones de CSP (si #56 está desplegado).
16. El workflow `Production smoke` en verde. Vigilar 24 h antes de dar la release por estable.

## Rollback

Disparadores: smoke rojo que no se corrige hacia delante en minutos, migración fallida o errores 5xx sostenidos.

1. **Vercel:** Instant Rollback al deployment anotado.
2. **Render:** rollback al deploy anotado.
3. **Base de datos:** las migraciones son aditivas: **no ejecutar `migrate:rollback`**. Corregir hacia delante o restaurar el backup verificado (`data:restore`), con aprobación del responsable.
4. Un service worker ya instalado no se revierte al instante: puede seguir sirviendo la versión nueva hasta la siguiente actualización.
5. Repetir el smoke y registrar el incidente.

## Registro

Cada release deja en su PR: SHA fusionado y SHA de CI, backup, IDs de deployment antes y después, resultado del smoke y, si hubo, rollback. Eso es lo que hace la release repetible y auditable.

## Con staging (#55)

Desde que existe el staging, el paso «Merge» de esta checklist se divide: fusionar en `main` solo despliega el staging. Para producción: (1) comprobar el staging, (2) lanzar el workflow **Promote to production**, (3) seguir con «Smoke posterior» y «Rollback». Ver `docs/deployment.md` → «Staging y promoción a producción».
