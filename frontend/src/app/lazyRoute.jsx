import { lazy, Suspense } from "react";
import { LoadingState } from "../components/states/LoadingState";

/**
 * Envuelve una pagina en React.lazy + Suspense. Los modulos pesados
 * (Recharts, calendario) quedan fuera del bundle inicial.
 */
export function lazyRoute(loader, exportName) {
  const Component = lazy(() => loader().then((module) => ({ default: module[exportName] })));

  return (
    <Suspense fallback={<LoadingState label="Cargando modulo..." />}>
      <Component />
    </Suspense>
  );
}
