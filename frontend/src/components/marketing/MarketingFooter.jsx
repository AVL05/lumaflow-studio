import { Link } from "react-router-dom";
import { BrandLogo } from "../branding/BrandLogo";

export function MarketingFooter() {
  return (
    <footer className="border-t border-white/8 bg-[#090908] px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-5 text-sm text-stone-500 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <BrandLogo className="h-8 w-8 rounded-lg" />
          <span>LumaFlow Studio</span>
        </div>
        <nav aria-label="Enlaces del pie" className="flex flex-wrap gap-x-6 gap-y-2">
          <Link className="transition hover:text-stone-200" to="/features">
            Casos de uso
          </Link>
          <Link className="transition hover:text-stone-200" to="/pricing">
            Precio
          </Link>
          <Link className="transition hover:text-stone-200" to="/privacy">
            Privacidad
          </Link>
          <Link className="transition hover:text-stone-200" to="/about-project">
            Sobre el proyecto
          </Link>
          <a
            className="transition hover:text-stone-200"
            href="https://aleviclop.dev"
            target="_blank"
            rel="noreferrer"
          >
            Creado por Alex Vicente
          </a>
        </nav>
      </div>
    </footer>
  );
}
