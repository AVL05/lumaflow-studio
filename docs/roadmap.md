# Roadmap

Estado tras el hardening V1 (#3–#12 mergeados). Lo implementado ya no aparece como pendiente.

## V1 hardening completado

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
| Runner de backups           | Schedule declarado; sin cron activo en producción (manual hasta entonces)                                      |
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
- Pagos online y conciliacion de facturas.
- Límites y planes solo después de validar el uso real.

## Criterio de producto

LumaFlow es un producto experimental en beta publica. No sustituye a Lightroom ni a otras herramientas de edicion: organiza la operacion que las rodea. La prioridad inmediata es validar el flujo con fotografos reales antes de definir limites, precios o colaboracion avanzada. Sin facturacion ni planes hasta esa validacion.
