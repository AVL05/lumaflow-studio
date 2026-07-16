# Roadmap

Estado posterior a la consolidacion de RAW Manager en LumaFlow Studio. Lo que sigue no esta implementado; lo que esta implementado no aparece aqui.

## Deuda conocida

| Tema | Detalle |
|---|---|
| Persistencia de chat WebGPU | La inferencia principal corre en navegador; falta persistir conversaciones WebGPU en backend o IndexedDB |
| Exportacion general | Presupuestos y facturas tienen PDF. `ExportService` mantiene CSV/JSON para listados y analitica |
| Analitica | `/api/analytics` hace varias consultas por carga, sin cache. Aceptable con volumenes de portfolio |
| Tests frontend | Tests sobre hooks, utilidades del calendario y componentes criticos. Sin cobertura de paginas completas |

## Proximas fases

**Corto plazo**

- Persistencia de conversaciones WebGPU y exportacion desde historial local.
- Kanban de tareas con drag & drop entre columnas de estado, reutilizando `DayDropZone`.
- Cache de `/api/analytics` con invalidacion por mutacion.

**Medio plazo**

- Exportacion PDF de planes de sesion, conversaciones de IA e informes de analitica.
- Contratos y aprobacion formal de entregas por parte del cliente.
- Caducidad configurable de tokens del portal y descargas originales en lote.

**Largo plazo**

- Multi-usuario por estudio: roles, permisos y recursos compartidos. Hoy el aislamiento es estrictamente por `user_id`.
- Pagos online y conciliacion de facturas.

## Fuera de alcance

Este proyecto es una release privada de portfolio. No busca ser un SaaS multi-tenant ni sustituir a Lightroom. Las decisiones de arquitectura estan tomadas para demostrar criterio tecnico sobre un dominio real, no para escalar a miles de usuarios.
