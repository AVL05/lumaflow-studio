import { useEffect, useState } from "react";
import { clientsApi } from "../api/clients";
import { invoicesApi } from "../api/invoices";
import { quotesApi } from "../api/quotes";
import { sessionsApi } from "../api/sessions";
import { getApiError } from "../api/client";
import { EmptyState } from "../components/states/EmptyState";
import { ErrorState } from "../components/states/ErrorState";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Field } from "../components/ui/Field";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { PageHeader } from "../components/ui/PageHeader";
import { Pagination } from "../components/ui/Pagination";
import { SearchBar } from "../components/ui/SearchBar";
import { Select } from "../components/ui/Select";
import { Skeleton } from "../components/ui/Skeleton";
import { StatusBadge } from "../components/ui/StatusBadge";
import { Textarea } from "../components/ui/Textarea";
import { useToast } from "../features/notifications/ToastContext";
import { usePaginatedResource } from "../hooks/usePaginatedResource";
import { useCreateIntent } from "../hooks/useCreateIntent";
import { quoteStatuses } from "../utils/catalogs";

const emptyItem = { description: "", quantity: 1, unit_price: "" };
const defaults = {
  job_id: "",
  client_id: "",
  session_id: "",
  issue_date: "",
  valid_until: "",
  tax_rate: 21,
  notes: "",
  items: [{ ...emptyItem }],
};

export function QuotesPage() {
  const toast = useToast();
  const resource = usePaginatedResource(quotesApi.list, {
    per_page: 12,
    sort: "created_at",
    direction: "desc",
  });
  const [clients, setClients] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [form, setForm] = useState(defaults);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      clientsApi.list({ per_page: 100, sort: "name", direction: "asc" }),
      sessionsApi.list({ per_page: 100 }),
    ])
      .then(([clientResponse, sessionResponse]) => {
        setClients(clientResponse.data);
        setSessions(sessionResponse.data);
      })
      .catch(() => {});
  }, []);

  function create() {
    setEditing(null);
    const params = new URLSearchParams(window.location.search);
    setForm({
      ...defaults,
      job_id: params.get("job_id") ?? "",
      client_id: params.get("client_id") ?? "",
      items: [{ ...emptyItem }],
    });
    setError("");
    setOpen(true);
  }

  useCreateIntent(create);

  function edit(quote) {
    setEditing(quote);
    setForm({
      job_id: quote.job_id ? String(quote.job_id) : "",
      client_id: String(quote.client_id),
      session_id: quote.session_id ? String(quote.session_id) : "",
      issue_date: quote.issue_date ?? "",
      valid_until: quote.valid_until ?? "",
      tax_rate: quote.tax_rate,
      notes: quote.notes ?? "",
      items: quote.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
      })),
    });
    setError("");
    setOpen(true);
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        job_id: form.job_id ? Number(form.job_id) : null,
        client_id: Number(form.client_id),
        session_id: form.session_id ? Number(form.session_id) : null,
        issue_date: form.issue_date || null,
        valid_until: form.valid_until || null,
        tax_rate: Number(form.tax_rate),
        items: form.items.map((item) => ({
          ...item,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
        })),
      };
      if (editing) await quotesApi.update(editing.id, payload);
      else await quotesApi.create(payload);
      toast.success(editing ? "Presupuesto actualizado." : "Presupuesto creado.");
      setOpen(false);
      await resource.refresh();
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(quote, status) {
    try {
      await quotesApi.status(quote.id, status);
      toast.success("Estado actualizado.");
      await resource.refresh();
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  async function invoice(quote) {
    try {
      await invoicesApi.create({ quote_id: quote.id });
      toast.success("Factura creada desde el presupuesto.");
      await resource.refresh();
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  async function download(quote) {
    try {
      downloadBlob(await quotesApi.pdf(quote.id), `presupuesto-${quote.quote_number}.pdf`);
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  async function confirmDelete() {
    try {
      await quotesApi.remove(deleting.id);
      setDeleting(null);
      toast.success("Presupuesto eliminado.");
      await resource.refresh();
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Negocio"
        title="Presupuestos"
        description="Convierte servicios y sesiones en propuestas profesionales, trazables y listas para facturar."
        action={<Button onClick={create}>Nuevo presupuesto</Button>}
      />
      <div className="mb-6 grid gap-3 md:grid-cols-[1fr_190px]">
        <SearchBar
          value={resource.filters.search ?? ""}
          onChange={(value) => resource.updateFilter("search", value)}
          placeholder="Buscar número o cliente"
        />
        <Select
          value={resource.filters.status ?? ""}
          onChange={(event) => resource.updateFilter("status", event.target.value)}
          options={[{ value: "", label: "Todos los estados" }, ...quoteStatuses]}
        />
      </div>
      {resource.error ? <ErrorState message={resource.error} /> : null}
      {resource.loading ? (
        <GridSkeleton />
      ) : resource.items.length === 0 ? (
        <EmptyState
          title="Sin presupuestos"
          description="Crea el primer presupuesto para cerrar el flujo comercial de una sesión."
          action={<Button onClick={create}>Crear presupuesto</Button>}
        />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {resource.items.map((quote) => (
              <Card key={quote.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-amber-200">
                      {quote.quote_number}
                    </p>
                    <h2 className="mt-2 text-lg font-semibold">{quote.client?.name}</h2>
                    <p className="mt-1 text-sm text-stone-400">
                      {quote.session?.name || "Sin sesión asociada"}
                    </p>
                  </div>
                  <StatusBadge options={quoteStatuses} value={quote.status} />
                </div>
                <div className="mt-5 flex items-end justify-between border-t border-white/10 pt-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-stone-400">Total</p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums">{money(quote.total)}</p>
                  </div>
                  <p className="text-xs text-stone-400">{quote.issue_date}</p>
                </div>
                <div className="mt-5">
                  <Select
                    value={quote.status}
                    onChange={(event) => setStatus(quote, event.target.value)}
                    options={quoteStatuses}
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => edit(quote)}>
                    Editar
                  </Button>
                  <Button variant="secondary" onClick={() => download(quote)}>
                    PDF
                  </Button>
                  {quote.status === "accepted" && !quote.invoice_id ? (
                    <Button onClick={() => invoice(quote)}>Facturar</Button>
                  ) : null}
                  <Button variant="danger" onClick={() => setDeleting(quote)}>
                    Eliminar
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          <Pagination meta={resource.meta} onPage={resource.setPage} />
        </>
      )}
      <Modal
        open={open}
        title={editing ? "Editar presupuesto" : "Nuevo presupuesto"}
        onClose={() => setOpen(false)}
      >
        <QuoteForm
          form={form}
          setForm={setForm}
          clients={clients}
          sessions={sessions}
          onSubmit={submit}
          saving={saving}
          error={error}
        />
      </Modal>
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Eliminar presupuesto"
        description="Se eliminarán también sus conceptos. Esta acción no se puede deshacer."
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}

function QuoteForm({ form, setForm, clients, sessions, onSubmit, saving, error }) {
  const updateItem = (index, key, value) =>
    setForm((current) => ({
      ...current,
      items: current.items.map((item, position) =>
        position === index ? { ...item, [key]: value } : item,
      ),
    }));
  const removeItem = (index) =>
    setForm((current) => ({
      ...current,
      items: current.items.filter((_, position) => position !== index),
    }));
  const total =
    form.items.reduce(
      (sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0),
      0,
    ) *
    (1 + Number(form.tax_rate || 0) / 100);
  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      {error ? <ErrorState message={error} /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Cliente">
          <Select
            required
            value={form.client_id}
            onChange={(e) => setForm({ ...form, client_id: e.target.value })}
            options={[
              { value: "", label: "Selecciona cliente" },
              ...clients.map((item) => ({ value: item.id, label: item.name })),
            ]}
          />
        </Field>
        <Field label="Sesión">
          <Select
            value={form.session_id}
            onChange={(e) => setForm({ ...form, session_id: e.target.value })}
            options={[
              { value: "", label: "Sin sesión" },
              ...sessions.map((item) => ({ value: item.id, label: item.name })),
            ]}
          />
        </Field>
        <Field label="Fecha de emisión">
          <Input
            type="date"
            value={form.issue_date}
            onChange={(e) => setForm({ ...form, issue_date: e.target.value })}
          />
        </Field>
        <Field label="Válido hasta">
          <Input
            type="date"
            value={form.valid_until}
            onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
          />
        </Field>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Conceptos</h3>
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              setForm((current) => ({ ...current, items: [...current.items, { ...emptyItem }] }))
            }
          >
            Añadir concepto
          </Button>
        </div>
        {form.items.map((item, index) => (
          <div
            key={index}
            className="grid gap-2 rounded-xl border border-white/10 bg-black/20 p-3 md:grid-cols-[1fr_90px_130px_auto]"
          >
            <Input
              required
              placeholder="Descripción"
              value={item.description}
              onChange={(e) => updateItem(index, "description", e.target.value)}
            />
            <Input
              required
              type="number"
              min="0.01"
              step="0.01"
              value={item.quantity}
              onChange={(e) => updateItem(index, "quantity", e.target.value)}
            />
            <Input
              required
              type="number"
              min="0"
              step="0.01"
              placeholder="Precio"
              value={item.unit_price}
              onChange={(e) => updateItem(index, "unit_price", e.target.value)}
            />
            <Button
              type="button"
              variant="danger"
              disabled={form.items.length === 1}
              onClick={() => removeItem(index)}
            >
              Quitar
            </Button>
          </div>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="IVA (%)">
          <Input
            required
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={form.tax_rate}
            onChange={(e) => setForm({ ...form, tax_rate: e.target.value })}
          />
        </Field>
        <div className="rounded-xl border border-amber-200/20 bg-amber-200/[0.06] p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-amber-200">Total estimado</p>
          <p className="mt-2 text-2xl font-semibold">{money(total)}</p>
        </div>
      </div>
      <Field label="Notas">
        <Textarea
          rows="3"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
      </Field>
      <div className="flex justify-end">
        <Button disabled={saving}>{saving ? "Guardando..." : "Guardar presupuesto"}</Button>
      </div>
    </form>
  );
}

function money(value) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(
    Number(value || 0),
  );
}
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
function GridSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton key={index} className="h-72" />
      ))}
    </div>
  );
}
