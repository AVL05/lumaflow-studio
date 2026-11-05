# Sprint 4 — Plantillas y postproducción (#43)

Continuación del Sprint 3, epic #37. Conservar rama, commits, cambios locales y test_plan.md. Sin producción, push, merge, dependencias o IA.

## Incrementos y contrato

1. Migración aditiva: plantillas de workspace, etapas por Job, recibos únicos de aplicación; ampliar Task/Checklist con etapa/proyecto y asignación/revisión de tareas. Reutilizar autorización, Task, ChecklistService y JobWorkflowService, sin otro pipeline comercial.
2. Ocho etapas iniciales configurables: importación pendiente, selección, edición, revisión interna/cliente, correcciones, exportación, entrega completada. Estado explícito, responsables miembros, fechas manuales, notas y progreso derivado de tareas/checks. Revisión optimista para evitar sobreescrituras; reabrir etapa si se reabre trabajo pendiente.
3. Nueve plantillas profesionales sin fechas ni IDs de recursos. Definición estructurada editable, copia/guardado privado por estudio. Previsualización exacta con fingerprint y confirmación; aplicación transaccional aditiva e idempotente, reutilización por clave de etapa/título de tarea/nombre de checklist. No sobrescribir históricos ni briefings/tomas/jornadas.
4. Panel responsive de carga diferida, resumen de pendientes/entrega/próximo paso, edición de tareas/checklists y plantillas. Conexiones al briefing, producción, equipo y entregas existentes.
5. PHPUnit/Vitest/Playwright, lint, formato y build; migración/restore sintéticos, documentación e issues con evidencia real.

## Riesgos y límites

Las etapas son seguimiento creativo independiente del lifecycle comercial legacy; completarlas no aprueba entregas ni facturas. No procesan archivos. Las referencias y responsables deben pertenecer al proyecto/estudio; participantes descriptivos no otorgan permisos. Guardar/aplicar requiere confirmación humana. Plantillas modificadas no se reaplican destructivamente: crear copia si se necesita otra aplicación. Sin fechas relativas automáticas.

MySQL/TiDB, B2, CI remoto e impresión física siguen pendientes; SQLite no acredita esos gates. Migraciones únicamente en pruebas sintéticas. Sin commits nuevos salvo petición explícita.

## Resultado implementado — cierre local 02/11/2026

Pipeline manual con las ocho etapas solicitadas, nombre/orden configurable, adición y omisión sin borrar histórico. Cada etapa muestra estado, tareas pendientes, responsable del estudio, vencimiento y observaciones; su progreso se calcula con tareas resueltas y controles marcados. Para completar una etapa deben resolverse tareas y checks; reabrir trabajo pendiente reabre una etapa completada. El progreso agregado es de etapas, no aprobación del cliente ni estado comercial.

Panel responsive con próximos pasos, fecha de entrega existente, tareas/checklists y conexiones al briefing, tomas/jornadas, equipo y entregas. Reutiliza TaskForm y los controladores/servicios actuales. Las altas anidadas derivan el estudio del Job autorizado, incluso si el actor tiene otro workspace activo. Fechas/responsables son elecciones explícitas, nunca inferencias desde una plantilla.

Nueve plantillas iniciales: retrato, fotografía de producto, boda, evento, videoclip, vídeo comercial, entrevista, documental y contenido vertical. Editor de formularios (sin JSON expuesto al usuario), copia de iniciales, edición/versionado optimista de propias y reutilización en otros proyectos del mismo estudio. El catálogo propio se pagina a 12; iniciales inmutables. Guardar una plantilla no altera proyectos anteriores.

La previsualización no escribe: lista etapas, tareas, checklists y controles individuales a crear/reutilizar. Confirmación explícita y fingerprint del plan antes de aplicar. Se preservan estados comerciales, IDs y datos existentes. Las tareas coincidentes pueden vincularse a una etapa sin reiniciar estados/fechas; las checklists conservan ubicación y reciben solo controles faltantes, manteniendo los anteriores y sus completados. No se borra contenido para adaptar un proyecto a una plantilla. El recibo único por Job/clave evita repetición accidental, incluso concurrente. Editar una plantilla ya aplicada no reaplica esa misma clave: usar copia/variante o añadir trabajo manualmente.

No se generan fotografías previstas concretas, equipo, participantes, calendarios ni texto de briefing: las plantillas organizan las acciones para preparar esos módulos ya existentes. No hay importación/exportación real de medios, IA, servicios de pago, colas residentes ni dependencias nuevas. Límites técnicos: 32 etapas por Job, 16 etapas por definición y 300 elementos totales por plantilla; aplicar tiene contador separado de 5/minuto. Ver límites completos en [API](../api.md).

## Seguridad, concurrencia y compatibilidad

Autorización por workspace y asociación al Job antes de validar ediciones. Dueños, admins y miembros conservan las capacidades existentes; referencias a otras etapas/proyectos/estudios se rechazan. El trait de integridad también oculta lecturas de filas incoherentes, incluidas checklists de etapa con una sesión de otro proyecto. Las asignaciones solo admiten memberships del estudio. Las propuestas no contienen IDs de personas o inventario.

Aplicación/orden serializados con el bloqueo de proyecto reutilizado de Sprint 3 y recibo con unique en DB. Ediciones de etapa y plantilla requieren revisión; una obsoleta devuelve 409. Tareas admiten revisión por compatibilidad con clientes anteriores; los formularios actuales la envían. Clientes externos que la omitan conservan actualización legacy, sin garantía optimista adicional. Los borradores sobreviven a errores/409 y al cambio de pestañas; descartar o salir requiere confirmación. La actividad usa eventos constantes/IDs, sin textos privados de etapa/plantilla.

Dos procesos reales SQLite/WAL verifican una sola aplicación (8 etapas, 12 tareas, 9 checklists y un recibo) y un ganador de edición de etapa frente a un lector obsoleto. El mismo worker sigue cubriendo carreras de producción. Esto no acredita bloqueos nativos de MySQL/TiDB.

La migración aditiva se ejecutó solo en SQLite sintético; la prueba conserva Task/Checklist previas, sus IDs, notas y estados. El drill de backup recupera plantillas, etapas, asignaciones/fechas/observaciones, tareas, checklists y recibos, además de los datos de Sprints 2/3. No se usaron datos ni credenciales productivas. MySQL/TiDB, B2 y tres días UTC siguen pendientes en #24 y [runbook](../backup-recovery.md); no usar down sobre datos reales para retirar este esquema.

## Archivos afectados en este sprint

- Backend nuevo: `app/Models/{ProjectTemplate,PostproductionStage}.php`, `app/Http/Requests/ProjectWorkflowRequest.php`, `app/Http/Resources/PostproductionStageResource.php`, `app/Http/Controllers/Api/ProjectWorkflowController.php`, `config/project_templates.php`, migración `2026_11_01_000001_add_project_workflows.php`.
- Backend reutilizado/ampliado: Job, Task, Checklist, ChecklistItem y trait BelongsToWorkspace; JobWorkflowService/ChecklistService; TaskController; TaskRequest/ChecklistRequest; TaskResource/ChecklistResource; rutas API. ProductionService expone su bloqueo existente para reutilizarlo. Sin sustitución de workflows comerciales.
- Frontend nuevo: `src/api/workflows.js`, `src/features/workflows/{PostproductionWorkspace.jsx,WorkflowTemplateEditor.jsx,workflowFormUtils.js}`. JobDetailPage integra carga diferida/guardia; TaskForm incorpora responsable opcional y TasksPage conserva/envía revisión.
- Tests: `ProjectWorkflowTest.php` (9), `WorkflowConcurrencyTest.php` (1), ampliación de BackupRestoreTest y worker de producción; `workflowFormUtils.test.js` (3), `PostproductionWorkspace.test.jsx` (4), `e2e/tests/workflows.spec.js` (1 recorrido completo).
- Docs: README, API, arquitectura, datos, despliegue, testing, roadmap, runbook, este informe y captura sintética. No se modifican lockfiles, CI ni AGENTS.md.

## Validación ejecutada

| Comprobación final | Resultado |
|---|---|
| `pnpm run test` | PASS: 235 PHPUnit, 135 Vitest en 35 archivos y 5 tests Node de política de auditoría |
| `pnpm run lint` | PASS: Oxlint y Pint |
| `pnpm --dir frontend run format:check` | PASS: todos los fuentes, sin reducir el gate |
| `pnpm run build` | PASS: PWA 27 entradas (1493.56 KiB); persiste warning de chunks >500 kB |
| `pnpm run test:e2e` | PASS: 19 recorridos Chromium, incluido plantilla personalizada con controles nuevos sin reiniciar los anteriores |
| `git diff --check` | PASS; avisos LF/CRLF fuera de frontend sin errores de whitespace |

Módulo diferido de postproducción: 22.68 kB minificado / 6.57 kB gzip; catálogo consultado al abrir Plantillas. Artefacto principal 562.63 kB / 152.66 kB gzip. La redistribución de chunks compartidos no acredita por sí sola menor carga inicial. Precache total 1493.56 KiB frente a 1469.78 KiB de Sprint 3; sin dependencias nuevas ni métricas de rendimiento de dispositivo inventadas.

[Captura móvil inspeccionada](../screenshots/sprint4-postproduction-mobile.png): Chromium 390×844, datos sintéticos. El recorrido también crea y configura en escritorio, confirma persistencia tras recarga y ausencia de overflow horizontal; no equivale a prueba de Safari o dispositivo físico.

Las iteraciones detectaron y corrigieron dos errores reproducidos: asociación de checklist de etapa a una sesión de otro proyecto, y omisión de controles nuevos al reutilizar una checklist. Sus tests fallaron antes de la corrección. El E2E usa el rol accesible del select al comprobar su estado; no elimina la aserción de transición. Durante una repetición Vitest se produjo un timeout de 5 s en OnboardingPage; se mantuvo el límite, el caso aislado y la suite completa posterior pasan. No se presentan los intentos fallidos como éxito ni se reducen controles.

## Límites y siguiente incremento

Sin guardado offline, versionado histórico completo de definiciones, sincronización retroactiva de plantillas o cronograma automático. Responsables que abandonan el estudio se muestran no disponibles y deben reasignarse explícitamente. Las etapas son seguimiento interno; la revisión/aprobación real del cliente continúa en entregas externas. Impresión física, MySQL/TiDB, B2 y CI remoto del código nuevo siguen NOT RUN. No se ha ejecutado una nueva auditoría de dependencias: se mantienen los locks y la mitigación de Sprint 1.5.

Git conserva `feat/backup-b2-storage`, HEAD `a46c72c`, nueve commits locales y cambios de Sprints 2/3. Este sprint permanece sin commit; `test_plan.md` sin seguimiento e intacto. Sin push, PR, merge o despliegue. #43 y #37 se actualizan sin cerrar trabajo pendiente de revisión/integración.

Siguiente sprint recomendado: #44, revisiones numeradas y confirmación de recepción de entregas externas. Mantener los gates externos como requisito de publicación; este resultado local no equivale a producción aprobada.
