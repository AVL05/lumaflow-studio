# Roadmap

Estado tras el hardening V1 (#3–#12 mergeados). Lo implementado ya no aparece como pendiente.

## Evolución 2.0 — planificada

La decisión de producto es mantener LumaFlow gratuito y open source, sin suscripciones obligatorias, funciones premium ni límites por donación. La ampliación audiovisual se realizará sobre React + Laravel, con entregas externas e IA opcional.

La [auditoría de Fase 0](plans/2026-10-29-lumaflow-2.0-audit.md), el [plan por fases](plans/2026-10-29-lumaflow-2.0-plan.md), el [diseño de apoyo](plans/2026-10-29-lumaflow-2.0-support.md) y la [validación](plans/2026-10-29-lumaflow-2.0-validation.md) documentan el estado actual y el backlog #36–#49. No considerar implementados briefings, shot lists, rodaje, revisiones numeradas ni donaciones por aparecer en el plan.

## V1 hardening completado

Sprint 1 de seguridad 2.0: [implementación y validación local](plans/2026-10-29-sprint1-security-stability.md), [matriz de dependencias](plans/2026-10-29-sprint1-dependencies.md). Cambios sin publicar; #39/#49/#24 siguen abiertos. No equivale a release ni recuperación productiva verificada. Prettier global continúa bloqueando CI y la recuperación externa necesita ensayo autorizado.

- Red de seguridad E2E (Playwright, 12 recorridos, CI).
- Workspaces con ownership, memberships, roles e invitaciones.
- Onboarding con primer valor guiado y checklist real.
- Contratos con lifecycle, snapshot y portal de aceptación.
- Caché de analítica con invalidación.
- Historial IA local en IndexedDB.
- Observabilidad opcional (Sentry + request IDs).
- Backup/restore verificable con runbook.

## Deuda conocida (no bloqueante)

| Tema                        | Detalle                                                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Exportacion general         | Presupuestos y facturas tienen PDF. `ExportService` mantiene CSV/JSON para listados y analitica               |
| Runner de backups           | GitHub Actions preparado; activación, destino privado duradero y 3 días reales pendientes (#24)                 |
| Source maps Sentry          | Subida no configurada; pendiente de secreto CI                                                                |
| Onboarding de invitados     | Los invitados configuran estudio personal; flujo invited-first pendiente                                       |

## Post-V1 / feedback-driven

**Corto plazo (solo con demanda real)**

- Kanban de tareas con drag & drop entre columnas de estado, reutilizando `DayDropZone`.
- Exportacion PDF de planes de sesion, conversaciones de IA e informes de analitica.
- Caducidad configurable de tokens del portal.

**Medio/largo plazo**

- Permisos granulares, equipos y SSO (la colaboración básica ya existe).
- Transferencia de ownership y borrado de cuenta endurecido.
- Sincronización multi-dispositivo del historial IA.
- Apoyo voluntario mediante enlaces externos verificados, sin pasarela propia.

## Criterio de producto

LumaFlow es un producto experimental en beta publica. No sustituye a Lightroom ni a otras herramientas de edicion: organiza el trabajo creativo que las rodea. La prioridad es validar los flujos con usuarios reales y ampliar lo que resulte útil sin introducir planes de pago. Presupuestos y facturas del estudio ya existen y se conservan; no son cobros por utilizar LumaFlow.
