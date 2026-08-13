import { Link } from "react-router-dom";
import { MarketingPage } from "../components/marketing/MarketingPage";
import { useDocumentMeta } from "../hooks/useDocumentMeta";

const useCases = [
  {
    number: "01",
    title: "Convierte solicitudes en sesiones",
    description:
      "Recibe la petición, conserva el contexto del cliente y llévala al calendario sin reconstruir la información en otra herramienta.",
    outcome: "De una consulta dispersa a una fecha confirmada.",
    image: "/product/calendar.png",
    alt: "Calendario de LumaFlow con sesiones, tareas y entregas organizadas",
  },
  {
    number: "02",
    title: "Prepara cada sesión",
    description:
      "Reúne equipo, localización, preset, checklist y notas del cliente antes de salir del estudio.",
    outcome: "Menos improvisación cuando empieza la producción.",
    image: "/product/presets.png",
    alt: "Biblioteca de presets de producción fotográfica en LumaFlow",
  },
  {
    number: "03",
    title: "Cobra sin perseguir clientes",
    description:
      "Crea presupuestos y facturas conectados al trabajo, controla su estado y conserva el historial comercial junto al cliente.",
    outcome: "El seguimiento económico forma parte del flujo.",
    image: "/product/invoices.png",
    alt: "Facturas y estado de cobro dentro de LumaFlow Studio",
  },
  {
    number: "04",
    title: "Controla tus entregas",
    description:
      "Publica la galería, recoge favoritas y registra la aprobación sin separar la experiencia del cliente de la gestión interna.",
    outcome: "Una entrega clara para el cliente y trazable para ti.",
    image: "/product/gallery.png",
    alt: "Galería de entrega con selección de fotografías favoritas",
  },
];

export function FeaturesPage() {
  useDocumentMeta(
    "Casos de uso para estudios fotográficos | LumaFlow",
    "Convierte solicitudes en sesiones, prepara el trabajo, controla entregas y cobra desde un único lugar.",
  );

  return (
    <MarketingPage>
      <section className="mx-auto grid max-w-[1400px] gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[0.78fr_1.22fr] lg:items-center lg:px-10 lg:py-28">
        <div className="landing-enter max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">
            El trabajo detrás de cada sesión
          </p>
          <h1 className="mt-5 max-w-[11ch] text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-balance text-stone-50 sm:text-6xl lg:text-[4.5rem]">
            De la consulta a la entrega.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-stone-400 sm:text-lg">
            Un flujo continuo para reservar, preparar, producir, cobrar y entregar cada trabajo.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/register"
              className="rounded-lg bg-amber-100 px-5 py-3 text-center text-sm font-semibold text-stone-950 transition hover:bg-stone-50"
            >
              Empezar gratis
            </Link>
            <Link
              to="/demo"
              className="rounded-lg border border-white/10 bg-white/[0.045] px-5 py-3 text-center text-sm font-semibold text-stone-100 transition hover:bg-white/[0.08]"
            >
              Explorar demo
            </Link>
          </div>
        </div>
        <div className="landing-enter landing-enter-delay overflow-hidden rounded-2xl border border-white/10 bg-[#11100e] p-2 shadow-[0_40px_120px_rgba(0,0,0,.5)] lg:-mr-20">
          <img
            src="/product/dashboard.png"
            alt="Panel general de un estudio fotográfico gestionado con LumaFlow"
            width="1270"
            height="714"
            fetchPriority="high"
            className="marketing-product-crop h-auto rounded-xl border border-white/8"
          />
        </div>
      </section>

      <section className="border-y border-white/8 bg-[#0d0c0b]">
        <div className="mx-auto max-w-[1400px] px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
          <div className="max-w-3xl">
            <h2 className="text-4xl font-semibold tracking-[-0.04em] text-stone-50 sm:text-5xl">
              El flujo, no otra lista de herramientas.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-stone-400">
              Cada parte conserva el contexto de la anterior para reducir duplicados, olvidos y
              seguimientos manuales.
            </p>
          </div>

          <div className="mt-16 space-y-24 lg:space-y-32">
            {useCases.map((useCase, index) => (
              <article
                key={useCase.title}
                className={`grid gap-10 lg:grid-cols-2 lg:items-center ${index % 2 ? "lg:[&>*:first-child]:order-2" : ""}`}
              >
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#11100e] p-2 shadow-[0_28px_90px_rgba(0,0,0,.32)]">
                  <img
                    src={useCase.image}
                    alt={useCase.alt}
                    width="1270"
                    height="714"
                    loading="lazy"
                    className="marketing-product-crop h-auto rounded-xl border border-white/8"
                  />
                </div>
                <div className="max-w-xl lg:px-8">
                  <span className="font-mono text-xs text-amber-200" aria-hidden="true">
                    {useCase.number}
                  </span>
                  <h3 className="mt-5 text-3xl font-semibold leading-tight tracking-[-0.035em] text-stone-50 sm:text-4xl">
                    {useCase.title}
                  </h3>
                  <p className="mt-5 text-base leading-7 text-stone-400">{useCase.description}</p>
                  <p className="mt-7 border-l border-amber-200/40 pl-4 text-sm font-medium leading-6 text-stone-200">
                    {useCase.outcome}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1400px] gap-10 px-4 py-24 sm:px-6 lg:grid-cols-[0.7fr_1.3fr] lg:items-center lg:px-10 lg:py-32">
        <div>
          <h2 className="text-4xl font-semibold tracking-[-0.04em] text-stone-50 sm:text-5xl">
            Mira el estudio completo.
          </h2>
          <p className="mt-5 text-base leading-7 text-stone-400">
            Analiza actividad, ingresos y carga de trabajo sobre la misma operación que gestionas
            cada día.
          </p>
          <Link
            className="mt-8 inline-block text-sm font-semibold text-amber-200 hover:text-amber-100"
            to="/demo"
          >
            Probar con datos ficticios →
          </Link>
        </div>
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#11100e] p-2">
          <img
            src="/product/analytics.png"
            alt="Analítica de actividad e ingresos en LumaFlow"
            width="1270"
            height="714"
            loading="lazy"
            className="marketing-product-crop h-auto rounded-xl border border-white/8"
          />
        </div>
      </section>

      <section className="border-t border-white/8 bg-[#0d0c0b] px-4 py-24 text-center sm:px-6 lg:px-10">
        <h2 className="mx-auto max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-stone-50 sm:text-5xl">
          Haz que cada trabajo avance.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-stone-400">
          La beta es gratuita y no pide tarjeta.
        </p>
        <Link
          className="mt-8 inline-block rounded-lg bg-amber-100 px-6 py-3 text-sm font-semibold text-stone-950 hover:bg-stone-50"
          to="/register"
        >
          Empezar gratis
        </Link>
      </section>
    </MarketingPage>
  );
}
