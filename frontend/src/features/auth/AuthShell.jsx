import { Link } from "react-router-dom";

const highlights = [
  ["47.2%", "sesiones listas para entregar"],
  ["18", "tareas abiertas esta semana"],
  ["WebGPU", "IA local en navegador"],
];

const pipeline = [
  ["Brief recibido", "Cliente: Alba Norte", "100%"],
  ["Sesion editorial", "Madrid Rio - 18:30", "72%"],
  ["Entrega galeria", "42 fotos seleccionadas", "38%"],
];

const checks = ["Tokens Bearer", "Datos aislados por usuario", "IA sin proveedor externo"];

export function AuthShell({ eyebrow = "Acceso privado", title, description, footer, children }) {
  return (
    <main className="relative min-h-dvh overflow-x-hidden bg-[#090908] text-stone-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(196,141,72,0.18),transparent_30rem),radial-gradient(circle_at_82%_28%,rgba(92,72,48,0.22),transparent_22rem),linear-gradient(145deg,#090908_0%,#12100d_48%,#080807_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,.82)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.82)_1px,transparent_1px)] [background-size:48px_48px]" />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <Link to="/" className="group flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-amber-200 text-sm font-semibold text-stone-950 transition group-hover:bg-stone-50">
              LF
            </span>
            <span>
              <span className="block text-sm font-semibold tracking-tight text-stone-50">
                LumaFlow Studio
              </span>
              <span className="block text-xs text-stone-400">photography workflow</span>
            </span>
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            <Link
              to="/about-project"
              className="hidden rounded-md px-3 py-2 text-stone-400 transition hover:bg-white/[0.05] hover:text-stone-100 sm:inline-flex"
            >
              Proyecto
            </Link>
            <Link
              to="/register"
              className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-stone-200 transition hover:bg-white/[0.08]"
            >
              Crear workspace
            </Link>
          </nav>
        </header>

        <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1.08fr_0.92fr] lg:py-14">
          <section className="hidden lg:block">
            <p className="text-sm font-medium text-amber-100">Acceso profesional privado</p>
            <h1 className="mt-5 max-w-3xl text-6xl font-semibold leading-[0.93] tracking-tight text-balance xl:text-7xl">
              Entra al centro de control de tu estudio fotografico.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-stone-400">
              Gestiona produccion, biblioteca, clientes y entregas con una interfaz pensada para
              decisiones reales de trabajo. Sin ruido, sin paneles de relleno.
            </p>

            <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
              {highlights.map(([value, label]) => (
                <div
                  key={label}
                  className="rounded-lg border border-white/10 bg-white/[0.045] p-4 shadow-xl shadow-black/20"
                >
                  <p className="text-2xl font-semibold tabular-nums text-stone-50">{value}</p>
                  <p className="mt-2 text-xs leading-5 text-stone-400">{label}</p>
                </div>
              ))}
            </div>

            <div className="relative mt-10 max-w-3xl">
              <div className="rounded-lg border border-white/10 bg-[#15130f]/90 p-3 shadow-2xl shadow-black/40">
                <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-300/70" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-200/70" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-300/70" />
                  </div>
                  <span className="rounded-md bg-black/30 px-3 py-1 text-xs text-stone-400">
                    /app/dashboard
                  </span>
                </div>

                <div className="grid gap-3 lg:grid-cols-[0.7fr_1.3fr]">
                  <aside className="space-y-2 rounded-md bg-black/20 p-3">
                    {["Dashboard", "Calendario", "Biblioteca", "Clientes"].map((item, index) => (
                      <div
                        key={item}
                        className={`rounded-md px-3 py-2 text-xs ${
                          index === 0 ? "bg-amber-200/12 text-amber-100" : "text-stone-400"
                        }`}
                      >
                        {item}
                      </div>
                    ))}
                  </aside>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      {["Ingresos", "Entregas", "Edicion"].map((item, index) => (
                        <div key={item} className="rounded-md bg-white/[0.045] p-3">
                          <p className="text-xs text-stone-400">{item}</p>
                          <p className="mt-2 text-lg font-semibold tabular-nums text-stone-100">
                            {["3.840", "12", "68%"][index]}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-md bg-black/20 p-3">
                      <div className="mb-3 flex items-center justify-between text-xs">
                        <span className="text-stone-300">Pipeline semanal</span>
                        <span className="text-stone-400">actualizado ahora</span>
                      </div>
                      <div className="space-y-3">
                        {pipeline.map(([name, detail, progress]) => (
                          <div key={name}>
                            <div className="mb-1 flex justify-between gap-3 text-xs">
                              <span className="text-stone-300">{name}</span>
                              <span className="text-stone-400">{detail}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-white/[0.06]">
                              <div
                                className="h-full rounded-full bg-amber-200/80"
                                style={{ width: progress }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -right-8 -top-7 w-56 rounded-lg border border-amber-200/20 bg-[#1a1510]/95 p-4 shadow-2xl shadow-black/30">
                <p className="text-xs uppercase tracking-[0.16em] text-amber-100">IA local</p>
                <p className="mt-2 text-sm leading-6 text-stone-300">
                  Plan de sesion generado con contexto del cliente y equipo disponible.
                </p>
              </div>
            </div>
          </section>

          <section className="flex justify-center lg:justify-end">
            <div className="w-full max-w-[29rem]">
              <div className="mb-6 lg:hidden">
                <p className="text-sm font-medium text-amber-100">Acceso profesional privado</p>
                <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight text-balance">
                  Gestiona tu estudio desde un panel privado.
                </h1>
              </div>

              <div className="rounded-lg border border-white/10 bg-[#11100e]/88 p-2 shadow-2xl shadow-black/45 backdrop-blur-xl">
                <div className="rounded-md border border-white/10 bg-[#15130f] p-6 sm:p-8">
                  <div className="mb-7 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-amber-200">
                        {eyebrow}
                      </p>
                      <h2 className="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                        {title}
                      </h2>
                    </div>
                    <span className="rounded-md border border-emerald-300/15 bg-emerald-400/10 px-2.5 py-1 text-xs text-emerald-100">
                      Seguro
                    </span>
                  </div>
                  <p className="-mt-4 mb-7 text-sm leading-6 text-stone-400">{description}</p>
                  {children}
                </div>

                <div className="grid gap-2 px-4 py-4 text-xs text-stone-400 sm:grid-cols-3">
                  {checks.map((item) => (
                    <span key={item} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-200/70" />
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <p className="mt-6 text-center text-sm text-stone-400">{footer}</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
