import { memo } from "react";
import { EmptyState } from "../../components/states/EmptyState";
import { CalendarEvent } from "./CalendarEvent";
import { DayDropZone } from "./DayDropZone";
import { dayLabel } from "./calendarUtils";

const hours = Array.from({ length: 15 }, (_, index) => `${String(index + 7).padStart(2, "0")}:00`);

export const CalendarDay = memo(function CalendarDay({ cursor, events, onMove, onSelect }) {
  const untimed = events.filter((event) => !event.time);

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
      <h2 className="text-sm font-semibold text-stone-100">{dayLabel(cursor)}</h2>

      {untimed.length > 0 ? (
        <div className="mt-4 space-y-1.5 rounded-md border border-dashed border-white/10 p-2">
          <p className="text-xs uppercase tracking-[0.16em] text-stone-400">Sin hora</p>
          {untimed.map((event) => (
            <CalendarEvent key={event.id} event={event} onSelect={onSelect} />
          ))}
        </div>
      ) : null}

      <div className="mt-4 space-y-px">
        {hours.map((hour) => {
          const slotEvents = events.filter((event) => event.time?.startsWith(hour.slice(0, 2)));

          return (
            <DayDropZone
              key={hour}
              date={cursor}
              onMove={(payload) => onMove({ ...payload, time: hour })}
              className="grid grid-cols-[64px_1fr] gap-3 rounded border border-transparent px-1 py-1.5 hover:border-white/[0.06]"
            >
              <span className="pt-0.5 text-xs tabular-nums text-stone-400">{hour}</span>
              <div className="min-h-6 space-y-1">
                {slotEvents.map((event) => (
                  <CalendarEvent key={event.id} event={event} onSelect={onSelect} />
                ))}
              </div>
            </DayDropZone>
          );
        })}
      </div>

      {events.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="Dia libre" description="No hay eventos programados para esta fecha." />
        </div>
      ) : null}
    </div>
  );
});
