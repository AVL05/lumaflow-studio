# Sprint 2 — Creative Workspace y briefings manuales

Objetivo: ampliar Job y /api/jobs sin cambiar IDs, tablas existentes, estados ni funciones comerciales. Issues #37, #40, #41. Sin IA nueva, medios, servicios de pago ni producción.

## Diseño y límites

Migración aditiva de photography_jobs: project_type (photography/audiovisual/personal, fotografía por defecto), participantes descriptivos (nombre/rol, no permisos), fechas de inicio/fin/entrega, enlaces HTTP(S), briefing JSON y contador de versión. Localizaciones adicionales mediante pivot hacia Location, validado y filtrado por workspace igual que el equipo existente; location_id mantiene su significado anterior. Cliente sigue nullable.

Briefing 1:1 en la propia fila: ocho campos de texto acotados, esquema cerrado y endpoint anidado. Se elige esto sobre la tabla propuesta en Fase 0 para evitar una segunda frontera de ownership y recursos duplicados. Description no se copia ni modifica automáticamente. Guardado explícito y control optimista de versión: 409 conserva el borrador local. Ningún texto del briefing pasa a logs o actividad.

Las cuatro fases se derivan de los estados legacy: preparación (lead a preparation), producción (shoot), postproducción (editing/review), entrega (delivered/closed). Cancelled permanece cancelado. No se mantiene un pipeline paralelo. Sesiones, tareas, equipo, contratos, presupuestos, facturas y entregas se reutilizan.

Paginación opt-in mediante parámetro paginate=1: el listado histórico y jobsApi.list conservan respuesta/semántica. La nueva página usa jobsApi.page y el hook/paginador existentes. No se truncan los selectores de los otros módulos silenciosamente.

## Incrementos y archivos

1. Backend: nueva migración, Job/JobRequest/JobResource/JobController, JobWorkflowService, validación/servicio de briefing y ruta anidada. Tests CreativeWorkspaceTest y ProjectBriefingTest antes de implementar. Validar asociaciones nuevas/legacy, roles, 404, payload antiguo, fechas, esquema, límites, conflictos y migración sobre filas previas. Migraciones solo en bases sintéticas de tests.
2. Frontend: jobsApi, JobForm y normalización, ProjectBriefingEditor y edición de organización reutilizando Modal/inputs; JobDetailPage con resumen/briefing/planificación/entregas/gestión comercial. JobsPage paginado y nomenclatura Proyectos, conservando URLs. Tests de formularios, guardado fallido/conflicto, descripción antigua y navegación/estados. Revisión móvil y teclado; usar componentes existentes.
3. E2E: creación personal y audiovisual, edición, briefing manual/reload, aislamiento y flujos comerciales anteriores. Ejecutar PHPUnit, Vitest, Node audit policy, lint, Prettier, build y Playwright. Documentar API, arquitectura, datos y roadmap; actualizar issues sin cerrarlos antes de integración.

## Riesgos y validación pendiente

No inferir ni inventar participantes, fechas o equipos. Enlaces son solo referencias externas; no controlan permisos del proveedor. Validación de cada FK/pivot en backend, relaciones filtradas y transacciones en escrituras. Formularios preservan borradores ante errores y conflictos; confirmar descarte al navegar.

Conservar los nueve commits locales y test_plan.md sin seguimiento. Sin push/merge/despliegue. MySQL/TiDB, B2 y CI remoto de los nuevos commits siguen pendientes según Sprint 1.5. La evidencia y los límites ejecutados se registran a continuación.

## Resultado implementado — 30/10/2026

Implementados #40 y #41 en el checkout local, sin publicar ni cerrar issues. Listado de proyectos con búsqueda, tipo y paginación; alta personal sin cliente; detalle responsive con resumen, briefing, planificación, entregas y gestión comercial. Organización editable con participantes descriptivos, fechas, cliente opcional, localización principal/adicionales, equipo y enlaces externos. Sesiones, tareas, documentos comerciales y estados anteriores siguen disponibles. Las cuatro fases se derivan del estado; no sustituyen el workflow anterior ni incorporan todavía shot lists o cronograma de rodaje.

Briefing manual con objetivos, referencias, necesidades técnicas, escenas, localizaciones, riesgos, pendientes y notas. Guardado explícito, límite de 4000 caracteres por campo y esquema cerrado; error o 409 conserva el borrador, recargar exige confirmar descarte. Cambiar de pestaña conserva el texto; salir/recargar advierte de cambios sin guardar. JSON 1:1 en Job, sin IA ni medios. Actividad sin contenido privado. La revisión protege el briefing; no se añade bloqueo optimista a todos los campos legacy ni un historial completo del texto.

Correcciones verificadas durante integración: `Modal` conserva foco al cambiar el callback de cierre durante la escritura; selector de contratos consume el array real de `jobsApi.list`; al cambiar de ID de proyecto se descarta el formulario anterior para impedir guardarlo sobre otro proyecto. Tests nuevos reproducen estos fallos. Se conservan los tests previos del modal (apertura, nombre accesible, Escape, botón y foco).

### Inventario de archivos afectados

- Backend existente: `backend/app/Models/Job.php`, `Http/Controllers/Api/JobController.php`, `Http/Requests/JobRequest.php`, `Http/Resources/JobResource.php`, `Services/JobWorkflowService.php` y `backend/routes/api.php`.
- Backend nuevo: `backend/app/Http/Requests/ProjectBriefingRequest.php`, `backend/app/Services/ProjectBriefingService.php`, `backend/database/migrations/2026_10_30_000001_add_creative_workspace_to_jobs.php`.
- Frontend existente: `frontend/src/api/jobs.js`, `features/jobs/{JobForm.jsx,jobFormUtils.js}`, `pages/{JobsPage.jsx,JobDetailPage.jsx,ContractsPage.jsx}`, `components/layout/AppLayout.jsx`, `components/ui/Modal.jsx`.
- UI nueva: `frontend/src/features/jobs/{ProjectBriefingEditor,ProjectOrganizationFields,ProjectResourcePicker}.jsx`.
- Backend tests: nuevos `CreativeWorkspaceTest.php` (7) y `ProjectBriefingTest.php` (4); ampliado `BackupRestoreTest.php` con recuperación de los metadatos y pivot nuevos.
- Frontend tests: nuevos `features/jobs/{JobForm.test.jsx,jobFormUtils.test.js,ProjectBriefingEditor.test.jsx}`, `pages/JobDetailPage.test.jsx`; ampliados `pages/ContractsPage.test.jsx` y `components/ui/Modal.test.jsx`.
- E2E: nuevo `e2e/tests/creative-workspace.spec.js` (2); adaptados `onboarding.spec.js` y `workflow.spec.js` a etiquetas/selector de la nueva UI, conservando sus recorridos comerciales.
- Docs: README, `docs/{api,architecture,database,testing,roadmap,backup-recovery}.md`, este informe y dos capturas sintéticas. Sin cambios de dependencias, lockfiles, IA o workflows CI.

### Validación ejecutada

| Comprobación | Resultado |
|---|---|
| `pnpm run test` | PASS: PHPUnit 214 tests (1525 assertions), Vitest 120 tests en 30 archivos y 5 tests Node de política de auditoría |
| Vitest tras la última regresión de cambio de proyecto | PASS: 120 tests; incluido después en suite completa |
| `php artisan test --filter=BackupRestoreTest` | PASS: 3 tests, 21 assertions; ampliación incluida después en suite completa |
| `pnpm run test:e2e` | PASS: 17 recorridos Chromium; incluye creación personal/audiovisual y recorridos anteriores |
| E2E creativo tras la última regresión | PASS: 2 recorridos; después se repite la suite completa |
| `pnpm run lint` | PASS: Oxlint y Pint |
| `pnpm --dir frontend run format:check` | PASS: todos los archivos fuente, sin reducir el gate |
| `pnpm run build` | PASS: PWA, 23 entradas de precache (1451.76 KiB); persiste warning de chunks >500 kB |
| `git diff --check` | PASS; Git advierte de conversión LF/CRLF fuera de frontend, sin errores de whitespace |

Primero se verificaron fallos con los tests nuevos antes de implementar backend y correcciones de foco/cambio de ID. Un test adicional reprodujo que objetos con claves se aceptaban como colecciones; `list` limita los nuevos arrays a listas JSON y evita errores de contrato en la SPA. Durante E2E se corrigió una condición inválida de una fixture de equipo y se actualizaron expectativas de texto antiguas; no se retiraron controles de negocio. Tras volver del diálogo de descarte, la comprobación de notas usa su rol accesible y mantiene la aserción sobre el borrador.

Capturas inspeccionadas, con datos sintéticos de Playwright: [escritorio](../screenshots/sprint2-project-desktop.png) y [móvil](../screenshots/sprint2-project-mobile.png). Son evidencia local de Chromium (1280×900 y 390×844); no equivalen a pruebas en dispositivos físicos ni otros motores.

### Migración, seguridad y límites operativos

La migración solo se ejecutó por PHPUnit/E2E en bases sintéticas. Prueba específica conserva ID, presupuesto, estado y descripción de una fila anterior. Las lecturas ocultan pivots incoherentes, las escrituras validan el workspace del proyecto y la suite prueba owner/admin/member, usuarios con dos memberships, miembros retirados y externos. Se preservan las regresiones previas de aislamiento, portales, aprobaciones idempotentes y logs.

Antes de integrar/desplegar: ensayo de migración y restauración MySQL/TiDB con copia sintética aislada, JSON/defaults/FKs y backup recuperable. No ejecutar rollback `down()` tras guardar nuevos datos sin conservarlos: elimina las columnas añadidas. Preferir corrección hacia delante. El backup completo ya incluye columnas y pivot; el drill SQLite verifica su recuperación. B2 real, permisos/retención/versiones remotas y tres días UTC siguen pendientes en #24 y [runbook](../backup-recovery.md).

CI remoto del código nuevo **NOT RUN**: no hay push ni dispatch; el CI histórico no valida este checkout. No se han actualizado dependencias ni reabierto su alcance; se mantiene la excepción baja de `deepmerge` y sus controles del Sprint 1.5 (#49). No se acreditan nuevas auditorías remotas ni recuperación externa.

Git conserva rama `feat/backup-b2-storage`, HEAD `a46c72c` y los nueve commits locales previos. Este sprint deja cambios sin commit; `test_plan.md` continúa sin seguimiento e intacto. No se crea PR, push, merge ni despliegue. Issues #40/#41 y epic #37 reciben seguimiento agregado sin información sensible y permanecen abiertos hasta revisión/integración.

Siguiente sprint recomendado: #42, shot lists ordenadas y planificación de producción sobre Job, seguido de #43 para plantillas/pipeline. Mantener MySQL/TiDB, B2 y CI remoto como gates de publicación separados; no presentar este resultado como producción aprobada.
