import { Button } from "./Button";

/** Barra flotante de acciones masivas. Se muestra solo con seleccion activa. */
export function BulkActionBar({ count, onClear, children }) {
  if (count === 0) return null;

  return (
    <div className="sticky bottom-4 z-30 mt-6 flex flex-wrap items-center gap-3 rounded-lg border border-amber-200/20 bg-[#14120e]/95 px-4 py-3 shadow-2xl shadow-black/50 backdrop-blur">
      <span className="text-sm text-stone-200">
        {count} {count === 1 ? "elemento" : "elementos"}
      </span>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        {children}
        <Button variant="ghost" onClick={onClear}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
