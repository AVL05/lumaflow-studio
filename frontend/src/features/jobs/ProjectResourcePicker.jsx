import { useCallback } from "react";
import { jobsApi } from "../../api/jobs";
import { usePaginatedResource } from "../../hooks/usePaginatedResource";
import { Input } from "../../components/ui/Input";
import { Pagination } from "../../components/ui/Pagination";
import { ErrorState } from "../../components/states/ErrorState";
import { Button } from "../../components/ui/Button";

export function ProjectResourcePicker({
  jobId,
  resource,
  label,
  selected,
  onChange,
  single = false,
}) {
  const fetcher = useCallback(
    (params) => jobsApi.options(jobId, { ...params, resource }),
    [jobId, resource],
  );
  const { items, meta, error, loading, filters, updateFilter, setPage, refresh } =
    usePaginatedResource(fetcher, { page: 1, search: "" });
  return (
    <fieldset className="min-w-0 rounded-xl border border-white/10 p-4">
      <legend className="px-1 text-sm font-semibold text-stone-200">{label}</legend>
      <Input
        aria-label={`Buscar ${label.toLowerCase()}`}
        placeholder="Buscar en el estudio del proyecto"
        value={filters.search}
        onChange={(e) => updateFilter("search", e.target.value)}
      />
      <p className="my-2 text-xs text-stone-400">
        {selected.length} seleccionado{selected.length === 1 ? "" : "s"}
      </p>
      {error && <ErrorState message={error} onRetry={refresh} />}
      {loading ? (
        <p role="status" className="text-sm text-stone-400">
          Cargando opciones...
        </p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {items.map((item) => (
            <label
              key={item.id}
              className="flex min-w-0 items-center gap-3 py-2 text-sm text-stone-300"
            >
              <input
                type={single ? "radio" : "checkbox"}
                name={single ? resource : undefined}
                checked={selected.includes(item.id)}
                onChange={(e) =>
                  onChange(
                    single
                      ? [item.id]
                      : e.target.checked
                        ? [...selected, item.id]
                        : selected.filter((id) => id !== item.id),
                  )
                }
              />
              <span className="break-words">{item.name}</span>
            </label>
          ))}
          {!items.length && !error && (
            <p className="text-sm text-stone-400">No hay coincidencias.</p>
          )}
        </div>
      )}
      {single && selected.length > 0 && (
        <Button type="button" variant="ghost" onClick={() => onChange([])}>
          Quitar selección
        </Button>
      )}
      <Pagination meta={meta} onPage={setPage} />
    </fieldset>
  );
}
