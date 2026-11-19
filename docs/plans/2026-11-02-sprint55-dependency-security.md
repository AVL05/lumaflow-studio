# Sprint 5.5 — Seguridad de dependencias (#49)

## Alcance

Resolver el árbol de build sin alterar producto, PWA, datos existentes ni herramientas. Rama actual y cambios de Sprints 2–5 preservados; nueve commits y test_plan.md intactos. Sin commit, push, merge ni despliegue.

## Evidencia y plan

Auditoría inicial: deepmerge 4.3.1 (bajo), minimatch 5.1.9 y 10.2.6 (dos moderados) y glob 11.1.0 (moderado). Todos llegan por vite-plugin-pwa → workbox-build 7.4.1. Registry sin versión corregida compatible del padre ni deepmerge. Parche publicado mínimo: minimatch 11.0.1 y glob 14.0.2; últimas versiones corregidas consultadas: 11.0.4 y 14.0.3.

1. Añadir pruebas de contratos reales: getManifest/globSync de Workbox y minimatch.match de FileList. No forzar la API global de minimatch ni retirar Jake: EJS sí lo utiliza en su CLI. Probar regresión sintética de deepmerge antes de mitigar.
2. Overrides acotados a workbox-build→glob y filelist→minimatch, manteniendo consumidores. Los saltos mayores transitivos son necesarios por no existir parches de sus ramas; comprobar contratos, CLI EJS y compilación PWA. Parche reproducible pnpm para deepmerge si reproduce el fallo; mantener el aviso nativo y condicionar cualquier excepción a comprobaciones reales, sin renombrar versiones.
3. Validar PWA producida/offline, suites requeridas, instalación frozen y auditorías completas/producción. Actualizar CI, documentación e issues con evidencia; ningún resultado pendiente se considera aprobado.

Riesgos: cambios de matching/exports, selección incorrecta de assets, precache de IA o respuestas API, pérdida de CLI y mantenimiento del parche local. No hay cambios de BD: los tests existentes usan exclusivamente sus bases sintéticas temporales. MySQL/TiDB, B2, CI remoto e impresión física siguen pendientes.

## Resultados

Implementado y validado localmente el 02/11/2026. El bloqueo de moderados queda retirado; permanece un aviso bajo nativo con mitigación verificable. No se declara una auditoría completa sin avisos.

### Matriz de los cuatro hallazgos

Todas las rutas parten de `frontend > vite-plugin-pwa 1.3.0 > workbox-build 7.4.1`. No son dependencias ejecutadas por Laravel ni por la SPA en el navegador.

| Paquete antes | Aviso / severidad | Ruta restante / exposición | Corrección |
| --- | --- | --- | --- |
| minimatch 5.1.9 | [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249), moderado | off-main-thread → EJS → Jake → FileList; matching del CLI/build, no patrones de clientes | Override **filelist@1.0.6 > minimatch 11.0.4**. FileList usa `.match`, que conserva esta API; se prueba su filtrado y el CLI EJS. No se impone una API nueva globalmente. |
| minimatch 10.2.6 | Mismo advisory, segundo hallazgo moderado | glob; matching de assets locales de precache. Configuración del repositorio, sin entrada de usuarios | Sustituido por **11.0.4**, que resuelve glob 14.0.3. Primera versión corregida publicada: 11.0.1; última consultada: 11.0.4. |
| glob 11.1.0 | [GHSA-3g3m-2fjr-6pw4](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4), moderado | Workbox usa globSync para descubrir assets; el aviso describe trabajo que continúa tras abortar recorridos. La aplicación no recorre archivos multimedia | Override **workbox-build@7.4.1 > glob 14.0.3**, primera corregida 14.0.2. Contratos reales getManifest/globSync, exclusiones y aborto sin lecturas posteriores probados. |
| deepmerge 4.3.1 | [GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4), bajo | @rollup/plugin-node-resolve. El consumidor instalado solo clona defaults constantes al inicializar; no recibe briefings, enlaces ni payloads de clientes | No hay release corregida. **Parche pnpm local** de fuente/CJS/UMD, pruebas de regresión y hashes obligatorios en el gate; aviso nativo conservado. |

Los saltos mayores de glob/minimatch son exclusivamente transitivos y necesarios para usar correcciones publicadas; no existen parches publicados de las ramas 11/5/10 indicadas. Se mantienen Vite, vite-plugin-pwa, Workbox, EJS, Jake y FileList en sus versiones anteriores. Verificar compatibilidad de las APIs utilizadas permite este incremento de seguridad sin actualizar el producto ni toda la cadena.

Se comprobó que Jake sí se usa en `ejs/bin/cli.js`; por eso **no se elimina** como supuesta dependencia huérfana. Tampoco se retira Testing Library/jest-dom por un aviso de obsolescencia: sus tests siguen activos. El lockfile elimina automáticamente las ramas antiguas ya sustituidas. `pnpm why --recursive brace-expansion` muestra únicamente 5.0.12: se elimina solo el override `brace-expansion@2`, sin referencias en el grafo final; se conserva el de la rama 5.

### Mitigación concreta de deepmerge

La prueba nueva falló antes del parche: el resultado anidado heredaba una propiedad sintética desde un prototipo no esperado al usar un placeholder null. **No se contaminó Object.prototype ni se demostró explotación de LumaFlow.** El debate upstream no equivale a una release corregida; la [reproducción/remediación upstream](https://github.com/TehShrike/deepmerge/issues/273) sigue sin paquete parcheado disponible en el registry consultado.

`patches/deepmerge@4.3.1.patch` rechaza `__proto__`, `constructor` y `prototype` antes de copiar claves de target/source. Incluye index.js y ambas distribuciones para no parchear solo un archivo que el consumidor no utiliza. Las pruebas ejercitan los CJS/UMD instalados, target null/prototipo nulo/claves propias y preservación de arrays, objetos, símbolos y opción de mezcla de arrays. Se conserva la API existente; se omiten intencionadamente las tres claves reservadas, que el consumidor real no utiliza.

La excepción anterior permitía la versión sin parche. Ahora exige además:

- `pnpm.patchedDependencies["deepmerge@4.3.1"]` con el archivo exacto; pnpm registra su SHA-256 en el lockfile.
- Hash revisado del parche `f53dc4ca4b2b78d6959faaac4776a084c416d7b5ff27b819a557022c2d373f8c` y de la entrada CJS realmente resuelta a través de Workbox/node-resolve: `82760c8642c378627a229fe14370632c63d3b0aea3b65da4a6d63d2b7cacf837`.
- Mismo advisory, versión, severidad baja, ausencia de parche upstream y única ruta de build. Otro aviso, ruta/runtime, versión, parche publicado, hash diferente o instalación sin parche falla.
- Pruebas del gate y del comportamiento mitigado antes de la auditoría en CI; JSON y código original conservados como artefacto, warning y resumen visibles. Sin ignores globales, versiones renombradas o continue-on-error.

El audit nativo no reconoce el parche y continúa con **exit 1 / un bajo**. El gate resulta **PASS con warning**, no «cero vulnerabilidades». Riesgo residual: mantener/revisar este parche mientras no haya actualización upstream y no aceptar configuración de build no confiable. Retirar juntos parche y excepción al publicar upstream una corrección y validar sus contratos. No se añade excepción para moderados: ya están corregidos.

### Pruebas y reproducibilidad

| Comprobación ejecutada | Resultado |
| --- | --- |
| `pnpm run test` | PASS: 9 Node, 245 PHPUnit y 141 Vitest (36 archivos) |
| `pnpm run test:e2e` final | PASS: 20 recorridos Chromium, sin reintentos automáticos de acciones |
| `pnpm run build` y `pnpm run test:pwa` | PASS: PWA compilada + 1 recorrido offline adicional |
| Contratos/gate con Node 22.23.4 Windows | PASS: 9 tests |
| Build con Node 22.23.4 | PASS; mismo precache y hashes de assets |
| `pnpm run lint` y Prettier frontend | PASS: oxlint, Pint y formato |
| Instalación frozen sobre checkout actual | PASS, sin resolución nueva |
| Instalación frozen desde cero en directorio temporal con manifests/lock/parche | PASS: 509 paquetes del entorno Windows y los 9 tests del gate/contratos |
| `pnpm audit --json` completo | **Exit 1**, 1 bajo mitigado; 0 moderados/altos/críticos |
| `check-security-audit.mjs` sobre ese JSON/código | **PASS con warning visible** y verificación de hashes |
| `pnpm audit --prod` | PASS, 0 avisos |
| Composer `audit --locked` completo y `--no-dev` | PASS, 0 avisos / 0 abandonados en ambos |
| `git diff --check` | PASS; warnings de EOL Windows sin errores de whitespace |
| Imagen Docker completa | BLOCKED: daemon Docker Desktop Linux no disponible; no se inicia ni cambia configuración |
| CI remoto, MySQL/TiDB, B2 e impresión física | NOT RUN, sin nuevas afirmaciones sobre esos entornos |

Suite general ejecutada con Node 24.18.0; contratos y build adicionales con Node 22.23.4, versión principal que usa CI. No se afirma ejecución remota en Linux. No se modifica una BD existente: las suites previas usan sus bases sintéticas temporales; la prueba PWA nueva no necesita backend ni BD. No se cambia código/migraciones/configuración de Laravel.

PWA offline: service worker instalado/controlando página, /login recargado sin conexión, HTML/CSS precacheados, lib-*.js excluido y fetch API offline rechazado. No se promete edición/guardado offline. Precache sin crecimiento: **28 entradas / 1505.48 KiB**; principal **565.02 kB / 153.59 kB gzip**. Persiste warning previo de chunks grandes; no se sube su umbral.

### Regresión de test detectada y corregida

El primer E2E completo terminó 18/20: dos recorridos públicos recibían 429 al compartir la misma IP y ventana de 30/min. No es una exposición de dependencias ni se modifica el límite del backend. La fixture visitorPage comprueba capacidad con un slug sintético inexistente; si quedan menos de veinte peticiones espera un minuto y exige presupuesto renovado antes del siguiente recorrido independiente. No limpia contadores, reduce peticiones, omite aserciones, intercepta respuestas ni reintenta escrituras. Solo su preparación admite 90 segundos; las aserciones UI conservan su timeout. La ejecución completa posterior pasa 20/20 en 4.4 minutos.

La prueba inicial de FileList usó un glob de exclusión sobre nombres inexistentes y no representaba su API de exclusión; se corrigió la fixture para excluir por regex y se conserva una aserción separada de minimatch.match. No se presenta ese fallo de fixture como vulnerabilidad. La regresión deepmerge sí falla sobre el paquete original y pasa con el parche instalado.

### Archivos y CI

- `package.json`/`pnpm-lock.yaml`: dos overrides transitivos, parche reproducible, retiro del override sin referencias y scripts de validación. Se conserva follow-redirects 1.16.2 del Sprint 5.
- `patches/deepmerge@4.3.1.patch`, `.gitattributes`: parche pequeño y LF estable para sus hashes.
- `scripts/check-security-audit.mjs`, su test y `scripts/build-dependencies.test.mjs`: verificación del parche real y contratos de consumidores, sin dependencia runtime nueva.
- `e2e/playwright.pwa.config.js`, `e2e/pwa/offline.spec.js`: comprobación aislada de producción/offline; `e2e/fixtures/test.js`: espera de presupuesto entre casos públicos.
- `.github/workflows/ci.yml`: mantiene auditorías completas/runtime, tests, formato y build; añade PWA de producción/offline al job E2E y sus artefactos. No se retira ningún control.
- `frontend/Dockerfile`: copia `patches/` antes de instalar; evita una instalación frozen con parche ausente. No cambia imagen/proveedor/dominio ni despliega.
- Documentos afectados: este informe, testing, deployment, roadmap y nota fechada de actualización en la matriz anterior. Los informes previos conservan su evidencia histórica.

La instalación limpia y la carpeta de edición se conservan fuera del repositorio en el temporal `lumaflow-s55-f19823fd49f44337a0325a92c838ca11`: la política de ejecución rechazó su limpieza recursiva. Se trasladó únicamente la carpeta de edición generada, sin borrar archivos ni tocar el workspace del usuario. No es una dependencia del build final; el parche instalado se verifica independientemente.

### Estado y siguiente sprint

Actualizados [#49](https://github.com/AVL05/lumaflow-studio/issues/49) y [#37](https://github.com/AVL05/lumaflow-studio/issues/37) con correcciones, pruebas y riesgos residuales. Ambos continúan abiertos. #49 conserva el seguimiento upstream del bajo, revisión/integración y CI remoto. No hay issues duplicados ni cierres que atribuyan cero avisos al audit completo.

Se conserva `feat/backup-b2-storage`, HEAD `a46c72c`, nueve commits locales, cambios previos y test_plan.md sin seguimiento y sin escrituras por esta tarea. Sin commits nuevos, push, merge, despliegue, datos reales ni servicios contratados.

**Sí se puede comenzar el desarrollo local del Sprint 6 / #45**: los moderados están corregidos y el bajo tiene mitigación comprobada con gate estricto. La activación pública de donaciones continúa sujeta a URLs reales verificadas y revisión de condiciones del alojamiento/aspectos fiscales prevista; no se implementa ni activa aquí. Este resultado no autoriza una release ni sustituye los gates externos pendientes.
