import { Link } from "react-router-dom";
import { BrandLogo } from "../branding/BrandLogo";

const navItems = [
  ["Casos de uso", "/features"],
  ["Cómo funciona", "/#workflow"],
  ["Demo", "/demo"],
  ["Privacidad", "/privacy"],
  ["Precio", "/pricing"],
];

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/8 bg-[#090908]/88 backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] max-w-[1400px] items-center justify-between gap-5 px-4 sm:px-6 lg:px-10">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/70"
          aria-label="LumaFlow Studio, inicio"
        >
          <BrandLogo className="h-9 w-9 rounded-lg" />
          <span className="text-sm font-semibold tracking-tight text-stone-50">
            LumaFlow Studio
          </span>
        </Link>

        <nav aria-label="Navegación principal" className="hidden items-center gap-7 lg:flex">
          {navItems.map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="text-sm text-stone-400 transition hover:text-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/70"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <Link
            to="/login"
            className="rounded-lg px-4 py-2 text-sm font-semibold text-stone-300 transition hover:bg-white/[0.05] hover:text-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/70"
          >
            Entrar
          </Link>
          <Link
            to="/register"
            className="rounded-lg bg-amber-100 px-4 py-2 text-sm font-semibold text-stone-950 transition hover:bg-stone-50 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090908]"
          >
            Empezar gratis
          </Link>
        </div>

        <details className="group relative sm:hidden">
          <summary className="cursor-pointer list-none rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-stone-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/70">
            Menú
          </summary>
          <nav
            aria-label="Navegación móvil"
            className="fixed inset-x-4 top-[76px] rounded-2xl border border-white/10 bg-[#12110f] p-3 shadow-[0_24px_80px_rgba(0,0,0,.55)]"
          >
            {navItems.map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="block rounded-lg px-3 py-3 text-sm text-stone-300 hover:bg-white/[0.06]"
              >
                {label}
              </a>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-white/10 pt-3">
              <Link
                className="rounded-lg px-3 py-2.5 text-center text-sm text-stone-200"
                to="/login"
              >
                Entrar
              </Link>
              <Link
                className="rounded-lg bg-amber-100 px-3 py-2.5 text-center text-sm font-semibold text-stone-950"
                to="/register"
              >
                Empezar gratis
              </Link>
            </div>
          </nav>
        </details>
      </div>
    </header>
  );
}
