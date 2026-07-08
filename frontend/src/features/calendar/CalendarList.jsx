import { memo } from "react";
import { Badge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/states/EmptyState";
import { calendarSources, labelFor } from "../../utils/catalogs";
import { sourceDots } from "./calendarUtils";

/** Vista lista compacta, pensada para densidad de datos. */
export const CalendarList = memo(function CalendarList({ events, onSelect }) {
  if (events.length === 0) {
    return <EmptyState title="Sin eventos" description="Ajusta el rango o los filtros." />;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-white/10">
      <table className="w-full min-w-160 text-left text-sm">
        <thead className="border-b border-white/10 bg-white/[0.03] text-[11px] uppercase tracking-[0.16em] text-stone-500">
          <tr>
            <th className="px-3 py-2 font-medium">Fecha</th>
            <th className="px-3 py-2 font-medium">Hora</th>
            <th className="px-3 py-2 font-medium">Tipo</th>
            <th className="px-3 py-2 font-medium">Titulo</th>
            <th className="px-3 py-2 font-medium">Estado</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr
              key={event.id}
              onClick={() => onSelect?.(event)}
              className="cursor-pointer border-b border-white/[0.05] transition last:border-0 hover:bg-white/[0.03]"
            >
              <td className="px-3 py-2 tabular-nums text-stone-400">{event.date}</td>
              <td className="px-3 py-2 tabular-nums text-stone-500">{event.time ?? "--:--"}</td>
              <td className="px-3 py-2">
                <span className="flex items-center gap-2 text-stone-400">
                  <span className={`h-2 w-2 rounded-full ${sourceDots[event.source]}`} />
                  {labelFor(calendarSources, event.source)}
                </span>
              </td>
              <td className="max-w-80 truncate px-3 py-2 text-stone-100">{event.title}</td>
              <td className="px-3 py-2">
                <Badge>{event.status ?? "-"}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});
