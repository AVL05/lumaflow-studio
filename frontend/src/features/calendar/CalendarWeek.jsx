import { memo } from "react";
import { CalendarEvent } from "./CalendarEvent";
import { DayDropZone } from "./DayDropZone";
import { dayNumber, groupByDate, todayIso, weekGrid, weekdayLabels } from "./calendarUtils";

export const CalendarWeek = memo(function CalendarWeek({ cursor, events, onMove, onSelect, onCreate }) {
  const days = weekGrid(cursor);
  const byDate = groupByDate(events);
  const today = todayIso();

  return (
    <div className="grid gap-2 md:grid-cols-7">
      {days.map((iso, index) => (
        <DayDropZone
          key={iso}
          date={iso}
          onMove={onMove}
          className="min-h-64 rounded-lg border border-white/10 bg-white/[0.02] p-2"
        >
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-stone-500">
                {weekdayLabels[index]}
              </p>
              <p
                className={`text-lg font-semibold ${iso === today ? "text-amber-200" : "text-stone-200"}`}
              >
                {dayNumber(iso)}
              </p>
            </div>
            <button
              type="button"
              aria-label={`Crear evento el ${iso}`}
              onClick={() => onCreate?.(iso)}
              className="rounded px-1 text-sm text-stone-600 transition hover:bg-white/[0.08] hover:text-stone-200"
            >
              +
            </button>
          </div>
          <div className="space-y-1.5">
            {(byDate[iso] ?? []).map((event) => (
              <CalendarEvent key={event.id} event={event} onSelect={onSelect} />
            ))}
          </div>
        </DayDropZone>
      ))}
    </div>
  );
});
