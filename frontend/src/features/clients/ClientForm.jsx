import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Textarea } from "../../components/ui/Textarea";
import { ErrorState } from "../../components/states/ErrorState";
import { clientStatuses } from "../../utils/catalogs";

export function ClientForm({ form, setForm, onSubmit, error, saving }) {
  const setValue = (name, value) => setForm((current) => ({ ...current, [name]: value }));

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
      {error ? (
        <div className="md:col-span-2">
          <ErrorState message={error} />
        </div>
      ) : null}
      <Field label="Nombre">
        <Input required value={form.name} onChange={(e) => setValue("name", e.target.value)} />
      </Field>
      <Field label="Estado">
        <Select
          value={form.status}
          onChange={(e) => setValue("status", e.target.value)}
          options={clientStatuses}
        />
      </Field>
      <Field label="Email">
        <Input
          type="email"
          value={form.email ?? ""}
          onChange={(e) => setValue("email", e.target.value)}
        />
      </Field>
      <Field label="Telefono">
        <Input value={form.phone ?? ""} onChange={(e) => setValue("phone", e.target.value)} />
      </Field>
      <Field label="Empresa">
        <Input value={form.company ?? ""} onChange={(e) => setValue("company", e.target.value)} />
      </Field>
      <Field label="Instagram">
        <Input
          value={form.instagram ?? ""}
          onChange={(e) => setValue("instagram", e.target.value)}
        />
      </Field>
      <div className="md:col-span-2">
        <Field label="Notas">
          <Textarea
            rows="4"
            value={form.notes ?? ""}
            onChange={(e) => setValue("notes", e.target.value)}
          />
        </Field>
      </div>
      <div className="md:col-span-2 flex justify-end">
        <Button disabled={saving}>{saving ? "Guardando..." : "Guardar cliente"}</Button>
      </div>
    </form>
  );
}
