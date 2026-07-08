import { useCallback, useState } from "react";
import { checklistsApi } from "../../api/checklists";
import { getApiError } from "../../api/client";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Checkbox } from "../../components/ui/Checkbox";
import { Skeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/states/EmptyState";
import { ErrorState } from "../../components/states/ErrorState";
import { useResource } from "../../hooks/useResource";
import { useToast } from "../notifications/ToastContext";
import { checklistTypes } from "../../utils/catalogs";
import { ChecklistCard } from "./ChecklistCard";

const defaults = { name: "", type: "gear", use_template: true };

/** Panel autocontenido de checklists para una sesion concreta. */
export function ChecklistPanel({ sessionId }) {
  const toast = useToast();
  const fetcher = useCallback(() => checklistsApi.list({ session_id: sessionId }), [sessionId]);
  const { data, loading, error, refresh } = useResource(fetcher);
  const [form, setForm] = useState(defaults);
  const [creating, setCreating] = useState(false);

  const checklists = data ?? [];

  async function guard(action, message) {
    try {
      await action();
      await refresh();
      if (message) toast.success(message);
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  async function create(event) {
    event.preventDefault();
    setCreating(true);
    await guard(
      () => checklistsApi.create({ ...form, session_id: sessionId }),
      "Checklist creada.",
    );
    setForm(defaults);
    setCreating(false);
  }

  return (
    <div className="space-y-5">
      <form className="grid gap-3 md:grid-cols-[1fr_180px_auto_auto]" onSubmit={create}>
        <Field label="Nombre">
          <Input
            required
            value={form.name}
            placeholder="Equipo para la sesion"
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          />
        </Field>
        <Field label="Tipo">
          <Select
            value={form.type}
            onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
            options={checklistTypes}
          />
        </Field>
        <div className="flex items-end pb-2">
          <Checkbox
            checked={form.use_template}
            onChange={(event) =>
              setForm((current) => ({ ...current, use_template: event.target.checked }))
            }
            label="Plantilla"
          />
        </div>
        <div className="flex items-end">
          <Button disabled={creating}>{creating ? "Creando..." : "Crear"}</Button>
        </div>
      </form>

      {error ? <ErrorState message={error} /> : null}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      ) : checklists.length === 0 ? (
        <EmptyState
          title="Sin checklists"
          description="Crea una checklist con plantilla para preparar equipo, edicion o entrega."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {checklists.map((checklist) => (
            <ChecklistCard
              key={checklist.id}
              checklist={checklist}
              onToggleItem={(item) =>
                guard(() => checklistsApi.toggleItem(item.id, !item.is_completed))
              }
              onAddItem={(target, title) =>
                guard(() => checklistsApi.addItem(target.id, { title }))
              }
              onRemoveItem={(item) => guard(() => checklistsApi.removeItem(item.id))}
              onReorder={(target, ids) => guard(() => checklistsApi.reorder(target.id, ids))}
              onDuplicate={(target) =>
                guard(() => checklistsApi.duplicate(target.id), "Checklist duplicada.")
              }
              onDelete={(target) =>
                guard(() => checklistsApi.remove(target.id), "Checklist eliminada.")
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
