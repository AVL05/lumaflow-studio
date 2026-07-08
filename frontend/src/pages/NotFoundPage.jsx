import { Link, useRouteError } from "react-router-dom";
import { Button } from "../components/ui/Button";

/**
 * Sirve como pagina 404 y como `errorElement` del router: sustituye la pantalla
 * de desarrollo de React Router, que filtraba stack traces al usuario.
 */
export function NotFoundPage({ asErrorBoundary = false }) {
  const error = useRouteError();
  const isCrash = asErrorBoundary && error;

  return (
    <div className="grid min-h-screen place-items-center bg-[#090908] px-4 text-stone-100">
      <div className="max-w-md text-center">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-amber-200/70">
          {isCrash ? "Error inesperado" : "Error 404"}
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          {isCrash ? "Algo se ha roto" : "Pagina no encontrada"}
        </h1>
        <p className="mt-4 text-sm leading-6 text-stone-400">
          {isCrash
            ? "La vista no ha podido renderizarse. Vuelve al dashboard e intentalo de nuevo."
            : "La ruta que buscas no existe o ha cambiado de sitio."}
        </p>
        {isCrash && import.meta.env.DEV ? (
          <pre className="mt-5 overflow-x-auto rounded-md border border-white/10 bg-black/40 p-3 text-left text-xs text-red-200">
            {error.message ?? String(error)}
          </pre>
        ) : null}
        <div className="mt-8 flex justify-center gap-2">
          <Link to="/app/dashboard">
            <Button>Ir al dashboard</Button>
          </Link>
          <Link to="/about-project">
            <Button variant="secondary">Sobre el proyecto</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
