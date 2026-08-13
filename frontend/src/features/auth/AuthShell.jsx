import { Link } from "react-router-dom";
import { BrandLogo } from "../../components/branding/BrandLogo";

export function AuthShell({ eyebrow = "Acceso a LumaFlow", title, description, footer, children }) {
  return (
    <main className="relative min-h-dvh overflow-x-hidden bg-[#090908] text-stone-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(196,141,72,0.14),transparent_32rem),linear-gradient(180deg,#0d0c0a_0%,#090908_60%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/25 to-transparent" />

      <div className="relative mx-auto grid min-h-dvh w-full max-w-6xl grid-rows-[auto_1fr] px-4 py-5 sm:px-6 sm:py-7">
        <header className="flex justify-center sm:justify-start">
          <Link
            to="/"
            aria-label="Ir al inicio de LumaFlow Studio"
            className="group flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/70 focus-visible:ring-offset-4 focus-visible:ring-offset-[#090908]"
          >
            <BrandLogo className="h-10 w-10 rounded-lg transition duration-200 group-hover:brightness-110" />
            <span>
              <span className="block text-sm font-semibold tracking-tight text-stone-50">
                LumaFlow Studio
              </span>
              <span className="block text-xs text-stone-500">Gestión fotográfica</span>
            </span>
          </Link>
        </header>

        <section className="flex items-center justify-center py-10 sm:py-14">
          <div className="w-full max-w-[27rem]">
            <div className="rounded-2xl border border-white/10 bg-[#12110f]/92 p-6 shadow-[0_28px_90px_rgba(0,0,0,.38)] backdrop-blur-xl sm:p-8">
              <header className="mb-7">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-amber-200">
                  {eyebrow}
                </p>
                <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-balance sm:text-[2.15rem]">
                  {title}
                </h1>
                <p className="mt-3 max-w-sm text-sm leading-6 text-stone-400">{description}</p>
              </header>
              {children}
            </div>

            <p className="mt-6 text-center text-sm text-stone-400">{footer}</p>
          </div>
        </section>
      </div>
    </main>
  );
}
