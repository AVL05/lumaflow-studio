import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { labelFor, reminderStatuses, reminderTypes, toneFor } from "../../utils/catalogs";

export function ReminderCard({ reminder, onEdit, onDelete, onComplete }) {
  return (
    <Card className={`p-5 ${reminder.is_due ? "border-amber-200/25" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="font-medium text-stone-100">{reminder.message}</p>
        <Badge variant={toneFor(reminderStatuses, reminder.status)}>
          {labelFor(reminderStatuses, reminder.status)}
        </Badge>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-sm text-stone-400">
        <span className="tabular-nums">{reminder.remind_at}</span>
        <span>· {labelFor(reminderTypes, reminder.type)}</span>
        {reminder.is_due ? <span className="text-amber-200">· vence pronto</span> : null}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {reminder.status === "pending" ? (
          <Button variant="secondary" onClick={() => onComplete(reminder)}>
            Marcar hecho
          </Button>
        ) : null}
        <Button variant="secondary" onClick={() => onEdit(reminder)}>
          Editar
        </Button>
        <Button variant="danger" onClick={() => onDelete(reminder)}>
          Eliminar
        </Button>
      </div>
    </Card>
  );
}
