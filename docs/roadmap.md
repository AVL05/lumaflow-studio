# Roadmap

Estado a fecha de la release v1 (fase 10). Lo que sigue no esta implementado; lo que esta implementado no aparece aqui.

## Deuda conocida

| Tema | Detalle |
|---|---|
| Persistencia de chat WebGPU | La inferencia principal corre en navegador; falta persistir conversaciones WebGPU en backend o IndexedDB |
| Analisis de fotos | Razona sobre EXIF y metadata, no sobre pixeles. Sin modelo de vision |
| Recordatorios | Se muestran en calendario y dashboard, pero no se envian. No hay colas ni jobs |
| Exportacion PDF | `ExportService` acepta `csv` y `json`. El contrato esta preparado; el formato `pdf` se rechaza en validacion |
| `photo_comparisons` | Tabla y modelo Eloquent existen. Falta la UI before/after |
| Analitica | `/api/analytics` hace ~12 consultas por carga, sin cache. Aceptable con volumenes de portfolio |
| Biblioteca | La galeria no virtualiza: con miles de fotos habria que paginar mas fino o virtualizar la lista |
| Tests frontend | 33 tests sobre hooks, utilidades del calendario y componentes criticos. Sin cobertura de paginas completas |

## Proximas fases

**Corto plazo**

- Persistencia de conversaciones WebGPU y exportacion desde historial local.
- Kanban de tareas con drag & drop entre columnas de estado, reutilizando `DayDropZone`.
- UI de comparacion before/after sobre `photo_comparisons`.
- Cache de `/api/analytics` con invalidacion por mutacion.

**Medio plazo**

- Envio real de recordatorios: cola + notificaciones push o email.
- Exportacion PDF de planes de sesion, conversaciones de IA e informes de analitica.
- Contratos y aprobacion formal de entregas por parte del cliente.
- Galeria publica por entrega, con enlace firmado y caducidad.

**Largo plazo**

- Modelo de vision local para analisis real de pixeles.
- Busqueda semantica sobre fotos usando embeddings locales.
- Multi-usuario por estudio: roles, permisos y recursos compartidos. Hoy el aislamiento es estrictamente por `user_id`.
- Facturacion.

## Fuera de alcance

Este proyecto es una release privada de portfolio. No busca ser un SaaS multi-tenant ni sustituir a Lightroom. Las decisiones de arquitectura estan tomadas para demostrar criterio tecnico sobre un dominio real, no para escalar a miles de usuarios.
