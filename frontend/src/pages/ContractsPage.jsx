import { useEffect, useState } from "react";
import { clientsApi } from "../api/clients";
import { contractsApi } from "../api/contracts";
import { jobsApi } from "../api/jobs";
import { quotesApi } from "../api/quotes";
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
import { contractStatuses } from "../utils/catalogs";
import {
  allowedTransitions,
  canDeleteContract,
  canEditContract,
} from "../features/contracts/contractTransitions";

const defaults = {
  job_id: "",
  client_id: "",
  quote_id: "",
  title: "",
  content: "",
  expires_at: "",
};

export function ContractsPage() {
  const toast = useToast();
  const resource = usePaginatedResource(contractsApi.list, {
    per_page: 12,
    sort: "created_at",
    direction: "desc",
  });
  const [clients, setClients] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [form, setForm] = useState(defaults);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      clientsApi.list({ per_page: 100, sort: "name", direction: "asc" }),
      jobsApi.list({ per_page: 100 }),
      quotesApi.list({ per_page: 100 }),
    ])
      .then(([clientResponse, jobResponse, quoteResponse]) => {
        setClients(clientResponse.data);
        setJobs(jobResponse.data);
        setQuotes(quoteResponse.data);
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
    });
    setError("");
    setOpen(true);
  }

  useCreateIntent(create);

  function edit(contract) {
    setEditing(contract);
    setForm({
      job_id: contract.job_id ? String(contract.job_id) : "",
      client_id: String(contract.client_id),
      quote_id: contract.quote_id ? String(contract.quote_id) : "",
      title: contract.title ?? "",
      content: contract.content ?? "",
      expires_at: contract.expires_at ?? "",
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
        job_id: Number(form.job_id),
        client_id: Number(form.client_id),
        quote_id: form.quote_id ? Number(form.quote_id) : null,
        title: form.title,
        content: form.content || undefined,
        expires_at: form.expires_at || null,
      };
      if (editing) await contractsApi.update(editing.id, payload);
      else await contractsApi.create(payload);
      toast.success(editing ? "Contrato actualizado." : "Contrato creado.");
      setOpen(false);
      await resource.refresh();
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(contract, status) {
    try {
      await contractsApi.status(contract.id, status);
      toast.success("Estado actualizado.");
      await resource.refresh();
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  async function confirmDelete() {
    try {
      await contractsApi.remove(deleting.id);
      setDeleting(null);
      toast.success("Contrato eliminado.");
      await resource.refresh();
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Negocio"
        title="Contratos"
        description="Acuerdos vinculados a cliente y trabajo, con contenido estable y aceptación trazable."
        action={<Button onClick={create}>Nuevo contrato</Button>}
      />
      <div className="mb-6 grid gap-3 md:grid-cols-[1fr_190px]">
        <SearchBar
          value={resource.filters.search ?? ""}
          onChange={(value) => resource.updateFilter("search", value)}
          placeholder="Buscar número, título o cliente"
        />
        <Select
          value={resource.filters.status ?? ""}
          onChange={(event) => resource.updateFilter("status", event.target.value)}
          options={[{ value: "", label: "Todos los estados" }, ...contractStatuses]}
        />
      </div>
      {resource.error ? <ErrorState message={resource.error} /> : null}
      {resource.loading ? (
        <GridSkeleton />
      ) : resource.items.length === 0 ? (
        <EmptyState
          title="Aún no tienes contratos"
          description="El contrato deja por escrito el acuerdo con tu cliente: alcance, importes y fechas. Créalo desde un trabajo para empezar."
          action={<Button onClick={create}>Crear mi primer contrato</Button>}
        />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {resource.items.map((contract) => {
              const transitions = allowedTransitions(contract.status);
              return (
                <Card key={contract.id} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-amber-200">
                        {contract.contract_number} · v{contract.version}
                      </p>
                      <h2 className="mt-2 text-lg font-semibold">{contract.title}</h2>
                      <p className="mt-1 text-sm text-stone-400">
                        {contract.client?.name || "Sin cliente"}
                      </p>
                    </div>
                    <StatusBadge options={contractStatuses} value={contract.status} />
                  </div>
                  <div className="mt-5">
                    <Select
                      value={contract.status}
                      disabled={transitions.length === 0}
                      onChange={(event) => setStatus(contract, event.target.value)}
                      options={[
                        ...contractStatuses.filter(
                          (option) =>
                            option.value === contract.status || transitions.includes(option.value),
                        ),
                      ]}
                      aria-label={`Estado del contrato ${contract.contract_number}`}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={() => setViewing(contract)}>
                      Ver contenido
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={!canEditContract(contract.status)}
                      title={
                        canEditContract(contract.status)
                          ? "Editar borrador"
                          : "Solo un borrador puede editarse"
                      }
                      onClick={() => edit(contract)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="danger"
                      disabled={!canDeleteContract(contract.status)}
                      title={
                        canDeleteContract(contract.status)
                          ? "Eliminar borrador"
                          : "Solo un borrador puede eliminarse"
                      }
                      onClick={() => setDeleting(contract)}
                    >
                      Eliminar
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
          <Pagination meta={resource.meta} onPage={resource.setPage} />
        </>
      )}
      <Modal
        open={open}
        title={editing ? "Editar contrato" : "Nuevo contrato"}
        onClose={() => setOpen(false)}
      >
        <ContractForm
          form={form}
          setForm={setForm}
          clients={clients}
          jobs={jobs}
          quotes={quotes}
          onSubmit={submit}
          saving={saving}
          error={error}
        />
      </Modal>
      <Modal open={Boolean(viewing)} title={viewing?.title ?? ""} onClose={() => setViewing(null)}>
        {viewing ? (
          <div className="space-y-4">
            <p className="text-xs text-stone-500">
              {viewing.contract_number} · v{viewing.version} ·{" "}
              {contractStatuses.find((option) => option.value === viewing.status)?.label}
              {viewing.status !== "draft"
                ? " · Contenido congelado al enviar (solo lectura)"
                : null}
            </p>
            <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-stone-200">
              {viewing.status === "draft"
                ? viewing.content
                : (viewing.content_snapshot ?? viewing.content)}
            </pre>
            <p className="text-xs leading-5 text-stone-500">
              Contenido editable de ejemplo. No constituye asesoramiento jurídico.
            </p>
          </div>
        ) : null}
      </Modal>
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Eliminar contrato"
        description="Solo los borradores pueden eliminarse. Esta acción no se puede deshacer."
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}

function GridSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3" aria-label="Cargando contratos">
      {[0, 1, 2].map((key) => (
        <Skeleton key={key} className="h-64" />
      ))}
    </div>
  );
}

function ContractForm({ form, setForm, clients, jobs, quotes, onSubmit, saving, error }) {
  const update = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error ? (
        <p className="rounded-lg border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}
      <Field label="Trabajo">
        <Select
          required
          value={form.job_id}
          onChange={update("job_id")}
          options={[
            { value: "", label: "Selecciona un trabajo" },
            ...jobs.map((job) => ({ value: String(job.id), label: job.title })),
          ]}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Cliente">
          <Select
            required
            value={form.client_id}
            onChange={update("client_id")}
            options={[
              { value: "", label: "Selecciona un cliente" },
              ...clients.map((client) => ({ value: String(client.id), label: client.name })),
            ]}
          />
        </Field>
        <Field label="Presupuesto (opcional)">
          <Select
            value={form.quote_id}
            onChange={update("quote_id")}
            options={[
              { value: "", label: "Sin presupuesto" },
              ...quotes.map((quote) => ({
                value: String(quote.id),
                label: `${quote.quote_number} · ${quote.total} EUR`,
              })),
            ]}
          />
        </Field>
      </div>
      <Field label="Título">
        <Input
          required
          maxLength={180}
          value={form.title}
          onChange={update("title")}
          placeholder="Contrato de servicios fotográficos"
        />
      </Field>
      <Field label="Contenido (Markdown, opcional: se genera desde el trabajo)">
        <Textarea
          rows={8}
          value={form.content}
          onChange={update("content")}
          placeholder="Alcance, importes, fechas y notas. Sin HTML."
        />
      </Field>
      <Field label="Caducidad (opcional)">
        <Input type="date" value={form.expires_at} onChange={update("expires_at")} />
      </Field>
      <Button disabled={saving}>{saving ? "Guardando..." : "Guardar contrato"}</Button>
    </form>
  );
}
