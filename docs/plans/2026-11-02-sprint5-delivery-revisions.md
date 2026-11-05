# Sprint 5 — Revisiones y entregas

## Alcance y compatibilidad

Implementación local de #44 sobre Delivery, Activity, notificaciones y el portal existentes. Se conservan IDs, rutas, estados comerciales y enlaces antiguos. Las nuevas versiones exigen HTTPS y nunca se descargan archivos externos. El estado de revisión es independiente del estado comercial.

## Incrementos

1. Migración aditiva, versiones inmutables, historial con Activity y pruebas backend. Archivos: migración nueva, Delivery/DeliveryRevision, servicio de revisiones, requests, recursos, controladores y rutas. Riesgos: concurrencia, contexto de cliente, enlaces históricos y expiración. Bloqueo del proyecto antes de la entrega; comprobación de versión y token dentro de la transacción.
2. Gestión de versiones y portal responsive sobre los componentes existentes, API frontend, tests Vitest y Playwright. Recepción explícita; nunca inferida de una visita. Expiración y revocación afectan únicamente al portal de LumaFlow.
3. Validación de suites y auditorías, documentación de resultados y actualización de #44/#37 sin cierre ni publicación del código.

## Límites de validación

MySQL/TiDB, B2, CI remoto e impresión física siguen pendientes de sus entornos autorizados. Solo datos sintéticos locales. No se alteran datos productivos ni se ejecutan rollbacks destructivos. Preservar todos los cambios y commits anteriores y test_plan.md.

## Resultados

Implementado y validado localmente el 02/11/2026. No publicado ni aprobado para producción.

### Funcionalidad

- Entregas HTTPS nuevas para cualquier proveedor compatible (Drive, Dropbox, Vimeo, YouTube no listado, etc.), sin integración que copie/valide remotamente el material. HTTP histórico conservado sin modificar. Cliente opcional y alta desde Job autorizado, aunque el workspace activo sea otro.
- Revisiones numeradas con snapshots inmutables de enlace, contraseña externa, proveedor, fecha y notas. UUID/hash de publicación para reintentos; versión optimista para edición. Cambiar contenido publicado desde el formulario antiguo conserva la revisión anterior. Borradores/archivo no se publican automáticamente; sustituir una versión aprobada exige revisión nueva.
- Estados separados: enviada, recibida, en revisión, cambios solicitados y aprobada. Recepción expresa, nunca por GET. Observaciones generales incluso tras aprobar; solicitudes de cambios diferenciadas. Un UUID repetido no duplica efectos, otro comentario legítimo con UUID distinto se conserva. Número consultado obligatorio tras la primera revisión; respuestas obsoletas devuelven conflicto.
- Activity reutilizado para acción, responsable, revisión y fecha; sin tabla de eventos paralela. Historial paginado para creador y portal. Las versiones internas no publicadas, notas privadas, emails e IDs de usuarios no salen al portal. Reasignar un historial publicado a otro proyecto/cliente/sesión se rechaza, también por bulk o pasando a borrador.
- Token de 40 caracteres, revocación, rotación y caducidad del portal. Verificación dentro del mismo bloqueo que las respuestas. Se mantienen URLs antiguas hasta revocación/rotación expresa. El token es una capacidad de acceso, no prueba de identidad; quien lo tenga puede consultar las revisiones publicadas. Tokens y contraseñas externas conservan almacenamiento legacy, no se afirma hashing en reposo.
- Integración con etapas existentes: revisión/correcciones en curso; nueva versión reabre entrega final. Aprobar no resuelve tareas/checks, ni completa entrega final si faltan otras entregas/etapas. Conserva los estados comerciales y su avance monotónico.
- Interfaz compartida responsive: previsualizar/confirmar nueva revisión, estados, comentarios, historial, configuración de acceso confirmada y recarga conservando observaciones. Se distinguen errores de conexión y enlace inexistente en la carga del portal. Carga diferida del seguimiento.

### Migración y recuperación

`2026_11_02_000001_add_delivery_revisions.php` hace nullable el cliente y añade metadatos de revisión/portal y delivery_revisions. Backfill de 100 registros por bloque; conserva IDs, URL, token, dinero, último comentario/fecha y actividades originales. La marca legacy distingue fecha de captura de una fecha de envío desconocida. Borradores legacy quedan internos. Down bloqueado expresamente: no se pierde historial ni se fuerza un cliente ficticio.

Antes de activación externa: copia recuperable, ensayo del up/restore y recuentos/integridad en destino MySQL/TiDB aislado. El ensayo SQLite recupera proyecto, entrega personal, enlaces de ambas versiones, notas, token, revocación e historial. **MySQL/TiDB y B2 no ejecutados**: mantener el runbook de docs/backup-recovery.md y #24 abierto. No se han tocado datos reales ni credenciales productivas.

### Archivos de este incremento

Backend: DeliveryController, PublicDeliveryController y nuevo DeliveryReviewController; DeliveryRequest y nuevo DeliveryReviewRequest; DeliveryResource/PublicDeliveryResource; Delivery y nuevo DeliveryRevision; DeliveryRevisionService nuevo, PublicDeliveryService y BulkActionService; migración aditiva y routes/api.php. Se retiran únicamente los handlers públicos sin ruta y DeliveryChangesRequest sustituido por el request validado común; las URLs approve/request-changes se conservan. PublicDeliveryService mantiene los métodos invocados por servicios/tests anteriores.

Frontend: api/deliveries.js y public.js; DeliveryDetail, DeliveryForm, DeliveryReviewPanel nuevo; ClientPortalPage, DeliveryDetailPage, DeliveriesPage y catálogo de proveedores. Tests: DeliveryRevisionTest nuevo; DeliveryConcurrencyTest/worker, ServerLogPrivacyTest, BackupRestoreTest, DeliveryReviewPanel.test.jsx nuevo y e2e/tests/deliveries.spec.js. Captura: docs/screenshots/sprint5-delivery-mobile.png. Solo override follow-redirects en package.json/pnpm-lock.yaml; no dependencia añadida.

Documentos afectados: README, API, arquitectura, base de datos, testing, recuperación, despliegue, roadmap, actualización fechada de la matriz de dependencias anterior y este informe. Las modificaciones de Sprints 2–4 en esos mismos archivos se conservan.

### Validación ejecutada

| Comprobación | Resultado local |
| --- | --- |
| `php artisan test` | PASS: 245 tests |
| PHPUnit de revisión/concurrencia tras ajuste final de idempotencia | PASS: 11 tests, 450 aserciones; procesos reales SQLite WAL |
| `pnpm --dir frontend run test` | PASS: 141 tests, 36 archivos |
| `pnpm run test:e2e` | PASS: 20 recorridos Chromium; recorrido de entrega también móvil 390×844 |
| `pnpm run lint` | PASS: oxlint y Pint |
| `pnpm --dir frontend run format:check` | PASS |
| `pnpm run build` | PASS; warning previo de chunks grandes visible |
| `pnpm run test:audit` | PASS: 5 tests del gate sin modificar sus excepciones |
| `pnpm install --frozen-lockfile --ignore-scripts` | PASS; un único paquete transitivo actualizado |
| `pnpm audit --prod` | PASS: 0 avisos |
| `composer audit --locked --format=json` | PASS: 0 avisos y 0 abandonados |
| `pnpm audit --json` y check-security-audit | FAIL: exit 1, 1 bajo y 3 moderados de build; detalle debajo |
| `git diff --check` | PASS; avisos Windows LF/CRLF sin errores de whitespace |
| MySQL/TiDB, B2, CI remoto, impresión física | NOT RUN; requieren entornos autorizados |

Pruebas nuevas cubren datos sintéticos en estudios independientes, owner/admin/member/externos, asociaciones y contexto inmutable, UUID/versiones, restauración y migración, aprobación obsoleta, expiración/revocación bajo lectura antigua, borradores no públicos y ausencia de peticiones/archivos multimedia. Concurrencia: aprobación/cambios, recepción/revisión repetidas, comentarios repetidos, publicación duplicada y publicación frente a aprobación de versión anterior. Canarios de path/query/payload no aparecen en logs del servidor; se conserva la suite de privacidad existente.

Iteraciones corregidas: recepción enviaba un mensaje vacío que fallaba validación; consultas duplicadas al historial consumían innecesariamente throttle público; se eliminó el fetch redundante sin relajar el límite. Se aislaron revisiones internas del historial público y se evitó la reasignación al volver a borrador. UUID de acciones sin comentario usa hash normalizado, sin confundir texto de historial con payload. Los intentos E2E fallidos no se presentan como éxito; la suite completa final conserva y pasa la aprobación legacy y el flujo nuevo.

Panel diferido: **10.50 kB / 3.33 kB gzip**. Chunk principal **565.02 kB / 153.59 kB gzip**, frente a 562.63 kB en Sprint 4. Precache **28 entradas / 1505.48 KiB**. El warning de chunks grandes permanece; estos tamaños no acreditan rendimiento de dispositivo físico. La captura móvil está inspeccionada; no se afirma cobertura Safari/iOS ni impresión física.

### Dependencias y bloqueo de seguridad (#49)

| Paquete / aviso | Instalado / ruta | Decisión y exposición |
| --- | --- | --- |
| follow-redirects — [GHSA-mrwp-f3q8-3g9p](https://github.com/advisories/GHSA-mrwp-f3q8-3g9p), alto | 1.16.1 → **1.16.2**, frontend → axios | Parche mínimo en override/lock. Afecta adaptador Node y arrays de cabeceras entre realms; la SPA usa navegador. El advisory no confirma explotación de Axios 1.20.0 ni de LumaFlow. Aviso eliminado del audit. |
| minimatch — [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249), moderado | 5.1.9: frontend → vite-plugin-pwa → workbox-build → off-main-thread → ejs → jake → filelist; 10.2.6: workbox-build → glob | Parche informado 11.0.1. Dos hallazgos; no forzar función/API de minimatch 5 a una mayor incompatible. Patrones del build proceden del repo, no de entregas/clientes; desarrollo/CI sin secretos productivos ni configuraciones no confiables. Seguimiento separado #49. |
| glob — [GHSA-3g3m-2fjr-6pw4](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4), moderado | 11.1.0: frontend → vite-plugin-pwa → workbox-build → glob | Parche informado 14.0.2. Trabajo que continúa tras abortar un recorrido; no es procesamiento de archivos del cliente en este producto. workbox-build publicado 7.4.1 sigue exigiendo glob ^11.0.1. No imponer mayor fuera de rango sin incremento compatible y pruebas específicas. Limitar build a fuentes de confianza, árbol conocido y runner aislado con límites de ejecución. |
| deepmerge — [GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4), bajo | 4.3.1: frontend → vite-plugin-pwa → workbox-build → @rollup/plugin-node-resolve | Sigue sin parche según audit. Se mantiene únicamente la excepción visible, exacta y previamente probada. No procesar configuración de build aportada por usuarios. |

No se amplía el gate ni se ocultan moderados: **el gate completo local falla y el remoto no se ha ejecutado**. La mitigación de alcance no equivale a corrección upstream. No hay upgrade mayor, audit fix force ni servicios nuevos. Actualizar #49 con estos hallazgos y mantener abierto. Los resultados anteriores fechados de Sprint 1/1.5 no describen el árbol actual.

### GitHub, Git y siguiente sprint

Actualizados [#44](https://github.com/AVL05/lumaflow-studio/issues/44), [#37](https://github.com/AVL05/lumaflow-studio/issues/37) y [#49](https://github.com/AVL05/lumaflow-studio/issues/49) con resultados verificados; los tres siguen abiertos. #44/#37 conservan revisión e integración pendientes; #49 requiere resolver compatibilidad de herramientas de build antes de release. #24 conserva los ensayos externos pendientes y no se ha cerrado. No se crean duplicados ni se publican tokens, payloads privados o ejemplos de explotación.

Se conserva `feat/backup-b2-storage`, HEAD `a46c72c`, nueve commits locales y todos los cambios anteriores. Este incremento queda sin commit, push, PR, merge ni despliegue; `test_plan.md` continúa sin seguimiento e intacto. Ninguna operación productiva.

Siguiente: consolidar #49 y las verificaciones externas autorizadas; después Sprint 6 / #45 (apoyo voluntario por enlaces configurables), sin empezar IA ni pagos propios. Funcionalidad local lista para revisión; **no declarar release lista con el gate de dependencias fallando**.
