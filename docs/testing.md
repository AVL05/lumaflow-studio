# Estrategia de pruebas

## SEO/GEO P0/P1 — regresiones locales

Vitest cubre la allowlist, metadata por ruta, queries sensibles, navegación pública/privada y copy de capacidades reales. `prerender.test.jsx` verifica contenido SSR comercial, rechazo de rutas privadas, ausencia de lectura del token y de peticiones fetch durante render. `SearchIndexingTest` verifica headers en éxito y errores sin modificar los estados 401/404/500.

Después de `pnpm run build`, `pnpm run test:pwa` ejecuta también `e2e/pwa/seo.spec.js` sobre el artefacto servido: seis páginas con y sin JS, hidratación sin errores, CTA/back, metadatos iniciales/DOM, robots/sitemap parseable, queries sensibles, alias 308, desconocidas 404 y shell privado. Comprueba además el conjunto de HTML emitido, schema sin valoraciones inventadas, revisiones MD5 finales del precache y contenido/CTA a 390/768/1280 px. Las capturas quedan en `e2e/test-results/pwa/` (ignoradas por Git).

La suite E2E principal conserva sus recorridos SPA/API y no sustituye estas pruebas del build. El smoke remoto conserva login/salud y añade H1/canonical de seis páginas y Content-Type de robots/sitemap. No se ha ejecutado en Actions ni se ha publicado esta implementación. Resultados y criterios abiertos: [auditoría SEO/GEO](SEO_GEO_AUDIT.md#13-implementación-local-p0p1).

LumaFlow combina tres niveles de pruebas. Cada uno cubre una capa distinta y ninguno sustituye a los demas.

| Nivel                        | Herramienta              | Cubre                                                          | Comando                  |
| ---------------------------- | ------------------------ | -------------------------------------------------------------- | ------------------------ |
| Backend (feature/unit)       | PHPUnit                  | API, validacion, autorizacion, servicios y consultas           | `pnpm run test:backend`  |
| Frontend (componentes/hooks) | Vitest + Testing Library | Comportamiento de hooks, utilidades, formularios y componentes | `pnpm run test:frontend` |
| Recorridos criticos (E2E)    | Playwright               | Flujos de usuario sobre SPA + API reales                       | `pnpm run test:e2e`      |

Las pruebas unitarias y de componentes son necesarias para iterar rapido; los recorridos E2E existen para confirmar que el flujo completo sigue funcionando entre las dos aplicaciones.

## Regresiones Sprint 3 (#42)

- `ShotListTest`: CRUD, duplicación, movimientos entre páginas, límites, revisiones, roles owner/admin/member y rechazo de referencias ajenas incluso con doble membership; lectura oculta equipo de pivot incoherente.
- `ProductionDayTest`: reutilización de Session/checklists, asignación, protección de traslado, desvinculación al borrar jornada, horarios/esquema, 404, migración sobre sesión antigua, PDF válido/escapado, límite de exportación y rate limit independiente. Calendario/ICS conservan fin real y no publican notas; mover a un horario incoherente se rechaza sin modificar la sesión.
- `ProductionConcurrencyTest` + fixture `production-worker.php`: dos procesos reales sobre SQLite temporal/WAL, altas y movimientos sin pérdida/colisión y un único ganador de notas con revisión obsoleta. No acredita bloqueos MySQL/TiDB.
- `BackupRestoreTest` ampliado con tomas, estado, notas, revisión, sesión/horario/participantes y equipo.
- Vitest: `productionFormUtils.test.js`, `ProductionWorkspace.test.jsx`: fotografía sin escena, normalización, datos legacy, estado rápido, borrador ante 409, descarte confirmado, orden accesible, eliminación confirmada y reintento. `CalendarEvent.test.jsx` comprueba rango con hora final y compatibilidad sin ella.
- Playwright `production.spec.js`: jornada y fotografía desde UI, equipo/localización, duplicación, reordenación por teclado, estados, observaciones, checklists, móvil 390px sin overflow, persistencia tras recarga, descarga PDF e aislamiento externo. La impresión física/diálogo nativo y otros motores no se automatizan.

Resultados agregados y capturas en [informe Sprint 3](plans/2026-10-30-sprint3-production.md). Se mantienen suites anteriores; los fallos de arranque en frío o fixtures se registran sin atribuirlos a funcionalidad validada.

## Regresiones Sprint 4 (#43)

- `ProjectWorkflowTest`: nueve definiciones válidas, edición/copia y reutilización entre proyectos, previsualización sin escrituras, confirmación, idempotencia, previsualización/revisión obsoleta, títulos existentes y controles de checklist sin reiniciar datos, inicialización/orden/transiciones, reapertura por tareas/checks, asignación owner/admin/member y referencias ajenas. También estudio activo distinto, integridad de sesión/proyecto, lectura de datos incoherentes y migración sobre Task/Checklist previas.
- `WorkflowConcurrencyTest`: dos procesos SQLite/WAL aplican la misma plantilla (un solo recibo y sin duplicar etapas/tareas/checklists) y editan la misma etapa obsoleta (un ganador, un 409). Reutiliza el worker de producción; no acredita el motor MySQL/TiDB.
- `BackupRestoreTest`: recupera plantillas, etapas, tareas, checklists, recibos y asignaciones/fechas/observaciones, además del contenido anterior.
- Vitest: `workflowFormUtils.test.js`, `PostproductionWorkspace.test.jsx`: roundtrip de definición sin recursos inventados, listas editables, preview/confirmación, tarea reutilizada, conflictos con borrador, orden y enlaces a módulos existentes. Las suites previas se conservan.
- E2E `workflows.spec.js`: nueve opciones, aplicación manual, controles/etapa completada, responsable/fecha explícitos, plantilla propia editada y reaplicación sin duplicados, datos históricos, aislamiento, recarga y móvil 390px. Los controles se localizan por rol accesible cuando la etiqueta contiene opciones de select.

Evidencia final en [informe Sprint 4](plans/2026-11-01-sprint4-workflows.md). MySQL/TiDB, B2, CI remoto e impresión física permanecen NOT RUN; no se rebajan gates ni se eliminan tests para declarar resultados.

## Ensayos de recuperación (#24)

`php artisan test --filter=Backup` verifica schedule 03:00 UTC/`--prune`/mutex,
restricción del workflow a repo original y `main`, concurrencia, checksum obligatorio,
configuración de destino y fallo sin secretos. `BackupRestoreTest` genera una copia
SQLite sintética con prune, comprueba tamaño/SHA-256 y restaura en DB temporal aislada.
CI de PRs no recibe Secrets de producción ni ejecuta `production-backup.yml`.
Ese workflow operativo solo tiene schedule/dispatch; no publica artifacts y falla
explícitamente mientras no exista destino privado duradero verificado.
La sintaxis del workflow puede comprobarse con `actionlint .github/workflows/production-backup.yml`.

## Suite E2E

### Regresiones Sprint 2 (#40, #41)

- `CreativeWorkspaceTest`: proyectos personales/audiovisuales, payload y listado legacy, paginación opt-in, opciones paginadas, fechas/esquemas/enlaces, asociaciones entre estudios con owner/admin/member y migración aditiva sobre una fila previa.
- `ProjectBriefingTest`: roundtrip manual sin modificar descripción, esquema cerrado y límites, revisiones obsoletas sin sobreescritura/actividad duplicada, miembros retirados/externos 404 y ausencia de texto privado en actividad.
- `BackupRestoreTest`: el drill SQLite también restaura un proyecto personal sin cliente, briefing/revisión y pivot de localizaciones. No acredita MySQL/TiDB ni conectividad B2.
- Vitest: `JobForm`, `jobFormUtils`, `ProjectBriefingEditor`, `JobDetailPage`, `Modal` y selector de contratos. Cubre guardado/errores/409, borradores entre pestañas, descarte confirmado, foco estable al escribir y respuesta real del listado legacy.
- `e2e/tests/creative-workspace.spec.js`: proyecto personal desde UI, participantes/fechas/enlaces, asociación de equipo/localización, briefing persistente, borrador y guardia de navegación, proyecto audiovisual, fase, permisos y compatibilidad comercial. Chromium a 1280×900 y 390×844, sin overflow horizontal; capturas sintéticas en el [informe](plans/2026-10-30-sprint2-creative-workspace.md). No acredita Safari, dispositivos físicos ni funcionamiento offline de escrituras.

Evidencia agregada y límites de ejecución en el informe del Sprint 2. La suite completa conserva los recorridos anteriores de aislamiento, portales, idempotencia y logs; onboarding/workflow solo actualizan controles y nombres de la nueva interfaz.

`e2e/` es un paquete del workspace de pnpm que ejecuta Playwright contra un entorno de pruebas propio. No usa Docker ni una base de datos compartida con desarrollo: crea un archivo SQLite local, arranca el backend con el servidor integrado de PHP y el frontend con el servidor de desarrollo de Vite, y los apaga al terminar.

### Recorridos cubiertos

| Recorrido                                 | Archivo                        | Qué valida                                                                                                     |
| ----------------------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Alta y acceso de un estudio               | `e2e/tests/auth.spec.js`       | Registro, verificacion de email por enlace firmado, onboarding, primer trabajo, login valido y login erroneo   |
| Alta comercial: cliente, trabajo y sesion | `e2e/tests/workflow.spec.js`   | Los tres modulos conectados usando el pipeline real de la interfaz                                             |
| Portal de entrega                         | `e2e/tests/deliveries.spec.js` | Creacion de entrega, apertura del portal publico sin sesion, aprobacion del cliente y reflejo en el panel      |
| Aislamiento entre estudios                | `e2e/tests/isolation.spec.js`  | Un segundo estudio recibe `404` al leer, modificar y borrar recursos ajenos, y la interfaz no filtra su nombre |

### Ejecutar

```bash
pnpm run test:e2e          # suite completa en modo headless
pnpm run test:e2e:ui       # modo interactivo con inspector
pnpm run test:e2e:report   # abre el ultimo informe HTML
pnpm run test:e2e:install  # descarga el navegador Chromium de Playwright
```

La primera ejecucion necesita el navegador. Si falla con un error de ejecutable ausente:

```bash
pnpm run test:e2e:install
```

### Entorno de pruebas

`e2e/support/env.js` define todo lo especifico del entorno:

| Elemento                 | Valor por defecto              | Permite sobrescribir con |
| ------------------------ | ------------------------------ | ------------------------ |
| API Laravel              | `http://127.0.0.1:8001`        | `E2E_BACKEND_PORT`       |
| SPA de Vite              | `http://127.0.0.1:5273`        | `E2E_FRONTEND_PORT`      |
| Base de datos            | `e2e/.tmp/lumaflow-e2e.sqlite` | —                        |
| Clave de aplicacion      | generada en `e2e/.tmp/app-key` | —                        |
| Credenciales de la suite | `e2e/support/accounts.js`      | —                        |

Todo lo generado vive en `e2e/.tmp/` y esta ignorado por git.

El backend se lanza con `php -S` y el router de Laravel en lugar de `php artisan serve`, porque ese ultimo solo reenvia `$_ENV` a su proceso hijo y esa variable suele venir vacia. El entorno (`APP_ENV=e2e`, `DB_CONNECTION=sqlite`, `MAIL_MAILER=log`, `CACHE_STORE=file`, `BCRYPT_ROUNDS=4`, origenes CORS de la SPA) se inyecta de forma explicita en cada proceso PHP.

Antes de ejecutar los tests, el `globalSetup`:

1. ejecuta `php artisan optimize:clear` y `migrate:fresh --seed --seeder=Database\Seeders\E2ESeeder`, de modo que la base solo contiene los datos de la suite;
2. vacia `backend/storage/logs/laravel.log`, porque el enlace de verificacion de email se lee de ese log (`MAIL_MAILER=log`);
3. inicia sesion una vez por cuenta reutilizable y guarda el `storageState` de la SPA.

`Database\Seeders\E2ESeeder` crea cinco estudios ficticios en el dominio reservado `.test`, ya verificados; cuatro configurados y uno (`e2e.nuevo@lumaflow.test`) sin onboarding para el recorrido de primer valor. Las credenciales viven solo en `e2e/support/accounts.js` y llegan al seeder por variables de entorno, para no duplicarlas en dos lenguajes. Solo se registra por UI una vez por ejecucion (el throttle comparte contador por IP en peticiones no autenticadas): el resto de cuentas llegan sembradas.

La suite ejecuta once recorridos completos en ~1 min, con cientos de peticiones autenticadas por usuario (cada navegacion dispara `AuthContext`, panel y contadores). Para no agotar el budget anti-abuso de produccion (`throttle:180,1`), el backend E2E define `API_THROTTLE_PER_MINUTE=1000` (`e2e/support/env.js`, leido via `config/api.php`). Produccion no define esa variable y conserva 180; `ApiThrottleTest` lo bloquea.

La cuenta de acceso (`e2e.acceso@lumaflow.test`) es independiente a proposito: el backend mantiene una sesion activa por usuario y cada login invalida los tokens anteriores, asi que el recorrido de login no puede usar la misma cuenta que los fixtures reutilizados.

### Fixtures

`e2e/fixtures/test.js` expone estas paginas, cada una en su propio contexto de navegador:

- `ownerPage`: estudio propietario de los recursos que crea el test.
- `outsiderPage`: segundo estudio, para comprobar aislamiento.
- `guestPage`: cuenta invitada al estudio compartido.
- `newcomerPage`: cuenta nueva a mitad del embudo de onboarding.
- `visitorPage`: ventana sin sesion, para portales publicos.

### Reglas para escribir tests

- **Sin esperas arbitrarias.** No se usan `waitForTimeout`. Las esperas son por estado visible, por URL o por condicion observable con `expect.poll`.
- **Selectores semanticos.** Se prioriza `getByRole`, `getByLabel` y `getByText` sobre clases CSS. El repositorio no usa `data-testid`, y los modales se acotan con `getByRole("dialog")`.
- **Sin datos reales.** Todo se crea dentro del test con identificadores unicos (`Date.now()`), de forma que los tests no dependan del orden de ejecucion y puedan repetirse.
- **Sin backdoors.** Los tests cruzan la interfaz real. Cuando hace falta leer un dato que la UI no expone (por ejemplo el token publico de una entrega), se usa la API autenticada con la sesion de esa misma pagina, no atajos de base de datos.

### Ejecucion en serie

La suite comparte una unica base SQLite, asi que `playwright.config.js` fija `fullyParallel: false` y `workers: 1`. La suite actual contiene quince recorridos; una base por test permitiría paralelizar, pero no se introduce ese cambio en este sprint.

## Integracion en CI

El job `E2E journeys` de `.github/workflows/ci.yml` instala PHP 8.4 con `pdo_sqlite`, Node 22, las dependencias de Composer y del workspace, el navegador Chromium de Playwright y ejecuta `pnpm run test:e2e`. El informe HTML se publica como artefacto cuando falla la suite.

## Como elegir donde probar

Sprint 1 añade `WorkspaceAssociationSecurityTest` (dos estudios, roles, referencias nuevas/legacy, historial, importación, calendario/reservas y retirada de contexto), `PublicDeliverySecurityTest`, `DeliveryConcurrencyTest`, `AuditLogPrivacyTest` y `ServerLogPrivacyTest`. Se amplían `ContractPortalTest`, `SentryScrubberTest`, Vitest Sentry y el E2E de entregas.

La prueba de concurrencia crea SQLite temporal con WAL, migra solo esa base y arranca dos procesos PHP tras una barrera de lecturas obsoletas. Cubre entregas (aprobaciones/comentarios) y contratos (aceptar/rechazar), con limpieza en finally. No acredita concurrencia MySQL ni acceso externo. El test del servidor verifica stdout/stderr reales con canarios y sin datos de producción. La redacción Sentry se prueba también con Event del SDK PHP y breadcrumbs reales del SDK JS.

Resultados y límites exactos: [informe Sprint 1](plans/2026-10-29-sprint1-security-stability.md) e [integración Sprint 1.5](plans/2026-10-29-sprint15-integration-stability.md). `format:check` pasa tras fijar LF en Git/Prettier: los 226 fallos locales anteriores eran finales de línea CRLF, sin diferencias de contenido respecto a los blobs versionados. No se ha desactivado ni reducido el gate.

`pnpm run test:audit` ejecuta cinco tests con Node nativo para la política de auditoría; también forma parte de `pnpm run test`. CI ejecuta `pnpm audit --prod` y `composer audit --locked` como controles estrictos. La auditoría pnpm completa guarda JSON y su código de salida, y `scripts/check-security-audit.mjs` solo admite GHSA-gcqx-w48m-w2h4 bajo, deepmerge 4.3.1, sin parche y en su ruta concreta de build PWA. Emite warning y resumen visibles; cualquier otro aviso o error de informe/red falla. Cambiar versión, ruta, severidad o disponibilidad del parche invalida la excepción. No hay `continue-on-error` ni ignores generales. La matriz en #49 explica la mitigación.

La ejecución remota histórica de Actions no valida commits locales nuevos. El gate completo del nuevo SHA debe verificarse tras publicación autorizada; esta sesión no hace push ni dispatch.

| Cambio                                        | Nivel minimo esperado                                                     |
| --------------------------------------------- | ------------------------------------------------------------------------- |
| Regla de validacion o serializacion de la API | PHPUnit feature test + actualizar `docs/api.md` si cambia el contrato     |
| Aislamiento o autorizacion                    | PHPUnit con caso de `404` + recorrido E2E si afecta a la interfaz         |
| Hook, utilidad o componente del frontend      | Vitest + Testing Library                                                  |
| Flujo de usuario de principio a fin           | Recorrido E2E                                                             |
| Correccion de error reproducible              | Test de regresion en el nivel mas bajo posible y, si rompia un flujo, E2E |

## Revisiones de entrega — Sprint 5

`DeliveryRevisionTest`: revisiones, UUID/reintentos, contenido histórico, conflictos de versión, recepción/revisión/cambios/aprobación, comentarios generales, enlaces HTTPS, proyectos personales, creación en workspace de Job no activo, owner/admin/member y externos, expiración/revocación/rotación, contexto inmutable y borradores privados. Backfill aditivo ensayado solo sobre SQLite sintético; no se baja la migración nueva. No se descargan enlaces: Http bloquea peticiones inesperadas y el almacenamiento local de prueba permanece vacío.

`DeliveryConcurrencyTest` y su worker cubren procesos independientes con SQLite WAL: aprobaciones/cambios, recepción y revisión repetidas, comentarios con UUID, publicación duplicada y publicación frente a aprobación de versión anterior. BackupRestoreTest recupera nuevas revisiones y portal revocado. ServerLogPrivacyTest extiende canarios a historia/comentarios del portal; AuditLogPrivacyTest conserva comprobación de archivos de log.

`DeliveryReviewPanel.test.jsx` comprueba previsualización/confirmación, recepción sin efectos en GET, reintento con UUID conservado, bloqueo de enlaces inseguros, revocación confirmada, recarga conservando notas y comentarios tras solicitar cambios. `e2e/tests/deliveries.spec.js` conserva aprobación legacy y añade entrega personal, dos versiones, móvil 390 px, recepción, revisión, cambios, rechazo de aprobación obsoleta, comentario final y revocación. Captura sintética: `docs/screenshots/sprint5-delivery-mobile.png`.

Resultados actuales y auditorías en el informe del Sprint 5. La auditoría completa tiene avisos de build y falla sin ampliar excepciones; esto es distinto de las suites funcionales y del audit de producción. MySQL/TiDB, B2, CI remoto e impresión física no quedan acreditados por estas pruebas.

## Dependencias y PWA de producción — Sprint 5.5

`pnpm run test:audit` ejecuta nueve tests Node: política de auditoría, detección de parche ausente/alterado, contratos reales Workbox/FileList/EJS, glob abortado sin lecturas posteriores y regresión de deepmerge en CJS/UMD. Se resuelven los paquetes a través de sus consumidores reales; no se prueban copias simuladas ni una dependencia instalada aparte. La excepción de deepmerge solo pasa con hashes SHA-256 revisados del parche y entrada instalada. La salida original de pnpm audit completo sigue visible con exit 1 y un aviso bajo mitigado; producción y Composer no tienen avisos.

Para comprobar el service worker generado, ejecutar `pnpm run build` y después `pnpm run test:pwa`. Usa Vite preview en 127.0.0.1:5274 y Chromium con contexto limpio, sin backend, credenciales ni BD. Verifica instalación/control del SW, recarga offline de /login, assets básicos presentes, exclusión de lib-*.js y rechazo de un fetch API offline. Se añade al job E2E de CI sin retirar sus recorridos originales. No acredita edición offline ni soporte físico Safari/iOS.

La fixture visitorPage comprueba el presupuesto público antes de cada recorrido: si quedan menos de veinte peticiones, espera a que termine la ventana real de 30/min y vuelve a comprobarla. No borra contadores, aumenta límites ni reintenta escrituras, y no modifica el timeout de las aserciones UI. El timeout de preparación de esa fixture admite la espera de un minuto; los tests internos de rate limiting permanecen activos. Corrige contaminación entre casos rápidos, no una vulnerabilidad de la aplicación. El primer intento de este sprint detectó dos 429; el recorrido completo posterior pasa con el control original habilitado.

Resultados y límites externos actuales: docs/plans/2026-11-02-sprint55-dependency-security.md.

## Apoyo voluntario — Sprint 6

`supportLinks.test.js` prueba cero/uno/dos proveedores, HTTPS/hostname/rutas de perfil, credenciales, puertos, query/fragmentos, escapes/controles, destinos reservados, perfiles GitHub y configuración inválida parcial. `SupportPage.test.jsx` verifica copy de gratuidad permanente, botones independientes, ninguna URL de fallback, nombres accesibles, nueva pestaña sin opener/referrer, teclado y ausencia de widgets/iframes. Las aserciones de MarketingPages reflejan gratuidad permanente, conservando las comprobaciones de cero coste y ausencia de cargos automáticos.

La suite E2E normal fuerza VITE_KOFI_URL y VITE_GITHUB_SPONSORS_URL vacías, comprueba /support pública y navegación desde footer móvil/configuración, ausencia de destinos de pago y scripts externos, overflow y capturas 390 px/escritorio. `pnpm run test:support` inicia exclusivamente Vite en 127.0.0.1:5275, sin backend, con dos URLs sintéticas interceptadas: prueba Enter/nueva pestaña, opener null, referrer ausente y cookies/localStorage/sessionStorage sin cambios. No contacta perfiles ni completa pagos; los valores de esa configuración no se usan en el build normal.

`pnpm run test:pwa` extiende la prueba de producción con navegación a /support offline y sin canales configurados. CI mantiene formato, lint, tests, build, auditorías y verificación del parche deepmerge; añade el test aislado de proveedores y sus artefactos. No se cambia la excepción del aviso bajo, ni se afirma auditoría completa limpia. Evidencia local y límites: docs/plans/2026-11-02-sprint6-voluntary-support.md.
