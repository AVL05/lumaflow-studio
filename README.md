<div align="center">

<img src="frontend/public/logo+texto.png" alt="LumaFlow Studio" width="420" />

# LumaFlow Studio

**Gestiona todo tu estudio fotográfico desde un único lugar.**

Clientes, trabajos, reservas, presupuestos, facturas, sesiones y entregas conectados en un mismo flujo.

**Beta pública gratuita · Sin tarjeta**

[Probar LumaFlow](https://lumaflow.aleviclop.dev/register) · [Explorar demo](https://lumaflow.aleviclop.dev/demo) · [Casos de uso](https://lumaflow.aleviclop.dev/features) · [Precio](https://lumaflow.aleviclop.dev/pricing) · [Privacidad](https://lumaflow.aleviclop.dev/privacy) · [Ver documentación](docs/) · [Estado del servicio](https://lumaflow-api.aleviclop.dev/api/health)

[![Laravel](https://img.shields.io/badge/Laravel-13-FF2D20)](https://laravel.com)
[![React](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev)
[![MySQL](https://img.shields.io/badge/MySQL-compatible-4479A1)](https://www.mysql.com)
[![WebGPU](https://img.shields.io/badge/IA-WebGPU_local-111827)](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API)
[![License](https://img.shields.io/badge/License-MIT-d4b06a)](LICENSE)

</div>

---

## Qué es LumaFlow

LumaFlow Studio es una plataforma de gestión para fotógrafos y pequeños estudios. Reúne la operación diaria y la relación con el cliente sin obligarte a mantener calendarios, hojas de cálculo, documentos y galerías desconectados.

El producto está en **beta pública**, es gratuito y open source con licencia MIT. No hay suscripciones obligatorias, funciones premium ni límites ligados a donaciones. El objetivo es simplificar el trabajo creativo conservando la arquitectura y los datos existentes.

La evolución para videógrafos, filmmakers y proyectos personales sigue el [plan LumaFlow 2.0](docs/plans/2026-10-29-lumaflow-2.0-plan.md). El [Sprint 2](docs/plans/2026-10-30-sprint2-creative-workspace.md) implementa localmente proyectos fotográficos, audiovisuales y personales, organización y briefing manual. El [Sprint 3](docs/plans/2026-10-30-sprint3-production.md) añade tomas, jornadas, seguimiento móvil y PDF/impresión. El [Sprint 4](docs/plans/2026-11-01-sprint4-workflows.md) incorpora nueve plantillas profesionales editables/reutilizables y postproducción con tareas, responsables, fechas y checklists. Estos cambios aún no están publicados ni desplegados. Organizan el trabajo sin importar ni procesar archivos audiovisuales.

## Pruébalo sin registrarte

La [demo interactiva](https://lumaflow.aleviclop.dev/demo) utiliza datos ficticios y no persiste cambios. Permite recorrer una jornada de trabajo, consultar clientes, explorar la agenda y consultar una entrega por enlace externo.

| Resumen                     | Agenda                      | Cliente y entrega                     |
| --------------------------- | --------------------------- | ------------------------------------- |
| Métricas y trabajo en curso | Sesiones, tareas y entregas | Actividad comercial y entrega externa |

No consulta información de producción ni comparte datos entre usuarios.

## Un flujo completo para el estudio

1. **Recibe reservas.** Centraliza solicitudes y datos iniciales del cliente.
2. **Controla el trabajo.** Reúne cliente, presupuesto, contrato, pago, sesión, tareas, equipo, galería y entrega en un único proyecto.
3. **Gestiona el negocio.** Crea presupuestos, controla estados y genera facturas PDF.
4. **Produce y da seguimiento.** Consulta agenda, notificaciones, progreso y actividad.
5. **Entrega.** Comparte un enlace externo mediante el portal de LumaFlow y recibe aprobación o una solicitud general de cambios. El acceso al material depende de los permisos del proveedor original. El [Sprint 5, implementado localmente](docs/plans/2026-11-02-sprint5-delivery-revisions.md), incorpora versiones numeradas, historial, recepción explícita, comentarios y revocación/rotación del portal, también sin cliente obligatorio; todavía no está publicado ni desplegado.
6. **Analiza.** Revisa ingresos, carga de trabajo y evolución del estudio con datos reales.

## Capturas de referencia

Estas capturas corresponden a una versión anterior de la interfaz; no acreditan las funcionalidades 2.0 planificadas. La imagen histórica de entrega conserva elementos de galería que ya no forman parte del flujo actual de enlaces externos.

| Dashboard                                                | Calendario                                               | Analítica                                                |
| -------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------- |
| ![Dashboard de LumaFlow](docs/screenshots/dashboard.png) | ![Calendario de LumaFlow](docs/screenshots/calendar.png) | ![Analítica de LumaFlow](docs/screenshots/analytics.png) |

| Presupuestos                                             | Facturas                                               | Galería del cliente                                          |
| -------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| ![Presupuestos en LumaFlow](docs/screenshots/quotes.png) | ![Facturas en LumaFlow](docs/screenshots/invoices.png) | ![Galería privada en LumaFlow](docs/screenshots/gallery.png) |

| Localizaciones                                                | Presets                                              | IA local                                                          |
| ------------------------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------- |
| ![Localizaciones en LumaFlow](docs/screenshots/locations.png) | ![Presets en LumaFlow](docs/screenshots/presets.png) | ![Asistente local de LumaFlow](docs/screenshots/ai-assistant.png) |

## Funcionalidades actuales

| Área                        | Funcionalidades                                                               |
| --------------------------- | ----------------------------------------------------------------------------- |
| **Dashboard**               | Agenda, tareas pendientes, progreso mensual, actividad y métricas del estudio |
| **Calendario**              | Mes, semana, día, agenda y lista; reprogramación mediante drag and drop       |
| **Trabajos**                | Pipeline, workflows por especialidad, contrato, pagos y timeline unificado    |
| **Sesiones**                | Cliente, tipo, estado, localización, checklist y timeline                     |
| **Tareas y checklists**     | Prioridades, vencimientos, acciones masivas y plantillas reutilizables        |
| **Clientes**                | CRM ligero conectado a trabajos, presupuestos, facturas y entregas            |
| **Reservas**                | Solicitudes públicas vinculadas a disponibilidad y seguimiento interno        |
| **Presupuestos y facturas** | Conceptos, IVA, estados, numeración por estudio y PDF                         |
| **Contratos**               | Acuerdo con cliente y trabajo, lifecycle con snapshot, portal de revisión y aceptación del cliente |
| **Colaboración**            | Estudios multiusuario con roles (owner/admin/member) e invitaciones mediante enlace compartido manualmente |
| **Entregas**                | Enlaces externos con portal por token, contraseña externa, caducidad del portal y aprobación; revisiones 2.0 disponibles localmente, sin desplegar |
| **Equipo y presets**        | Inventario y ajustes de cámara reutilizables                                  |
| **Localizaciones**          | Mapa, acceso, permisos, coste, clima y equipo recomendado                     |
| **Analítica**               | KPIs y gráficas calculados sobre la actividad real                            |
| **IA local**                | Chat contextual, planes de sesión y recomendación de equipo                   |
| **Historial IA**            | Conversaciones WebGPU persistidas en IndexedDB del navegador                  |
| **PWA**                     | Aplicación instalable con shell offline                                       |

## Operación y resiliencia

- **Aislamiento por workspace.** Cada consulta parte de `accessibleBy()` (memberships owner/admin/member); `user_id` se conserva como creador. Recursos ajenos responden 404.
- **Observabilidad opcional.** Sentry desactivado sin DSN; request ID (`X-Request-ID`) correlaciona frontend y backend con redacción de datos sensibles.
- **Backup y recuperación.** Comandos `data:backup` / `data:restore` con checksum, retención y drill verificado. Ver [docs/backup-recovery.md](docs/backup-recovery.md).

## Privacidad e IA local

La experiencia principal de inteligencia artificial se ejecuta en el navegador mediante WebGPU y WebLLM:

- no requiere claves de proveedores externos;
- el usuario instala y elige un modelo compatible;
- los datos usados como contexto pertenecen a su propia cuenta;
- la ausencia de IA no bloquea el resto de la aplicación;
- Ollama queda disponible como compatibilidad local avanzada del backend.

Consulta [docs/ai.md](docs/ai.md) para conocer modelos, requisitos y limitaciones.

## Estado de la beta

La beta actual es gratuita y no solicita tarjeta. Esto significa:

- acceso a todos los módulos disponibles hoy;
- demo pública sin registro;
- evolución frecuente del producto;
- posibilidad de cambios de interfaz y contrato durante la beta;
- sin compromiso sobre precios o límites futuros hasta que se publiquen expresamente.

LumaFlow ya funciona como producto desplegado, pero sigue siendo experimental. No debe considerarse todavía un servicio crítico ni utilizarse como única copia de documentos o fotografías.

## Arquitectura

El repositorio contiene dos aplicaciones independientes que se comunican por HTTP:

```text
frontend/src/api/*.js  ->  hooks  ->  features  ->  pages
                              |
                              v
routes/api.php  ->  Controller  ->  FormRequest  ->  Service
                                              |
                                              v
                                      Model + Resource
```

Principios principales:

- **Aislamiento por workspace.** Cada consulta parte de `accessibleBy()` sobre las memberships del usuario.
- **404 para recursos ajenos.** No se confirma la existencia de información de otra cuenta.
- **Controladores delgados.** La lógica de dominio vive en servicios.
- **API y SPA separadas.** El frontend utiliza tokens Bearer de Sanctum.
- **IA bajo demanda.** WebLLM no penaliza la carga inicial de la aplicación.

Más detalle en [docs/architecture.md](docs/architecture.md).

## Stack

| Capa            | Tecnología                                                                |
| --------------- | ------------------------------------------------------------------------- |
| Frontend        | React 19, Vite, React Router 7, Tailwind CSS 4, Recharts, Leaflet, PWA    |
| Backend         | Laravel 13, PHP 8.3+, Sanctum, Dompdf                                     |
| Datos           | MySQL compatible, Eloquent                                                |
| IA              | WebGPU, WebLLM y Ollama opcional                                          |
| Calidad         | PHPUnit, Pint, Vitest, Testing Library, Playwright, oxlint y Prettier     |
| Infraestructura | Vercel, Render, TiDB Cloud, almacenamiento S3 compatible y Docker Compose |

## Desarrollo local

Requisitos: PHP 8.3+, Composer, Node 22+ y pnpm 10+.

```bash
git clone https://github.com/AVL05/lumaflow-studio.git
cd lumaflow-studio
pnpm run start
```

`pnpm run start` prepara SQLite, instala dependencias cuando hace falta y levanta:

| Servicio             | URL                          |
| -------------------- | ---------------------------- |
| Landing y aplicación | `http://localhost:5173`      |
| Demo interactiva     | `http://localhost:5173/demo` |
| API Laravel          | `http://localhost:8000/api`  |

React, JavaScript y CSS utilizan HMR. Los cambios PHP se aplican en la siguiente petición. No necesitas Docker ni MySQL para empezar.

El alta local sigue `crear cuenta -> verificar email -> configurar estudio -> elegir primer paso -> dashboard`. Tras el onboarding puedes crear el primer trabajo, cargar un workspace ficticio o importar clientes mediante CSV. Como `pnpm run start` usa correo por log, copia el enlace de verificacion desde `backend/storage/logs/laravel.log`.

El dashboard incorpora un checklist de activacion 0/5 basado en datos reales: estudio configurado, primer cliente, primer trabajo, reservas activadas y primera sesion. LumaFlow solo muestra el estado **Estudio operativo** cuando existe una entrega completada o se activa un enlace publico de reservas; los datos de ejemplo nunca completan ese hito.

Dentro del producto, la navegación prioriza Inicio, Trabajos, Calendario y Clientes. El botón global `+ Crear` abre clientes, trabajos, sesiones, presupuestos, facturas, tareas o entregas desde cualquier módulo. `Ctrl/Cmd + K` abre búsqueda y comandos; `Ctrl/Cmd + L` abre Luma con el contexto de la pantalla actual. En móvil, esas cuatro rutas forman una barra inferior y el resto queda bajo **Más**.

### Docker

```bash
cp .env.example .env
docker compose up --build
```

| Servicio   | URL                     |
| ---------- | ----------------------- |
| Frontend   | `http://localhost:8080` |
| Backend    | `http://localhost:8000` |
| phpMyAdmin | `http://localhost:8081` |

Consulta [docs/deployment.md](docs/deployment.md) para Docker, producción y despliegue automático.

## Variables principales

`frontend/.env`:

```env
VITE_API_URL=http://localhost:8000/api
VITE_WEBGPU_AI_MODEL=Llama-3.2-1B-Instruct-q4f16_1-MLC
```

`backend/.env` contiene la conexión de datos, orígenes permitidos, almacenamiento y compatibilidad Ollama. Nunca se versionan credenciales ni archivos `.env`; solo `.env.example`.

## Calidad

```bash
pnpm run lint
pnpm run test
pnpm run build
```

Los recorridos críticos de usuario se cubren con Playwright sobre un entorno de pruebas propio (SQLite local, servidor de PHP y Vite), sin Docker:

```bash
pnpm run test:e2e
```

La automatización de GitHub ejecuta formato, lint, tests, build PWA, recorridos E2E e imágenes Docker. Después del despliegue, un smoke test comprueba la landing, el favicon y el estado de la API. Consulta [docs/testing.md](docs/testing.md) para conocer la estrategia de pruebas.

## Roadmap

La V1 de hardening (#3–#12) está completada y mergeada en `main`. El estado completo está en [docs/roadmap.md](docs/roadmap.md).

El trabajo futuro depende de feedback real y métricas de uso. Posibles líneas post-V1, sin compromiso ni fechas:

- colaboración avanzada (permisos granulares, equipos);
- transferencia de ownership y borrado de cuenta endurecido;
- avisos de backup automatizado con runner de cron en producción;
- subida de source maps para Sentry;
- sincronización multi-dispositivo del historial IA;
- workspace creativo, planificación audiovisual y revisiones externas según el plan 2.0.

## Qué no hace

LumaFlow no es un editor ni un servicio de alojamiento de fotografías, vídeo, RAW, proxies o proyectos multimedia. Las entregas son enlaces externos; no controla los permisos ni garantiza la disponibilidad del proveedor. La IA es opcional y no es necesaria para gestionar el estudio.

## Apoyar LumaFlow

LumaFlow seguirá siendo gratuito, sin planes premium, cuotas ni ventajas exclusivas por donar. El apoyo voluntario ayuda a mantener la infraestructura y continuar el desarrollo. La [página de apoyo](frontend/src/pages/SupportPage.jsx), disponible en `/support`, está implementada localmente con accesos en footer y configuración; todavía no está desplegada.

Ko-fi y GitHub Sponsors se configuran con `VITE_KOFI_URL` y `VITE_GITHUB_SPONSORS_URL`, vacías por defecto. **No hay enlaces de donación activos ni perfiles verificados; no se ha creado FUNDING.yml.** LumaFlow no procesa pagos ni almacena datos de donantes. Consulta [Apoyar LumaFlow: configuración y revisión previa](docs/support.md) antes de activar perfiles reales, incluida la revisión fiscal española y de Vercel Hobby.

También puedes apoyar reportando problemas reproducibles, mejorando documentación o contribuyendo mediante [CONTRIBUTING.md](CONTRIBUTING.md).

## Open source y contribuciones

LumaFlow es un producto experimental open source con licencia MIT. El repositorio también documenta decisiones de arquitectura y sirve como trabajo de portfolio, pero el producto se diseña para uso real y aprendizaje con usuarios.

Antes de proponer un cambio:

1. abre un issue explicando el problema o caso de uso;
2. evita incluir información real de clientes o credenciales;
3. ejecuta lint, tests y build;
4. mantén los cambios compatibles con la arquitectura actual.

## Seguridad

- No publiques `.env`, tokens, correos, prompts ni respuestas de IA.
- No uses datos reales en issues, demos o capturas.
- Reporta vulnerabilidades de forma privada al responsable del repositorio.

## Licencia y autoría

[MIT](LICENSE). Diseñado y desarrollado por [Alex Vicente López](https://aleviclop.dev).
