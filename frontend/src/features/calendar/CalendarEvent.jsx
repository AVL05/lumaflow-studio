import { sourceStyles } from "./calendarUtils";

export function CalendarEvent({ event, onSelect, compact = false }) {
  function handleDragStart(dragEvent) {
    dragEvent.dataTransfer.effectAllowed = "move";
    dragEvent.dataTransfer.setData(
      "application/lumaflow-event",
      JSON.stringify({ source: event.source, sourceId: event.source_id, time: event.time }),
    );
  }

  return (
    <button
      type="button"
      draggable={event.draggable}
      onDragStart={handleDragStart}
      onClick={() => onSelect?.(event)}
      title={event.title}
      className={`w-full cursor-grab rounded border px-2 py-1 text-left text-xs transition active:cursor-grabbing hover:brightness-125 ${sourceStyles[event.source]}`}
    >
      {/* La rejilla mensual es estrecha: la hora va encima y el título usa dos líneas. */}
      <span className={compact ? "flex flex-col" : "flex items-center gap-1.5"}>
        {event.time ? (
          <span className="shrink-0 tabular-nums opacity-70">
            {event.time.slice(0, 5)}
            {!compact && event.meta?.end_time ? `–${event.meta.end_time.slice(0, 5)}` : ""}
          </span>
        ) : null}
        <span className={compact ? "line-clamp-2 hyphens-auto break-words" : "truncate"}>
          {event.title}
        </span>
      </span>
      {!compact && event.meta?.client ? (
        <span className="mt-0.5 block truncate opacity-60">{event.meta.client}</span>
      ) : null}
    </button>
  );
}
