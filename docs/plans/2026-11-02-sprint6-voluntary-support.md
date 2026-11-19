# Sprint 6 — Apoyo voluntario (#45)

## Alcance y ejecución

Reutilizar MarketingPage, footer, SettingsPage y lazyRoute; sin backend, tablas, pagos propios, SDK, tracking de donantes ni dependencias nuevas. Variables VITE_KOFI_URL y VITE_GITHUB_SPONSORS_URL vacías; no existen perfiles aportados/verificados y no se crea FUNDING.yml.

1. Helper de validación y tests de destinos HTTPS, host/ruta de perfil, cero/uno/dos proveedores y entradas maliciosas. Riesgos: normalización URL y confundir formato válido con titularidad. Validación sintáctica estricta más verificación manual antes de activar.
2. Página pública responsive, footer y configuración; corregir únicamente copy comercial contradictorio con gratuidad permanente. Tests de render/teclado, rutas y navegación móvil; sin abrir perfiles sintéticos ni ejecutar JS externo.
3. Documentar configuración y revisiones legales/hosting pendientes, ejecutar suites/auditorías preservando mitigación deepmerge y actualizar #45/#37 con evidencia.

Archivos previstos: supportLinks.js/tests, SupportPage.jsx/tests, router, MarketingFooter, SettingsPage, páginas de marketing con copy contradictorio, frontend/.env.example, tests E2E, README y documentación de despliegue/privacidad/testing/roadmap. Riesgos acotados a navegación pública y configuración de build; proyectos, producción, entregas, permisos y datos no se modifican.

## Resultados

Implementado y validado localmente el 02/11/2026. Sin activación de enlaces, publicación o despliegue. Se conservan rama `feat/backup-b2-storage`, HEAD `a46c72c`, nueve commits, cambios previos y `test_plan.md` sin seguimiento. No se crean commits nuevos.

### Funcionalidad y archivos afectados por este sprint

- `frontend/src/pages/SupportPage.jsx`, `frontend/src/utils/supportLinks.js` y sus tests: página pública diferida, cero/uno/dos proveedores, validación HTTPS estricta, destinos inválidos ocultos y enlaces con protección de opener/referrer. Sin SDK, iframe, pagos propios, almacenamiento de donantes ni llamadas a proveedores al cargar.
- `frontend/src/app/router.jsx`, `frontend/src/components/marketing/MarketingFooter.jsx` y `frontend/src/pages/SettingsPage.jsx`: acceso público, footer discreto y configuración. Se reutilizan MarketingPage, Panel, metadatos y navegación existentes.
- `PricingPage.jsx`, `AboutProjectPage.jsx`, `LandingPage.jsx` y `MarketingPages.test.jsx`: corregido el texto que permitía planes futuros o limitaba la gratuidad a la beta; precios siguen en 0 €. La referencia comercial a galerías propias se sustituye por entregas externas.
- `frontend/.env.example` y `frontend/Dockerfile`: dos variables públicas de build, vacías por defecto. No se configuran perfiles reales ni secretos, no se crea FUNDING.yml y no se modifican dependencias/lockfile en este sprint.
- `e2e/tests/support.spec.js`, `e2e/playwright.support.config.js`, `e2e/support-tests/providers.spec.js`, `e2e/playwright.config.js` y `e2e/pwa/offline.spec.js`: navegación móvil y configuración, proveedores sintéticos interceptados sin pagos/peticiones reales, teclado, almacenamiento, ausencia de scripts externos y acceso offline.
- `package.json` y `.github/workflows/ci.yml`: comando `test:support` y ejecución en CI con artefactos. Se conservan todos los gates y la verificación existente del parche deepmerge.
- README, `docs/support.md`, despliegue, testing, roadmap y diseño de apoyo original: configuración real, estado local y condiciones previas a activación. Capturas sintéticas en `docs/screenshots/sprint6-support-{desktop,mobile,configured-mobile}.png`, inspeccionadas en escritorio y móvil.

No se modifica backend, esquema, proyectos, producción, entregas, autorización, IA o permisos en este incremento. El diff global conserva cambios anteriores de esos módulos: no son trabajo del Sprint 6.

### Validación ejecutada

| Comprobación | Resultado real |
| --- | --- |
| PHPUnit (`pnpm run test:backend`, ejecutado mediante `pnpm run test`) | PASS: 245 tests |
| Vitest completo (`pnpm --dir frontend run test`) | PASS final: 195 tests / 38 archivos |
| Nuevas pruebas Vitest | 47 de validación URL y 7 de página: PASS |
| Playwright completo (`pnpm run test:e2e`) | PASS final: 21 Chromium, 4,7 minutos |
| Proveedores aislados (`pnpm run test:support`) | PASS: 1 recorrido con dos proveedores sintéticos, teclado, móvil, referrer/opener, sin cookies/almacenamiento ni JS de terceros |
| PWA producción/offline (`pnpm run test:pwa`) | PASS: 1 recorrido; incluye `/support` offline y exclusión de API/IA del precache |
| Política de auditoría/contratos (`pnpm run test:audit`) | PASS: 9 tests Node; parche deepmerge verificado |
| Lint (`pnpm run lint`) | PASS: Oxlint y Pint, sin warnings nuevos |
| Prettier (`pnpm --dir frontend run format:check`) | PASS |
| Build (`pnpm run build`) | PASS; conserva warning de chunk >500 kB |
| Auditoría pnpm completa | Exit 1: un aviso LOW de deepmerge, mitigado y visible; gate PASS con warning |
| Auditoría pnpm producción | PASS: cero avisos |
| Auditoría Composer completa y producción | PASS: cero avisos / paquetes abandonados |

El primer `pnpm run test` pasó Node/PHPUnit y falló en frontend por una expectativa comercial obsoleta y un timeout de JobDetailPage. Se actualizó únicamente la expectativa afectada por el nuevo texto; JobDetailPage no se modifica: sus pruebas aisladas y la suite completa posterior pasan. El primer Playwright completo pasó 20 casos y agotó un timeout en CreativeWorkspace durante «Preparando workspace seguro»; repetición completa sin otras suites simultáneas: 21 PASS. No se ampliaron timeouts, eliminaron aserciones ni alteraron controles de seguridad. Las ejecuciones fallidas se registran; no se atribuye una causa no demostrada a esos timeouts.

Build final: SupportPage diferida **5,85 kB / 2,48 kB gzip**; principal **566,01 kB / 153,85 kB gzip**; precache **29 entradas / 1512,85 KiB**. Son tamaños medidos, no una evaluación de rendimiento en dispositivos reales.

La mitigación deepmerge permanece intacta: hash del parche `f53dc4ca4b2b78d6959faaac4776a084c416d7b5ff27b819a557022c2d373f8c` y CJS instalado `82760c8642c378627a229fe14370632c63d3b0aea3b65da4a6d63d2b7cacf837`. No se declara eliminada la alerta upstream ni se crean excepciones nuevas.

### Activación, seguimiento y límites

Guía operativa: [docs/support.md](../support.md). Las dos variables siguen vacías en el ejemplo y no se han recibido URLs reales del mantenedor. No hay enlaces de donación activos ni FUNDING.yml. La validación de formato no acredita existencia/titularidad del perfil: ambas comprobaciones son manuales antes de activar.

Fuentes de Vercel, GitHub Sponsors, Ko-fi y AEAT reconsultadas el 02/11/2026 y enlazadas en la guía. Pedir donaciones no se considera por sí mismo uso comercial según Vercel Fair Use, pero no acredita la elegibilidad Hobby de toda la plataforma. La revisión legal/fiscal española del receptor y del uso real de alojamiento sigue pendiente; no se autoriza activación pública por completar las pruebas.

#45 y epic #37 se actualizan con resultados locales y permanecen abiertos para revisión/integración y gates de activación. Sin push, PR, merge, despliegue ni modificación productiva. CI incluye la nueva prueba, pero su ejecución remota aún no se verifica. MySQL/TiDB, B2, tres días UTC, Docker completo (sin daemon) e impresión física conservan sus pendientes anteriores; no se consideran validados por pruebas SQLite/Chromium.

Siguiente paso recomendado: revisión e integración autorizada de los incrementos locales y validaciones externas pendientes; después abordar #46 en un sprint separado si se autoriza. No se inicia IA en este sprint.
