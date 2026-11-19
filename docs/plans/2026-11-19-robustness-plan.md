# Plan de robustez — 19/11/2026

Qué falta para que LumaFlow sea un sistema robusto en producción, priorizado. Cada punto parte de una evidencia del repositorio o de producción y tiene su issue con alcance y criterios de aceptación. Este documento no implementa nada.

Contexto: la API productiva no responde desde el 03/11/2026 y no hay copia de seguridad recuperable activa. Ver el [informe de consolidación](2026-11-06-consolidation-release-assessment.md).

## P0 — Producción disponible y recuperable

| #   | Issue                                                                                                 | Evidencia                                                                                |
| --- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 1   | [#51 Restaurar la API productiva](https://github.com/AVL05/lumaflow-studio/issues/51)                 | `/api/health` y `/up` sin respuesta desde el 03/11; redeploy de Render en `failure`      |
| 2   | [#52 Servidor PHP de producción](https://github.com/AVL05/lumaflow-studio/issues/52)                  | `Dockerfile` y `render.yaml` usan `php artisan serve`; plan `free` con arranques en frío |
| 3   | [#53 Backups externos verificados y drill](https://github.com/AVL05/lumaflow-studio/issues/53)        | Scheduler sin runner en Render; `production-backup.yml` desactivado                      |
| 4   | [#54 Migraciones en MySQL en CI y ensayo en TiDB](https://github.com/AVL05/lumaflow-studio/issues/54) | CI solo SQLite; `deliveries.client_id` con `->change()` y backfill sin ensayar           |
| 5   | [#55 Staging de API y Vercel fijado a `main`](https://github.com/AVL05/lumaflow-studio/issues/55)     | Merge a `main` despliega y migra; Vercel publicó una rama no fusionada                   |

## P1 — Seguridad

| #   | Issue                                                                                            | Evidencia                                                               |
| --- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| 6   | [#56 Cabeceras de seguridad](https://github.com/AVL05/lumaflow-studio/issues/56)                 | Sin CSP, HSTS, frame-ancestors ni nosniff; token en `localStorage`      |
| 7   | [#57 Caducidad de tokens Sanctum](https://github.com/AVL05/lumaflow-studio/issues/57)            | Sin `config/sanctum.php`: los tokens no caducan                         |
| 8   | [#58 PRs automáticos de dependencias](https://github.com/AVL05/lumaflow-studio/issues/58)        | Sin Dependabot/Renovate; parches aplicados a mano                       |
| 9   | [#59 Límites de abuso en endpoints públicos](https://github.com/AVL05/lumaflow-studio/issues/59) | Reservas y portales sin autenticación                                   |
| 10  | [#60 2FA opcional](https://github.com/AVL05/lumaflow-studio/issues/60)                           | Cuentas con datos personales de clientes protegidas solo por contraseña |

## P2 — Observabilidad

| #   | Issue                                                                                       | Evidencia                                                         |
| --- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 11  | [#61 Separar liveness y readiness](https://github.com/AVL05/lumaflow-studio/issues/61)      | Render usa `/api/health`, que da 503 si cae `s3` aunque no se use |
| 12  | [#62 Sentry con source maps y alertas](https://github.com/AVL05/lumaflow-studio/issues/62)  | Subida de source maps sin configurar; sin reglas de alerta        |
| 13  | [#63 Monitor externo de disponibilidad](https://github.com/AVL05/lumaflow-studio/issues/63) | La caída del 03/11 no generó ningún aviso                         |

## P3 — Resiliencia ante terceros y datos

| #   | Issue                                                                                     | Evidencia                                                |
| --- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| 14  | [#64 Proveedor de mapas configurable](https://github.com/AVL05/lumaflow-studio/issues/64) | CARTO pasó a exigir clave y rompió todos los mapas       |
| 15  | [#65 Versionar imágenes de producto](https://github.com/AVL05/lumaflow-studio/issues/65)  | PWA con `CacheFirst` 30 días sobre `/product/*`          |
| 16  | [#66 Correo fuera de la petición](https://github.com/AVL05/lumaflow-studio/issues/66)     | `DeliveryReadyMail` síncrono; cola `database` sin worker |
| 17  | [#67 Exportación y borrado de cuenta](https://github.com/AVL05/lumaflow-studio/issues/67) | Pendiente en el roadmap; requiere revisión legal         |

## P4 — Calidad y rendimiento

| #   | Issue                                                                                     | Evidencia                                         |
| --- | ----------------------------------------------------------------------------------------- | ------------------------------------------------- |
| 18  | [#68 Chunks y presupuesto Lighthouse](https://github.com/AVL05/lumaflow-studio/issues/68) | `index` 602 kB y `AnalyticsPage` 428 kB           |
| 19  | [#69 Accesibilidad automatizada](https://github.com/AVL05/lumaflow-studio/issues/69)      | Sin comprobaciones axe en E2E                     |
| 20  | [#70 Checklist de release](https://github.com/AVL05/lumaflow-studio/issues/70)            | Procedimiento solo en el informe de consolidación |

## Orden recomendado

1 → 3 → 4 → 2 → 6–7 → 11–13 → resto.

No conviene fusionar en `main` hasta cerrar #53 (copia de seguridad) y #54 (migraciones ensayadas), porque el merge despliega y migra producción automáticamente. #52, #55, #60 y #67 necesitan aprobación expresa antes de implementarse (despliegue, producto o revisión legal, según AGENTS.md §15).
