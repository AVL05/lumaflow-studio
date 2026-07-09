import { Panel } from "../../components/ui/Panel";
import { EmptyState } from "../../components/states/EmptyState";

/** Tabla compacta reutilizable para comparativas de la pagina de analitica. */
export function AnalyticsTable({ title, description, rows, valueLabel = "Total", metaLabel }) {
  const total = rows.reduce((sum, row) => sum + row.total, 0);

  return (
    <Panel className="p-5">
      <h2 className="text-sm font-semibold text-stone-100">{title}</h2>
      {description ? <p className="mt-1 text-xs text-stone-400">{description}</p> : null}

      {rows.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="Sin datos" description="No hay registros para comparar." />
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.16em] text-stone-400">
              <tr>
                <th className="pb-2 font-medium">Elemento</th>
                {metaLabel ? <th className="pb-2 font-medium">{metaLabel}</th> : null}
                <th className="pb-2 text-right font-medium">{valueLabel}</th>
                <th className="pb-2 text-right font-medium">%</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-t border-white/[0.05]">
                  <td className="max-w-64 truncate py-2 text-stone-200">{row.label}</td>
                  {metaLabel ? <td className="py-2 text-stone-400">{row.meta ?? "-"}</td> : null}
                  <td className="py-2 text-right tabular-nums text-stone-300">{row.total}</td>
                  <td className="py-2 text-right tabular-nums text-stone-400">
                    {total > 0 ? Math.round((row.total / total) * 100) : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
