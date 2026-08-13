import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { clientsApi } from "../api/clients";
import { getApiError } from "../api/client";
import { Button } from "../components/ui/Button";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Modal } from "../components/ui/Modal";
import { PageHeader } from "../components/ui/PageHeader";
import { Pagination } from "../components/ui/Pagination";
import { SearchBar } from "../components/ui/SearchBar";
import { Select } from "../components/ui/Select";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/states/EmptyState";
import { ErrorState } from "../components/states/ErrorState";
import { ClientCard } from "../features/clients/ClientCard";
import { ClientForm } from "../features/clients/ClientForm";
import { ClientImportPanel } from "../features/clients/ClientImportPanel";
import { useToast } from "../features/notifications/ToastContext";
import { usePaginatedResource } from "../hooks/usePaginatedResource";
import { useCreateIntent } from "../hooks/useCreateIntent";
import { clientStatuses } from "../utils/catalogs";

const defaults = {
  name: "",
  email: "",
  phone: "",
  company: "",
  instagram: "",
  notes: "",
  status: "lead",
};

export function ClientsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();
  const resource = usePaginatedResource(clientsApi.list, {
    per_page: 12,
    sort: "created_at",
    direction: "desc",
  });
  const [form, setForm] = useState(defaults);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [importOpen, setImportOpen] = useState(searchParams.get("import") === "1");

  function openCreate() {
    setEditing(null);
    setForm(defaults);
    setFormError("");
    setFormOpen(true);
  }

  useCreateIntent(openCreate);

  function openEdit(client) {
    setEditing(client);
    setForm({ ...defaults, ...client });
    setFormError("");
    setFormOpen(true);
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setFormError("");

    try {
      const payload = normalizeClient(form);
      if (editing) {
        await clientsApi.update(editing.id, payload);
        toast.success("Cliente actualizado.");
      } else {
        await clientsApi.create(payload);
        toast.success("Cliente creado.");
      }
      setFormOpen(false);
      await resource.refresh();
    } catch (err) {
      setFormError(getApiError(err));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    await clientsApi.remove(deleting.id);
    toast.success("Cliente eliminado.");
    setDeleting(null);
    await resource.refresh();
  }

  function closeImport() {
    setImportOpen(false);
    if (searchParams.has("import")) {
      const next = new URLSearchParams(searchParams);
      next.delete("import");
      setSearchParams(next, { replace: true });
    }
  }

  async function imported(result) {
    toast.success(`${result.imported} clientes importados${result.skipped ? ` · ${result.skipped} omitidos` : ""}.`);
    closeImport();
    await resource.refresh();
  }

  return (
    <>
      <PageHeader
        eyebrow="CRM"
        title="Clientes"
        description="Gestiona leads, clientes activos y contactos listos para entregas fotograficas."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setImportOpen(true)}>
              Importar CSV
            </Button>
            <Button onClick={openCreate}>Nuevo cliente</Button>
          </div>
        }
      />

      <div className="mb-6 grid gap-3 lg:grid-cols-[1fr_180px_160px_140px]">
        <SearchBar
          value={resource.filters.search ?? ""}
          onChange={(value) => resource.updateFilter("search", value)}
          placeholder="Buscar por nombre, email, empresa o Instagram"
        />
        <Select
          value={resource.filters.status ?? ""}
          onChange={(e) => resource.updateFilter("status", e.target.value)}
          options={[{ value: "", label: "Todos los estados" }, ...clientStatuses]}
        />
        <Select
          value={resource.filters.sort ?? "created_at"}
          onChange={(e) => resource.updateFilter("sort", e.target.value)}
          options={[
            { value: "created_at", label: "Fecha" },
            { value: "name", label: "Nombre" },
            { value: "status", label: "Estado" },
          ]}
        />
        <Select
          value={resource.filters.direction ?? "desc"}
          onChange={(e) => resource.updateFilter("direction", e.target.value)}
          options={[
            { value: "asc", label: "Asc" },
            { value: "desc", label: "Desc" },
          ]}
        />
      </div>

      {resource.error ? <ErrorState message={resource.error} /> : null}
      {resource.loading ? (
        <ClientSkeleton />
      ) : resource.items.length === 0 ? (
        <EmptyState
          title="Sin clientes"
          description="Crea el primer cliente para conectar sesiones y entregas."
          action={<Button onClick={openCreate}>Crear cliente</Button>}
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {resource.items.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                onEdit={openEdit}
                onDelete={setDeleting}
              />
            ))}
          </div>
          <Pagination meta={resource.meta} onPage={resource.setPage} />
        </>
      )}

      <Modal
        open={formOpen}
        title={editing ? "Editar cliente" : "Nuevo cliente"}
        onClose={() => setFormOpen(false)}
      >
        <ClientForm
          form={form}
          setForm={setForm}
          onSubmit={submit}
          error={formError}
          saving={saving}
        />
      </Modal>
      <Modal open={importOpen} title="Importar clientes" onClose={closeImport}>
        <ClientImportPanel onImported={imported} />
      </Modal>
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Eliminar cliente"
        description="Esta accion elimina el cliente. No elimina entregas existentes, pero quedaran bloqueadas por integridad si estan asociadas."
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}

function normalizeClient(form) {
  return {
    name: form.name,
    email: form.email || null,
    phone: form.phone || null,
    company: form.company || null,
    instagram: form.instagram || null,
    notes: form.notes || null,
    status: form.status,
  };
}

function ClientSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton key={index} className="h-64" />
      ))}
    </div>
  );
}
