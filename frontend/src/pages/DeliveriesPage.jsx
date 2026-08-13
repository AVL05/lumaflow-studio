import { useEffect, useState } from "react";
import { clientsApi } from "../api/clients";
import { deliveriesApi } from "../api/deliveries";
import { sessionsApi } from "../api/sessions";
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
import { DeliveryCard } from "../features/deliveries/DeliveryCard";
import { DeliveryForm } from "../features/deliveries/DeliveryForm";
import { useToast } from "../features/notifications/ToastContext";
import { usePaginatedResource } from "../hooks/usePaginatedResource";
import { useCreateIntent } from "../hooks/useCreateIntent";
import { deliveryStatuses } from "../utils/catalogs";

const defaults = {
  job_id: "",
  client_id: "",
  session_id: "",
  title: "",
  status: "draft",
  budget: "",
  payment_status: "pending",
  amount_paid: "",
  delivery_date: "",
  gallery_url: "",
  private_notes: "",
};

export function DeliveriesPage() {
  const toast = useToast();
  const resource = usePaginatedResource(deliveriesApi.list, {
    per_page: 12,
    sort: "created_at",
    direction: "desc",
  });
  const [clients, setClients] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [form, setForm] = useState(defaults);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    Promise.all([
      clientsApi.list({ per_page: 100, sort: "name", direction: "asc" }),
      sessionsApi.list({ per_page: 100, sort: "date", direction: "desc" }),
    ])
      .then(([clientResponse, sessionResponse]) => {
        setClients(clientResponse.data);
        setSessions(sessionResponse.data);
      })
      .catch(() => {
        setClients([]);
        setSessions([]);
      });
  }, []);

  function openCreate() {
    setEditing(null);
    const params = new URLSearchParams(window.location.search);
    setForm({ ...defaults, job_id: params.get("job_id") ?? "", client_id: params.get("client_id") ?? "" });
    setFormError("");
    setFormOpen(true);
  }

  useCreateIntent(openCreate);

  function openEdit(delivery) {
    setEditing(delivery);
    setForm({
      ...defaults,
      ...delivery,
      client_id: String(delivery.client?.id ?? delivery.client_id ?? ""),
      session_id: String(delivery.session?.id ?? delivery.session_id ?? ""),
      budget: delivery.budget ?? "",
      amount_paid: delivery.amount_paid ?? "",
      delivery_date: delivery.delivery_date ?? "",
    });
    setFormError("");
    setFormOpen(true);
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setFormError("");

    try {
      const payload = normalizeDelivery(form);
      if (editing) {
        await deliveriesApi.update(editing.id, payload);
        toast.success("Entrega actualizada.");
      } else {
        await deliveriesApi.create(payload);
        toast.success("Entrega creada.");
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
    await deliveriesApi.remove(deleting.id);
    toast.success("Entrega eliminada.");
    setDeleting(null);
    await resource.refresh();
  }

  return (
    <>
      <PageHeader
        eyebrow="Flujo comercial"
        title="Entregas"
        description="Controla cada encargo desde el cliente y la sesión hasta la entrega y aprobación."
        action={<Button onClick={openCreate}>Nueva entrega</Button>}
      />

      <div className="mb-6 grid gap-3 lg:grid-cols-[1fr_180px_160px_140px]">
        <SearchBar
          value={resource.filters.search ?? ""}
          onChange={(value) => resource.updateFilter("search", value)}
          placeholder="Buscar por titulo, cliente, sesion o URL"
        />
        <Select
          value={resource.filters.status ?? ""}
          onChange={(e) => resource.updateFilter("status", e.target.value)}
          options={[{ value: "", label: "Todos los estados" }, ...deliveryStatuses]}
        />
        <Select
          value={resource.filters.sort ?? "created_at"}
          onChange={(e) => resource.updateFilter("sort", e.target.value)}
          options={[
            { value: "created_at", label: "Fecha" },
            { value: "delivery_date", label: "Entrega" },
            { value: "title", label: "Titulo" },
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
        <DeliverySkeleton />
      ) : resource.items.length === 0 ? (
        <EmptyState
          title="Sin entregas"
          description="Prepara una galería o entrega para un trabajo y compártela con el cliente."
          action={<Button onClick={openCreate}>Crear entrega</Button>}
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {resource.items.map((delivery) => (
              <DeliveryCard
                key={delivery.id}
                delivery={delivery}
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
        title={editing ? "Editar entrega" : "Nueva entrega"}
        onClose={() => setFormOpen(false)}
      >
        <DeliveryForm
          form={form}
          setForm={setForm}
          clients={clients}
          sessions={sessions}
          onSubmit={submit}
          error={formError}
          saving={saving}
        />
      </Modal>
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Eliminar entrega"
        description="Esta acción elimina la entrega, pero no elimina cliente, sesión ni fotos."
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}

function normalizeDelivery(form) {
  return {
    job_id: form.job_id ? Number(form.job_id) : null,
    client_id: Number(form.client_id),
    session_id: form.session_id ? Number(form.session_id) : null,
    title: form.title,
    status: form.status,
    budget: form.budget === "" ? null : Number(form.budget),
    payment_status: form.payment_status || "pending",
    amount_paid: form.amount_paid === "" ? 0 : Number(form.amount_paid),
    delivery_date: form.delivery_date || null,
    gallery_url: form.gallery_url || null,
    private_notes: form.private_notes || null,
  };
}

function DeliverySkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton key={index} className="h-64" />
      ))}
    </div>
  );
}
