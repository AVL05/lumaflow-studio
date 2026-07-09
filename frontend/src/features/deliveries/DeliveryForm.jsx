import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Textarea } from "../../components/ui/Textarea";
import { ErrorState } from "../../components/states/ErrorState";
import { deliveryStatuses, paymentStatuses } from "../../utils/catalogs";

export function DeliveryForm({ form, setForm, clients, sessions, onSubmit, error, saving }) {
  const setValue = (name, value) => setForm((current) => ({ ...current, [name]: value }));

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
      {error ? (
        <div className="md:col-span-2">
          <ErrorState message={error} />
        </div>
      ) : null}
      <Field label="Titulo">
        <Input required value={form.title} onChange={(e) => setValue("title", e.target.value)} />
      </Field>
      <Field label="Estado">
        <Select
          value={form.status}
          onChange={(e) => setValue("status", e.target.value)}
          options={deliveryStatuses}
        />
      </Field>
      <Field label="Cliente">
        <Select
          required
          value={form.client_id}
          onChange={(e) => setValue("client_id", e.target.value)}
          options={[
            { value: "", label: "Selecciona cliente" },
            ...clients.map((client) => ({ value: String(client.id), label: client.name })),
          ]}
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
      <Field label="Presupuesto">
        <Input
          type="number"
          min="0"
          step="0.01"
          value={form.budget ?? ""}
          onChange={(e) => setValue("budget", e.target.value)}
        />
      </Field>
      <Field label="Estado de pago">
        <Select
          value={form.payment_status ?? "pending"}
          onChange={(e) => setValue("payment_status", e.target.value)}
          options={paymentStatuses}
        />
      </Field>
      <Field label="Importe pagado">
        <Input
          type="number"
          min="0"
          step="0.01"
          value={form.amount_paid ?? ""}
          onChange={(e) => setValue("amount_paid", e.target.value)}
        />
      </Field>
      <Field label="Fecha entrega">
        <Input
          type="date"
          value={form.delivery_date ?? ""}
          onChange={(e) => setValue("delivery_date", e.target.value)}
        />
      </Field>
      <div className="md:col-span-2">
        <Field label="Gallery URL">
          <Input
            type="url"
            value={form.gallery_url ?? ""}
            onChange={(e) => setValue("gallery_url", e.target.value)}
          />
        </Field>
      </div>
      <div className="md:col-span-2">
        <Field label="Notas privadas">
          <Textarea
            rows="4"
            value={form.private_notes ?? ""}
            onChange={(e) => setValue("private_notes", e.target.value)}
          />
        </Field>
      </div>
      <div className="md:col-span-2 flex justify-end">
        <Button disabled={saving}>{saving ? "Guardando..." : "Guardar entrega"}</Button>
      </div>
    </form>
  );
}
