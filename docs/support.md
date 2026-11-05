# Apoyar LumaFlow

Estado del Sprint 6: página `/support` y enlaces de acceso implementados localmente. **Sin enlaces de donación activos:** no se han proporcionado perfiles reales verificados. No se ha creado `.github/FUNDING.yml`, publicado ni desplegado esta funcionalidad.

## Modelo y privacidad

LumaFlow seguirá siendo gratuito y open source para todos. Donar no compra funciones, prioridad, cuotas, almacenamiento, ventajas exclusivas ni acceso premium. No se condiciona ninguna función a una aportación ni se consulta un estado de donante.

El apoyo se realiza mediante enlaces externos. LumaFlow no tiene checkout, SDK de pagos, widgets, iframes, webhooks, callbacks de pago, tabla de donantes ni registros de aportaciones. No registra tarjetas, cuentas bancarias, importes, emails de donantes o asociación con cuentas del estudio. No añade cookies de seguimiento ni scripts de los proveedores. La página funciona sin backend/IA y sin JavaScript remoto de los proveedores; sigue siendo una página React que necesita el JavaScript propio de la aplicación.

Los enlaces abren nueva pestaña con `noopener noreferrer` y política `no-referrer`. Solo al abrir voluntariamente un enlace se visita al proveedor, que aplica sus propias condiciones y privacidad. El titular podría recibir información directamente desde su cuenta del proveedor; debe revisarla por separado. No importarla a LumaFlow ni publicar agradecimientos con identidad sin consentimiento.

## Configuración

Variables públicas de build de Vite, vacías por defecto en `frontend/.env.example`:

```env
VITE_KOFI_URL=
VITE_GITHUB_SPONSORS_URL=
```

Después de recibir y verificar las URLs del mantenedor, establecer únicamente el perfil Ko-fi y/o GitHub Sponsors correspondiente. Se pueden configurar cero, uno o ambos de forma independiente. Nunca poner claves de Stripe, PayPal, API, tarjetas o información bancaria en variables `VITE_*`: se incluyen en el bundle público.

- En local: configurar en el entorno de Vite o un archivo `.env.local` sin seguimiento. Reiniciar el servidor al cambiar variables.
- Vercel: configurar solo en el entorno autorizado y reconstruir. No activar producción por el mero hecho de que una URL pase el validador.
- Docker: `frontend/Dockerfile` admite argumentos de build `VITE_KOFI_URL` y `VITE_GITHUB_SPONSORS_URL`, ambos vacíos por defecto. No son variables runtime de Nginx ni secretos. El build de imagen completo sigue sin comprobarse por falta de daemon Docker local.
- Cambiar o retirar destinos requiere un nuevo build y despliegue autorizado. No se garantiza revocación inmediata de páginas ya abiertas, caches offline o contenido controlado por los proveedores.

No hay URLs de ejemplo de cuentas ni fallbacks de pago. Sin configuración, `/support` explica la gratuidad y ofrece contribuir al repositorio real del proyecto. Valores inválidos se ocultan sin exponerlos en la interfaz; un proveedor inválido no oculta otro válido.

### Validación de destinos

`frontend/src/utils/supportLinks.js` no hace peticiones remotas. Exige HTTPS, hostname exacto `ko-fi.com` o `github.com`, sin credenciales, puertos alternativos, query ni fragmentos; rechaza escapes, controles, porcentajes y normalización de segmentos. Solo admite un perfil Ko-fi o `/sponsors/` seguido de un nombre GitHub. Rechaza rutas conocidas de login, checkout, exploración y gestión, así como subdominios/sufijos engañosos.

El conjunto conservador de perfiles Ko-fi aceptado por esta integración es ASCII alfanumérico/guion bajo/guion, de 3 a 64 caracteres, empezando por alfanumérico o guion bajo. Es una política local de formato, no una afirmación sobre todos los límites del proveedor. GitHub admite nombres alfanuméricos con guiones simples, hasta 39 caracteres. Un formato válido **no verifica existencia, titularidad, habilitación para recibir apoyo ni destino después de redirecciones**. Verificar todo ello manualmente antes de activarlo; nunca contactar perfiles sintéticos de tests.

## Revisión antes de activar públicamente

### Hosting — fuentes revalidadas el 02/11/2026

[Vercel Fair Use](https://vercel.com/docs/limits/fair-use-guidelines) excluye pedir donaciones de su definición de uso comercial. [Hobby](https://vercel.com/docs/plans/hobby) sigue limitado a uso personal no comercial. Esto no acredita que el servicio completo de gestión para estudios sea elegible: revisar con Vercel la plataforma real, titular, destinatarios y utilización; obtener aclaración si hay duda. Ser gratuito/open source no constituye una aprobación general. No migrar, contratar ni activar donaciones para sortear esta revisión.

[GitHub Sponsors](https://docs.github.com/en/sponsors/getting-started-with-github-sponsors/about-github-sponsors) permite aportaciones puntuales o mensuales con condiciones propias. Configurar sin recompensas que den acceso exclusivo en LumaFlow y comprobar elegibilidad del receptor. Una recurrencia voluntaria del proveedor no se puede convertir en requisito de uso.

[Ko-fi explica sus responsabilidades fiscales](https://help.ko-fi.com/hc/en-us/articles/10792069957661-How-tax-works-on-Ko-fi): no liquida el IVA ni los impuestos del creador por él. Revisar comisiones y condiciones particulares antes de configurar el perfil. No prometer recepción íntegra, ausencia de comisiones, disponibilidad ni ventajas fiscales. Estas consultas no verifican las cuentas concretas del mantenedor.

### España — decisiones pendientes del titular y asesoría

No clasificar una aportación solo por llamarla «donación» en la UI. Antes de recibir importes, revisar:

1. Receptor legal, residencia fiscal y comunidad autónoma; naturaleza sin contraprestación frente a ingresos vinculados a actividad. [AEAT: rendimientos de actividades económicas](https://sede.agenciatributaria.gob.es/Sede/irpf/empresarios-individuales-profesionales/rendimientos-actividades-economicas.html). Determinar el tratamiento aplicable —IRPF/actividad, ISD o impuesto de sociedades según corresponda— sin asumir exenciones, umbrales ni competencia territorial.
2. Obligaciones censales/IAE y Seguridad Social, documentación, contabilidad, comisiones, moneda y aportaciones internacionales. Revisar IVA si existe contraprestación, justificantes/facturación y política de devoluciones con la asesoría; no asumir que el proveedor sustituye obligaciones locales.
3. No anunciar deducciones ni emitir certificados fiscales automáticamente. La [AEAT establece requisitos específicos para deducciones por donativos](https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/irpf-2025/c16-deducciones-generales-cuota/deducciones-donativos-otras-aportaciones/requisitos-comunes-deducciones-donativos.html); no se ha verificado que el receptor reúna esas condiciones.
4. Información del titular/LSSI y condiciones visibles para quien aporta; obligaciones de información que correspondan a las plataformas. Privacidad/RGPD sobre los datos que el titular reciba del proveedor: finalidad, conservación, derechos y acceso mínimo. No copiar datos de donantes al producto ni relacionarlos con permisos de clientes/workspaces.

La revisión jurídica/fiscal individual **no se ha realizado ni se considera aprobada**. No se afirman resultados tributarios para el mantenedor ni para aportantes.

### Activación y FUNDING

1. Obtener URLs reales del mantenedor, comprobar titularidad/destino final y que el apoyo no ofrece funciones exclusivas.
2. Resolver revisión de Vercel Hobby y revisión legal/fiscal del titular. Documentar el resultado sin datos sensibles.
3. Configurar las URLs autorizadas, probar el build con cero/uno/dos canales y revisar copy/teclado/móvil.
4. Solo entonces crear `.github/FUNDING.yml` con las claves `ko_fi` y/o `github` y los identificadores de esos perfiles verificados. No crear placeholders ni un archivo con perfiles inventados. Mantenerlo alineado con los destinos autorizados de la aplicación.
5. Revisión de código y despliegue únicamente autorizado. Este sprint no activa URLs, configura cuentas de pagos ni cambia producción.

## Validación

Vitest cubre cero/uno/dos proveedores, inválidos, nombres accesibles, privacidad y controles de nueva pestaña. `e2e/tests/support.spec.js` comprueba footer móvil y configuración con variables vacías. `pnpm run test:support` usa un servidor aislado con URLs sintéticas solo de prueba y respuestas externas interceptadas: verifica dos enlaces por teclado, móvil, ausencia de SDK/iframes, cookies/almacenamiento y referrer/opener; no hace pagos ni contacta perfiles reales.

Resultados de suites, auditorías y límites actuales: [informe del Sprint 6](plans/2026-11-02-sprint6-voluntary-support.md). La mitigación de deepmerge y sus comprobaciones de CI permanecen intactas; el aviso bajo nativo sigue visible.
