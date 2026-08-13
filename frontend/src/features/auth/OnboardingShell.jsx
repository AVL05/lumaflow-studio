import { Link } from "react-router-dom";
import { BrandLogo } from "../../components/branding/BrandLogo";

export function OnboardingShell({ current, total, title, description, children }) {
  return (
    <main className="relative min-h-dvh overflow-x-hidden bg-[#090908] text-stone-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(196,141,72,0.14),transparent_34rem),linear-gradient(180deg,#0d0c0a_0%,#090908_68%)]" />
      <div className="relative mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 py-5 sm:px-6 sm:py-7">
        <header className="flex items-center justify-between gap-4">
          <Link
            to="/"
            aria-label="Ir al inicio de LumaFlow Studio"
            className="flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/70"
          >
            <BrandLogo className="h-10 w-10 rounded-lg" />
            <span className="text-sm font-semibold text-stone-50">LumaFlow Studio</span>
          </Link>
          <p className="text-sm text-stone-500">
            {current} de {total}
          </p>
        </header>

        <section className="flex flex-1 items-center py-10 sm:py-14">
          <div className="grid w-full overflow-hidden rounded-2xl border border-white/10 bg-[#12110f]/94 shadow-[0_32px_100px_rgba(0,0,0,.42)] lg:grid-cols-[0.7fr_1.3fr]">
            <div className="border-b border-white/10 bg-[linear-gradient(145deg,#211c14,#12100d)] p-7 sm:p-10 lg:border-b-0 lg:border-r">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">
                Configura tu estudio
              </p>
              <h1 className="mt-5 text-3xl font-semibold leading-tight tracking-[-0.035em] text-stone-50 sm:text-4xl">
                {title}
              </h1>
              <p className="mt-4 max-w-sm text-sm leading-6 text-stone-400">{description}</p>
              <div className="mt-10 flex gap-2" aria-label={`Progreso: ${current} de ${total}`}>
                {Array.from({ length: total }, (_, index) => (
                  <span
                    key={index}
                    className={`h-1 flex-1 rounded-full ${index < current ? "bg-amber-200" : "bg-white/10"}`}
                  />
                ))}
              </div>
            </div>
            <div className="p-6 sm:p-10">{children}</div>
          </div>
        </section>
      </div>
    </main>
  );
}
