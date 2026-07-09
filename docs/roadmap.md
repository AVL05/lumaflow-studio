# Roadmap

Estado a fecha de la release v1 (fase 10). Lo que sigue no esta implementado; lo que esta implementado no aparece aqui.

## Deuda conocida

| Tema | Detalle |
|---|---|
| Persistencia de chat WebGPU | La inferencia principal corre en navegador; falta persistir conversaciones WebGPU en backend o IndexedDB |
| Exportacion PDF | `ExportService` acepta `csv` y `json`. El contrato esta preparado; el formato `pdf` se rechaza en validacion |
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
- Galeria publica por entrega, con enlace firmado y caducidad.

**Largo plazo**

- Multi-usuario por estudio: roles, permisos y recursos compartidos. Hoy el aislamiento es estrictamente por `user_id`.
- Facturacion.

## Fuera de alcance

Este proyecto es una release privada de portfolio. No busca ser un SaaS multi-tenant ni sustituir a Lightroom. Las decisiones de arquitectura estan tomadas para demostrar criterio tecnico sobre un dominio real, no para escalar a miles de usuarios.
