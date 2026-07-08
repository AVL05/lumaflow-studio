import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Textarea } from "../../components/ui/Textarea";
import { ErrorState } from "../../components/states/ErrorState";
import { taskPriorities, taskStatuses } from "../../utils/catalogs";

export function TaskForm({ form, setForm, onSubmit, error, saving, sessions, clients }) {
  const setValue = (name, value) => setForm((current) => ({ ...current, [name]: value }));

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
      {error ? (
        <div className="md:col-span-2">
          <ErrorState message={error} />
        </div>
      ) : null}

      <div className="md:col-span-2">
        <Field label="Titulo">
          <Input required value={form.title} onChange={(e) => setValue("title", e.target.value)} />
        </Field>
      </div>

      <Field label="Prioridad">
        <Select
          value={form.priority}
          onChange={(e) => setValue("priority", e.target.value)}
          options={taskPriorities}
        />
      </Field>
      <Field label="Estado">
        <Select
          value={form.status}
          onChange={(e) => setValue("status", e.target.value)}
          options={taskStatuses}
        />
      </Field>

      <Field label="Fecha limite">
        <Input
          type="date"
          value={form.due_date ?? ""}
          onChange={(e) => setValue("due_date", e.target.value)}
        />
      </Field>
      <Field label="Hora">
        <Input
          type="time"
          value={form.due_time ?? ""}
          onChange={(e) => setValue("due_time", e.target.value)}
        />
      </Field>

      <Field label="Sesion">
        <Select
          value={form.session_id ?? ""}
          onChange={(e) => setValue("session_id", e.target.value)}
          options={[
            { value: "", label: "Sin sesion" },
            ...sessions.map((session) => ({ value: String(session.id), label: session.name })),
          ]}
        />
      </Field>
      <Field label="Cliente">
        <Select
          value={form.client_id ?? ""}
          onChange={(e) => setValue("client_id", e.target.value)}
          options={[
            { value: "", label: "Sin cliente" },
            ...clients.map((client) => ({ value: String(client.id), label: client.name })),
          ]}
        />
      </Field>

      <div className="md:col-span-2">
        <Field label="Descripcion">
          <Textarea
            rows="3"
            value={form.description ?? ""}
            onChange={(e) => setValue("description", e.target.value)}
          />
        </Field>
      </div>

      <div className="flex justify-end md:col-span-2">
        <Button disabled={saving}>{saving ? "Guardando..." : "Guardar tarea"}</Button>
      </div>
    </form>
  );
}
