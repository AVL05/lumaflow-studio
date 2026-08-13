import { Link } from "react-router-dom";
import { MarketingFooter } from "../components/marketing/MarketingFooter";
import { MarketingHeader } from "../components/marketing/MarketingHeader";

const workflow = [
  ["Planifica", "Agenda sesiones, tareas, equipo y localizaciones desde un calendario compartido."],
  ["Produce", "Centraliza checklists, presets y contexto del cliente antes de cada sesión."],
  ["Gestiona", "Convierte el trabajo en presupuestos, facturas y entregas trazables."],
  ["Entrega", "Publica una galería privada para revisión, favoritos y aprobación del cliente."],
];

const faqs = [
  [
    "¿LumaFlow sustituye mi editor de fotografía?",
    "No. Organiza la operación del estudio alrededor de tus herramientas de edición: sesiones, clientes, equipo, presupuestos, facturas y entregas.",
  ],
  [
    "¿La inteligencia artificial envía mis datos a terceros?",
    "La experiencia principal usa modelos WebGPU ejecutados en tu navegador. No necesita claves de API ni un proveedor externo para procesar tus datos.",
  ],
  [
    "¿Puedo usarlo desde móvil?",
    "Sí. Es una PWA responsive que puedes instalar desde un navegador compatible y abrir como una aplicación.",
  ],
  [
    "¿Cómo recibe las fotografías mi cliente?",
    "Cada entrega dispone de un portal privado donde el cliente puede revisar la galería, seleccionar favoritas y aprobar el trabajo.",
  ],
  [
    "¿Cuánto cuesta ahora?",
    "La beta pública es gratuita y no solicita tarjeta. Si el modelo cambia, las condiciones se comunicarán antes de aplicarse.",
  ],
];

function ProductImage({ src, alt, className = "", eager = false }) {
  return (
    <img
      src={src}
      alt={alt}
      width="1270"
      height="714"
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "auto"}
      decoding="async"
      className={`marketing-product-crop block h-auto ${className}`}
    />
  );
}

export function LandingPage() {
  return (
    <div className="landing-page min-h-dvh overflow-x-hidden bg-[#090908] text-stone-100">
      <a
        href="#contenido"
        className="sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:not-sr-only focus:rounded-lg focus:bg-stone-100 focus:px-4 focus:py-2 focus:text-stone-950"
      >
        Saltar al contenido
      </a>
      <MarketingHeader />

      <main id="contenido">
        <section className="relative mx-auto grid min-h-[calc(100dvh-68px)] max-w-[1400px] items-center gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[0.78fr_1.22fr] lg:px-10 lg:py-16">
          <div className="landing-enter relative z-10 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">
              Del primer contacto a la entrega
            </p>
            <h1 className="mt-5 max-w-[12ch] text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-balance text-stone-50 sm:text-6xl lg:text-[4.5rem]">
              Tu estudio fotográfico, en un único lugar.
            </h1>
            <p className="mt-6 max-w-[38rem] text-base leading-7 text-stone-400 sm:text-lg">
              Clientes, trabajos, reservas, presupuestos, facturas, sesiones y entregas conectados
              en un mismo flujo.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/register"
                className="rounded-lg bg-amber-100 px-5 py-3 text-center text-sm font-semibold text-stone-950 transition hover:bg-stone-50 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090908]"
              >
                Empezar gratis
              </Link>
              <a
                href="#workflow"
                className="rounded-lg border border-white/10 bg-white/[0.045] px-5 py-3 text-center text-sm font-semibold text-stone-100 transition hover:border-amber-200/25 hover:bg-white/[0.08] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/70"
              >
                Ver cómo funciona
              </a>
            </div>
          </div>

          <div className="landing-enter landing-enter-delay relative lg:-mr-28">
            <div className="absolute -inset-16 -z-10 bg-[radial-gradient(circle,rgba(196,141,72,.18),transparent_62%)] blur-2xl" />
            <div className="overflow-hidden rounded-2xl border border-white/12 bg-[#11100e] p-2 shadow-[0_40px_120px_rgba(0,0,0,.5)] sm:p-3">
              <ProductImage
                src="/product/dashboard.png"
                alt="Dashboard real de LumaFlow Studio con calendario, tareas y métricas del estudio"
                eager
                className="rounded-xl border border-white/8"
              />
              <div className="flex flex-col gap-3 px-2 pb-1 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 text-stone-500">
                  Datos ficticios. Sin registro y sin modificar información real.
                </p>
                <Link
                  to="/demo"
                  className="shrink-0 rounded-lg border border-white/10 bg-white/[0.05] px-4 py-2 text-center text-sm font-semibold text-stone-100 transition hover:border-amber-200/25 hover:bg-white/[0.08]"
                >
                  Explorar demo
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-white/8 bg-[#0d0c0b]">
          <div className="mx-auto grid max-w-[1400px] gap-px bg-white/8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Operación", "Sesiones, tareas y calendario"],
              ["Negocio", "Clientes, presupuestos y facturas"],
              ["Entrega", "Galerías privadas y favoritos"],
              ["Inteligencia", "IA local con WebGPU"],
            ].map(([title, text]) => (
              <div key={title} className="bg-[#0d0c0b] px-6 py-7 lg:px-8">
                <p className="text-sm font-semibold text-stone-100">{title}</p>
                <p className="mt-2 text-sm leading-6 text-stone-500">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="producto"
          className="mx-auto max-w-[1400px] px-4 py-24 sm:px-6 lg:px-10 lg:py-32"
        >
          <div className="max-w-3xl">
            <h2 className="text-4xl font-semibold leading-tight tracking-[-0.04em] text-stone-50 sm:text-5xl">
              Menos pestañas. Más control.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-stone-400">
              LumaFlow conecta la preparación, la producción y el cobro para que cada sesión avance
              con contexto y sin tareas perdidas.
            </p>
          </div>

          <div className="mt-14 grid gap-4 lg:grid-cols-12">
            <article className="overflow-hidden rounded-2xl border border-white/10 bg-[#11100e] lg:col-span-7 lg:row-span-2">
              <div className="p-6 sm:p-8">
                <h3 className="text-xl font-semibold text-stone-50">Calendario operativo</h3>
                <p className="mt-3 max-w-xl text-sm leading-6 text-stone-400">
                  Sesiones, entregas y tareas conviven en una misma línea temporal y se reprograman
                  mediante arrastre.
                </p>
              </div>
              <ProductImage
                src="/product/calendar.png"
                alt="Calendario real de LumaFlow con vistas de mes, semana, día, agenda y lista"
                className="border-t border-white/8"
              />
            </article>

            <article className="rounded-2xl border border-white/10 bg-[linear-gradient(145deg,#1c1914,#11100e)] p-6 sm:p-8 lg:col-span-5">
              <p className="text-5xl font-semibold tracking-[-0.06em] text-amber-100">
                Todo conectado
              </p>
              <h3 className="mt-8 text-xl font-semibold text-stone-50">Clientes conectados</h3>
              <p className="mt-3 text-sm leading-6 text-stone-400">
                Historial, sesiones, presupuestos, facturas y entregas permanecen unidos a cada
                cliente.
              </p>
            </article>

            <article className="overflow-hidden rounded-2xl border border-white/10 bg-[#11100e] lg:col-span-5">
              <div className="p-6 sm:p-8">
                <h3 className="text-xl font-semibold text-stone-50">Decisiones con datos</h3>
                <p className="mt-3 text-sm leading-6 text-stone-400">
                  Analítica de actividad, ingresos y carga de trabajo calculada sobre tu operación
                  real.
                </p>
              </div>
              <ProductImage
                src="/product/analytics.png"
                alt="Panel de analítica real de LumaFlow Studio"
                className="border-t border-white/8"
              />
            </article>

            <article className="rounded-2xl border border-white/10 bg-[#15130f] p-6 sm:p-8 lg:col-span-4">
              <h3 className="text-xl font-semibold text-stone-50">Documentos comerciales</h3>
              <p className="mt-3 text-sm leading-6 text-stone-400">
                Presupuestos, conceptos, impuestos, numeración y facturas PDF dentro del mismo
                flujo.
              </p>
            </article>

            <article className="rounded-2xl border border-amber-200/15 bg-amber-100 p-6 text-stone-950 sm:p-8 lg:col-span-8">
              <h3 className="text-2xl font-semibold tracking-tight">Tu estudio también viaja.</h3>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-700">
                Instala LumaFlow como PWA y consulta el trabajo desde portátil, tablet o móvil sin
                duplicar herramientas.
              </p>
            </article>
          </div>
        </section>

        <section
          id="workflow"
          className="border-y border-white/8 bg-[#0d0c0b] px-4 py-24 sm:px-6 lg:px-10 lg:py-32"
        >
          <div className="mx-auto max-w-[1400px]">
            <h2 className="max-w-2xl text-4xl font-semibold tracking-[-0.04em] text-stone-50 sm:text-5xl">
              De la reserva a la entrega.
            </h2>
            <div className="mt-14 grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
              {workflow.map(([title, description], index) => (
                <article key={title} className="relative border-t border-white/12 pt-6">
                  <span className="font-mono text-xs text-amber-200" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-5 text-2xl font-semibold tracking-tight text-stone-50">
                    {title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-stone-400">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="privacidad"
          className="relative mx-auto grid max-w-[1400px] gap-14 px-4 py-24 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-10 lg:py-32"
        >
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">
              Privacidad e IA local
            </p>
            <h2 className="mt-5 text-4xl font-semibold leading-tight tracking-[-0.04em] text-stone-50 sm:text-5xl">
              La inteligencia trabaja donde están tus datos.
            </h2>
            <p className="mt-5 text-base leading-7 text-stone-400">
              Los modelos WebGPU se ejecutan en el navegador. El asistente usa el contexto de tu
              estudio sin depender de una API externa.
            </p>
            <dl className="mt-10 grid gap-7 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-semibold text-stone-100">Sin claves externas</dt>
                <dd className="mt-2 text-sm leading-6 text-stone-500">
                  Instalas y eliges el modelo compatible desde la aplicación.
                </dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-stone-100">Contexto limitado</dt>
                <dd className="mt-2 text-sm leading-6 text-stone-500">
                  La IA solo consulta información perteneciente a tu estudio.
                </dd>
              </div>
            </dl>
            <Link
              to="/privacy"
              className="mt-8 inline-block text-sm font-semibold text-amber-200 transition hover:text-amber-100"
            >
              Ver cómo protegemos los datos →
            </Link>
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#11100e] p-2 shadow-[0_32px_100px_rgba(0,0,0,.4)]">
            <ProductImage
              src="/product/ai-assistant.png"
              alt="Centro de inteligencia fotográfica real con modelos WebGPU administrables"
              className="rounded-xl border border-white/8"
            />
          </div>
        </section>

        <section className="border-y border-white/8 bg-[#0d0c0b] px-4 py-24 sm:px-6 lg:px-10 lg:py-32">
          <div className="mx-auto grid max-w-[1400px] gap-12 lg:grid-cols-[0.65fr_1.35fr] lg:items-center">
            <div className="max-w-lg">
              <h2 className="text-4xl font-semibold leading-tight tracking-[-0.04em] text-stone-50 sm:text-5xl">
                Una entrega que también cuida tu marca.
              </h2>
              <p className="mt-5 text-base leading-7 text-stone-400">
                Comparte un portal privado, recoge favoritos y mantén el estado comercial de cada
                entrega en el mismo lugar.
              </p>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-stone-300">
                <span>Enlace protegido</span>
                <span>Selección de favoritas</span>
                <span>Aprobación del cliente</span>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#11100e] p-2 shadow-[0_32px_100px_rgba(0,0,0,.4)]">
              <ProductImage
                src="/product/gallery.png"
                alt="Vista real de una entrega y galería privada de cliente en LumaFlow"
                className="rounded-xl border border-white/8"
              />
            </div>
          </div>
        </section>

        <section
          id="precio"
          className="mx-auto max-w-[1400px] px-4 py-24 sm:px-6 lg:px-10 lg:py-32"
        >
          <div className="grid overflow-hidden rounded-2xl border border-white/10 bg-[#11100e] lg:grid-cols-[1.25fr_0.75fr]">
            <div className="p-7 sm:p-10 lg:p-14">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">
                Beta pública
              </p>
              <h2 className="mt-5 text-4xl font-semibold tracking-[-0.04em] text-stone-50 sm:text-5xl">
                Empieza sin coste.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-stone-400">
                Crea tu cuenta y utiliza todos los módulos actuales de forma gratuita. No necesitas
                introducir una tarjeta.
              </p>
              <div className="mt-10 grid gap-3 text-sm text-stone-300 sm:grid-cols-2">
                <p>Todos los módulos actuales</p>
                <p>IA WebGPU en el navegador</p>
                <p>Galerías privadas</p>
                <p>PWA instalable</p>
              </div>
            </div>
            <div className="flex flex-col justify-between border-t border-white/10 bg-[linear-gradient(145deg,#201c14,#14120f)] p-7 sm:p-10 lg:border-l lg:border-t-0 lg:p-14">
              <div>
                <p className="text-sm text-stone-400">Beta gratuita</p>
                <p className="mt-3 text-6xl font-semibold tracking-[-0.06em] text-stone-50">
                  0 €
                  <span className="ml-2 text-base font-normal tracking-normal text-stone-500">
                    durante la beta
                  </span>
                </p>
              </div>
              <Link
                to="/register"
                className="mt-10 rounded-lg bg-amber-100 px-5 py-3 text-center text-sm font-semibold text-stone-950 transition hover:bg-stone-50 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#14120f]"
              >
                Empezar gratis
              </Link>
              <Link
                to="/pricing"
                className="mt-3 text-center text-sm font-semibold text-stone-300 transition hover:text-stone-50"
              >
                Ver condiciones de la beta
              </Link>
            </div>
          </div>
        </section>

        <section
          id="faq"
          className="border-t border-white/8 bg-[#0d0c0b] px-4 py-24 sm:px-6 lg:px-10 lg:py-32"
        >
          <div className="mx-auto grid max-w-[1400px] gap-12 lg:grid-cols-[0.55fr_1fr]">
            <div>
              <h2 className="text-4xl font-semibold tracking-[-0.04em] text-stone-50 sm:text-5xl">
                Preguntas frecuentes
              </h2>
              <p className="mt-5 max-w-sm text-base leading-7 text-stone-400">
                Lo esencial antes de abrir tu espacio de trabajo.
              </p>
            </div>
            <div className="divide-y divide-white/10 border-t border-white/10">
              {faqs.map(([question, answer]) => (
                <details key={question} className="group py-1">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-left text-base font-semibold text-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/70">
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
          </div>
        </section>

        <section className="relative overflow-hidden border-t border-white/8 px-4 py-24 sm:px-6 lg:px-10 lg:py-32">
          <div className="absolute inset-0 -z-0 bg-[radial-gradient(circle_at_50%_100%,rgba(196,141,72,.18),transparent_52%)]" />
          <div className="relative mx-auto max-w-4xl text-center">
            <h2 className="text-4xl font-semibold leading-tight tracking-[-0.04em] text-stone-50 sm:text-6xl">
              Tu siguiente sesión empieza aquí.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-stone-400">
              Reúne producción, negocio y entrega en una plataforma construida para fotografía.
            </p>
            <Link
              to="/register"
              className="mt-8 inline-block rounded-lg bg-amber-100 px-6 py-3 text-sm font-semibold text-stone-950 transition hover:bg-stone-50 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090908]"
            >
              Empezar gratis
            </Link>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
