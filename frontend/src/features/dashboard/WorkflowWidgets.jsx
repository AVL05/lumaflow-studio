import { Link } from "react-router-dom";
import { Badge } from "../../components/ui/Badge";
import { Card } from "../../components/ui/Card";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { ActivityFeed } from "../timeline/ActivityFeed";
import { sourceDots } from "../calendar/calendarUtils";
import {
  gearCategories,
  labelFor,
  taskPriorities,
  taskStatuses,
  toneFor,
} from "../../utils/catalogs";

function WidgetCard({ title, action, children }) {
  return (
    <Card className="p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-semibold text-stone-100">{title}</h2>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </Card>
  );
}

function Empty({ text }) {
  return <p className="text-sm text-stone-400">{text}</p>;
}

export function AgendaWidget({ events }) {
  return (
    <WidgetCard
      title="Agenda de hoy"
      action={
        <Link to="/app/calendar" className="text-xs text-amber-200 hover:text-amber-100">
          Calendario
        </Link>
      }
    >
      {events.length === 0 ? (
        <Empty text="Sin eventos programados para hoy." />
      ) : (
        <ul className="space-y-2">
          {events.map((event) => (
            <li key={event.id} className="flex items-center gap-3 rounded-md bg-white/[0.04] p-3">
              <span className={`h-2 w-2 shrink-0 rounded-full ${sourceDots[event.source]}`} />
              <span className="min-w-0 flex-1 truncate text-sm text-stone-200">{event.title}</span>
              <span className="shrink-0 text-xs tabular-nums text-stone-400">
                {event.time ?? "--:--"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}

export function PendingTasksWidget({ tasks, summary }) {
  return (
    <WidgetCard
      title="Tareas pendientes"
      action={
        <Link to="/app/tasks" className="text-xs text-amber-200 hover:text-amber-100">
          Ver todas
        </Link>
      }
    >
      {summary ? (
        <p className="mb-3 text-xs text-stone-400">
          {summary.open} abiertas · {summary.overdue} vencidas · {summary.dueToday} para hoy
        </p>
      ) : null}

      {tasks.length === 0 ? (
        <Empty text="Nada pendiente. Buen trabajo." />
      ) : (
        <ul className="space-y-2">
          {tasks.map((task) => (
            <li key={task.id} className="rounded-md bg-white/[0.04] p-3">
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 flex-1 truncate text-sm text-stone-200">{task.title}</p>
                <Badge variant={toneFor(taskPriorities, task.priority)}>
                  {labelFor(taskPriorities, task.priority)}
                </Badge>
              </div>
              <p className={`mt-1 text-xs ${task.is_overdue ? "text-red-300" : "text-stone-400"}`}>
                {task.due_date ?? "Sin fecha"} · {labelFor(taskStatuses, task.status)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}

export function MonthlyProgressWidget({ progress }) {
  return (
    <WidgetCard title="Progreso mensual">
      <ProgressBar value={progress.completionRate} label="Sesiones cerradas" />
      <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
        {[
          ["Sesiones", progress.sessions],
          ["Cerradas", progress.completedSessions],
          ["Entregas", progress.deliveries],
          ["Tareas hechas", progress.completedTasks],
          ["Mes", progress.month],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs uppercase tracking-[0.14em] text-stone-400">{label}</dt>
            <dd className="mt-1 text-stone-200">{value}</dd>
          </div>
        ))}
      </dl>
    </WidgetCard>
  );
}

export function ActivityWidget({ activities }) {
  return (
    <WidgetCard title="Actividad reciente">
      <ActivityFeed activities={activities} />
    </WidgetCard>
  );
}

export function FavoriteGearWidget({ gear }) {
  return (
    <WidgetCard
      title="Equipo favorito"
      action={
        <Link to="/app/gear" className="text-xs text-amber-200 hover:text-amber-100">
          Inventario
        </Link>
      }
    >
      {gear.length === 0 ? (
        <Empty text="Marca equipo como favorito para verlo aqui." />
      ) : (
        <ul className="space-y-2">
          {gear.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-md bg-white/[0.04] p-3"
            >
              <span className="min-w-0 truncate text-sm text-stone-200">{item.name}</span>
              <Badge>{labelFor(gearCategories, item.category)}</Badge>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}

export function TopLocationsWidget({ locations }) {
  return (
    <WidgetCard
      title="Localizaciones mas utilizadas"
      action={
        <Link to="/app/locations" className="text-xs text-amber-200 hover:text-amber-100">
          Mapa
        </Link>
      }
    >
      {locations.length === 0 ? (
        <Empty text="Sin localizaciones favoritas." />
      ) : (
        <ul className="space-y-2">
          {locations.map((location) => (
            <li
              key={location.id}
              className="flex items-center justify-between gap-3 rounded-md bg-white/[0.04] p-3"
            >
              <span className="min-w-0 truncate text-sm text-stone-200">{location.name}</span>
              <span className="shrink-0 text-xs tabular-nums text-stone-400">
                {location.sessions_count ?? 0} sesiones
              </span>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}
