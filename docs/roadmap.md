# Roadmap

Estado posterior a la consolidacion de RAW Manager en LumaFlow Studio. Lo que sigue no esta implementado; lo que esta implementado no aparece aqui.

## Deuda conocida

| Tema                        | Detalle                                                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Persistencia de chat WebGPU | La inferencia principal corre en navegador; falta persistir conversaciones WebGPU en backend o IndexedDB      |
| Exportacion general         | Presupuestos y facturas tienen PDF. `ExportService` mantiene CSV/JSON para listados y analitica               |
| Analitica                   | `/api/analytics` hace varias consultas por carga, sin cache. Aceptable durante la beta con volumen controlado |
| Tests frontend              | Tests sobre hooks, utilidades del calendario y componentes criticos. Sin cobertura de paginas completas       |

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

## Criterio de producto

LumaFlow es un producto experimental en beta publica. No sustituye a Lightroom ni a otras herramientas de edicion: organiza la operacion que las rodea. La prioridad inmediata es validar el flujo con fotografos reales antes de definir limites, precios o colaboracion multiusuario.

El aislamiento actual es por usuario. Antes de escalar el servicio deben completarse roles por estudio, observabilidad, copias de seguridad, politicas de retencion y una estrategia de capacidad verificable.
