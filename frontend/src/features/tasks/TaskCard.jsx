import { memo } from "react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Checkbox } from "../../components/ui/Checkbox";
import { labelFor, taskPriorities, taskStatuses, toneFor } from "../../utils/catalogs";

/** Memoizada: cada clic de la seleccion multiple re-renderiza el listado entero. */
export const TaskCard = memo(function TaskCard({
  task,
  selected,
  onSelect,
  onToggle,
  onEdit,
  onDelete,
}) {
  const done = task.status === "completed";

  return (
    <Card className={`p-5 ${task.is_overdue ? "border-red-400/25" : ""}`}>
      <div className="flex items-start gap-3">
        <Checkbox
          checked={selected}
          onChange={() => onSelect(task.id)}
          aria-label={`Seleccionar ${task.title}`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h2
              className={`font-semibold ${done ? "text-stone-400 line-through" : "text-stone-50"}`}
            >
              {task.title}
            </h2>
            <Badge variant={toneFor(taskPriorities, task.priority)}>
              {labelFor(taskPriorities, task.priority)}
            </Badge>
          </div>

          <p className="mt-2 line-clamp-2 text-sm text-stone-400">
            {task.description || "Sin descripcion."}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-stone-400">
            <Badge variant={toneFor(taskStatuses, task.status)}>
              {labelFor(taskStatuses, task.status)}
            </Badge>
            {task.due_date ? (
              <span className={task.is_overdue ? "text-red-300" : ""}>
                {task.due_date}
                {task.due_time ? ` · ${task.due_time}` : ""}
                {task.is_overdue ? " · vencida" : ""}
              </span>
            ) : (
              <span>Sin fecha</span>
            )}
            {task.session ? <span>· {task.session.name}</span> : null}
            {task.client ? <span>· {task.client.name}</span> : null}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => onToggle(task)}>
              {done ? "Reabrir" : "Completar"}
            </Button>
            <Button variant="secondary" onClick={() => onEdit(task)}>
              Editar
            </Button>
            <Button variant="danger" onClick={() => onDelete(task)}>
              Eliminar
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
});
