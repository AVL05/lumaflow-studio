import { ResponsiveContainer } from "recharts";
import { Panel } from "../../components/ui/Panel";
import { EmptyState } from "../../components/states/EmptyState";

export function ChartPanel({ title, description, data, height = 260, children, action }) {
  const isEmpty = !data || data.length === 0 || data.every((item) => (item.total ?? 0) === 0);

  return (
    <Panel className="p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-stone-100">{title}</h2>
          {description ? <p className="mt-1 text-xs text-stone-500">{description}</p> : null}
        </div>
        {action}
      </div>

      {isEmpty ? (
        <EmptyState title="Sin datos" description="No hay registros en el rango seleccionado." />
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          {children}
        </ResponsiveContainer>
      )}
    </Panel>
  );
}
