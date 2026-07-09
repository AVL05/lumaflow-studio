import { memo } from "react";
import { CalendarEvent } from "./CalendarEvent";
import {
  dayNumber,
  groupByDate,
  isSameMonth,
  monthGrid,
  todayIso,
  weekdayLabels,
} from "./calendarUtils";
import { DayDropZone } from "./DayDropZone";

export const CalendarMonth = memo(function CalendarMonth({
  cursor,
  events,
  onMove,
  onSelect,
  onCreate,
}) {
  const grid = monthGrid(cursor);
  const byDate = groupByDate(events);
  const today = todayIso();

  return (
    <div className="overflow-hidden rounded-lg border border-white/10">
      <div className="grid grid-cols-7 border-b border-white/10 bg-white/[0.03]">
        {weekdayLabels.map((label) => (
          <div
            key={label}
            className="px-2 py-2 text-center text-xs uppercase tracking-[0.16em] text-stone-400"
          >
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {grid.map((iso) => (
          <DayDropZone
            key={iso}
            date={iso}
            onMove={onMove}
            className={`min-h-28 border-b border-r border-white/[0.06] p-1.5 last:border-r-0 ${
              isSameMonth(iso, cursor) ? "" : "bg-black/20 opacity-50"
            }`}
          >
            <div className="mb-1 flex items-center justify-between">
              <span
                className={`grid h-6 w-6 place-items-center rounded-full text-xs ${
                  iso === today ? "bg-amber-200 font-semibold text-stone-950" : "text-stone-400"
                }`}
              >
                {dayNumber(iso)}
              </span>
              <button
                type="button"
                aria-label={`Crear evento el ${iso}`}
                onClick={() => onCreate?.(iso)}
                className="rounded px-1 text-xs text-stone-400 transition hover:bg-white/[0.08] hover:text-stone-200"
              >
                +
              </button>
            </div>
            <div className="space-y-1">
              {(byDate[iso] ?? []).slice(0, 3).map((event) => (
                <CalendarEvent key={event.id} event={event} onSelect={onSelect} compact />
              ))}
              {(byDate[iso]?.length ?? 0) > 3 ? (
                <p className="px-1 text-xs text-stone-400">+{byDate[iso].length - 3} mas</p>
              ) : null}
            </div>
          </DayDropZone>
        ))}
      </div>
    </div>
  );
});
