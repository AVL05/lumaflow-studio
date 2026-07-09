import { Button } from "../../components/ui/Button";
import { Checkbox } from "../../components/ui/Checkbox";
import { Panel } from "../../components/ui/Panel";
import { calendarSources } from "../../utils/catalogs";
import { sourceDots } from "./calendarUtils";

export function CalendarSidebar({ sources, onToggleSource, counts, onCreateTask }) {
  return (
    <Panel className="p-4">
      <h2 className="text-sm font-semibold text-stone-100">Filtros</h2>
      <div className="mt-4 space-y-3">
        {calendarSources.map((source) => (
          <div key={source.value} className="flex items-center justify-between gap-3">
            <Checkbox
              checked={sources.includes(source.value)}
              onChange={() => onToggleSource(source.value)}
              label={
                <span className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${sourceDots[source.value]}`} />
                  {source.label}
                </span>
              }
            />
            <span className="text-xs tabular-nums text-stone-400">{counts[source.value] ?? 0}</span>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-2 border-t border-white/10 pt-5">
        <p className="text-xs uppercase tracking-[0.16em] text-stone-400">Crear</p>
        <Button variant="secondary" className="w-full" onClick={onCreateTask}>
          Nueva tarea
        </Button>
      </div>

      <p className="mt-6 text-xs leading-5 text-stone-400">
        Arrastra cualquier evento a otro dia para reprogramarlo. Los cambios se guardan al soltar.
      </p>
    </Panel>
  );
}
