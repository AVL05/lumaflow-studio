import { Link } from "react-router-dom";
import { MarketingPage } from "../components/marketing/MarketingPage";
import { useDocumentMeta } from "../hooks/useDocumentMeta";

const included = [
  "Clientes, sesiones, tareas y calendario",
  "Presupuestos, facturas y documentos PDF",
  "Galerías de entrega y favoritas",
  "Equipo, localizaciones y presets",
  "Analítica e IA WebGPU en el navegador",
  "PWA instalable para escritorio y móvil",
];

const pricingFaqs = [
  ["¿Necesito una tarjeta?", "No. El registro de la beta no solicita datos de pago."],
  [
    "¿Me cobraréis al terminar la beta?",
    "No habrá cargos automáticos. Cualquier plan futuro se anunciará antes y requerirá una decisión explícita por tu parte.",
  ],
  [
    "¿Hay módulos de pago ahora?",
    "No. Durante la beta, todos los módulos disponibles forman parte del acceso gratuito.",
  ],
];

export function PricingPage() {
  useDocumentMeta(
    "Precio de LumaFlow | Beta gratuita",
    "Usa todos los módulos actuales de LumaFlow gratis durante la beta, sin tarjeta ni cargos automáticos.",
  );

  return (
    <MarketingPage>
      <section className="mx-auto max-w-[1400px] px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
        <div className="landing-enter max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">
            Beta pública
          </p>
          <h1 className="mt-5 max-w-[13ch] text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-stone-50 sm:text-6xl lg:text-[4.5rem]">
            Un precio claro mientras validamos.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-stone-400 sm:text-lg">
            Todo LumaFlow, gratis durante la beta y sin tarjeta.
          </p>
        </div>

        <div className="mt-14 grid overflow-hidden rounded-2xl border border-white/10 bg-[#11100e] lg:grid-cols-[0.72fr_1.28fr]">
          <div className="flex flex-col justify-between bg-[linear-gradient(145deg,#241f16,#15120e)] p-7 sm:p-10 lg:p-14">
            <div>
              <p className="text-sm font-semibold text-amber-200">Beta</p>
              <p className="mt-5 text-7xl font-semibold tracking-[-0.07em] text-stone-50">0 €</p>
              <p className="mt-3 text-sm text-stone-400">por mes durante la beta</p>
            </div>
            <div className="mt-12">
              <Link
                className="block rounded-lg bg-amber-100 px-5 py-3 text-center text-sm font-semibold text-stone-950 hover:bg-stone-50"
                to="/register"
              >
                Empezar gratis
              </Link>
              <p className="mt-4 text-center text-xs text-stone-500">
                Sin tarjeta. Sin cargos automáticos.
              </p>
            </div>
          </div>
          <div className="p-7 sm:p-10 lg:p-14">
            <h2 className="text-3xl font-semibold tracking-[-0.035em] text-stone-50">
              Todo lo necesario para operar el estudio.
            </h2>
            <div className="mt-9 grid gap-x-10 gap-y-5 sm:grid-cols-2">
              {included.map((item) => (
                <p
                  key={item}
                  className="border-t border-white/10 pt-4 text-sm leading-6 text-stone-300"
                >
                  {item}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/8 bg-[#0d0c0b] px-4 py-24 sm:px-6 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-[1400px]">
          <h2 className="max-w-2xl text-4xl font-semibold tracking-[-0.04em] text-stone-50 sm:text-5xl">
            Qué ocurrirá después.
          </h2>
          <div className="mt-14 grid gap-10 md:grid-cols-3">
            {[
              [
                "01",
                "Validamos la beta",
                "Mejoramos el producto con uso real antes de fijar planes definitivos.",
              ],
              [
                "02",
                "Avisamos con antelación",
                "Cualquier cambio económico se explicará antes de entrar en vigor.",
              ],
              [
                "03",
                "Tú decides",
                "No existe renovación ni cobro automático ligado a tu cuenta beta.",
              ],
            ].map(([number, title, text]) => (
              <article key={title} className="border-t border-white/12 pt-6">
                <span className="font-mono text-xs text-amber-200">{number}</span>
                <h3 className="mt-5 text-2xl font-semibold text-stone-50">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-stone-400">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1400px] gap-12 px-4 py-24 sm:px-6 lg:grid-cols-[0.55fr_1fr] lg:px-10 lg:py-32">
        <div>
          <h2 className="text-4xl font-semibold tracking-[-0.04em] text-stone-50 sm:text-5xl">
            Preguntas de precio
          </h2>
        </div>
        <div className="divide-y divide-white/10 border-t border-white/10">
          {pricingFaqs.map(([question, answer]) => (
            <details key={question} className="group py-1">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-base font-semibold text-stone-100">
                {question}
                <span
                  className="text-xl font-light text-amber-200 transition group-open:rotate-45"
                  aria-hidden="true"
                >
                  +
                </span>
              </summary>
              <p className="max-w-2xl pb-6 pr-10 text-sm leading-7 text-stone-400">{answer}</p>
            </details>
          ))}
        </div>
      </section>
    </MarketingPage>
  );
}
