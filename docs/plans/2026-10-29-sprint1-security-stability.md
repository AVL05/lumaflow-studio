# LumaFlow 2.0 — Sprint 1: Security & Stability

Fecha: 29/10/2026. Issues #39, #49, #24; epic #37. Estado: **implementado y validado localmente; sin publicar ni desplegar**. La Fase 0 se conserva como evidencia histórica. Este informe describe resultados del sprint, no una auditoría general nueva.

Actualización posterior: [Sprint 1.5](2026-10-29-sprint15-integration-stability.md) integra commits locales. El fallo de formato observado aquí era CRLF del checkout Windows: normalizarlo no cambia ningún blob de los 228 archivos fuente. La afirmación de CI bloqueado por deuda de formato no estaba verificada remotamente; la ejecución remota de `efd6ef5` sí pasó. El formato local queda resuelto y el CI de los nuevos commits sigue pendiente de publicación autorizada. Las filas siguientes conservan la evidencia histórica del Sprint 1.

## Alcance y conservación del trabajo previo

Se mantiene `feat/backup-b2-storage`, HEAD `efd6ef5`, sin commits, push, PR, merge ni cambio de rama. PR #35 permanece separado: no atribuirle estos cambios. Se preservan los cambios locales iniciales de README, docs/database, docs/roadmap, los cuatro documentos de Fase 0, test_plan.md y las retiradas previas de TagRequest/ScoreBadge. Esas retiradas no pertenecen al sprint.

Sin nuevas dependencias runtime, cambios de esquema, migraciones, borrado de registros, datos reales, servicios de pago, funciones IA, donaciones ni despliegues. Los cambios de IA son exclusivamente de aislamiento del contexto y persistencia existentes.

## Incrementos implementados y pruebas

### 1. Asociaciones y aislamiento — #39

- Form Requests validan asociaciones contra el workspace destino, no la unión de todas las memberships. En actualización se utiliza el workspace del recurso y se autoriza antes de validar; lo ajeno responde 404.
- `BelongsToWorkspace` valida referencias al guardar y aplica integridad de relaciones al leer. Un registro legacy mal asociado se oculta de listados, rutas directas, relaciones, recuentos y portales; permanece en la base de datos. No se repara ni reasigna automáticamente.
- El pivot de equipo y el sujeto de actividades comprueban workspace. La actividad se escribe en el estudio del recurso, aunque el actor tenga otro seleccionado.
- Calendario público y reservas se limitan al estudio propio del publicador. El contexto Ollama existente requiere membership vigente y el workspace correspondiente; mensajes/planes/análisis conservan el workspace del recurso. La importación deduplica emails dentro del workspace destino.
- HTTP/HTTPS sin credenciales en enlaces nuevos de entrega y contrato legacy. Portales de entrega no publican enlaces históricos inseguros. Borradores, archivados, caducados y desconocidos responden 404; caducidad de hoy sigue vigente. Archivar retira el portal; no revoca contenido del proveedor externo.

`WorkspaceAssociationSecurityTest`: diez tests con dos estudios independientes, owner/admin/member, externo, datos legacy, rutas directas, lecturas relacionadas, equipo, historial, reservas/calendario, importación y retirada de membership. Los casos iniciales de asociación y enlaces fueron RED antes del cambio y PASS después. Se conservan las pruebas existentes de retirada y permisos; no se introduce una nueva matriz de roles.

### 2. Respuestas públicas idempotentes y coherentes

- `PublicDeliveryService`: actualizaciones condicionales y transacción con reintentos. Aprobar repetidamente no cambia la fecha ni genera nueva actividad/notificación. Repetir el mismo comentario tampoco; comentarios diferentes aceptados conservan historial.
- Una corrección obsoleta que intenta sobrescribir otra devuelve 409; tras aprobación devuelve 422. Notificación y actividad fallidas revierten la transición.
- Contratos: la notificación y `already_processed` se deciden dentro del bloqueo/transacción; desaparece la ventana entre leer el estado y notificar desde el controlador. Aceptar/rechazar mantiene el lifecycle existente, snapshot y sincronización con trabajo.
- La escritura precede a la lectura bloqueante para evitar upgrades de locks en SQLite; MySQL usa también el bloqueo de fila/transacción. No se añade almacenamiento de deduplicación ni una dependencia.

`PublicDeliverySecurityTest`: nueve pruebas. `ContractPortalTest`: nueva regresión con enlaces/lecturas obsoletas; suite de doce pruebas. `DeliveryConcurrencyTest`: dos procesos PHP tras barrera real y SQLite temporal/WAL; seis carreras (aprobar/aprobar, comentar/aprobar, comentar/comentar, aceptar/aceptar, rechazar/rechazar y aceptar/rechazar). Una única transición final válida, notificación por acción confirmada y comentarios preservados. **No es un ensayo MySQL/TiDB.**

### 3. Privacidad de logs y observabilidad

- AuditLog conserva evento, clase, archivo/línea, ruta segura, IDs internos y referencia; elimina mensajes brutos de excepción/correo. El handler deja de duplicarlos en el log Laravel predeterminado.
- Sentry PHP usa el callback tipado para Event real; frontend admite breadcrumbs del SDK en formato array. Ambos eliminan cuerpos, credenciales, mensajes privados, variables, consultas sensibles y tokens de rutas; mantienen tipo/localización técnica de error. No se necesita DSN para usar la aplicación.
- `backend/server.php` sustituye el router predeterminado que imprimía URI bruta en `artisan serve` (comando del Dockerfile actual); E2E lo reutiliza. No cambia rutas. Los logs de proxy/proveedor requieren revisión privada separada.
- El mailer `log` y su inclusión en failover se rechazan en producción antes de escribir cuerpos/enlaces. Usar SMTP; local y E2E conservan log solo para datos sintéticos. No se han probado credenciales SMTP reales.

Canarios en archivos de log reales, stdout/stderr de servidor HTTP, eventos SDK y Vitest: PASS. Mutación temporal que retiraba redacción del router: FAIL esperado; código restaurado y suite final PASS. En E2E: 28 peticiones públicas, cero rutas privadas sin redactar en la salida del servidor. Esto no demuestra que otros sistemas de logging externos estén configurados correctamente.

No se han leído logs productivos ni identificado credenciales reales comprometidas en esta sesión. El procedimiento privado de revisión/rotación condicionada queda en docs/deployment.md, sin publicar valores.

## Dependencias — #49

La [matriz por aviso](2026-10-29-sprint1-dependencies.md) recoge paquete, versión, severidad, ruta, parche y exposición: 14 avisos pnpm de producción, 24 Composer y 46 adicionales del árbol build/dev. Son avisos por versión, no explotaciones confirmadas.

| Paquete | Antes → después |
| --- | --- |
| axios / follow-redirects | 1.19.0 → 1.20.0 / 1.16.0 → 1.16.1 |
| vite | 8.2.1 → 8.2.4 |
| vitest, coverage-v8 y familia | 4.1.10 → 4.1.12 |
| brace-expansion | 2.1.4 → 2.1.7 y 5.0.9 → 5.0.12 |
| fast-uri / serialize-javascript | 3.1.5 → 3.1.9 / 7.1.0 → 7.1.3 |
| source-map-js / undici | 1.2.1 → 1.2.2 / 7.29.0 → 7.30.1 |
| laravel/framework | 13.19.0 → 13.30.0 |
| dompdf/dompdf | 3.1.5 → 3.1.6 |
| league/commonmark / league/flysystem | 2.8.2 → 2.10.2 / 3.35.2 → 3.35.3 |
| symfony/http-foundation / symfony/mime | 8.1.1 → 8.1.10 / 8.1.0 → 8.1.10 |

Lockfiles regenerados con actualizaciones dirigidas. Se rechazó una resolución inicial demasiado amplia y se rehízo el lock manteniendo los demás paquetes. Instalación pnpm frozen y Composer dry-run no proponen cambios pendientes. Composer cambia exactamente seis paquetes, sin instalaciones/eliminaciones; composer.json permanece intacto. No `audit --fix --force`, upgrades mayores ni ignores de avisos.

**Pendiente:** deepmerge 4.3.1, aviso bajo sin parche upstream, solo en la cadena de build PWA. Configuración/código de confianza, runners locales y CI sin secretos productivos; no procesa payloads HTTP del producto en esa ruta. Evaluación y criterio para retirar la mitigación en la matriz/#49. No hay avisos altos/críticos pendientes en las auditorías ejecutadas.

## Backups y recuperación — #24

**PASS: 32 tests / 264 assertions** con datos sintéticos después de actualizar Flysystem. Copia/restauración SQLite real; checksums, retención 7+4, limpieza, errores, traversal y canarios. Storage fake y SDK mock verifican listado paginado, borrado por VersionId y AccessDenied, sin borrar objetos ajenos.

**NOT RUN:** conexión B2 real, permisos reales, restauración MySQL/TiDB, ACL del host Linux y tres días UTC de copias. No se habilita cron/gate, no se provisionan recursos y no se toca producción. #24 no está completo. [Runbook actualizado](../backup-recovery.md#revalidación-sprint-1--29102026) con ensayo sintético externo y restauración aislada pendientes de autorización/infraestructura.

## Validación final

Equipo: Windows, PHP 8.5.4, Node 24.18.0, pnpm 10.34.1; bases SQLite sintéticas. No sustituye PHP 8.4/Node 22 de CI ni producción.

| Comprobación | Resultado ejecutado |
| --- | --- |
| `pnpm run test` / última pasada `php artisan test` — PHPUnit | PASS: 203 tests; última pasada 1375 assertions. Assertions de espera concurrente pueden variar. |
| `pnpm run test` — Vitest | PASS: 26 archivos / 108 tests. |
| `pnpm run lint` | PASS: oxlint y Pint de todo el backend. |
| `pnpm run build` | PASS: Vite 8.2.4; PWA 23 entradas, 1437,13 KiB; warning de chunks grandes existente. |
| `pnpm run test:e2e` | PASS: 15 recorridos Chromium, 58,1 s; aprobación repetida ampliada. |
| `php artisan test --filter=Backup` | PASS: 32 tests, 264 assertions. |
| `pnpm audit --prod --json` | PASS, exit 0, cero avisos. |
| `composer audit --locked --format=json` | PASS, cero avisos y paquetes abandonados. |
| `pnpm audit --json` | FAIL, exit 1: un aviso bajo deepmerge; cero moderados/altos/críticos. |
| `pnpm install --frozen-lockfile` | PASS. |
| Composer install dry-run / validate | PASS; warning anterior de restricción exacta barryvdh/laravel-dompdf. |
| Prettier de ambos archivos frontend tocados | PASS. |
| `pnpm --dir frontend run format:check` | FAIL previo: 226 archivos restantes (228 en Fase 0). No se reformatean masivamente. CI sigue bloqueado en ese gate. |
| `git diff --check` | PASS. |

Durante implementación hubo RED intencionados de regresión/mutación. La primera fixture concurrente de contratos omitía content obligatorio y el primer ensayo HTTP no tenía tablas en su proceso hijo; se corrigieron las fixtures sin debilitar las garantías. Una ejecución de Artisan desde raíz falló por directorio incorrecto; se repitió desde backend. La revisión final detectó y corrigió una restricción excesiva de URLs con @ en la query, con regresión que mantiene el rechazo de credenciales en la autoridad. No quedan esos fallos en la ejecución final.

## Riesgos y paso a revisión

1. No considerar release listo: falta CI real y su deuda Prettier, revisión humana del diff y ensayo MySQL/TiDB aislado. La prueba local no acredita tiempos ni planes de consultas productivos; EXISTS añade comprobaciones por relación con búsqueda por clave primaria. Medir con volumen representativo antes de publicar.
2. Datos legacy incoherentes permanecen ocultos/conservados. Inventariar en entorno privado, obtener copia recuperable y aprobar correcciones individualmente. No eliminar ni reasignar silenciosamente.
3. Entregas/calendario retienen tokens legacy almacenados para compatibilidad; no prometer hash universal ni revocación del proveedor externo. Un token previamente expuesto requiere revisión/regeneración según módulo y plan compatible separado.
4. Antes de publicación revisar SMTP, configuración de access logs externos y cachés de agregados previas; invalidar estas últimas durante la ventana autorizada. No se ejecutan comandos de producción en este sprint.
5. #39, #49, #24 y #37 se han actualizado mediante la integración GitHub con progreso agregado y permanecen abiertos: revisión/integración pendiente, aviso residual y criterios externos de recuperación sin cumplir. No se publican canarios, payloads, tokens ni procedimiento de explotación.

Siguiente incremento recomendado: separar estos cambios por seguridad, privacidad e idempotencia y dependencias para revisión, conservar la rama/PR de backups, resolver el gate de formato en cambio dedicado y ejecutar el ensayo MySQL/B2 sintético autorizado. Después comenzar #40/#41 con workspace creativo y briefing manual; aún sin ampliar IA, donaciones ni producción.

## Inventario de archivos de este sprint

Se listan a continuación los archivos modificados/nuevos del sprint. Los cambios previos de Fase 0 citados al inicio se excluyen del inventario.

- `backend/app/Http/Controllers/Api/AiController.php`
- `backend/app/Http/Controllers/Api/DeliveryController.php`
- `backend/app/Http/Controllers/Api/InvoiceController.php`
- `backend/app/Http/Controllers/Api/Public/PublicBookingController.php`
- `backend/app/Http/Controllers/Api/Public/PublicContractController.php`
- `backend/app/Http/Controllers/Api/Public/PublicDeliveryController.php`
- `backend/app/Http/Requests/ChecklistRequest.php`
- `backend/app/Http/Requests/ContractRequest.php`
- `backend/app/Http/Requests/DeliveryRequest.php`
- `backend/app/Http/Requests/JobRequest.php`
- `backend/app/Http/Requests/PresetRequest.php`
- `backend/app/Http/Requests/QuoteRequest.php`
- `backend/app/Http/Requests/SessionRequest.php`
- `backend/app/Http/Requests/TaskRequest.php`
- `backend/app/Models/Activity.php`
- `backend/app/Models/Concerns/BelongsToWorkspace.php`
- `backend/app/Models/Job.php`
- `backend/app/Providers/AppServiceProvider.php`
- `backend/app/Services/ActivityLogger.php`
- `backend/app/Services/AiContextService.php`
- `backend/app/Services/CalendarService.php`
- `backend/app/Services/ClientImportService.php`
- `backend/app/Services/ContractPortalService.php`
- `backend/app/Services/IcsFeedService.php`
- `backend/app/Services/PublicDeliveryService.php`
- `backend/app/Services/SessionPlannerService.php`
- `backend/app/Services/WorkspaceAuthorizer.php`
- `backend/app/Support/AuditLog.php`
- `backend/app/Support/SentryScrubber.php`
- `backend/bootstrap/app.php`
- `backend/composer.lock`
- `backend/config/sentry.php`
- `backend/server.php`
- `backend/tests/Feature/AuditLogPrivacyTest.php`
- `backend/tests/Feature/ContractPortalTest.php`
- `backend/tests/Feature/ContractTest.php`
- `backend/tests/Feature/DeliveryConcurrencyTest.php`
- `backend/tests/Feature/PublicDeliverySecurityTest.php`
- `backend/tests/Feature/ServerLogPrivacyTest.php`
- `backend/tests/Feature/WorkspaceAssociationSecurityTest.php`
- `backend/tests/Fixtures/delivery-response-worker.php`
- `backend/tests/Unit/SentryScrubberTest.php`
- `docs/ai.md`
- `docs/api.md`
- `docs/architecture.md`
- `docs/backup-recovery.md`
- `docs/deployment.md`
- `docs/plans/2026-10-29-sprint1-dependencies.md`
- `docs/plans/2026-10-29-sprint1-security-stability.md`
- `docs/roadmap.md`
- `docs/testing.md`
- `e2e/support/backend.js`
- `e2e/tests/deliveries.spec.js`
- `frontend/package.json`
- `frontend/src/app/sentry.js`
- `frontend/src/app/sentry.test.js`
- `package.json`
- `pnpm-lock.yaml`
