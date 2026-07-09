import { memo } from "react";
import { EmptyState } from "../../components/states/EmptyState";
import { CalendarEvent } from "./CalendarEvent";
import { dayLabel, groupByDate, todayIso } from "./calendarUtils";

/** Vista agenda: eventos agrupados por dia, en orden cronologico. */
export const CalendarAgenda = memo(function CalendarAgenda({ events, onSelect }) {
  const byDate = groupByDate(events);
  const dates = Object.keys(byDate).sort();
  const today = todayIso();

  if (dates.length === 0) {
    return (
      <EmptyState
        title="Agenda vacia"
        description="No hay sesiones, entregas, tareas ni recordatorios en el rango seleccionado."
      />
    );
  }

  return (
    <div className="space-y-5">
      {dates.map((iso) => (
        <div key={iso} className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
          <div className="mb-3 flex items-baseline gap-3">
            <h3
              className={`text-sm font-semibold ${iso === today ? "text-amber-200" : "text-stone-200"}`}
            >
              {dayLabel(iso)}
            </h3>
            <span className="text-xs text-stone-400">{byDate[iso].length} eventos</span>
          </div>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {byDate[iso].map((event) => (
              <CalendarEvent key={event.id} event={event} onSelect={onSelect} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
});
