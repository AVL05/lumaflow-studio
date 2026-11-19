import { MarketingPage } from "../components/marketing/MarketingPage";
import { Panel } from "../components/ui/Panel";
import { getSupportLinks } from "../utils/supportLinks";

export function SupportPage() {
  const links = getSupportLinks();

  return (
    <MarketingPage>
      <section className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6 lg:px-10 lg:py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">
          Apoyar LumaFlow
        </p>
        <div className="mt-6 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
          <div>
            <h1 className="max-w-[18ch] text-4xl font-semibold leading-[1.08] tracking-[-0.045em] text-stone-50 sm:text-6xl">
              LumaFlow seguirá siendo gratuito.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-stone-300">
              Una herramienta open source para organizar proyectos fotográficos y audiovisuales. Las
              donaciones voluntarias ayudan a mantener la infraestructura y continuar el desarrollo.
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-400">
              Queremos que puedas dedicar más tiempo a crear y menos a organizar. Tu apoyo ayuda a
              corregir errores, mejorar la experiencia y mantener el proyecto disponible para todos.
            </p>
          </div>
          <Panel className="p-6 sm:p-8">
            <section aria-labelledby="support-channels-title">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">
                Siempre opcional
              </p>
              <h2
                id="support-channels-title"
                className="mt-4 text-2xl font-semibold tracking-tight"
              >
                Apoyo voluntario
              </h2>
              {links.length ? (
                <>
                  <p className="mt-4 text-sm leading-7 text-stone-400">
                    Elige el proveedor que prefieras. La aportación se realiza fuera de LumaFlow y
                    nunca es un requisito para utilizarlo.
                  </p>
                  <div className="mt-6 flex flex-col gap-3">
                    {links.map((link) => (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        referrerPolicy="no-referrer"
                        aria-label={`Apoyar en ${link.name} (nueva pestaña)`}
                        className="inline-flex min-h-12 items-center justify-between gap-4 rounded-lg border border-amber-200/25 bg-amber-200/[0.06] px-4 py-3 text-sm font-semibold text-amber-100 transition hover:bg-amber-200/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/70"
                      >
                        Apoyar en {link.name}
                        <span aria-hidden="true">↗</span>
                      </a>
                    ))}
                  </div>
                  <p className="mt-4 text-xs leading-6 text-stone-400">
                    Los enlaces abren una pestaña nueva. Consulta las condiciones y posibles
                    comisiones del proveedor antes de aportar.
                  </p>
                </>
              ) : (
                <p className="mt-4 text-sm leading-7 text-stone-300">
                  Los canales de apoyo todavía no están disponibles. Mientras tanto, puedes
                  contribuir con ideas, reportar errores o ayudar con el código.
                </p>
              )}
              <a
                href="https://github.com/AVL05/lumaflow-studio"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex min-h-11 items-center text-sm text-stone-200 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/70"
              >
                Contribuir en GitHub<span className="sr-only"> (nueva pestaña)</span>
              </a>
            </section>
          </Panel>
        </div>
        <div className="mt-12 grid gap-8 border-t border-white/10 pt-8 md:grid-cols-2 lg:mt-16">
          <section aria-labelledby="support-free-title">
            <h2 id="support-free-title" className="text-lg font-semibold">
              Las mismas funciones para todos
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-stone-400">
              Dones o no, tendrás las mismas funcionalidades. Sin planes premium, cuotas, ventajas
              exclusivas ni límites artificiales por donar. No necesitas aportar para seguir
              utilizando LumaFlow.
            </p>
          </section>
          <section aria-labelledby="support-privacy-title">
            <h2 id="support-privacy-title" className="text-lg font-semibold">
              Tu aportación queda en el proveedor
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-stone-400">
              LumaFlow no recibe datos de pago, no registra donantes ni vincula aportaciones a tu
              cuenta. Esta página no carga widgets, iframes ni scripts de los proveedores. Al abrir
              un enlace, se aplican sus propias condiciones y política de privacidad.
            </p>
          </section>
        </div>
      </section>
    </MarketingPage>
  );
}
