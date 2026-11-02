> Decisión final de publicación: **NO-GO para publicación conjunta en producción**. Evaluación de `eb9553b`: ver §16. Las secciones anteriores conservan evidencia histórica.

# Auditoría SEO/GEO de LumaFlow Studio

Fecha: **2 de noviembre de 2026**, Europe/Madrid. Estado actualizado: **P0/P1 implementados localmente con verificaciones y bloqueos abiertos; sin publicar**. Preparación de publicación aislada en [§14](#14-publicación-aislada-desde-originmain). Las secciones 1–13 conservan el diagnóstico, implementación y mediciones del workspace original; no representan el conjunto de código que se publica en la rama aislada.

## 1. Dictamen ejecutivo

La oportunidad principal es hacer accesible y coherente el producto público que ya existe. No hace falta migrar React/Vite, introducir Next.js, incorporar un blog ni renderizar el CRM en servidor.

Decisiones recomendadas:

1. **P0: separar indexación comercial y operativa.** Corregir canonical, robots/sitemap, respuestas HTTP y exclusión de acceso, CRM y portales. `noindex` nunca sustituye autenticación ni autorización.
2. **P0: corregir contradicciones de producto antes de amplificarlas.** Features describe entregas mediante enlaces externos; Landing, Privacy y About todavía prometen alojamiento/selección de fotografías. Pricing y Support locales ya reflejan gratuidad permanente con apoyo voluntario, pero producción conserva el modelo de beta gratuita temporal.
3. **P1: prerender estático exclusivamente de páginas públicas**, reutilizando sus componentes React. Mantener SPA y API Laravel independientes y las rutas privadas con renderizado cliente. Metadatos correctos deben existir en la respuesta HTTP, además del DOM.
4. **P1: explicar claramente “CRM gratuito para fotógrafos y filmmakers”**, funcionalidades comprobables y límites de IA/entregas. Mejorar respuestas concretas, enlaces y entidad del producto para búsqueda tradicional y con IA.
5. **P2: optimización proporcional al rendimiento observado.** Las diez mediciones Lighthouse principales dan 96–100 en rendimiento. La portada móvil tiene poco margen en LCP y la descarga inicial contiene JavaScript no utilizado; no hay evidencia que justifique una reescritura.

**Incidencia de producción adicional:** entregas, contratos y reservas con identificadores sintéticos inexistentes devuelven `500`, cuando el contrato y los tests locales esperan `404`. No se ha diagnosticado su causa ni modificado producción. Debe investigarse antes de considerar validados los portales.

## 2. Alcance, procedencia y límites

- Repositorio solicitado: [AVL05/lumaflow-studio](https://github.com/AVL05/lumaflow-studio), contrastado con la copia de trabajo actual.
- Rama local: `feat/backup-b2-storage`; HEAD: `a46c72cb2c701efec4d3e9d433507f92b3c60df4`.
- Había numerosos cambios modificados y sin seguimiento antes de esta tarea. **El código local no equivale al despliegue ni al HEAD remoto.** Las referencias a líneas corresponden a este estado local.
- Sitio examinado: [lumaflow.aleviclop.dev](https://lumaflow.aleviclop.dev/); API identificada en `docs/deployment.md`: `https://lumaflow-api.aleviclop.dev/api`.
- Evidencias: GET HTTP sin sesión, DOM renderizado en navegador, código/configuración, pruebas existentes, Lighthouse CLI y documentación oficial consultada en esta fecha.
- HTML de producción observado: entrada `/assets/index-DaMPEJou.js`, CSS `/assets/index-_yGxvsXb.css`. No se atribuye ese build a un SHA concreto no verificado.
- Solo se crea este documento. Sin cambios de aplicación, dependencias, ramas, commit, push, PR, despliegue, cuentas nuevas ni formularios enviados.
- No se accedió a clientes, credenciales o tokens reales. Los identificadores usados en comprobaciones negativas son sintéticos.
- No se consultaron propiedades privadas de Search Console/Bing, logs productivos, configuración real de base de datos, cuentas de donaciones ni datos de conversión. No se garantiza indexación, posicionamiento ni citas en respuestas de IA.

Estados usados: **CONFIRMADO** = evidencia directa; **POTENCIAL/PENDIENTE** = requiere otra comprobación; **PASS/FAIL** = resultado de una comprobación concreta; **NOT RUN** = no ejecutada. Un test local aprobado no certifica producción.

## 3. Rastreo HTTP y arquitectura de la SPA

### 3.1 Respuestas observadas

Las siguientes rutas devolvieron `200`, `Content-Type: text/html; charset=utf-8`, cuerpo de **1.674 bytes**, cero H1 en HTML inicial y `<div id="root"></div>`. Todas comparten title/description de la portada, canonical `https://lumaflow.aleviclop.dev/`, `robots=index, follow` y ausencia de `X-Robots-Tag`:

| Grupo                     | URLs probadas                                                                                                                      | Interpretación                                                             |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Comercial publicado       | `/`, `/features`, `/pricing`, `/privacy`, `/about-project`                                                                         | Dependencia completa de JS para contenido y enlaces                        |
| Acceso                    | `/login`, `/register`                                                                                                              | Indexables por directiva inicial; no deberían competir con el producto     |
| CRM                       | `/app/clients`                                                                                                                     | Shell público, sin datos en HTML; la protección depende de auth/API        |
| Portales sintéticos       | `/deliver/seo-audit-invalid-token-20261102`, `/contract/seo-audit-invalid-token-20261102`, `/book/seo-audit-invalid-slug-20261102` | Shell indexable incluso para enlaces operativos inexistentes               |
| Infraestructura SEO       | `/robots.txt`, `/sitemap.xml`                                                                                                      | **FAIL:** devuelven HTML de la aplicación, no TXT/XML                      |
| Página local no publicada | `/support`                                                                                                                         | Navegador muestra “Pagina no encontrada”, pero HTTP es 200: soft 404       |
| Inexistente               | `/__seo_audit_missing_20261102`                                                                                                    | HTTP 200 por fallback; el texto de error de React no cambia el estado HTTP |
| Alias/variantes           | `/security`, `/features/`, `/index.html`                                                                                           | HTTP 200; falta normalización en servidor                                  |
| Parámetro de campaña      | `/?utm_source=seo-audit`                                                                                                           | Canonical a `/`, apropiado para esta variante concreta                     |

También se comprobó:

- `http://lumaflow.aleviclop.dev/` y `/features` → **308** a su equivalente HTTPS, conservando ruta: **PASS**.
- `/security` usa `<Navigate to="/privacy" replace />` localmente; no es un redirect HTTP 301/308.
- `/product/dashboard.png` → **200 image/png**, 50.682 bytes; la imagen OG existe. `/sw.js` → **200 application/javascript**.
- HTML: `Cache-Control: public, must-revalidate, max-age=0`, servidor Vercel, HSTS `max-age=63072000`.
- La ausencia de sitemap no demuestra por sí sola falta de indexación. El canonical erróneo es una señal de consolidación, no prueba de qué canonical ha elegido Google.

### 3.2 Evidencia de implementación

| Evidencia local                              | Hallazgo confirmado                                                                                                    |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `frontend/index.html:10–24`                  | Metadatos generales, `index, follow`, OG y canonical fijo a `/`; sin JSON-LD                                           |
| `frontend/src/main.jsx:14`                   | `createRoot().render()`, sin render de contenido en build ni hidratación                                               |
| `frontend/src/app/router.jsx:39–126`         | `createBrowserRouter`, rutas públicas, acceso, portales y `/app` en el mismo árbol                                     |
| `frontend/src/hooks/useDocumentMeta.js:3–18` | Solo cambia title/description mediante `useEffect`; restaura valores al desmontar. No gestiona canonical, robots ni OG |
| `frontend/vercel.json`                       | Rewrite global a `/index.html`                                                                                         |
| `frontend/docker/nginx.conf`                 | `try_files $uri $uri/ /index.html`: fallback también para desconocidas                                                 |
| `frontend/public/`                           | No contiene robots.txt ni sitemap.xml                                                                                  |
| `frontend/vite.config.js`                    | No configura SSG/SSR; sí PWA/Workbox                                                                                   |

No es correcto afirmar que Google no puede indexar una SPA: puede ejecutar JavaScript. Aquí el problema es depender del render para toda la información y ofrecer señales equivocadas incluso después del render. Los consumidores que no ejecutan JS reciben un shell. [Fundamentos de JavaScript SEO de Google](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics).

### 3.3 Metadatos después de ejecutar JavaScript

Comprobado mediante navegación directa y DOM, y navegación interna Pricing → Login:

| Ruta publicada   | Title renderizado                                   | H1                                            | Canonical/OG/robots                             |
| ---------------- | --------------------------------------------------- | --------------------------------------------- | ----------------------------------------------- |
| `/`              | LumaFlow Studio · Todo tu estudio en un único lugar | Tu estudio fotográfico, en un único lugar.    | Generales de portada                            |
| `/features`      | Casos de uso para estudios fotográficos · LumaFlow  | De la consulta a la entrega.                  | Siguen apuntando a portada; `index, follow`     |
| `/pricing`       | Precio de LumaFlow · Beta gratuita                  | Un precio claro mientras validamos.           | Siguen apuntando a portada; `index, follow`     |
| `/privacy`       | Privacidad e IA local · LumaFlow                    | Tus datos. Tu IA local.                       | Siguen apuntando a portada; `index, follow`     |
| `/about-project` | Title general de portada                            | Todo tu estudio fotografico en un unico lugar | Sin metadatos específicos                       |
| `/support`       | Title general de portada                            | Pagina no encontrada                          | Soft 404 indexable                              |
| `/login`         | Title general de portada                            | Formulario de acceso                          | Conserva canonical de portada e `index, follow` |

Cada una de las cinco páginas comerciales publicadas presenta un H1 en el DOM; no falta un H1 por página, falta en el HTML entregado sin JS. No se detectaron scripts JSON-LD en estas páginas. `/demo` cambia title por un efecto propio, pero no resuelve canonical/description/robots.

**Open Graph:** `og:image` es relativo, `og:url`, `og:title` y `og:description` son iguales en todas las rutas; falta imagen con URL absoluta y metadatos propios. No hay etiquetas `twitter:card` en la plantilla. No se ejecutaron depuradores de redes sociales; la presentación efectiva de cada plataforma queda pendiente.

## 4. Política de indexación recomendada

Usar una lista explícita de páginas editoriales; **nunca generar sitemap/prerender recorriendo enlaces del CRM o registros de base de datos**.

| Superficie                                                                    | Política recomendada                                                  | Sitemap/prerender                     | HTTP y precauciones                                                                                                                                    |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/`, `/features`, `/pricing`                                                  | Indexables, canonical propio HTTPS                                    | Sí                                    | 200 con contenido inicial                                                                                                                              |
| `/privacy`, `/about-project`                                                  | Públicas indexables por confianza y transparencia                     | Sí                                    | Metadatos específicos; corregir afirmaciones antes de publicar                                                                                         |
| `/support`                                                                    | Pública indexable cuando se publique su contenido real                | Sí, solo tras comprobar 200 y H1 real | Hoy excluir del sitemap de producción                                                                                                                  |
| `/demo`                                                                       | `noindex, follow` inicialmente                                        | No                                    | Mantener enlazada como herramienta de conversión; no prohibir su uso. Reconsiderar indexación si incorpora una explicación editorial propia suficiente |
| `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email` | `noindex`; acceso/registro pueden mantener `follow`                   | No                                    | No bloquear enlaces de registro ni alterar tokens/firmas/query de recuperación                                                                         |
| `/onboarding`, `/getting-started`, `/app` y `/app/*`                          | `noindex`                                                             | Nunca                                 | Mantener guardias y API; no emitir contenido personalizado en HTML estático                                                                            |
| `/deliver/*`, `/contract/*`, `/book/*`                                        | `noindex, nofollow, nosnippet` desde respuesta inicial                | Nunca                                 | Portales operativos accesibles a sus destinatarios; no redirigirlos a login por SEO                                                                    |
| API, ICS, PDF, exportaciones y recursos sensibles                             | `X-Robots-Tag: noindex, nofollow, nosnippet` en respuestas aplicables | Nunca                                 | Respetar tipos de contenido, auth y descarga; evitar caché pública de respuestas con datos                                                             |
| `/security`                                                                   | Alias permanente de `/privacy`                                        | No                                    | 301/308 en servidor conservando la navegación; fallback cliente si procede                                                                             |
| Desconocidas                                                                  | 404 real y página útil                                                | No                                    | No devolver portada 200 para cualquier path                                                                                                            |

Criterios adicionales:

- Canonical comercial absoluto propio, sin fragmentos, parámetros UTM ni credenciales. No construirlo a partir de query o IDs arbitrarios. No canonicalizar login, contratos ni datos de clientes a la portada.
- Elegir rutas públicas sin barra final y normalizarlas con una sola redirección; `/index.html` a `/`. **No aplicar normalizaciones genéricas a enlaces firmados, tokens o endpoints API.**
- Las páginas públicas deben recibir HTML y metadatos equivalentes para visitantes y bots. No introducir detección de user-agent ni contenido exclusivo para crawlers.
- `robots.txt` debe existir, ser `text/plain` y anunciar el sitemap absoluto. No bloquear JS/CSS ni páginas que necesitan ser rastreadas para leer `noindex`.
- No combinar indiscriminadamente `Disallow` y `noindex`: si se bloquea el rastreo, el robot puede no leer la exclusión. Para retirar URLs ya indexadas, permitir comprobar `noindex` o usar el procedimiento del buscador; no confiar en ocultarlas en robots. [Directivas de robots de Google](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag).
- La API ya sirve `robots.txt` con `Disallow: /` en producción. Conservar la protección de acceso y revisar por separado si necesita retirada de URLs previamente indexadas: ese bloqueo no garantiza que los buscadores lean un futuro header de exclusión.
- No poner tokens concretos en robots, sitemap, canonical, OG, JSON-LD, `llms.txt`, logs de auditoría ni informes compartidos.
- Publicar sitemap XML con URLs canónicas 200 e indexables. `lastmod` solo si refleja un cambio real del contenido; no actualizarlo artificialmente en cada build. No incluir alias, demo, cuentas ni `/support` mientras sea una soft 404.
- No añadir `hreflang` sin versiones idiomáticas reales. `lang="es"` ya está presente.

## 5. Contenido, funcionalidades y coherencia

### 5.1 Matriz de afirmaciones frente al código

| Afirmación                                                                                   | Evidencia                                                                                                          | Dictamen y acción recomendada                                                                                                                                                                                                                   |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Clientes, proyectos, sesiones, tareas, presupuestos/facturas PDF                             | Rutas API y módulos frontend; `CommercialDocumentService`, `AnalyticsService`                                      | Implementados en código. No equivale a verificar cada flujo en producción                                                                                                                                                                       |
| Entregas por enlaces externos y aprobación                                                   | `FeaturesPage.jsx:30–39`, `DeliveryRequest`, `PublicDeliveryService`, `PublicDeliveryResource`, `ClientPortalPage` | Es la descripción coherente con el modelo actual. Contraseña/fecha corresponden a datos del enlace; no prometer control sobre el proveedor externo                                                                                              |
| “Galerías privadas y favoritos”, publicación/carga múltiple                                  | `LandingPage.jsx:9,27,119`; `AboutProjectPage.jsx:20`                                                              | **Contradice el flujo actual.** No hay rutas de carga/favoritos en `backend/routes/api.php`. Revisar también demo, capturas y textos alternativos que sugieren selección alojada                                                                |
| Fotografías subidas a S3 como parte de crear una entrega                                     | `PrivacyPage.jsx:25–30` y sección “Qué sale del dispositivo”                                                       | **Desactualizado** frente al servicio de entregas por URL. Tener un disk S3 o backup privado no demuestra hosting de galerías. La corrección de declaraciones de privacidad requiere la revisión correspondiente, no una edición SEO automática |
| IA principal local WebGPU/WebLLM y opcional                                                  | `features/ai/webGpuAi.js`, imports dinámicos, `docs/ai.md`, ruta IA lazy                                           | Coherente. Explicar compatibilidad, descarga inicial de modelos y memoria; no prometer IA en cualquier móvil o sin conexión desde el primer uso                                                                                                 |
| “El historial se reconstruye del servidor, nunca del cliente” como descripción general de IA | `AboutProjectPage.jsx`, decisión técnica sobre `AiContextService`                                                  | Mezcla compatibilidad backend con experiencia principal. `localAiRepository.js` y `docs/ai.md` sitúan historial WebGPU en IndexedDB por cuenta/workspace. Diferenciar ambos flujos                                                              |
| “Cada consulta limita recursos al usuario” / aislamiento solo con `ownedBy`                  | Privacy y About; `BelongsToWorkspace`, `WorkspaceAuthorizer` y rutas de miembros                                   | Excesivamente simplificado: el modelo admite workspaces y miembros autorizados. Describir aislamiento entre estudios sin prometer exclusión de colaboradores legítimos                                                                          |
| Conexión de producción y base de datos con TLS                                               | Configuración/documentación de despliegue; HTTPS/HSTS frontend observado                                           | HTTPS frontend confirmado. La conexión TLS real a DB no se inspeccionó. No presentar configuración prevista como certificación operativa                                                                                                        |
| “Cobra sin perseguir clientes”                                                               | Features; presupuestos/facturas y estados                                                                          | Puede sugerir cobro/reclamación automáticos que no se han demostrado. Preferir “Controla presupuestos, facturas y estados de cobro”; no anunciar pasarela de pagos                                                                              |
| CRM para filmmakers                                                                          | Proyectos audiovisuales, briefing, tomas, jornadas y posproducción en código local y tests                         | Hay soporte local comprobable, pero no se verificó su disponibilidad autenticada en producción. Landing/Features publicadas están centradas en fotografía; ampliar el posicionamiento solo al publicar las funciones correspondientes           |
| Open source                                                                                  | `LICENSE` MIT, repositorio público consultable                                                                     | Sustentado. No confundir licencia de código con garantía de hosting gratuito perpetuo, capacidad ilimitada o SLA                                                                                                                                |
| PWA instalable                                                                               | Manifest, registro SW y prueba existente de build offline                                                          | Implementación existente. Esta auditoría no certifica offline completo del CRM ni instalación en dispositivos físicos                                                                                                                           |

La palabra “galería privada” puede describir un destino externo, pero debe explicitarlo: el portal de LumaFlow organiza enlace y revisión; la selección de fotos, alojamiento y permisos del proveedor no pasan a ser capacidades propias por enlazarlo.

### 5.2 Gratuidad y donaciones

**Estado publicado comprobado:** Pricing indica “gratis durante la beta”, “por mes durante la beta” y planes económicos por definir; About repite límites/precios futuros. `/support` no está publicado.

**Estado local comprobado:** Pricing y Support indican todas las funciones gratuitas, sin planes premium ni ventajas por donar; `docs/support.md` documenta la decisión y que no hay canales activos verificados. Landing aún mezcla “Si el modelo cambia…” y “Ver condiciones de la beta” con “sin planes de pago”. No presentar este trabajo local como ya publicado.

Texto recomendado, basado en esa decisión documentada y sujeto a publicación coherente:

> LumaFlow Studio es un CRM gratuito y open source para fotógrafos y filmmakers. Todas las funciones son gratuitas y no necesitas tarjeta. Las aportaciones son voluntarias y no desbloquean funciones ni privilegios. El producto está en beta pública.

Separar estado de madurez (**beta**) de modelo económico (**gratuito**). Explicar “fotografías y vídeos se alojan en tus proveedores; LumaFlow organiza enlaces y seguimiento”. No añadir “ilimitado”, “sin costes de terceros”, “garantizado para siempre”, “sin comisiones” ni disponibilidad de proveedores no verificados. La gratuidad no acredita capacidad infinita ni continuidad del servicio.

Reutilizar `getSupportLinks()` y la página existente; no incorporar checkout, SDK, cuentas ficticias, agradecimientos con identidad ni seguimiento de donantes. Sin perfiles reales verificados, mostrar el estado de canales pendientes y contribuir en GitHub. Las revisiones ya indicadas en `docs/support.md` siguen pendientes; esta auditoría no las aprueba.

### 5.3 Intención de búsqueda y captación

Los H1 son legibles pero genéricos y el title principal no contiene “CRM”, “gratis” ni audiencia. No se han medido volúmenes ni dificultad: las siguientes son **hipótesis de intención**, no keywords validadas por demanda.

| Página           | Intención principal                               | Propuesta editorial, no implementada                                                                                                          |
| ---------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`              | CRM gratuito para fotógrafos y filmmakers         | Title: “CRM gratuito para fotógrafos y filmmakers · LumaFlow Studio”. H1 claro sobre organizar clientes y proyectos; mantener un único H1     |
| `/features`      | Software para organizar un estudio y producciones | Explicar casos reales: consulta → proyecto → sesión/rodaje → presupuesto/factura → enlace de entrega. Separar funciones publicadas de futuras |
| `/pricing`       | ¿Es gratis? ¿Qué incluye? ¿Tengo que donar?       | Title: “LumaFlow gratis: funciones y apoyo voluntario”. Respuestas directas, sin tabla de planes inexistentes                                 |
| `/privacy`       | Qué datos guarda el CRM y cómo funciona la IA     | Resumen comprensible sobre API, IndexedDB y proveedores externos; revisión de exactitud antes de cualquier schema                             |
| `/about-project` | Quién mantiene LumaFlow y cuál es su alcance      | Autor, licencia y enlaces reales al proyecto; corregir tildes y separar tecnología de beneficios para usuarios                                |
| `/support`       | Cómo contribuir voluntariamente                   | Explicar opcionalidad y canales reales, cuando existan; secundario al registro                                                                |

Descripción candidata de portada: “Organiza clientes, proyectos, sesiones, presupuestos, facturas y entregas por enlaces externos. LumaFlow es gratuito y no pide tarjeta.” Ampliar a producción audiovisual solo tras verificar la versión publicada. No imponer un número de caracteres como garantía de snippet: comprobar claridad y previsualización.

Mantener CTAs existentes a `/register` y `/demo`, y navegación a Features/Pricing/Privacy/About. Los `<Link>` de React generan enlaces `<a href>` rastreables una vez renderizados; el prerender debe ofrecerlos también sin JS. Preferir anclas descriptivas a “ver más”, evitar páginas nuevas que repitan contenido sin necesidad y conservar preguntas/respuestas en texto HTML, aunque estén en `<details>`.

**Fallo de navegación confirmado a 768 px:** no se muestra ni navegación principal (`hidden ... lg:flex`) ni menú (`sm:hidden`); solo accesos. `MarketingHeader.jsx:27,54`. El footer conserva enlaces, por lo que no son páginas huérfanas, pero se pierde descubrimiento en la cabecera entre 640 y 1023 px. Corregir breakpoints sin rediseñar.

## 6. GEO y datos estructurados

GEO se aborda aquí como acceso y comprensión fiable del producto, no como garantía de ser citado.

- Resumir qué es, para quién, qué incluye, qué no hace, precio y condiciones, con respuestas independientes y comprobables. Evitar promesas vagas, métricas ficticias, logos de clientes, testimonios o integraciones API cuando solo existe un enlace externo.
- Identidad consistente: **LumaFlow Studio**, dominio canónico, autor y GitHub reales. Añadir fecha de actualización solo si se mantiene; no fingir revisión reciente automática.
- JSON-LD público mínimo: `WebSite` y `SoftwareApplication`/`WebApplication` coherentes con el contenido, `name`, URL, descripción, `applicationCategory: BusinessApplication` y precio `0` cuando se publique esa condición. No inventar organización legal, dirección, `aggregateRating`, reseñas, descargas ni número de usuarios.
- Una descripción válida en schema.org no garantiza un resultado enriquecido de Google. Google exige reseña o valoración para su resultado de software: si no existe, **no fabricarla para pasar el validador**. [Documentación de SoftwareApplication](https://developers.google.com/search/docs/appearance/structured-data/software-app).
- No priorizar `FAQPage` como mecanismo de rich results: la documentación actual de Google informa que los resultados FAQ dejaron de mostrarse desde el 7 de mayo de 2026. Mantener las preguntas visibles por utilidad. [Actualizaciones oficiales de Google Search](https://developers.google.com/search/updates).
- Las funciones de IA de Google no requieren un archivo especial ni schema exclusivo. `llms.txt` no es P0/P1 y no sustituye HTML, sitemap o buenas respuestas; podría añadirse solo con una necesidad y mantenimiento definidos. [Google: funciones de IA y sitios web](https://developers.google.com/search/docs/appearance/ai-features).
- Revisar acceso de Googlebot, Bingbot y bots de búsqueda con IA a las páginas públicas, también en CDN/WAF. La elegibilidad de Bing/Copilot sigue dependiendo de rastreo y calidad; no se verificaron logs de bots reales. [Bing Webmaster Guidelines](https://www.bing.com/webmasters/help/bing-webmaster-guidelines-30fba23a).
- Distinguir `OAI-SearchBot` (búsqueda), `GPTBot` (entrenamiento) y `ChatGPT-User` (visitas solicitadas por usuarios). Facilitar búsqueda no obliga a autorizar entrenamiento. Si se crean grupos específicos en robots, repetir las restricciones operativas pertinentes: no asumir que heredan las del grupo genérico. No conceder acceso privilegiado a bots. [Documentación de crawlers de OpenAI](https://developers.openai.com/api/docs/bots).

Medición futura: Search Console para cobertura/canonical seleccionado/consultas/CTR; Bing Webmaster Tools para rastreo y sus informes disponibles; registro de visitas referidas por IA con rutas públicas y sin parámetros sensibles. Definir conversiones como visita a registro, alta verificada y primera acción útil. Reutilizar instrumentación existente y revisar privacidad antes de añadir otra; no enviar emails, nombres, IDs de clientes o URLs de portales a analítica.

## 7. Rendimiento: Lighthouse ejecutado

### 7.1 Método y resultados

**PASS de ejecución:** diez auditorías (cinco páginas × móvil/escritorio), todas con salida 0, sin `runtimeError` ni `runWarnings`; dos repeticiones móviles adicionales de portada. Lighthouse **13.5.0**, Node **24.18.0**, Chrome headless **156.0.0.0**, Windows. Se utilizó Lighthouse previamente presente en caché; **no se instaló ningún paquete ni navegador**.

Móvil: 412×823, DPR 1,75, throttling simulado con RTT 150 ms, throughput 1638,4 Kbps y CPU ×4. Escritorio: preset desktop, RTT 40 ms, throughput 10240 Kbps y CPU ×1. Perfiles temporales independientes, sin autenticación; auditorías de navegación sobre producción. Son datos de laboratorio, no móviles físicos ni Core Web Vitals de campo; TBT no equivale a INP.

| Ruta             | Perfil     | Rendimiento | Accesibilidad | Buenas prácticas | SEO | LCP (s) | TBT (ms) | CLS |
| ---------------- | ---------- | ----------: | ------------: | ---------------: | --: | ------: | -------: | --: |
| `/`              | Móvil      |          96 |            95 |              100 |  92 |   2,516 |        0 |   0 |
| `/`              | Escritorio |         100 |            95 |              100 |  92 |   0,551 |        0 |   0 |
| `/features`      | Móvil      |          98 |            95 |              100 |  85 |   1,996 |        0 |   0 |
| `/features`      | Escritorio |         100 |            95 |              100 |  85 |   0,467 |        0 |   0 |
| `/pricing`       | Móvil      |          96 |            95 |              100 |  85 |   2,348 |        0 |   0 |
| `/pricing`       | Escritorio |         100 |            95 |              100 |  85 |   0,506 |        0 |   0 |
| `/privacy`       | Móvil      |          98 |            96 |              100 |  85 |   1,978 |        0 |   0 |
| `/privacy`       | Escritorio |         100 |            96 |              100 |  85 |   0,570 |        0 |   0 |
| `/about-project` | Móvil      |          96 |           100 |              100 |  85 |   2,349 |        2 |   0 |
| `/about-project` | Escritorio |         100 |           100 |              100 |  85 |   0,504 |        0 |   0 |

Portada móvil, tres LCP: **2,516 / 2,050 / 2,504 s**; mediana **2,504 s**, rendimiento 96/97/96. El margen es estrecho y existe variación; no interpretar 4 ms sobre un umbral como una regresión demostrada. Las demás combinaciones tienen una ejecución por perfil y no representan una distribución.

No se mide `/support` como landing válida porque hoy devuelve una soft 404. Se incorpora a la matriz tras su publicación autorizada. No se han atribuido estos resultados al código local modificado.

### 7.2 Problemas medidos y prioridad

1. **SEO:** `robots-txt` falla por sintaxis HTML y `canonical` falla en las cuatro páginas interiores por apuntar a portada. La puntuación SEO no cubre toda la auditoría ni certifica indexación.
2. **Descubrimiento LCP:** la imagen principal de portada tiene `fetchpriority=high` y carga eager, pero no se descubre en el documento inicial (`lcp-discovery-insight`). El prerender resuelve la causa de descubrimiento; considerar preload específico solo si se mide una mejora, evitando precargar imágenes de otras rutas.
3. **JS no usado:** entrada de 688.064 bytes descomprimidos, 202.183 bytes transferidos en la medición móvil de portada; Lighthouse estima 145.536 bytes no utilizados en esa navegación, aproximadamente 72 % de su tamaño comprimido auditado. Router importa muchas páginas privadas estáticamente. Candidato a lazy-load de módulos privados, conservando el patrón `lazyRoute`; no probar una refactorización amplia antes de corregir señales SEO.
4. **Imágenes:** la portada móvil ofrece ahorro estimado de **139.237 bytes** entre imágenes sobredimensionadas/logo. Usar variantes responsive y formatos adecuados al recurso, conservando dimensiones/alt y prioridad de LCP. Es una estimación de Lighthouse, no ahorro ya obtenido. No asumir que las imágenes lazy fuera de viewport se descargan igual en todos los dispositivos.
5. **CSS:** recurso de 20.046 bytes transferidos; ahorro estimado de bloqueo de **150 ms** en portada móvil. No justifica reescribir Tailwind ni introducir extracción manual de CSS crítico de primeras.
6. **Legibilidad:** `color-contrast` detecta texto `#79716b` sobre `#0d0c0b` con ratio **4,08:1**, y footer sobre `#090908` con **4,16:1**, frente a 4,5:1 requerido para esos textos normales. Corregir tokens/clases puntuales conservando diseño.
7. **Source maps:** Lighthouse avisa de su ausencia para la entrada grande; no es un bloqueo SEO. No publicar mapas con fuentes sensibles por buscar una puntuación; revisar su gestión privada en observabilidad si hace falta.

### 7.3 Evidencias conservadas y reproducción

Informes completos JSON/HTML en el directorio temporal local:

`C:\Users\alexv\AppData\Local\Temp\lumaflow-seo-audit-20261102\`

Nombres: `home-mobile`, `home-desktop`, `features-mobile`, `features-desktop`, `pricing-mobile`, `pricing-desktop`, `privacy-mobile`, `privacy-desktop`, `about-project-mobile`, `about-project-desktop`, `home-mobile-repeat-2`, `home-mobile-repeat-3`, cada uno con `.report.json` y `.report.html`. `browser-pages.json` conserva las lecturas de DOM público. Son archivos temporales de esta máquina, no artefactos versionados ni almacenamiento permanente.

Comando realmente utilizado, con destino variable según página/perfil:

```powershell
node 'C:\Users\alexv\AppData\Local\npm-cache\_npx\1722e863ebfd623b\node_modules\lighthouse\cli\index.js' `
  'https://lumaflow.aleviclop.dev/' `
  --chrome-flags='--headless --disable-gpu' `
  --only-categories=performance,accessibility,best-practices,seo `
  --output=json --output=html `
  --output-path="$env:TEMP/lumaflow-seo-audit-20261102/home-mobile" --quiet
```

Para escritorio se añadió `--preset=desktop`. No reproducir mediante `npx -y` si sigue vigente la prohibición de instalar dependencias. Para comprobar HTTP se utilizó `Invoke-WebRequest -SkipHttpErrorCheck`; para distinguir redirects, `-MaximumRedirection 0`. Repetir sobre el despliegue autorizado y guardar fecha/build/versiones junto al resultado.

## 8. Seguridad y fronteras que no deben cambiar

### Evidencia confirmada

- GET sin sesión a `/api/clients` devuelve **401 JSON**, `Cache-Control: no-cache, private`; no devolvió clientes.
- `backend/routes/api.php:77` conserva Sanctum; módulos críticos requieren verificación/onboarding. La SPA tiene `ProtectedRoute`; una página de login indexable no prueba una fuga de datos privados.
- Portales públicos locales usan token/slug, rate limit de 30/min y servicios específicos; contratos tienen enlaces con hash, revocación y expiración. `PublicDeliveryService` filtra borradores/archivadas/revocadas/caducadas y usa `firstOrFail`.
- `PublicDeliveryResource` incluye nombre del cliente, enlaces/contraseña de galería y estados/importes: son datos legítimos para el destinatario del portal, **inadecuados para HTML estático público, cachés compartidas o schema comercial**.
- No se encontró `noindex` ni `X-Robots-Tag` en el código fuente examinado de frontend/backend. Tampoco en las respuestas operativas HTTP probadas.
- La API publicada devuelve **500 JSON “Server Error”** a identificadores sintéticos inexistentes en `/api/public/deliveries/...`, `/api/public/contracts/...` y `/api/public/studios/...`. Entregas se repitió y devolvió 500 de nuevo. No hubo stack ni datos de cliente en esas respuestas. **FAIL del contrato negativo de producción**, no demostración de la causa ni de exposición de datos.
- Las mismas fronteras tienen **39 tests locales aprobados, 222 assertions** en el filtro ejecutado; la divergencia local/producción requiere diagnóstico operativo separado.

### Reglas para implementar SEO

- No cambiar scopes/workspaces, Sanctum, CORS, guardias, rate limits, caducidades, PDF/ICS ni formularios públicos para que “los vea Google”.
- No prerenderizar con cuentas, `storageState`, cookies o API real. Proceso de build aislado, sin credenciales y con cero solicitudes de negocio/modelos/donaciones. No serializar `process.env` ni estado de usuarios.
- Default seguro para HTML fuera de la allowlist: `noindex`. Aplicar headers de rutas en hosting/API sin convertir assets, manifest, SW o JSON en HTML y sin bloquear registro, recuperación o portales.
- No activar `CacheFirst` de datos autenticados. En API/portales sensibles comprobar `private, no-store` cuando proceda; no confundir el shell estático genérico, que puede ser público, con respuestas de negocio.
- Para portales revisar `Referrer-Policy: no-referrer` y enlaces externos `noreferrer`; evitar que tokens se propaguen a destinos externos o herramientas SEO. La política HTTP no estaba presente en las respuestas probadas. No reescribir enlaces ni visitar destinos reales de clientes en validadores externos.
- No desactivar SW/PWA. `main.jsx` registra SW inmediatamente y Workbox solo excluye `/api/` de navegación por configuración local. Si se añade SSG, conservar un **shell privado distinto de la portada renderizada** y ajustar fallback/precache al HTML final; comprobar entrada directa, recarga, offline y actualizaciones.
- Si un error real impide servir contenido público, responder de forma adecuada y recuperable, sin convertir un fallo de API en una portada promocional 200.

## 9. Alternativas arquitectónicas compatibles

| Alternativa                                                        | Beneficio                                                     | Coste/riesgo                                                                                                                   | Decisión                                                                                 |
| ------------------------------------------------------------------ | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Solo metadatos cliente + robots/sitemap                            | Corrección rápida usando hook actual                          | Contenido inicial vacío y previews sin JS; canonical inicial puede contradecir al DOM                                          | Parche parcial, insuficiente como destino final                                          |
| HTML inicial por ruta con head correcto, manteniendo CSR del body  | Resuelve canonical/previews iniciales con pocos cambios       | El cuerpo sigue dependiendo de JS                                                                                              | Buen primer corte P0, previo al prerender                                                |
| **SSG de páginas públicas con Vite y React DOM server existentes** | Contenido, enlaces y metadata en HTML; sin servidor adicional | Pequeño entry público de build, hidratación, rutas y PWA requieren pruebas                                                     | **Recomendación P1**                                                                     |
| Snapshot de navegador con Playwright ya instalado                  | Reutiliza render real y reduce adaptación SSR                 | Efectos, SW, carreras, contenido accidental y dependencia del navegador en build; snapshots no son automáticamente hidratables | Alternativa condicionada a una prueba aislada si SSG nativo cuesta más de lo justificado |
| SSR runtime completo o aplicación comercial separada               | Flexibilidad para contenido dinámico                          | Más infraestructura/mantenimiento y límites nuevos                                                                             | Desproporcionado para estas páginas estáticas                                            |
| Migración de framework o blog                                      | No resuelve por sí misma la coherencia ni privacidad          | Fuera de alcance                                                                                                               | Descartada                                                                               |

La documentación de [Vite sobre prerender/SSG](https://vite.dev/guide/ssr#pre-rendering-ssg) contempla generar HTML de rutas conocidas en build. Es viabilidad arquitectónica, **no una prueba de concepto ejecutada** en este repositorio.

Diseño mínimo propuesto:

1. Allowlist compartida de rutas/metadatos comerciales, origen canónico fijo y contenido de los componentes actuales; ampliar `useDocumentMeta`, evitando una librería SEO nueva.
2. Entry de build que importe solo páginas públicas con un router compatible con servidor. No importar directamente `router.jsx`: instancia `createBrowserRouter` al evaluar el módulo y arrastra módulos privados dependientes del navegador.
3. Renderizar body y head por ruta. Los `useEffect` actuales no se ejecutan en servidor: title/description/canonical/robots/OG deben emitirse explícitamente desde la misma definición pública. Sin peticiones API ni modelos de IA.
4. Distinguir HTML prerenderizado y shell SPA. Usar hidratación compatible en páginas públicas y `createRoot` en shell operativo; no llamar a `hydrateRoot` sobre un snapshot arbitrario sin demostrar paridad. [Contrato de hidratación de React](https://react.dev/reference/react-dom/client/hydrateRoot).
5. Servir archivos públicos antes del fallback, redirects y 404 reales. Las rutas conocidas `/app/*`, acceso y portales conservan su shell y sus guardias. No enviar todas las rutas al nuevo `/index.html` comercial.
6. Workbox debe calcular revisiones tras disponer del HTML definitivo; no sobrescribir `dist/index.html` después de generar un precache que contiene su hash anterior. Fallback operativo separado, estrategia explícita para páginas públicas y regresiones offline. [Precache y assets de Vite PWA](https://vite-pwa-org.netlify.app/guide/static-assets).
7. Publicar solo artefactos cliente/HTML previstos; excluir bundles del entry de servidor, datos de test y perfiles de navegador. No cambiar los proveedores frontend/API ni mezclar Laravel con el render de marketing.

Riesgos concretos: discrepancias de hidratación, head duplicado, shell noindex servido a páginas indexables, portada precacheada en lugar de login/portal, API tragada por el rewrite, 404 que rompe enlaces profundos legítimos y copias de marketing fuera de sincronía. Mitigarlos con allowlist, reutilización y tests de artefacto desplegable antes de abrir más páginas.

## 10. Plan P0/P1/P2 y archivos afectados

Todas las acciones siguientes son **propuestas**. Deben convertirse en issues con aceptación verificable antes de implementar; este encargo documental no autoriza publicación ni cambios de producto.

| Orden | Prioridad | Trabajo                                                                 | Archivos previstos / superficie                                                                                                                                                              | Dependencia y criterio de cierre                                                                            |
| ----- | --------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 1     | P0        | Investigar respuestas 500 de portales sintéticos en producción          | Diagnóstico privado de despliegue/API; servicios/controllers/tests del portal solo si la causa lo requiere                                                                                   | Causa reproducida, inexistente 404, sin stack/datos y sin alterar tokens; issue independiente               |
| 2     | P0        | Acordar y corregir afirmaciones de entregas, IA y gratuidad             | `LandingPage.jsx`, `FeaturesPage.jsx`, `PricingPage.jsx`, `PrivacyPage.jsx`, `AboutProjectPage.jsx`, `SupportPage.jsx`, demo/capturas afectadas; `docs/support.md` y `docs/ai.md` si procede | Matriz copy–capacidad aprobada; distinguir local/publicado; revisión específica de privacidad               |
| 3     | P0        | Metadatos iniciales por ruta y exclusión de superficies operativas      | `frontend/index.html`, `src/hooks/useDocumentMeta.js`, `src/app/router.jsx`; definición pública mínima reutilizable y paso de generación de head si se necesita                              | Canonical correcto en HTTP y DOM, noindex operacional inicial, sin duplicados                               |
| 4     | P0        | Robots/sitemap y semántica de hosting                                   | Nuevos `frontend/public/robots.txt`, sitemap estático o generado desde allowlist; `frontend/vercel.json`, `frontend/docker/nginx.conf`; `docs/deployment.md`                                 | TXT/XML 200 correctos, alias 301/308, desconocida 404; assets/API/portales conservados                      |
| 5     | P0        | Headers antindexación de respuestas sensibles y política de referencias | Config de hosting; middleware Laravel mínimo, `backend/bootstrap/app.php` y tests si se centraliza allí; configuración HTTP existente                                                        | Sin auth/ownership changes; respuestas JSON/ICS/PDF y expiradas conservan contrato. Coordinar robots de API |
| 6     | P1        | SSG solo comercial con hidratación comprobada                           | `frontend/src/main.jsx`, router/entry público mínimo, `frontend/vite.config.js`, `frontend/package.json` y/o scripts de build; `frontend/Dockerfile` si cambia el pipeline                   | HTML con contenido sin JS, sin acceso a negocio; PWA y navegación profundas pasan                           |
| 7     | P1        | Posicionamiento y respuestas GEO; OG absoluto y schema real             | Páginas comerciales y hook/definición de metadata; assets OG solo si se necesita una imagen específica                                                                                       | Nombre/audiencia/precio/capacidades coherentes; schema parseable sin reseñas inventadas                     |
| 8     | P1        | Reparar navegación 640–1023 px y contraste                              | `MarketingHeader.jsx`, `MarketingFooter.jsx`, clases puntuales de páginas                                                                                                                    | Descubrimiento y legibilidad sin rediseño; comprobar 390/768/1280 px                                        |
| 9     | P1        | Regresiones SEO de artefacto y smoke público                            | Tests de metadata, `MarketingPages.test.jsx`, `LandingPage.test.jsx`, tests demo/support; nueva spec comercial en `e2e/`; suite PWA y `.github/workflows/production-smoke.yml`               | Assertions sobre HTML/headers reales, no solo jsdom. No eliminar el smoke de login/API existente            |
| 10    | P1        | Validación posterior a publicación autorizada                           | Search Console/Bing y `docs/testing.md`, `docs/architecture.md`, `docs/deployment.md`; `docs/roadmap.md` solo al implementar                                                                 | Sitemap aceptado y URLs inspeccionadas; no equiparar solicitud a indexación                                 |
| 11    | P2        | Imágenes responsive, lazy privado y CSS solo con medición               | Imágenes `frontend/public/product/`, `BrandLogo`, páginas comerciales, `router.jsx` y `lazyRoute`                                                                                            | Comparación antes/después con mismo perfil; no degradar LCP/CLS ni navegación                               |
| 12    | P2        | Seguimiento de captación y búsquedas reales                             | Herramientas existentes e informes, sin datos operativos                                                                                                                                     | Línea base de impresiones/clics/altas útiles; revisar 2–4 semanas y ajustar por evidencia                   |

No se propone migración de datos, modificación de contratos de dominio ni nueva dependencia runtime. Si se necesita alguna, justificarla en su issue antes de incorporarla; la presencia de React DOM, Vite y Playwright permite evaluar las opciones sin instalar un framework.

## 11. Pruebas existentes, resultados y criterios de aceptación

### 11.1 Ejecutado en esta auditoría

| Comprobación                                                             | Resultado real                                        | Alcance y límite                                                                  |
| ------------------------------------------------------------------------ | ----------------------------------------------------- | --------------------------------------------------------------------------------- |
| HTTP de rutas públicas, acceso, shell privado, variantes, robots/sitemap | Ejecutado; fallos descritos en §3                     | Sin login ni datos reales                                                         |
| HTTP API sin credenciales y tokens sintéticos                            | 401 esperado en clientes; 500 inesperados en portales | No valida recursos ajenos ni causas de error                                      |
| DOM de cinco páginas públicas, `/support`, navegación Pricing → Login    | Ejecutado                                             | Verifica diferencias de head y texto publicado; no crawler de Google real         |
| Navegación a 768 px                                                      | FAIL de disponibilidad de menú principal              | No es una auditoría responsive de todos los tamaños                               |
| Lighthouse                                                               | 12 ejecuciones con salida 0                           | Diez principales y dos repeticiones; métricas en §7                               |
| Vitest seleccionado                                                      | **PASS: 5 archivos, 59 tests**                        | Landing, MarketingPages, Demo, Support y supportLinks locales                     |
| PHPUnit seleccionado                                                     | **PASS: 39 tests, 222 assertions**                    | PublicPortal, PublicDeliverySecurity, ContractPortal y WorkspaceOwnership locales |
| Lint/build/suites completas/Playwright local                             | **NOT RUN**                                           | Cambio solo documental; no certificar implementación de SSG todavía inexistente   |
| Search Console/Bing/CrUX/INP real/dispositivos físicos                   | **NOT RUN**                                           | Requieren datos/acceso o ejecución adicional                                      |

Comandos de pruebas realmente ejecutados:

```powershell
pnpm --dir frontend run test -- src/pages/LandingPage.test.jsx src/pages/MarketingPages.test.jsx src/pages/DemoPage.test.jsx src/pages/SupportPage.test.jsx src/utils/supportLinks.test.js
# Desde backend/:
php artisan test --filter='PublicPortalTest|PublicDeliverySecurityTest|ContractPortalTest|WorkspaceOwnershipTest'
```

Las pruebas actuales verifican copy y flujos de componentes, no HTML inicial/canonical/robots/sitemap. **`MarketingPages.test.jsx` obliga a mostrar “Almacenamiento de galerías”**, consolidando una afirmación desactualizada: que pase no prueba exactitud comercial. Cambiar esa expectativa junto con la corrección del copy, manteniendo la cobertura de separación entre datos locales, API y proveedores externos.

Reutilizar `PublicDeliverySecurityTest`, `PublicPortalTest`, `ContractPortalTest`, `WorkspaceOwnershipTest`, `WorkspaceAssociationSecurityTest`, pruebas de redacción Sentry/logs y specs `auth-resilience`, `isolation`, `deliveries`, `contract-portal`. `e2e/pwa/offline.spec.js` ya verifica shell/login offline y ausencia de API/modelos en caché; extenderla, no sustituirla. El smoke productivo actual solo comprueba shell de `/login` y salud API, por lo que puede pasar con marketing/sitemap defectuosos. La configuración E2E principal usa Vite dev: no prueba por sí sola rewrites/SSG/headers de Vercel ni Nginx.

### 11.2 Aceptación verificable para implementación

| ID    | Criterio                                                                                         | Cómo verificar                                                                                                                                                                                                                                                                |
| ----- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-01 | Solo la allowlist comercial se emite como HTML indexable                                         | Inspeccionar artefactos de build y sitemap. Ausencia de rutas `/app`, tokens, clientes, JSON de auth y datos de fixtures                                                                                                                                                      |
| AC-02 | Cada página pública tiene title/description propios, un canonical propio absoluto y OG coherente | GET sin JS + parser HTML + DOM después de hidratar y tras navegación interna/back. Exactamente una etiqueta de cada tipo; sin parámetros                                                                                                                                      |
| AC-03 | H1, explicación principal, enlaces y CTA están en HTML inicial                                   | HTTP y navegador con JS desactivado sobre build de producción. Texto real, no loader ni copia oculta para bots                                                                                                                                                                |
| AC-04 | Robots y sitemap son archivos reales                                                             | 200 `text/plain` y 200 XML parseable; Sitemap absoluto; solo URLs finales, sin redirects/noindex/soft 404                                                                                                                                                                     |
| AC-05 | Exclusión de acceso/CRM/portales funciona antes de JS                                            | Headers/meta de GET a acceso, `/app/*`, portales sintéticos, reset/verificación. Sin canonical/OG que contengan tokens; controles de API conservados                                                                                                                          |
| AC-06 | HTTP semántico sin romper SPA                                                                    | HTTPS en un salto, alias/security/index/barra final normalizados solo donde procede, desconocida 404. Deep links privados y portales siguen cargando su shell; assets ausentes no devuelven HTML 200                                                                          |
| AC-07 | No se debilitan aislamiento y consentimiento                                                     | Propietario/miembro legítimo permitido; externo 404; sin sesión 401 en API; token desconocido/expirado/revocado/borrador 404; sin payloads privados en HTML, head, schema o logs                                                                                              |
| AC-08 | Build público sin datos o dependencias de negocio                                                | Ejecutar build en contexto limpio con API inaccesible y sin credenciales. Cero peticiones a API productiva/modelos/proveedores; snapshots deterministas                                                                                                                       |
| AC-09 | PWA y actualizaciones siguen operativas                                                          | Suite build offline: login/portales válidos no se convierten en landing; públicos correctos online; precache con revisiones finales; ninguna respuesta API/modelo/estado autenticado cacheado                                                                                 |
| AC-10 | Copy coincide con implementación publicada                                                       | Matriz de claims con revisión de Landing/Features/Pricing/Privacy/About/Demo/Support; sin alojamiento/favoritos propios ni pagos no existentes; sin canales de apoyo ficticios                                                                                                |
| AC-11 | Metadatos resisten navegación SPA                                                                | Home → Features → Pricing → Login → atrás, y acceso a About/Support: título/canonical/robots correctos, sin valores heredados ni duplicados. Probar desmontaje del hook                                                                                                       |
| AC-12 | Schema válido y honesto                                                                          | JSON parseable y validador schema.org; Rich Results Test sin URL/token de cliente. Aceptar que no hay rich result de software si faltan reseñas reales                                                                                                                        |
| AC-13 | Rendimiento y legibilidad preservados                                                            | Tres Lighthouse por perfil/ruta comercial antes/después en el mismo entorno; comparar mediana y dispersión. Objetivo propuesto: mediana LCP ≤2,5 s, CLS ≤0,1, TBT ≤200 ms y rendimiento ≥95, sin regresión inexplicada. Son objetivos de laboratorio, no PASS actual de campo |
| AC-14 | Menú, contenido y registro accesibles                                                            | 390/768/1280 px, teclado/foco, contraste normal ≥4,5:1; CTA y enlaces comerciales utilizables sin overflow. Capturas con datos ficticios                                                                                                                                      |
| AC-15 | Publicación verificada separadamente de build local                                              | Tras autorización: comprobar SHA/build publicado, HTTP/DOM, sitemap aceptado, inspección de URLs y canonical elegido en Search Console. No marcar “indexado” solo por devolver 200                                                                                            |

En la implementación ejecutar los checks proporcionales y, al afectar frontend/recorrido/API, los gates del repositorio (`pnpm run lint`, `pnpm run test`, `pnpm run build`, `pnpm run test:e2e`) y las regresiones PWA. Añadir comprobaciones de **build servido con configuración equivalente a producción**: Vitest y Vite dev no validan las reglas del hosting. Instalar herramientas o navegadores solo fuera de la restricción actual y con autorización aplicable.

## 12. Problemas potenciales y verificaciones pendientes

| Cuestión                                                 | Qué se sabe                                                                                                                             | Qué falta para concluir                                                                                                                       |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Cobertura y canonical seleccionado por Google            | Canonical entregado incorrecto                                                                                                          | Search Console: inspección de las cinco URLs, cobertura, exclusiones, render HTML y sitemaps                                                  |
| Aparición real en buscadores con IA                      | HTML poco accesible sin JS y claims contradictorios                                                                                     | Logs de bots legítimos, pruebas de consulta documentadas y referencias recibidas. No hay evidencia de una exclusión general por WAF           |
| Motivo de 500 en portales productivos                    | Respuesta repetida 500; contrato local 404 y tests PASS                                                                                 | Logs redactados, release/migraciones/configuración y reproducción aislada. No asumir sin evidencia un fallo de esquema, Render o autorización |
| Experiencia PWA antigua                                  | En primera apertura del navegador se observó tránsito a login; apertura posterior de `/` y Lighthouse limpio sirvieron landing correcta | No se reprodujo un redirect persistente de portada. Revisar actualización/SW si usuarios lo reportan; no afirmar que portada redirige siempre |
| Core Web Vitals reales                                   | Lighthouse alto, LCP móvil de portada al límite                                                                                         | CrUX/Search Console/RUM suficiente para LCP/INP/CLS p75; no inventar métricas cuando falte muestra                                            |
| Disponibilidad de funciones audiovisuales en producción  | Módulos y pruebas locales presentes                                                                                                     | QA autenticada autorizada sobre release identificado antes de ampliar claims públicos                                                         |
| Declaraciones legales y seguridad operativa              | Página técnica de privacidad y configuración documentada                                                                                | Exactitud sobre responsables, conservación, derechos, terceros y TLS operativo. No equivale a revisión jurídica ni aprobación de cumplimiento |
| Capturas y demo alineadas con producto actual            | Textos heredados de galerías/favoritos; capturas comerciales existentes                                                                 | Comparar visualmente con release vigente y renovar solo las que describan capacidades que ya no existen                                       |
| Impacto real del code splitting y compresión de imágenes | JS no usado y bytes de imágenes medidos                                                                                                 | Experimento acotado antes/después; no afirmar ahorro o mejora sin implementarlo y medirlo                                                     |
| Preview social                                           | Imagen accesible y OG genérico/relativo                                                                                                 | Prueba específica de plataformas con URL comercial pública; nunca validar portales de clientes                                                |

**Resultado de la auditoría inicial:** documento y plan verificable. La implementación posterior se registra por separado a continuación; producción no ha sido modificada.

## 13. Implementación local P0/P1

Estado: **implementado localmente, sin commit/push/deploy**. El encargo explícito del usuario autoriza la ejecución de estas fases sobre la rama actual. La búsqueda de issues SEO no devolvió resultados; no se crearon issues ni PR. No se añadieron dependencias, migraciones ni variables de entorno. Los cambios previos del workspace se conservaron; se registró una baseline SHA-256 fuera del repositorio antes de editar.

### 13.1 Cambios implementados

- `frontend/src/app/seo.js`: allowlist de seis rutas (`/`, `/features`, `/pricing`, `/privacy`, `/about-project`, `/support`), títulos/descripciones propios, canonical absoluto a cada ruta, OG coherente e imagen absoluta. Schema público `WebSite`/`SoftwareApplication`, precio 0 EUR, sin valoraciones/reseñas inventadas. No se garantiza un rich result.
- `RouteMetadata.jsx` y `useDocumentMeta.js`: único gestor de head durante navegación, retirada de canonical/OG/schema públicos en acceso, demo, CRM, portales y desconocidas; `noindex, nofollow, nosnippet`. No incorpora params, tokens, IDs, datos de sesión ni emails al head. Parámetros sensibles conocidos (`token`, `signature`, `email`) no se usan como canonical; las variantes UTM conservan canonical limpio.
- `publicRoutes.jsx` y `prerender.jsx`: componentes existentes con el mismo árbol inicial de providers y router en memoria durante build. Solo se permite prerender comercial; no se ejecutan efectos de auth, consultas de negocio ni descargas de IA. La igualdad del árbol incluye el contenedor de toasts: omitirlo produjo un error de hidratación en la primera prueba y se corrigió antes de aceptar el build.
- `frontend/scripts/publicSeo.mjs` y `vite.config.js`: generación de HTML en `generateBundle`, antes del cálculo de revisiones Workbox en `closeBundle`. Se emiten seis documentos comerciales, `app-shell.html` vacío/noindex y `404.html`, además de robots TXT y sitemap XML desde la allowlist. No se publica un bundle SSR ni hay un servidor SSR runtime.
- `main.jsx`: `hydrateRoot` solo en documentos marcados como prerenderizados; `createRoot` en el shell operativo. Los módulos/guardias privados siguen siendo SPA. Se reutiliza React Router sin migración de framework.
- `frontend/vercel.json`: rutas ordenadas para alias 308, queries sensibles conocidas, páginas comerciales, archivos, shell operativo y 404 real. `frontend/docker/nginx.conf` aplica separación equivalente. Vite preview interpreta las reglas del repositorio para las pruebas locales; su resultado no certifica el edge de Vercel ni el binario Nginx.
- PWA: fallback al shell únicamente para rutas operativas conocidas; HTML comercial precacheado con hashes del contenido final. Se conserva exclusión de API y modelos y la estrategia existente de imágenes. No se modifica la apariencia ni las animaciones.
- `ExcludeSearchIndexing` global de Laravel: `X-Robots-Tag: noindex, nofollow, nosnippet`, `Referrer-Policy: no-referrer` y `Cache-Control: private, no-store` en API, incluidos errores. No cambia payloads, estados de dominio, autenticación, autorización, validación, CORS ni caducidad/revocación.
- Copy: Landing, Features, Privacy y About describen enlaces externos, revisión/aprobación, historial WebGPU en IndexedDB y acceso por estudios autorizados. Se retiran promesas de alojamiento/favoritos propios y de cobros automáticos. Gratuidad y apoyo voluntario se distinguen del estado beta; se reutilizan Pricing/Support existentes, sin activar canales reales. Los estilos no se editaron.
- Regresiones: nuevos tests de política/head, render comercial y claims, `SearchIndexingTest`, y suite SEO del artefacto dentro de `pnpm run test:pwa`. Smoke remoto ampliado sin retirar comprobaciones previas de login/salud.

### 13.2 Investigación de los 500 productivos

Se repitieron GET sin sesión con identificadores sintéticos nuevos en entregas, contratos y reservas; los tres devolvieron 500 JSON genérico, sin stack ni datos privados. La sonda pública `/api/health` devolvió 200: API, base de datos, almacenamiento y caché `up`; Ollama `degraded`. Esto descarta atribuir sin más el fallo a una indisponibilidad general de conexión a DB, pero **no comprueba esquema/migraciones ni identifica la causa**.

En código, las búsquedas desconocidas terminan en `firstOrFail`/404. La nueva prueba reproduce HTTP 404 local con debug desactivado para entregas, contratos, estudios y calendario. También verifica que un error inesperado auténtico permanezca 500 sin datos de excepción: **no hay catch genérico que convierta errores de infraestructura en “no encontrado”**.

**Pendiente/bloqueado:** diagnóstico de ese despliegue, release efectiva y logs redactados. No se accedió a credenciales/recursos reales ni se ejecutaron migraciones o acciones productivas. No existe evidencia suficiente para corregir una causa de código del 500 sin especular. Requiere investigación operativa autorizada antes de declarar los portales productivos validados.

### 13.3 Evidencia de validación local

Las suites de componentes y el build se ejecutan sobre el estado local con cambios previos del repositorio. La suite E2E usa sus cuentas/base SQLite ficticias; la suite SEO/PWA sirve el build y no necesita backend ni sesión. Los errores iniciales de syntax/hidratación se corrigieron y las pruebas fallidas se volvieron a ejecutar; no se redujeron gates ni se borró cobertura.

| Validación                                 | Estado actual | Evidencia                                                                                                                                                         |
| ------------------------------------------ | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lint frontend y Pint backend               | PASS          | `pnpm run lint`                                                                                                                                                   |
| Formato de fuentes frontend                | PASS          | `pnpm --dir frontend run format:check`                                                                                                                            |
| Build con SSG y SW                         | PASS          | `pnpm run build`; seis documentos + shell/404 + TXT/XML; sin dependencia nueva                                                                                    |
| E2E SPA/API completo                       | PASS          | `pnpm run test:e2e`: 21 recorridos, 3,8 min                                                                                                                       |
| SEO del build y PWA offline                | PASS          | `pnpm run test:pwa`: 10 pruebas; seis rutas con/sin JS, hidratación/back, HTML/head, tipos, XML parseable, hashes finales, 308/404, noindex y vistas 390/768/1280 |
| Apoyo voluntario configurado sintético     | PASS          | `pnpm run test:support`: 1 prueba; sin contactos/pagos reales                                                                                                     |
| Backend focalizado de indexación           | PASS          | `SearchIndexingTest`: 4 tests, 42 assertions; 401/404/500 y éxito                                                                                                 |
| Docker/Nginx real                          | BLOCKED       | Docker CLI presente, daemon `dockerDesktopLinuxEngine` no disponible; no se instaló ni arrancó infraestructura                                                    |
| Vercel/Actions/producción del nuevo código | NOT RUN       | Sin push, deploy ni dispatch. El smoke nuevo está preparado, no ejecutado remotamente                                                                             |
| Search Console/Bing/CrUX/Rich Results Test | NOT RUN       | Sin acceso/configuración o publicación autorizada; no se envían URLs de clientes                                                                                  |

`pnpm run test` completo terminó con salida 0: **249 tests backend (2.206 assertions), 228 tests frontend en 42 archivos y 9 tests de tooling/auditoría**. Los 21 E2E SPA/API, 10 SEO/PWA y 1 de apoyo configurado también pasaron. `pnpm run lint`, `format:check` y `pnpm run build` finales terminaron con salida 0. No existe un comando typecheck aplicable al frontend JavaScript; no se inventa ese resultado.

La revisión de routing añadió casos negativos con `?token=...`: solo las rutas comerciales conocidas reciben el shell por query sensible. Una URL inexistente o `/api` frontal conserva 404, y robots/assets existentes conservan su tipo. No se aplica una reescritura global basada en queries. Una regresión específica falló antes de acotar la regla y pasó después.

#### Lighthouse local final: 36 ejecuciones

Se midieron **seis rutas × dos perfiles × tres repeticiones**, Lighthouse 13.5.0/Chrome 156, sobre `http://127.0.0.1:5276` sirviendo el build. Perfiles móvil/escritorio y throttling equivalentes a §7; `--headless --disable-gpu`, sin sesión ni paquetes nuevos. 36 salidas 0, sin runtime errors ni run warnings. Los hashes de bundles y HTML no cambiaron en el build de cierre respecto al medido.

| Ruta             | Rendimiento móvil (mediana) | LCP móvil (mediana, s) | Rendimiento escritorio (mediana) | LCP escritorio (mediana, s) | SEO en ambos perfiles |
| ---------------- | --------------------------: | ---------------------: | -------------------------------: | --------------------------: | --------------------: |
| `/`              |                          90 |                  3,230 |                              100 |                       0,785 |                   100 |
| `/features`      |                          85 |                  3,887 |                               99 |                       0,846 |                   100 |
| `/pricing`       |                          95 |                  2,406 |                              100 |                       0,549 |                   100 |
| `/privacy`       |                          90 |                  3,207 |                              100 |                       0,691 |                   100 |
| `/about-project` |                          95 |                  2,406 |                              100 |                       0,708 |                   100 |
| `/support`       |                          95 |                  2,405 |                              100 |                       0,548 |                   100 |

CLS fue 0 en las 36 muestras; TBT máximo 7 ms. Accesibilidad: 95 en portada/Features/Pricing, 96 Privacy, 100 About y 94 Support; buenas prácticas 100. Persisten advertencias de contraste de los estilos existentes. **El objetivo móvil de AC-13 no se cumple en portada, Features y Privacy**. La prueba local y la medición productiva inicial no comparten versión/hosting/red: no se puede atribuir cuantitativamente una mejora o regresión al cambio SEO. Es necesario comparar una baseline local equivalente antes de optimizar.

La imagen principal ya está en HTML inicial; no se mantiene el fallo original de descubrimiento dependiente de JS. Esto no garantiza por sí solo menor LCP: en la muestra móvil de portada, Lighthouse estima CSS bloqueante de unos 21 kB transferidos/451 ms y conserva el coste del JS inicial. Su insight observó como LCP una etiqueta de cabecera y 71 ms en la traza real, frente al LCP simulado de 3,230 s. No confundir esos dos valores ni convertir la simulación en dato de campo. No se alteraron animaciones para manipular la medición.

Informes JSON/HTML y `summary.json`: `C:\Users\alexv\AppData\Local\Temp\lumaflow-seo-implementation-20261102\`, 36 de cada formato. Nombres `home|features|pricing|privacy|about-project|support` + `-mobile|desktop-1|2|3.report.json|html`. Son artefactos temporales locales. El comando de §7 se reutilizó sustituyendo URL y output path; no se ejecutó Lighthouse sobre portales ni datos reales.

Capturas locales de portada, generadas por la suite del build con datos ficticios, en `e2e/test-results/pwa/seo-commercial-content-and-7bbda-op-tablet-and-mobile-widths/home-{390,768,1280}.png`. No son evidencia de dispositivos físicos ni de producción.

Las suites E2E existentes también regeneraron tres artefactos de documentación que ya estaban presentes: `docs/screenshots/sprint5-delivery-mobile.png`, `docs/screenshots/sprint6-support-mobile.png` y `docs/screenshots/sprint6-support-configured-mobile.png`. Se dejan como evidencia local de los tests; no representan un rediseño ni capturas de datos reales. No se restauraron desde Git porque esos archivos formaban parte del trabajo previo sin seguimiento.

### 13.4 Estado de los 15 criterios de aceptación

| Criterio                                 | Estado                           | Evidencia y límite                                                                                                                                                                             |
| ---------------------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-01 — allowlist de HTML indexable      | PASS local                       | Ocho HTML emitidos en total: seis comerciales, shell vacío y 404. Sitemap solo con los seis públicos; prueba de artefacto                                                                      |
| AC-02 — metadatos propios sin duplicados | PASS local                       | HTTP del build y DOM tras hidratación, registro/back; OG y canonical absolutos. Hosting productivo pendiente                                                                                   |
| AC-03 — contenido sin JS                 | PASS local                       | H1, enlaces y CTA visibles con JS desactivado en las seis páginas                                                                                                                              |
| AC-04 — robots/sitemap reales            | PASS local                       | TXT/XML 200, XML parseado y conjunto de URLs exacto                                                                                                                                            |
| AC-05 — noindex operacional inicial      | PASS local                       | Shell y headers sin canonical/token para acceso, CRM, portales y queries conocidas; API verificada en éxito y errores                                                                          |
| AC-06 — semántica HTTP                   | PARTIAL                          | Alias 308, desconocidas/assets/API frontal 404 y deep links operativos probados. HTTPS del proveedor y Nginx real pendientes                                                                   |
| AC-07 — aislamiento/privacidad           | PASS local / BLOCKED producción  | Suites de ownership/portales/E2E conservadas; error inesperado sigue 500 sin detalles. Los 500 reales no están diagnosticados                                                                  |
| AC-08 — render sin sesión/API            | PASS local                       | Render rechaza rutas privadas; spies comprueban que no lee el token ni llama fetch. Build Node sin efectos cliente. No serializa datos/entorno                                                 |
| AC-09 — PWA/hashes/actualizaciones       | PARTIAL                          | Instalación y recarga offline, shell correcto, soporte offline, precache final y exclusión API/IA PASS. Migración desde workers productivos antiguos pendiente                                 |
| AC-10 — copy/capacidades                 | PASS local / PARTIAL release     | Claims actualizados y tests; canales reales desactivados. Publicar y contrastar capturas históricas con el release final sigue pendiente                                                       |
| AC-11 — navegación SPA/head              | PASS local                       | Cada página comercial → registro → atrás, metadatos privados y retorno sin duplicados; tests de hook                                                                                           |
| AC-12 — schema válido y honesto          | PARTIAL                          | JSON parseado, entidades/precio verificados y sin reviews ficticias. Validador externo/Rich Results no ejecutados; no se promete resultado enriquecido                                         |
| AC-13 — rendimiento                      | PARTIAL / objetivo móvil abierto | Lighthouse repetido por ruta/perfil; primeras muestras móviles no alcanzan LCP ≤2,5 s/rendimiento ≥95. No hay baseline local equivalente para atribuir una regresión o mejora; ver tabla final |
| AC-14 — responsive/accesibilidad         | PARTIAL                          | H1/CTA sin overflow y capturas a 390/768/1280. Contraste y hueco de navegación de la auditoría se conservan por la restricción de no modificar diseño; no se certifica accesibilidad completa  |
| AC-15 — publicación/indexación real      | BLOCKED                          | No autorizadas en este encargo. No se equipara HTTP local 200 ni SEO 100 con indexación o canonical elegido por Google                                                                         |

### 13.5 Riesgos y trabajo pendiente

1. Investigar los 500 de producción con logs redactados y release/esquema verificados. No ejecutar cambios destructivos ni migraciones a ciegas.
2. Validar Vercel y Nginx reales, transición desde PWA antigua y Search Console/Bing después de una publicación autorizada. Las reglas se contrastaron con la [configuración de routing de Vercel](https://vercel.com/docs/build-output-api/configuration) y sus [tipos oficiales](https://github.com/vercel/vercel/blob/main/packages/routing-utils/src/types.ts); las pruebas de preview cubren solo el subconjunto usado aquí.
3. Medir y resolver el rendimiento móvil en una tarea acotada con baseline equivalente: estilos/animaciones, compresión de imágenes y lazy-loading amplio no se cambian dentro de este encargo. El warning de chunks >500 kB permanece visible.
4. Revisar contraste/menú intermedio cuando se autorice ese cambio visual. Los CTAs probados siguen utilizables; no se afirma cumplimiento total por tener Lighthouse alto.
5. Confirmar veracidad de capturas y disponibilidad audiovisual contra el release publicado; no activar perfiles de apoyo ni inventar condiciones.

No se ha cambiado la autenticación, autorización, schema de DB ni contenido de recursos del CRM. `package.json`, `frontend/package.json`, `pnpm-lock.yaml`, guardia/auth y CSS principal se contrastaron con la baseline y permanecen iguales a su estado previo a esta tarea.

## 14. Publicación aislada desde origin/main

El usuario autorizó una rama SEO independiente al comprobar que `feat/backup-b2-storage` tenía nueve commits locales previos sin publicar y numerosos cambios de otros sprints. Rama de publicación: `feat/seo-geo-public-pages`, creada desde `origin/main` **03676ea496b22d6538f4c2fcb0671bf6592e64ff**, sin esos commits. El checkout original conserva su rama, código y staging; no se traslada ni elimina su trabajo.

### Alcance revisado

Se incluyen únicamente metadatos, head/navegación, HTML comercial estático, shell/404, robots/sitemap, headers de indexación, corrección de copy, tests SEO/PWA y documentación. `SupportPage`, su validador de URLs y sus tests ya existían en el trabajo local: son dependencias necesarias del sexto documento comercial aprobado. Se incorporan sin perfiles reales, SDK de pagos, backend de donantes ni activación remota. El footer enlaza esa página. No se copian funcionalidades de proyectos, briefing, rodaje, workflows, revisiones de entrega, backups, cambios de ownership, migraciones ni upgrades de dependencias.

En documentos compartidos se trasladan solo las secciones SEO; se excluyen los bloques de otros sprints y el reformateo ajeno. `package.json` añade únicamente `test:pwa`; los manifiestos de dependencias y lockfiles permanecen iguales a `origin/main`. CI incorpora build y pruebas SEO/PWA al recorrido E2E existente, sin retirar checks. El smoke público conserva login y salud y añade HTML/canonical/TXT/XML.

Las únicas capturas incluidas son [portada móvil](screenshots/seo-home-mobile.png) y [portada escritorio](screenshots/seo-home-desktop.png), obtenidas del build aislado, sin sesión y con imágenes/datos de demostración. Se excluyen las capturas de sprints anteriores. Los PNG contienen exclusivamente chunks IHDR/IDAT/IEND, sin EXIF ni texto de metadatos. Los informes Lighthouse, logs, `.env`, claves de pruebas, bases SQLite, node_modules/vendor y dist quedan fuera del commit.

### Validación del conjunto publicable

| Gate                      | Resultado de esta rama                                                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Instalación reproducible  | `pnpm install --frozen-lockfile` y `composer install --no-interaction --prefer-dist`: PASS; no se actualizan lockfiles                                 |
| Lint                      | `pnpm run lint`: PASS                                                                                                                                  |
| Formato                   | `pnpm --dir frontend run format:check`: PASS. Se normalizaron CRLF solo en el checkout Windows aislado, sin cambios de contenido ni diff adicional     |
| Build                     | `pnpm run build`: PASS; seis HTML comerciales, shell, 404, TXT/XML y SW con 25 entradas; Vite 8.2.1 de la base remota                                  |
| Tests completos           | `pnpm run test`: PASS, **170 backend / 822 assertions y 193 frontend / 32 archivos**                                                                   |
| E2E existentes            | `pnpm run test:e2e`: PASS, **15 recorridos**, 1,2 min                                                                                                  |
| SEO/PWA del artefacto     | `pnpm run test:pwa`: PASS, **10 pruebas**, incluyendo hidratación, sin JS, privacidad de shell/head, 308/404, queries, tipos, sitemap y precache final |
| Smoke remoto              | Sintaxis del JavaScript comprobada con Node; ejecución remota pendiente de publicación/evento del proveedor                                            |
| Secretos/artefactos       | Escaneo de firmas de credenciales sin hallazgos; revisión manual de diff, ficheros y capturas. Escaneo final sobre staging sin hallazgos antes del commit                |
| Auditoría pnpm producción | **FAIL heredado:** 15 avisos, 10 altos y 5 moderados, en Axios/follow-redirects del lockfile remoto                                                    |
| Auditoría Composer        | **FAIL heredado:** avisos en dompdf/dompdf, laravel/framework, league/commonmark, league/flysystem, symfony/http-foundation y symfony/mime             |

Los avisos de dependencias se contrastan con manifiestos/lockfiles sin cambios respecto a la base. No se importan silenciosamente los commits de seguridad excluidos, ni se actualizan versiones para ocultar ese resultado. **Esta rama está preparada para revisión, no aprobada para producción.** Los contadores de §13 pertenecen al workspace ampliado anterior y no se atribuyen a este commit aislado.

### Cobertura de los 15 criterios en la rama aislada

| Criterio | Estado publicable                                                                                                                                                                                                                                   |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-01    | PASS: allowlist de seis rutas y conjunto exacto de HTML/sitemap                                                                                                                                                                                     |
| AC-02    | PASS local: title/description/canonical/OG propios en HTTP y DOM, sin duplicados                                                                                                                                                                    |
| AC-03    | PASS: seis páginas con contenido y CTA sin JS                                                                                                                                                                                                       |
| AC-04    | PASS: robots TXT y sitemap XML reales/parseables                                                                                                                                                                                                    |
| AC-05    | PASS local: shell operacional noindex y headers API; sin tokens en head/HTML generado                                                                                                                                                               |
| AC-06    | PARTIAL: 308/404 y deep links probados localmente; HTTPS/provider/Nginx reales pendientes                                                                                                                                                           |
| AC-07    | PARTIAL: 15 recorridos e independencia de auth/API conservados. No se publican aquí los endurecimientos previos de los portales; no se certifican todos sus estados de expiración/revocación/relaciones. Los 500 productivos siguen sin diagnóstico |
| AC-08    | PASS local: render comercial acotado sin lectura de token ni fetch de negocio                                                                                                                                                                       |
| AC-09    | PARTIAL: instalación/offline/hash final PASS; transición desde PWA productiva antigua pendiente                                                                                                                                                     |
| AC-10    | PASS de copy local; funcionalidades audiovisuales específicas no incluidas ni anunciadas como implementadas. Canales de apoyo sin activar                                                                                                           |
| AC-11    | PASS: navegación comercial → registro → atrás, sin heredar canonical público en privado                                                                                                                                                             |
| AC-12    | PARTIAL: schema parseable y honesto; validador externo/rich result no comprobados                                                                                                                                                                   |
| AC-13    | PARTIAL: 12 mediciones nuevas del build aislado, SEO 100 en todas; rendimiento móvil 86–96 y escritorio 100. LCP móvil 2,33–3,69 s; objetivo móvil abierto. Las 36 muestras de §13 son históricas                                                                                                                         |
| AC-14    | PARTIAL: CTA y contenido comprobados a 390/768/1280; no se modifica contraste ni navegación visual                                                                                                                                                  |
| AC-15    | Pendiente: push/SHA remoto/CI se informan tras publicación; no hay despliegue manual ni verificación de indexación real                                                                                                                             |

### Límites de publicación

No se cambia configuración remota de Vercel, Render o Nginx; los archivos de configuración versionados son parte del SEO revisado. No hay deploy manual, migraciones remotas, merge ni activación de donaciones. CI solo se dispara para `main` y PRs contra `main`: un push a la nueva rama no implica una ejecución de CI. El SHA del commit y el estado remoto se comunican después del push; no se inventa un resultado anticipado.

Antes de una aprobación de producción siguen abiertos los avisos de dependencias, los 500 de portales, el rendimiento móvil, el edge/Nginx real, workers antiguos y Search Console/Bing. Una CI funcional verde no cierra por sí sola esos riesgos.

### Lighthouse final del build aislado

Lighthouse 13.5.0, preview local del build de esta rama, una medición por página/perfil (12 en total); sin errores de ejecución. No son métricas de producción ni datos de campo.

| Ruta | Rendimiento móvil / escritorio | SEO ambos | LCP móvil / escritorio (s) | Accesibilidad ambos |
| --- | --- | --- | --- | --- |
| / | 93 / 100 | 100 | 2,93 / 0,76 | 95 |
| /features | 86 / 100 | 100 | 3,69 / 0,75 | 95 |
| /pricing | 96 / 100 | 100 | 2,33 / 0,51 | 95 |
| /privacy | 91 / 100 | 100 | 3,10 / 0,66 | 96 |
| /about-project | 95 / 100 | 100 | 2,41 / 0,71 | 100 |
| /support | 96 / 100 | 100 | 2,33 / 0,55 | 94 |

Los informes JSON/HTML se conservan fuera del repositorio, en el directorio temporal `lumaflow-seo-publication-lighthouse`. No se cambian diseño, animaciones ni dependencias para mejorar estas cifras durante la preparación de publicación.


## 15. Bloqueos y verificación de la PR #50

### Preview exacto de 21dcafe

Vercel identifica el deployment `dpl_382jDHatoimiXkhNuBZwCUWGXrpi`, estado READY, SHA completo `21dcafe29c55a1b8c70e686276e1d8ffbe222a1d`, rama `feat/seo-geo-public-pages`, URL [lumaflow-studio-fl1e5bgll-aleviclop.vercel.app](https://lumaflow-studio-fl1e5bgll-aleviclop.vercel.app). Se verificó la asociación SHA/deployment mediante el conector, no mediante un alias de rama mutable.

El Preview exige Vercel Authentication. Se accedió con la sesión CLI existente y un OIDC de desarrollo efímero (`vercel env run`), sin desactivar protección, crear enlaces compartidos, modificar variables remotas ni persistir/imprimir el token. `vercel curl` devolvía todavía 302; ese intento no se contó como validación. Playwright solo adjunta el header a peticiones al origen Preview y bloquea terceros; trazas y capturas desactivadas para no guardar credenciales. Service workers bloqueados en ese smoke remoto; su actualización se prueba aparte.

**PASS: 7 pruebas remotas**, seis rutas y un recorrido de infraestructura:

- Seis respuestas HTML 200 con H1, títulos/descripciones y canonical absoluto de producción; contenido/CTA visibles con JS desactivado.
- Hidratación sin errores React y navegación comercial → registro → atrás; privado sin canonical y retorno sin duplicados.
- `robots.txt` 200 `text/plain`, `sitemap.xml` 200 `application/xml`, conjunto exacto de seis URLs de producción.
- Alias 308, desconocidas/assets/API frontal inexistentes 404; acceso, recuperación, CRM, portales sintéticos y query sensible reciben shell vacío noindex, sin canonical ni identificador en HTML.
- El header `X-Robots-Tag: noindex` de Vercel en las páginas públicas del **Preview es esperado**. No se elimina para aparentar indexabilidad del entorno. Los metadatos comerciales mantienen el canonical productivo.

Pruebas reutilizables: `e2e/playwright.preview.config.js` y `e2e/preview/seo.spec.js`. Ejecutar desde un entorno con acceso autorizado: `SEO_PREVIEW_URL=https://<deployment-exacto>.vercel.app pnpm --dir e2e exec playwright test --config=playwright.preview.config.js`. En Windows se puede envolver esa orden en `vercel env run --project lumaflow-studio --scope aleviclop -- ...`; el token no va en argumentos, fuentes ni logs. La variable selecciona únicamente el target del smoke y no modifica la aplicación.

### Producción permanece separada

[Production Smoke Checks 41513813116](https://github.com/AVL05/lumaflow-studio/actions/runs/41513813116) falló al exigir H1 en `/`: se activó tras el Preview pero consulta el dominio productivo fijo, donde se recibió el shell antiguo. No se han cambiado ni relajado sus expectativas, triggers, assertions ni estado. La CI funcional verde de `21dcafe` ([41517937995](https://github.com/AVL05/lumaflow-studio/actions/runs/41517937995)) no significa que la fase SEO esté publicada en producción.

### Seguridad: correcciones compatibles justificadas

Se inspeccionó `22a2eb89c1dc0a2779fdffa1c35d82222b23f215` de `feat/backup-b2-storage`. Contiene cambios de dependencias separables del resto del trabajo. Se recuperan únicamente sus manifiestos/locks de seguridad, manteniendo `test:pwa` y sin cherry-pick de funcionalidades, políticas, migraciones, CI ni otros sprints. No se introduce ninguna dependencia nueva ni se cruza un major instalado.

| Área | Versiones resultantes | Motivo |
| --- | --- | --- |
| Runtime JS | Axios 1.20.0; follow-redirects 1.16.2 | Avisos confirmados por auditoría; la rama antigua fijaba 1.16.1, aún afectada por [GHSA-mrwp-f3q8-3g9p](https://github.com/advisories/GHSA-mrwp-f3q8-3g9p); aquí se aplica 1.16.2 |
| Build/tests | Vite 8.2.4; Vitest/coverage 4.1.12 | Parches compatibles del bundler y runner utilizados por prerender/PWA |
| Transitivas | brace-expansion 2.1.7/5.0.12; fast-uri 3.1.9; serialize-javascript 7.1.3; source-map-js 1.2.2; undici 7.30.1 | Overrides de seguridad de la rama auditada, acotados a las mismas familias major |
| PHP | Laravel 13.30.0; dompdf 3.1.6; CommonMark 2.10.2; Flysystem 3.35.3; Symfony HttpFoundation/Mime 8.1.10 | Solo seis entradas de paquete cambian en composer.lock; sin cambiar composer.json ni el código de autenticación/API. Laravel corrige, entre otros, [GHSA-f9x3-7vq9-cph6](https://github.com/advisories/GHSA-f9x3-7vq9-cph6) |

Resultados medidos tras instalación frozen y Composer install:

- `pnpm audit --prod --json`: **PASS, 0 avisos**.
- `composer audit --locked --format=json`: **PASS, 0 avisos**.
- `pnpm audit --json`: **FAIL residual, 4 avisos: 3 moderados y 1 bajo; 0 altos/críticos**. La auditoría previa completa tenía 64 (27 altos, 29 moderados y 8 bajos). Son conteos de dependencia/advisory, no cuatro fallos explotables demostrados del CRM.
- Residuales en `vite-plugin-pwa → workbox-build`: glob 11.1.0 (parche publicado 14.0.2), minimatch 5.1.9/10.2.6 (parche publicado 11.0.1), deepmerge 4.3.1 ([sin versión corregida publicada](https://github.com/advisories/GHSA-gcqx-w48m-w2h4)). Se usan al generar artefactos desde el repositorio, no como dependencias runtime de las páginas ni de Laravel. No se añade una excepción silenciosa ni se fuerza un override major incompatible; queda **pendiente revisión del toolchain/upstream**, especialmente si se construye código o configuración no confiable.

Los locks de §14 eran inmutables para aquella publicación. Esta continuación autoriza corregir bloqueos de seguridad y por ello documenta explícitamente el cambio de alcance y versiones, sin atribuir sus resultados al antiguo Preview.

### HTTP 500 productivos: diagnóstico pendiente

Repetición con GET sin sesión a los tres endpoints públicos usando exclusivamente identificadores sintéticos: deliveries, contracts y studios siguen devolviendo **500 JSON genérico**, sin stack/SQL en la respuesta. `/api/health` devuelve 200; esto no demuestra que el esquema, release y todas las consultas de portales sean correctos. Se usó el ID de correlación sintético `seo-release-negative-20261102`, devuelto por la API, para facilitar búsqueda de logs.

Se revisó el código: entrega/reserva resuelven ausencias mediante `firstOrFail`; contratos usan un 404 uniforme. Los tests locales negativos y de aislamiento pasan. No hay evidencia para atribuir el 500 a esos controladores, a una migración, a la base o al logging. Los logs del checkout son locales, no evidencia de Render. El servicio productivo es la API Laravel de Render; los logs de funciones Vercel no son sustituto de sus logs.

No hay conector/CLI de Render autenticada ni acceso Sentry disponible. El usuario indicó continuar sin esos logs, mantener el diagnóstico pendiente y no modificar el backend a ciegas. **No se añade catch global ni se transforma 500 en 404 artificialmente.** Pendiente para el operador: correlacionar el request ID en Render/Sentry con release y excepción redactada; comprobar el esquema aplicado sin ejecutar migraciones o consultas sobre datos privados dentro de esta PR.

### PWA anterior → nueva: evidencia y límites

Se añade `e2e/pwa/upgrade.spec.js`: construye la fuente pre-SEO congelada en `03676ea` en un directorio temporal con dependencias ya instaladas, sin cambiar de rama. Instala su worker, conserva una pestaña abierta y almacenamiento sintético; sirve después el build candidato en **el mismo origen**, solicita `registration.update()` y espera el reload de `autoUpdate`. Comprueba shell privado noindex sin canonical, navegación/recarga offline, limpieza de entradas precache obsoletas y conservación de localStorage. No borra almacenamiento del usuario para hacer pasar la actualización.

**PASS** con el build anterior reconstruido y **PASS** con una captura pública del worker/assets que producción sirve actualmente, usada solo en el servidor local de pruebas (`PWA_LEGACY_DIR`), sin tocar sesiones/cachés del navegador del usuario ni la web productiva. La captura queda en TEMP, fuera de Git:

- JS de entrada anterior: `/assets/index-DaMPEJou.js`.
- SHA-256 del SW anterior: `cc8fee4a73655b9e7718676c5e04062c051f337704d0805e7806a5b611e8779d`.
- SHA-256 del index anterior: `0d7624111f12c6173eac30358e8a77d36b03619e4d087ca899f28c0bf602ce67`.

La prueba respeta que el fallback del SW solo atiende **navegaciones**, no cualquier fetch. Se corrigió una carrera del propio test entre el reload automático y uno manual; no fue necesario cambiar el worker ni código de aplicación. CI obtiene historial para reconstruir esa baseline; no necesita red productiva ni credenciales de Vercel. El worker capturado se valida localmente en Chromium, no se certifican todos los sistemas operativos ni todas las generaciones históricas de worker. Una PWA que permanezca offline no puede descargar la actualización hasta recuperar red; las pestañas antiguas pueden seguir mostrando su build hasta que el worker tome control. El caché runtime de imágenes mantiene su política previa; no se vacían datos privados ni IndexedDB.

### Estado actualizado de los criterios

| Criterio | Resultado de esta continuación |
| --- | --- |
| AC-01 | PASS: allowlist intacta; seis documentos públicos |
| AC-02 | PASS Preview: head inicial y tras navegación sin duplicados |
| AC-03 | PASS Preview sin JS, seis rutas |
| AC-04 | PASS Preview: TXT/XML y URLs exactas |
| AC-05 | PASS Preview/local: privado noindex y shell sin identificadores |
| AC-06 | PASS Preview 200/308/404; Nginx real y promoción productiva pendientes |
| AC-07 | PARTIAL/BLOCKED producción: 500 persistentes sin logs; no se altera auth/contratos |
| AC-08 | PASS: prerender sigue limitado al contenido público |
| AC-09 | PASS Chromium local con worker anterior reconstruido y capturado; rollout real/múltiples SO pendiente |
| AC-10 | Sin cambios: copy verificado; donaciones no activadas |
| AC-11 | PASS Preview: registro/atrás e hidratación |
| AC-12 | Sin cambios: schema local validado; validador externo pendiente |
| AC-13 | Sin cambios: objetivo móvil pendiente, no se atribuye una mejora a los parches |
| AC-14 | Sin cambios visuales; contraste/navegación pendientes de su tarea |
| AC-15 | PR sigue en borrador; ningún merge ni publicación productiva; Search Console/Bing pendiente |

### Validación y límites finales

Lint, build, 170 tests backend / 822 assertions y 193 frontend: PASS con las dependencias corregidas. SEO/PWA: 11 pruebas PASS, incluida actualización desde baseline reconstruida; smoke del Preview 21dcafe: 7 PASS. La suite E2E inicial dio 14 PASS y un fallo al borrar historial local de IA; ese recorrido pasó aislado al repetirse. No se oculta la incidencia ni se modifica el CRM o se debilitan assertions para resolverla.

La repetición completa E2E pasó: **15/15**, 47,8 s, sin modificar ese test ni el CRM. CI del nuevo SHA se informa en la PR tras el push. El smoke productivo conserva sus fallos y expectativas. No hay merge, despliegue manual, migración remota ni modificación de configuración de proveedores. Los avisos moderados/bajos del toolchain, los 500 sin diagnóstico y las comprobaciones productivas pendientes siguen abiertos; no equivalen a un release aprobado.


## 16. Evaluación final de publicación de eb9553b

Fecha: 2 de noviembre de 2026 (Europe/Madrid). Candidato de aplicación evaluado: `eb9553bd9ac6ae31d9109df4a624b9cd20a84c9e`. Esta evaluación solo añade documentación; no modifica aplicación, tests, dependencias ni configuración remota. La PR permanece en borrador.

### 16.1 Los cuatro avisos: severidad y exposición

Se repitieron las tres auditorías: runtime pnpm **0 avisos**, Composer locked **0 avisos**, auditoría pnpm completa **4 hallazgos (3 moderados, 1 bajo)**. Son **tres advisories**, con minimatch afectando a dos versiones/rutas. No se confunde cantidad de hallazgos con cuatro vulnerabilidades distintas. Severidad publicada según GitHub Reviewed; exposición según código y configuración revisados, no una prueba de explotación.

| Hallazgo instalado | Severidad publicada | Exposición observada y precondición | ¿Corrección obligatoria antes de producción? |
| --- | --- | --- | --- |
| deepmerge 4.3.1, vía Workbox → plugin-node-resolve | Baja, [GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4) | En Node al combinar opciones del resolver; el callsite inspeccionado combina defaults del plugin. No llega una petición/dato del CRM a esas opciones. El ataque requiere un objeto fuente malicioso. Sin parche publicado | No bloquea por sí solo este artefacto estático si se construye código/configuración revisados. Seguimiento upstream y aceptación explícita del riesgo residual; bloquear si se permite configuración de terceros no confiable |
| minimatch 5.1.9, vía Workbox → plugin-off-main-thread → ejs → jake → filelist | Moderada, [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) | Dependencia transitiva de herramientas. El aviso cubre versiones <11.0.1; no se demostró que el camino concreto de Jake se ejecute ni un exploit sobre 5.1.9. Los patrones son del repositorio, no de usuarios del CRM | No se fuerza salto 5→11 dentro de esta PR. Pendiente actualización compatible/upstream; requisito previo si se introducen patrones no confiables |
| minimatch 10.2.6, vía Workbox → glob | Moderada, mismo advisory | Amplificación de patrones con optimizationLevel ≥2 según advisory; requiere patrones controlados por atacante. Workbox enumera archivos locales de dist con patrones/configuración del build | No bloquea aisladamente con entradas revisadas y build aislado; no se afirma riesgo cero. No override 10→11 sin compatibilidad probada |
| glob 11.1.0, vía Workbox | Moderada, [GHSA-3g3m-2fjr-6pw4](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4) | Bypass de cancelación AbortSignal en recorridos, impacto de disponibilidad/I/O. El callsite de Workbox usa globSync con cwd/follow/ignore, sin signal; no hay globbing de peticiones. No se reprodujo explotación en este uso | No requiere forzar 11→14 para publicar estos archivos estáticos. Seguimiento del parche 14.0.2 y uso de límites del proceso de build, sin confiar en AbortSignal como aislamiento |

Evidencia local: `workbox-build/build/lib/get-file-details.js:23` usa globSync sobre globDirectory; `@rollup/plugin-node-resolve/dist/es/index.js:1079` combina defaults mediante deepMerge. Estas dependencias no son runtime del frontend servido como archivos ni del backend PHP. Riesgo residual principal: proceso de build/CI ante código, árboles o configuración hostiles. No se silencian los avisos ni se añade una excepción a CI. La condición operativa es construir solo la revisión aprobada con lockfiles y aislamiento habituales, sin reutilizar secretos de producción en builds no confiables. Los avisos no son el motivo principal del NO-GO.

### 16.2 HTTP 500: qué se puede concluir

Se repitieron GET negativos de deliveries/contracts/studios con identificadores sintéticos: **500 genérico sin stack/SQL**; request ID `seo-final-evaluation-20261102`. Se conserva la limitación de §15: no hay logs de Render/Sentry ni SHA de la API desplegada verificable desde las fuentes accesibles.

La preexistencia está documentada desde la auditoría inicial. Vercel confirma además que el frontend productivo actual es `dpl_EWFQuHTqY1et2aC13CHy6DvwWQCg`, SHA **03676ea**, no la rama SEO. El estado del frontend no demuestra el release del backend. La PR no modifica controladores públicos, ContractPortalService, rutas API, CORS, migraciones ni cliente de auth frente a main; sí cambia headers globales y seis dependencias PHP. `SearchIndexingTest` se repitió: **4 PASS / 42 assertions**, incluyendo 404 negativos, 401 y conservación del 500 inesperado.

Conclusión acotada: **no hay evidencia de que esta PR introduzca los 500 observados y se documentaron antes de publicarla; no se puede certificar causalidad nula ni ausencia de interacción en un futuro backend sin logs/release/esquema**. Tampoco se interpreta health 200 como certificación de los portales. No se altera backend a ciegas ni se convierte 500 en 404 para maquillar el gate.

### 16.3 Preview: SEO PASS; autenticación y PWA con límites demostrados

Deployment exacto **eb9553b**: `dpl_CtB3motkpJUvbDjpJ5RfXqayQAM3`, [lumaflow-studio-opt22ycl3-aleviclop.vercel.app](https://lumaflow-studio-opt22ycl3-aleviclop.vercel.app), READY. Repetición de `playwright.preview.config.js`: **7/7 PASS**, 10,7 s: seis páginas comerciales, navegación/atrás, hidratación, contenido sin JS, sitemap/robots, canonical y códigos HTTP. El noindex del Preview es esperado. [CI 41521043713](https://github.com/AVL05/lumaflow-studio/actions/runs/41521043713) del candidato continúa verde en sus cuatro jobs.

Comprobaciones adicionales con contexto Chromium nuevo, sin datos ni credenciales de clientes:

- **PASS:** `/app/clients` sin sesión redirige a `/login`; formulario de acceso visible.
- **FAIL de validación integrada en Preview:** GET `/api/user` sin token devuelve 401; preflight de `/api/login` devuelve 204, pero ambos anuncian `Access-Control-Allow-Origin: https://lumaflow.aleviclop.dev`, incluso cuando Origin es el deployment Preview. El navegador confirma que fetch desde Preview queda bloqueado por CORS. El mismo header coincide para el origen productivo. No se envía una contraseña real, no se crea cuenta productiva ni se abre CORS con comodines. La configuración CORS está igual que en main; es una restricción del entorno disponible, no una regresión de auth demostrada de la PR.
- **PASS local, 2 E2E de auth repetidos:** registro/verificación/onboarding e inicio de sesión con cuenta sintética del backend SQLite aislado. No equivale a login exitoso del Preview contra Render.
- **PWA remota NOT VERIFIED:** en el Preview protegido, la navegación HTTP con OIDC funciona pero Chromium rechaza la carga de script del worker con `The script resource is behind a redirect, which is disallowed.`; no aparece registro/control tras 15 s. Un fetch HTTP normal a sw.js con header da 200 JavaScript. Esto confirma la limitación del flujo de autenticación del Preview para registrar el worker; no demuestra que el SW público de producción vaya a fallar. No se desactiva protección ni se crea un bypass compartido para aprobarlo artificialmente.
- **PWA local PASS previo del mismo candidato:** 11 tests SEO/PWA, actualización del worker anterior reconstruido y captura del productivo; no se promueve ese resultado a certificación del worker remoto protegido. Queda pendiente validar con acceso browser/session admitido para todos los subrecursos o un entorno de QA autorizado, y después el smoke productivo tras promoción.

[Production Smoke Checks 41521086778](https://github.com/AVL05/lumaflow-studio/actions/runs/41521086778) sigue **FAIL**, independiente de Preview: conserva todas sus expectativas sobre el dominio de producción. No se ha cambiado ni marcado como superado.

### 16.4 Integración con main y trabajo posterior

Después de fetch, `origin/main` permanece en **03676ea496b22d6538f4c2fcb0671bf6592e64ff**, ancestro del candidato: **0 commits detrás / 3 delante**. GitHub informa MERGEABLE y la simulación `git merge-tree --write-tree --name-only origin/main eb9553b` no presenta conflictos; no ejecuta un merge en la rama ni modifica índice/worktree. El diff de 52 archivos queda limitado al SEO/PWA/copy, soporte comercial ya aprobado, sus tests/docs/capturas y las correcciones de dependencias explícitamente justificadas en §15. No se añaden migraciones ni funcionalidades CRM.

Distinción necesaria sobre trabajo posterior:

- La PR pública #35 de backups, head remoto **efd6ef5**, también se combina sin conflictos textuales con eb9553b en la simulación. Esto no certifica su funcionamiento conjunto ni autoriza fusionarla.
- La rama **local** `feat/backup-b2-storage` contiene nueve commits adicionales no publicados. Su simulación contra el candidato sí produce conflictos en **package.json y pnpm-lock.yaml**; hay 11 archivos solapados entre sus commits y esta PR. El checkout original tiene además trabajo pendiente que solapa 25 archivos. No se ha modificado, descartado ni publicado ese trabajo.
- Si ese trabajo se integra después, revisar manualmente scripts, overrides y lockfile para conservar `test:pwa` y follow-redirects 1.16.2, sin restaurar 1.16.1 por accidente; regenerar lock y repetir checks. Revisar también middlewares y CI aunque Git pueda fusionarlos automáticamente.

Conclusión: **sin conflictos ni commits inesperados respecto al main consultado**, no una garantía sobre futuros movimientos de main u otras ramas. Repetir fetch/simulación/checks inmediatamente antes de cualquier merge autorizado. No se resuelven conflictos de ramas ajenas dentro de esta evaluación.

### 16.5 Plan de publicación y rollback — preparado, NO ejecutado

1. **Antes de autorizar publicación:** resolver o aceptar con responsable la incidencia productiva de portales tras diagnosticarla; disponer de release/SHA, esquema aplicado y deployment anterior de Render. Validar login real en QA con cuenta sintética y origen CORS exacto autorizado, y registro/offline de PWA con acceso válido a sus scripts. No cambiar CORS/protección remotamente sin autorización. Registrar aceptación del riesgo residual del toolchain. Confirmar main/CI del SHA final y operador disponible para rollback.
2. **Coordinar ambos proveedores antes del merge:** el repositorio declara Vercel ligado a main y Render checksPass. No asumir que fusionar es una acción sin despliegue. Verificar la configuración real y que el smoke productivo rojo no deje Render esperando checks indefinidamente; no deshabilitar el gate. No añadir mecanismos ni modificar proveedores en esta evaluación.
3. **Vercel:** tras autorización y CI verde, usar el flujo Git existente para generar el build de producción con su VITE_API_URL productivo; no promover ciegamente el Preview, que puede llevar variables de otro entorno. Confirmar SHA y dominio. Mantener ambas versiones disponibles para recuperación.
4. **Backend:** usar su flujo autorizado una vez verificados release, backup/restauración y estado de migraciones. Esta PR no añade migraciones, pero el entrypoint existente ejecuta `php artisan migrate --force`: que el diff no tenga migraciones no demuestra que la DB remota no tenga otras pendientes. No ejecutar migraciones manuales, regenerar APP_KEY ni cambiar secretos como parte del smoke. No publicar a ciegas el backend sin esa comprobación.
5. **Smoke inmediato y posterior a actualización de worker:** seis HTML 200 con contenido sin JS, title/description/canonical/OG propios; robots TXT y sitemap XML con seis URLs; alias 308 y desconocidas/assets 404; acceso/recuperación/CRM/portales noindex sin información en HTML. Login/logout y recuperación permitidos con cuenta sintética autorizada; API sin sesión 401 y aislamiento de tenant en QA. Identificadores públicos inexistentes deben dar 404 sin detalles; 500 es FAIL, nunca se acepta como respuesta correcta. PWA nueva y cliente con worker anterior: red→update→offline, shell privado correcto y sin API cacheada. Comprobar ausencia de aumento de errores con logs redactados. No enviar formularios de clientes reales ni datos a herramientas de indexación. Search Console/Bing después de estabilizar.
6. **Rollback:** ante fallo nuevo de login, exposición, hidratación, rutas, errores API o worker, detener avance y restaurar el artefacto anterior de la capa afectada. Frontend: [Instant Rollback de Vercel](https://vercel.com/docs/instant-rollback) al deployment productivo anterior registrado (actualmente dpl_EWFQuHTqY1et2aC13CHy6DvwWQCg / 03676ea; confirmar elegibilidad y disponibilidad en el momento). Backend: [Rollback de Render](https://render.com/docs/rollbacks) a un artefacto anterior verificado; su ID y disponibilidad están pendientes, no se inventa un objetivo. El rollback del Dashboard Render desactiva autodeploy; el de API no lo hace: el operador debe coordinar el flujo con autorización. No se prescribe `migrate:rollback`, restauración destructiva de DB ni borrado de localStorage/IndexedDB. Volver a comprobar el worker y cliente: cambiar el deployment no revierte inmediatamente un SW ya instalado ni borra datos. Repetir el smoke, conservar evidencia y preparar corrección posterior; volver al release anterior no arregla los 500 que ya existían.

### 16.6 Decisión y condiciones para reconsiderar

**NO-GO para publicación conjunta de la PR #50 en producción en el estado de evidencia actual.** El código SEO está implementado, su Preview comercial pasa y CI es verde. Los avisos de build tienen exposición acotada y pueden tratarse mediante aceptación explícita y seguimiento; no justifican un salto major forzado.

El NO-GO se debe a que falta verificar auth real y PWA en el entorno de publicación/QA autorizado, los 500 reales siguen sin diagnóstico y no hay evidencia suficiente de release/esquema/objetivo de rollback de Render. No se afirma que la PR cause esas incidencias ni se convierte una limitación del entorno Preview en un defecto nuevo de aplicación. La política del repositorio impide fusionar con checks fallidos; el smoke productivo rojo permanece visible.

Para pasar a GO condicionado: cerrar la validación de auth/PWA en un entorno admitido, obtener diagnóstico y tratamiento aceptado de los 500, confirmar rollback del backend y coordinación de gates/autodeploy, aceptar el riesgo residual de toolchain y repetir integración/CI si cambia main. La autorización expresa para merge/despliegue sigue siendo necesaria. En esta sesión solo se actualizan el informe y la PR; no se ejecutan estos pasos de publicación.
