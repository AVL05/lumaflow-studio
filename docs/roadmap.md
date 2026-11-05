# Roadmap

Estado tras el hardening V1 (#3–#12 mergeados). Lo implementado ya no aparece como pendiente.

## SEO/GEO P0/P1 — implementado localmente, con verificaciones externas pendientes

Metadatos por ruta, allowlist comercial, robots/sitemap generados, exclusión de superficies operativas, headers API, copy coherente y HTML público prerenderizado/hidratado sin cambiar React/Vite + Laravel. El CRM conserva su SPA; no se añaden pagos, alojamiento de originales, blog ni dependencias. Se mantienen estilos y animaciones.

Ver [auditoría y criterios de aceptación](SEO_GEO_AUDIT.md#13-implementación-local-p0p1). Los 500 de portales productivos, rendimiento móvil pendiente, Vercel/Nginx real, actualización desde PWA antigua, Search Console y métricas de campo no se declaran resueltos por la validación local. Sin commit, push ni despliegue.

## Evolución 2.0 — planificada

La decisión de producto es mantener LumaFlow gratuito y open source, sin suscripciones obligatorias, funciones premium ni límites por donación. La ampliación audiovisual se realizará sobre React + Laravel, con entregas externas e IA opcional.

La [auditoría de Fase 0](plans/2026-10-29-lumaflow-2.0-audit.md), el [plan por fases](plans/2026-10-29-lumaflow-2.0-plan.md), el [diseño de apoyo](plans/2026-10-29-lumaflow-2.0-support.md) y la [validación](plans/2026-10-29-lumaflow-2.0-validation.md) documentan el punto de partida y el backlog #36–#49. Revisiones numeradas y página de apoyo están implementadas localmente; las donaciones reales siguen desactivadas. Los sprints locales no equivalen a una release.

### Sprint 2 — implementado y validado localmente, sin publicar

[#40](https://github.com/AVL05/lumaflow-studio/issues/40) y [#41](https://github.com/AVL05/lumaflow-studio/issues/41): proyectos fotográficos, audiovisuales y personales sin cliente obligatorio; participantes descriptivos, fechas, localizaciones, equipo y enlaces; cuatro fases derivadas del estado; listado paginado y detalle responsive con gestión comercial accesible. Briefing manual con ocho campos, validación, guardado explícito, conflicto de revisión y protección de borradores. IDs, endpoints y datos históricos se conservan mediante migración aditiva.

Ver [implementación y evidencia](plans/2026-10-30-sprint2-creative-workspace.md). No equivale a release: integración, migración MySQL/TiDB, recuperación B2 y CI remoto siguen pendientes.

### Sprint 3 — implementación local de tomas y producción

[#42](https://github.com/AVL05/lumaflow-studio/issues/42): CRUD, duplicación, orden transaccional y estados de tomas; listas fotográficas sin escena obligatoria. Las jornadas reutilizan Session, calendario y checklists, con horarios, participantes, incidencias y tomas asignadas. Modo rodaje móvil, observaciones con revisión y PDF/impresión mediante Dompdf. Carga frontend bajo demanda, sin medios ni IA.

Ver [informe y límites](plans/2026-10-30-sprint3-production.md). Sin publicación, integración ni aprobación productiva. La duplicación reutiliza tomas dentro del proyecto; las plantillas organizativas se añaden en el Sprint 4, sin copiar tomas creativas entre proyectos.

### Sprint 4 — plantillas y postproducción implementadas localmente

[#43](https://github.com/AVL05/lumaflow-studio/issues/43): ocho etapas configurables, tareas/checklists reutilizadas, responsables del estudio, fechas/observaciones manuales y progreso. Nueve plantillas iniciales (retrato, producto, boda, evento, videoclip, comercial, entrevista, documental, vertical), duplicación/edición y reutilización de plantillas propias. Previsualización confirmada y aplicación aditiva idempotente; no inventa fechas, equipo o participantes ni altera estados comerciales.

Ver [evidencia y límites](plans/2026-11-01-sprint4-workflows.md). Pendiente de integración y verificaciones externas MySQL/TiDB, B2, CI remoto e impresión física. #44 continúa en el Sprint 5.

### Sprint 5 — revisiones y entregas implementadas localmente

[#44](https://github.com/AVL05/lumaflow-studio/issues/44): enlaces HTTPS nuevos, snapshots numerados, historial paginado, recepción explícita, revisión, cambios, comentarios y aprobación. Entregas personales sin cliente, integración con etapas existentes y control de versión/UUID. Portal con expiración, revocación y rotación, sin atribuir control sobre los permisos del proveedor. Se preservan IDs, estados comerciales y enlaces históricos; borradores internos nunca se publican en el historial.

Ver [informe y verificaciones](plans/2026-11-02-sprint5-delivery-revisions.md). Sin push, merge ni despliegue. Los avisos de build se tratan en Sprint 5.5; la release y la activación de donaciones siguen sujetas a sus validaciones externas.

### Sprint 5.5 — dependencias corregidas o mitigadas localmente

[#49](https://github.com/AVL05/lumaflow-studio/issues/49): glob 14.0.3 y minimatch 11.0.4 mediante overrides transitivos probados, sin actualizar Vite/Workbox/EJS/Jake ni retirar herramientas activas. Deepmerge conserva aviso bajo nativo, pero incorpora parche local reproducible y pruebas de regresión; CI exige hashes del parche y del código instalado para permitir esa única excepción visible. Se elimina el override de brace-expansion 2, cuya rama ya no existe en el grafo.

La PWA compilada instala y recarga offline sin cachear el bundle de IA ni respuestas API. Informe: [Sprint 5.5](plans/2026-11-02-sprint55-dependency-security.md). Se puede iniciar desarrollo local de #45 sin IA ni pagos propios; #49 sigue abierto por riesgo residual upstream/revisión e integración. No equivale a CI remoto ni aprobación de despliegue. MySQL/TiDB, B2, Docker completo e impresión física no se declaran verificados.

### Sprint 6 — apoyo voluntario implementado localmente, sin activar

[#45](https://github.com/AVL05/lumaflow-studio/issues/45): /support pública y diferida, footer/configuración/README, proveedores HTTPS configurables e independientes, validación estricta y mensajes de gratuidad permanente. Sin pagos dentro del producto, SDK/iframes, tracking de donantes, datos nuevos, IA o dependencias. Se corrige únicamente el copy de planes futuros contradictorio en marketing; no cambian funciones de proyectos/producción/entregas.

Ambas variables siguen vacías: no se han recibido perfiles verificados y no se crea FUNDING.yml. Ver [guía de configuración y revisión pendiente](support.md) e [informe](plans/2026-11-02-sprint6-voluntary-support.md). Activación condicionada a titularidad/destinos reales, Vercel Hobby y revisión legal/fiscal española. Sin commit, push, merge ni despliegue. La mitigación de deepmerge de Sprint 5.5 permanece intacta; el aviso bajo sigue visible. IA especializada (#46) continúa pendiente y no se inicia aquí.

## V1 hardening completado

Sprint 1 de seguridad 2.0: [implementación y validación local](plans/2026-10-29-sprint1-security-stability.md), [matriz de dependencias](plans/2026-10-29-sprint1-dependencies.md). [Sprint 1.5](plans/2026-10-29-sprint15-integration-stability.md) integra commits locales y corrige el formato Windows mediante LF. Formato, lint, tests y build pasan localmente; CI incorpora auditorías con una excepción visible y acotada de build. #39/#49/#24 siguen abiertos, sin push ni release. La recuperación externa y el CI de los nuevos commits siguen pendientes.

- Red de seguridad E2E (Playwright, 12 recorridos, CI).
- Workspaces con ownership, memberships, roles e invitaciones.
- Onboarding con primer valor guiado y checklist real.
- Contratos con lifecycle, snapshot y portal de aceptación.
- Caché de analítica con invalidación.
- Historial IA local en IndexedDB.
- Observabilidad opcional (Sentry + request IDs).
- Backup/restore verificable con runbook.

## Deuda conocida (no bloqueante)

| Tema                    | Detalle                                                                                         |
| ----------------------- | ----------------------------------------------------------------------------------------------- |
| Exportacion general     | Presupuestos y facturas tienen PDF. `ExportService` mantiene CSV/JSON para listados y analitica |
| Runner de backups       | GitHub Actions preparado; activación, destino privado duradero y 3 días reales pendientes (#24) |
| Source maps Sentry      | Subida no configurada; pendiente de secreto CI                                                  |
| Onboarding de invitados | Los invitados configuran estudio personal; flujo invited-first pendiente                        |

## Post-V1 / feedback-driven

**Corto plazo (solo con demanda real)**

- Kanban de tareas con drag & drop entre columnas de estado, reutilizando `DayDropZone`.
- Exportacion PDF de planes de sesion, conversaciones de IA e informes de analitica.
- Políticas de caducidad coordinadas entre portales; la entrega ya tiene caducidad, revocación y rotación locales en Sprint 5.

**Medio/largo plazo**

- Permisos granulares, equipos y SSO (la colaboración básica ya existe).
- Transferencia de ownership y borrado de cuenta endurecido.
- Sincronización multi-dispositivo del historial IA.
- Apoyo voluntario mediante enlaces externos verificados, sin pasarela propia.

## Criterio de producto

LumaFlow es un producto experimental en beta publica. No sustituye a Lightroom ni a otras herramientas de edicion: organiza el trabajo creativo que las rodea. La prioridad es validar los flujos con usuarios reales y ampliar lo que resulte útil sin introducir planes de pago. Presupuestos y facturas del estudio ya existen y se conservan; no son cobros por utilizar LumaFlow.
