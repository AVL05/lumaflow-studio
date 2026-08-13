import { useEffect, useState } from "react";
import { invoicesApi } from "../api/invoices";
import { quotesApi } from "../api/quotes";
import { getApiError } from "../api/client";
import { EmptyState } from "../components/states/EmptyState";
import { ErrorState } from "../components/states/ErrorState";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Field } from "../components/ui/Field";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { PageHeader } from "../components/ui/PageHeader";
import { Pagination } from "../components/ui/Pagination";
import { Select } from "../components/ui/Select";
import { Skeleton } from "../components/ui/Skeleton";
import { StatusBadge } from "../components/ui/StatusBadge";
import { Textarea } from "../components/ui/Textarea";
import { useToast } from "../features/notifications/ToastContext";
import { usePaginatedResource } from "../hooks/usePaginatedResource";
import { useCreateIntent } from "../hooks/useCreateIntent";
import { invoiceStatuses } from "../utils/catalogs";

export function InvoicesPage() {
  const toast = useToast();
  const resource = usePaginatedResource(invoicesApi.list, { per_page: 12 });
  const [quotes, setQuotes] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ quote_id: "", issue_date: "", due_date: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    quotesApi
      .list({ status: "accepted", per_page: 100 })
      .then((response) => setQuotes(response.data.filter((quote) => !quote.invoice_id)))
      .catch(() => setQuotes([]));
  }, [resource.items]);

  function openCreate() {
    setForm({ quote_id: "", issue_date: "", due_date: "", notes: "" });
    setError("");
    setOpen(true);
  }

  useCreateIntent(openCreate);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await invoicesApi.create({
        ...form,
        quote_id: Number(form.quote_id),
        issue_date: form.issue_date || null,
        due_date: form.due_date || null,
      });
      toast.success("Factura creada.");
      setOpen(false);
      await resource.refresh();
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setSaving(false);
    }
  }

  async function status(invoice, value) {
    try {
      await invoicesApi.status(invoice.id, value);
      toast.success("Estado actualizado.");
      await resource.refresh();
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  async function download(invoice) {
    try {
      const blob = await invoicesApi.pdf(invoice.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `factura-${invoice.invoice_number}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Negocio"
        title="Facturación"
        description="Emite facturas desde presupuestos aceptados y controla vencimientos y cobros."
        action={
          <Button onClick={openCreate}>
            Nueva factura
          </Button>
        }
      />
      <div className="mb-6 max-w-xs">
        <Select
          value={resource.filters.status ?? ""}
          onChange={(e) => resource.updateFilter("status", e.target.value)}
          options={[{ value: "", label: "Todos los estados" }, ...invoiceStatuses]}
        />
      </div>
      {resource.error ? <ErrorState message={resource.error} /> : null}
      {resource.loading ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-64" />
          ))}
        </div>
      ) : resource.items.length === 0 ? (
        <EmptyState
          title="Sin facturas"
          description="Acepta un presupuesto y conviértelo en factura sin volver a introducir importes."
        />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {resource.items.map((invoice) => (
              <Card key={invoice.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-amber-200">
                      {invoice.invoice_number}
                    </p>
                    <h2 className="mt-2 text-lg font-semibold">{invoice.client?.name}</h2>
                  </div>
                  <StatusBadge options={invoiceStatuses} value={invoice.status} />
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
                  <div>
                    <p className="text-xs text-stone-400">Total</p>
                    <p className="mt-1 text-xl font-semibold">{money(invoice.total)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-stone-400">Vencimiento</p>
                    <p className="mt-1 text-sm">{invoice.due_date || "Sin fecha"}</p>
                  </div>
                </div>
                <div className="mt-5">
                  <Select
                    value={invoice.status}
                    onChange={(e) => status(invoice, e.target.value)}
                    options={invoiceStatuses}
                  />
                </div>
                <div className="mt-3">
                  <Button variant="secondary" onClick={() => download(invoice)}>
                    Descargar PDF
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          <Pagination meta={resource.meta} onPage={resource.setPage} />
        </>
      )}
      <Modal open={open} title="Nueva factura" onClose={() => setOpen(false)}>
        <form className="space-y-4" onSubmit={submit}>
          {error ? <ErrorState message={error} /> : null}
          <Field label="Presupuesto aceptado">
            <Select
              required
              value={form.quote_id}
              onChange={(e) => setForm({ ...form, quote_id: e.target.value })}
              options={[
                {
                  value: "",
                  label: quotes.length
                    ? "Selecciona presupuesto"
                    : "No hay presupuestos pendientes",
                },
                ...quotes.map((quote) => ({
                  value: quote.id,
                  label: `${quote.quote_number} · ${quote.client?.name} · ${money(quote.total)}`,
                })),
              ]}
            />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Fecha de emisión">
              <Input
                type="date"
                value={form.issue_date}
                onChange={(e) => setForm({ ...form, issue_date: e.target.value })}
              />
            </Field>
            <Field label="Vencimiento">
              <Input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Notas">
            <Textarea
              rows="3"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </Field>
          <div className="flex justify-end">
            <Button disabled={saving || !quotes.length}>
              {saving ? "Creando..." : "Crear factura"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function money(value) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(
    Number(value || 0),
  );
}
