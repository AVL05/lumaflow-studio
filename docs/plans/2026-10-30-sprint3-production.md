# Sprint 3 — Shot lists y producción (#42)

Continuación local del Sprint 2, epic #37. Preservar rama, nueve commits, cambios pendientes y `test_plan.md`. Sin producción, push, merge, nuevas dependencias ni IA.

## Incrementos

1. Tomas: migración aditiva `shots`/pivot de equipo, modelo, FormRequest, Resource, servicio y rutas anidadas en Job. CRUD, duplicación pendiente y movimientos adyacentes transaccionales con bloqueo del proyecto. Tests con dos estudios, roles, referencias y orden.
2. Jornadas: reutilizar Session, calendario, notas, tareas y checklists. Añadir hora final, participantes descriptivos e incidencias; asignar tomas solo a sesiones del mismo proyecto. No crear ProductionDay paralelo. Conservar sesiones antiguas; impedir su traslado a otro proyecto mientras tengan tomas.
3. UI: módulo bajo demanda en detalle del proyecto, fotografías previstas para fotografía, escenas opcionales, edición y modo rodaje móvil con cambios de estado/observaciones explícitos. Reutilizar selectores paginados de localización/equipo y participantes del proyecto. PDF con Dompdf y Blade escapado, impresión mediante el documento PDF.
4. Integración: pruebas PHPUnit/Vitest/Playwright, lint, Prettier, build; documentación API/datos/arquitectura y seguimiento #42/#37 con resultados reales.

## Riesgos y límites

Cambios simultáneos de orden/alta/baja serializados por bloqueo de Job. Estado/observaciones de cada toma con revisión optimista y 409 para no perder notas. Validar IDs contra workspace y proyecto, no contra memberships generales. No uploads ni HTML remoto en exportaciones. Participantes son metadatos, no permisos.

MySQL/TiDB, restauración B2 y CI remoto pendientes del Sprint 1.5/2 siguen siendo gates independientes. Migraciones solo sobre datos sintéticos aislados. El rollback no debe eliminar metadatos reales: preferir corrección hacia delante y copia recuperable. Plantillas profesionales completas corresponden a #43; la duplicación permite reutilizar tomas existentes.

## Implementación local

Tomas con ID estable, escena opcional, descripción, plano/tipo de fotografía, movimiento, focal, localización del inventario, equipo, segundos estimados, hora prevista, notas y estado pending/ready/done/discarded. Alta/edición, duplicación con estado pendiente y observaciones/hora reiniciadas, eliminación confirmada y botones subir/bajar compatibles con teclado/táctil, incluso entre páginas. Listado de 24 con filtros por jornada/estado; ordenar requiere quitar filtros. No hay drag obligatorio ni biblioteca adicional.

Las jornadas son sesiones del proyecto: se conservan IDs y calendario, se amplían hora final, participantes descriptivos e incidencias. Crear jornada añade checklists mínimas mediante el servicio existente; editar utiliza el controlador de sesiones y mantiene lifecycle comercial. Localización/equipo se eligen mediante los selectores paginados del Sprint 2. Las tomas solo se asignan a sesiones del mismo proyecto. Borrar sesión conserva tomas sin asignación; no se permite trasladar una sesión con tomas. Briefing, tareas y datos comerciales siguen en sus secciones del proyecto.

Modo rodaje: estados y observaciones desde tarjetas grandes, menos acciones secundarias, filtros, checklists y jornada editable en móvil. Guardado explícito; errores y 409 conservan el borrador, recargar exige descartarlo explícitamente. La guardia de navegación del detalle incorpora cambios de producción, y cambiar de pestaña no desmonta el módulo. No se promete guardado offline, colaboración en vivo ni resolución automática de conflictos.

PDF completo o por jornada con Dompdf/Blade escapado, sin imágenes ni recursos remotos/PHP, sin archivos persistentes. Incluye objetivos del briefing, jornadas/participantes, notas, incidencias, checklists y tomas/equipo. Descarga y apertura del visor PDF para su impresión nativa. Límite técnico de 500 tomas/documento (422 y dividir por jornada); rate limit 5/minuto separado del tráfico API normal. Sin cálculo de solapamientos, duración total ni planificador automático; horarios del día introducidos manualmente, sin jornadas que crucen medianoche.

Calendario e ICS usan hora final cuando existe; sesiones antiguas mantienen su comportamiento anterior. El modelo impide horarios incoherentes también desde el drag del calendario. Se corrigió el límite inclusivo del último día en SQLite, reproducido por prueba. El feed público no recibe notas, incidencias, participantes ni tomas y conserva el alcance del estudio publicador.

## Integridad y regresiones

Autorización del Job antes de validar cuerpo; tomas/sesiones de otro proyecto o estudio responden 404. FKs y validación por workspace/proyecto; trait de integridad existente y scope adicional de sesión/proyecto. Equipo de pivots incoherentes no se serializa. IDs de propietario/workspace enviados no controlan asociaciones. Participantes no conceden permisos. Pruebas cubren owner/admin/member, doble membership y usuarios externos.

Altas/duplicaciones/bajas/movimientos comparten bloqueo de Job. En SQLite, FOR UPDATE no basta: dos procesos reprodujeron `database is locked` en altas simultáneas. Se adquiere un bloqueo de escritura antes de leer posiciones; las carreras pasan sin pérdida ni posiciones repetidas. Ediciones de contenido comprueban revisión tras bloqueo: un único ganador, el otro recibe 409 sin sobrescribir notas. No se atribuye este ensayo a MySQL/TiDB; queda pendiente verificar ese motor.

Se detectó que ErrorState aceptaba llamadas con onRetry pero no mostraba acción: ahora admite ese callback opcional y la prueba de recuperación de carga lo verifica. Se mantienen comportamiento y contenido anteriores sin callback. No se eliminaron tests ni se redujeron controles.

## Archivos de este sprint

- Nuevo backend: `app/Models/Shot.php`, `app/Http/Requests/{ShotRequest,ProductionDayRequest}.php`, `app/Http/Resources/ShotResource.php`, `app/Http/Controllers/Api/{ShotController,ProductionController}.php`, `app/Services/{ProductionService,ProductionDocumentService}.php`.
- Migración `backend/database/migrations/2026_10_30_000002_add_production_planning.php`; vista `backend/resources/views/pdf/production.blade.php`.
- Backend ampliado: Job (relación), Session (metadatos/integridad), SessionRequest/SessionResource, SessionController (transacción y bloqueo), CalendarService/IcsFeedService (fin y límites inclusivos), rutas API. Sin alterar migraciones históricas ni datos existentes.
- Frontend nuevo: `src/api/production.js`, `src/features/production/{ProductionWorkspace.jsx,ProductionForms.jsx,productionFormUtils.js}`. Detalle Job integra sección y carga diferida; ErrorState incorpora reintento; CalendarEvent/CalendarList muestran rango si existe.
- Tests nuevos: `backend/tests/Feature/{ShotListTest,ProductionDayTest,ProductionConcurrencyTest}.php`, fixture `backend/tests/Fixtures/production-worker.php`; `productionFormUtils.test.js`, `ProductionWorkspace.test.jsx`, `CalendarEvent.test.jsx`; `e2e/tests/production.spec.js`. BackupRestoreTest conserva su cobertura y añade recuperación de tomas/jornadas/equipo.
- Docs afectados: README, API, arquitectura, datos, testing, roadmap, runbook y este informe. Sin dependencias, lockfiles, IA, servicios o workflows nuevos.

## Validación y límites de publicación

| Comprobación final | Resultado |
|---|---|
| `pnpm run test` | PASS: 225 PHPUnit, 128 Vitest (33 archivos), 5 tests Node de política de auditoría |
| `pnpm run lint` | PASS: Oxlint y Pint |
| `pnpm --dir frontend run format:check` | PASS: todos los fuentes, sin reducir el gate |
| `pnpm run build` | PASS: PWA 25 entradas, 1469.78 KiB; warning anterior de chunks >500 kB permanece |
| `pnpm run test:e2e` | PASS: 18 recorridos Chromium, incluido producción móvil/PDF; repetición final completa tras integración de calendario |
| `git diff --check` | PASS; avisos de conversión LF/CRLF fuera de frontend, sin errores de whitespace |

Producción se entrega en chunk dinámico de 16.89 kB minificado / 5.09 kB gzip. Bundle principal 705.95 kB / 202.24 kB gzip, frente a 706.02 kB / 202.36 kB de la medición local del Sprint 2 conservada en la sesión. No se han añadido dependencias ni inferencia residente. El shell PWA no ofrece cola de escrituras offline.

[Captura móvil inspeccionada](../screenshots/sprint3-production-mobile.png): Chromium 390×844, datos sintéticos, estados/observaciones y controles táctiles. El recorrido también crea y planifica en escritorio. No acredita Safari ni dispositivos físicos. El PDF sintético descargado se valida en el test y queda en `e2e/test-results` ignorado por Git, sin añadir archivos generados innecesarios a documentación.

En la iteración hubo un fallo de fixture al omitir `access_difficulty` de una localización, corregido según contrato existente; otro arranque frío no alcanzó Dashboard antes del timeout y se repitió sin debilitar el gate. La comprobación de checklist espera la respuesta real antes de afirmar su estado, sin éxito optimista falso. Pint falló una vez al escribir un archivo en Windows y otra comprobación coincidió con un test aún sin formatear: se repitieron tras formatear; el resultado final sí pasa. Estos intentos no se presentan como validaciones exitosas.

Migración ensayada exclusivamente en bases sintéticas de PHPUnit/E2E: up/down sobre sesión previa conserva ID, notas y Job. BackupRestoreTest recupera toma/estado/notas/revisión, sesión/horario/participantes y pivot de equipo en SQLite temporal. MySQL/TiDB, B2 real y tres días UTC siguen **NOT RUN** según [runbook](../backup-recovery.md) y #24. No se han utilizado credenciales ni datos productivos.

CI remoto del código nuevo **NOT RUN**: sin push ni dispatch, el run histórico no acredita este checkout. El warning anterior de chunks grandes y la mitigación de deepmerge del Sprint 1.5 siguen documentados; no se actualizaron dependencias ni se afirma una nueva auditoría externa.

Git mantiene `feat/backup-b2-storage`, HEAD `a46c72c`, los nueve commits locales y todos los cambios previos del Sprint 2. Este sprint permanece sin commit; `test_plan.md` sigue sin seguimiento e intacto. No hay push, PR, merge ni despliegue. #42 y #37 se actualizan con evidencia agregada, sin cerrar trabajo pendiente de integración.

Pendientes de producto: plantillas completas/intercambio entre proyectos (#43), postproducción, estimación automática de cronograma y validación en otros motores/dispositivos. Impresión física y diálogo nativo no verificados por headless. Próximo sprint recomendado: #43 (plantillas y postproducción), manteniendo los gates externos antes de cualquier release.
