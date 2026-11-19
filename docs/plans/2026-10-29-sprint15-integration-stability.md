# LumaFlow 2.0 — Sprint 1.5: integración y estabilidad

Fecha: 29/10/2026. Base: [Sprint 1](2026-10-29-sprint1-security-stability.md), commit inicial `efd6ef5`. Rama conservada: `feat/backup-b2-storage`. Alcance: revisión, integración local, formato, auditorías y validación. Sin push, PR nuevo, merge, despliegue, recursos contratados ni Sprint 2.

## Resultado de la revisión

Se revisaron los cambios pendientes de Fase 0 y Sprint 1: controllers, requests, servicios, modelos/scopes, SDK/logging, fixtures/tests, manifests/lockfiles, E2E y documentación. Se conservan las correcciones de aislamiento, validación de asociaciones nuevas e históricas, límites públicos, contexto existente, idempotencia y privacidad. No se eliminan datos, migraciones ni capacidades activas.

Se simplifica el retorno interno de ContractPortalService: ya no devuelve un array con un contrato sin consumidor; devuelve únicamente el booleano already_processed que necesita el controlador. Se elimina el parámetro de aceptación sin uso. El contrato HTTP mantiene su misma forma. Tests de portales, concurrencia y suite completa pasan.

Los cambios anteriores se conservan como commits separados. Las retiradas verificadas de TagRequest y ScoreBadge pertenecen a Fase 0; no se atribuyen a una limpieza nueva. `test_plan.md` era un archivo local sin seguimiento, de planificación genérica de marketing; se conserva intacto fuera de los commits por ser trabajo previo ajeno al producto actual. No se oculta mediante gitignore ni se borra.

## Prettier: causa demostrada y corrección

Los 226 errores locales no requerían cambiar la estructura del código: eran finales de línea CRLF del checkout Windows. Se ejecutó `prettier --debug-check src` antes de formatear (verificación interna de estabilidad AST), se normalizó con el formatter existente y se verificó que **los 228 archivos fuente resultantes son byte a byte iguales a sus blobs de Git**. No hay diff de contenido en frontend/src.

La comparación calculó SHA-1 Git de cada archivo: SHA1(`blob <bytes>\0` + contenido) frente a `git ls-tree -r HEAD frontend/src`. Resultado: 228 iguales, cero distintos. `git add --renormalize -- frontend/src` refrescó el índice sin introducir cambios de contenido.

`.gitattributes` fija LF para frontend/src y su configuración; Prettier declara `endOfLine: lf`. No se cambia la configuración global del usuario ni se excluyen archivos del gate. El commit de formato solo necesita esos dos archivos de configuración, no un reformateo funcional de 226 fuentes.

La afirmación anterior de CI bloqueado por deuda de formato era una inferencia incorrecta a partir del fallo local. Se corrigen roadmap/testing y se añade una aclaración al informe histórico. El run remoto de `efd6ef5` sí pasó formato, lint, tests, build, E2E e imágenes.

## Dependencias y CI

- Registry y [advisory oficial](https://github.com/advisories/GHSA-gcqx-w48m-w2h4) revisados de nuevo: deepmerge sigue en 4.3.1, sin parche. No se cambia versión ni se introduce una sustitución incompatible.
- `pnpm audit --prod`: PASS, cero avisos. `composer audit --locked`: PASS, cero avisos/abandonados. `pnpm audit --json` completo conserva **exit 1 por un aviso bajo**. No se describe ese comando como verde.
- CI añade auditoría estricta de producción y Composer. Para el árbol completo guarda JSON y código de salida; la política solo permite GHSA-gcqx-w48m-w2h4 bajo, deepmerge 4.3.1, sin parche (`<0.0.0`) y en la ruta exacta vite-plugin-pwa → workbox-build → @rollup/plugin-node-resolve → deepmerge.
- La excepción emite warning, resumen visible y artefacto de auditoría; no hay `continue-on-error`, ignore global ni umbral que admita otros avisos bajos. Nueva versión, ruta, severidad, parche disponible, fallo de red o informe inconsistente bloquean el gate.
- Mitigación: solo código/configuración de build de confianza; runners de desarrollo no públicos; CI sin secretos productivos. Esta ruta no consume payloads HTTP del producto. Retirar la excepción en cuanto se pueda parchear/eliminar el paquete; seguimiento #49.
- Cinco tests Node nativos prueban la política y sus rechazos. Son parte de `pnpm run test` y del job de frontend; sin nuevas dependencias.

Workflow local revisado y parseado/formateado con Prettier. Instalaciones frozen y Composer dry-run/validate PASS. No se cambian las condiciones de despliegue ni jobs productivos.

**GitHub Actions real:** [run 37623479798](https://github.com/AVL05/lumaflow-studio/actions/runs/37623479798), SHA `efd6ef5f7a43477062f9365069d3fab42c7115f2`, success en Backend quality, Frontend quality, E2E journeys y Deployment images. No incluía las nuevas auditorías. **Los commits locales nuevos todavía no tienen run remoto**; no se hace push ni dispatch para fingir una verificación del nuevo SHA. Tampoco se ha comprobado/modificado protección de rama.

## Validación ejecutada

Windows, PHP 8.5.4, Node 24.18.0, pnpm 10.34.1. El CI declarado utiliza PHP 8.4/Node 22/Linux; su ejecución para los nuevos commits queda pendiente.

| Control | Resultado |
| --- | --- |
| `pnpm run test` | PASS: 5 tests de política, 203 PHPUnit y 108 Vitest / 26 archivos. |
| Regresión específica de seguridad/portales/logs/SDK | PASS: 41 tests antes de integrar; incluidas seis carreras con dos procesos reales. |
| `pnpm run lint` | PASS: oxlint y Pint completos. |
| `pnpm --dir frontend run format:check` | PASS en todas las fuentes. |
| `prettier --debug-check src` previo a escritura | PASS; comparación posterior con blobs Git: 228/228 idénticos. |
| `pnpm run build` | PASS; PWA 23 entradas / 1437,13 KiB. Warning existente de chunks grandes. |
| `pnpm run test:e2e` | PASS: 15 recorridos Chromium, aproximadamente 1,2 min. |
| Política contra JSON real de pnpm | PASS con warning explícito del único aviso bajo. |
| Auditorías pnpm producción / Composer | PASS: cero avisos. |
| Auditoría pnpm completa sin política | FAIL esperado, exit 1, un aviso bajo no corregido. |
| Instalación pnpm frozen / Composer dry-run y validate | PASS; warning previo de restricción exacta de laravel-dompdf. |
| `git diff --check` | PASS. |

No se observan regresiones introducidas por esta integración en las suites ejecutadas. Se conservan pruebas de owner/admin/member/externo, retirada, relaciones legacy, proyectos personales, portales y canarios. PHPUnit incluye las pruebas sintéticas de backup existentes. No se acredita recuperación externa por pasar mocks o SQLite.

## Recuperación externa

**NOT RUN:** MySQL/TiDB y B2 reales. No hay credenciales de ensayo autorizadas en las variables del proceso ni clientes mysql/mysqldump; Docker instalado carece de daemon activo. No se leen ni reutilizan secretos productivos. Tampoco se crean servicios o bases.

[Procedimiento reproducible pendiente](../backup-recovery.md#ensayo-mysqlb2-pendiente--sprint-15): dos DB vacías aisladas, cinco estudios sintéticos y sus clientes/proyectos, backup remoto/checksum, drill, aplicación solo en target vacía y comparación de datos/relaciones; permisos B2 y retención con fixtures exclusivas. Los comandos están preparados, no ejecutados. La activación productiva y tres días UTC siguen pendientes en #24.

## Commits locales y seguimiento

| Commit | Incremento |
| --- | --- |
| 76c6017 | Fase 0: limpieza comprobada, documentación y planes previos. |
| 22a2eb8 | Parches compatibles y matriz de dependencias. |
| c883d0c | Aislamiento y asociaciones por workspace. |
| 7a42972 | Idempotencia/transacciones de portales, regresiones y simplificación interna. |
| 76bd367 | Redacción de observabilidad, router y correo productivo. |
| 05512ac | Evidencia del Sprint 1 y límites de recuperación. |
| b03616d | LF consistente entre Windows y CI. |
| 9401d4b | Gates de auditoría y política acotada con tests. |

Este informe y las aclaraciones documentales se añaden en un commit de integración separado. La rama sigue apilada sobre el trabajo de backups/PR #35; no se ha publicado ni modificado ese PR. Antes de publicar debe revisarse la separación de incrementos; no hacer un push indiscriminado al PR de backups.

#24, #39, #49 y #37 reciben progreso agregado, sin datos sensibles. Permanecen abiertos: recuperación externa, revisión/publicación del código y ejecución de CI del nuevo SHA pendientes. No se crean duplicados ni se cierran trabajos parcialmente validados.

## Preparación para #40 y #41

**Preparado para comenzar desarrollo local incremental**: formato resuelto, seguridad y comportamiento cubiertos, dependencias de producción sin avisos y excepción baja de build explícita. Este sprint no implementa #40/#41.

Publicación/release requiere revisión de los commits, CI remoto del SHA que se publique y validación externa pendiente de recuperación/configuración del proveedor. Mantener esas condiciones visibles; no convertir la preparación local en aprobación de producción.
