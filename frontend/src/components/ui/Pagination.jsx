import { Button } from "./Button";

export function Pagination({ meta, onPage }) {
  if (!meta || meta.last_page <= 1) return null;

  return (
    <div className="mt-6 flex items-center justify-between gap-3 text-sm text-stone-500">
      <span>
        Pagina {meta.current_page} de {meta.last_page}
      </span>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          disabled={meta.current_page <= 1}
          onClick={() => onPage(meta.current_page - 1)}
        >
          Anterior
        </Button>
        <Button
          variant="secondary"
          disabled={meta.current_page >= meta.last_page}
          onClick={() => onPage(meta.current_page + 1)}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}
