import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { ErrorState } from "../../components/states/ErrorState";
import { reminderStatuses, reminderTypes } from "../../utils/catalogs";

export function ReminderForm({ form, setForm, onSubmit, error, saving, subjects }) {
  const setValue = (name, value) => setForm((current) => ({ ...current, [name]: value }));
  const options = subjects[form.type] ?? [];

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
      {error ? (
        <div className="md:col-span-2">
          <ErrorState message={error} />
        </div>
      ) : null}

      <div className="md:col-span-2">
        <Field label="Mensaje">
          <Input
            required
            value={form.message}
            onChange={(e) => setValue("message", e.target.value)}
          />
        </Field>
      </div>

      <Field label="Fecha">
        <Input
          required
          type="date"
          value={form.remind_date}
          onChange={(e) => setValue("remind_date", e.target.value)}
        />
      </Field>
      <Field label="Hora">
        <Input
          type="time"
          value={form.remind_time ?? ""}
          onChange={(e) => setValue("remind_time", e.target.value)}
        />
      </Field>

      <Field label="Tipo">
        <Select
          value={form.type}
          onChange={(e) => {
            setValue("type", e.target.value);
            setValue("remindable_id", "");
          }}
          options={reminderTypes}
        />
      </Field>
      <Field label="Estado">
        <Select
          value={form.status}
          onChange={(e) => setValue("status", e.target.value)}
          options={reminderStatuses}
        />
      </Field>

      {form.type !== "custom" ? (
        <div className="md:col-span-2">
          <Field label="Elemento asociado">
            <Select
              value={form.remindable_id ?? ""}
              onChange={(e) => setValue("remindable_id", e.target.value)}
              options={[{ value: "", label: "Sin asociar" }, ...options]}
            />
          </Field>
        </div>
      ) : null}

      <div className="flex justify-end md:col-span-2">
        <Button disabled={saving}>{saving ? "Guardando..." : "Guardar recordatorio"}</Button>
      </div>
    </form>
  );
}
