import { useState } from "react";
import { locationsApi } from "../api/locations";
import { getApiError } from "../api/client";
import { Button } from "../components/ui/Button";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Modal } from "../components/ui/Modal";
import { PageHeader } from "../components/ui/PageHeader";
import { Pagination } from "../components/ui/Pagination";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/states/EmptyState";
import { ErrorState } from "../components/states/ErrorState";
import { LocationCard } from "../features/locations/LocationCard";
import { LocationFilters } from "../features/locations/LocationFilters";
import { LocationForm } from "../features/locations/LocationForm";
import { useToast } from "../features/notifications/ToastContext";
import { usePaginatedResource } from "../hooks/usePaginatedResource";

const defaults = {
  name: "",
  city: "",
  country: "",
  latitude: "",
  longitude: "",
  type: "urban",
  best_time: "",
  access_difficulty: "easy",
  rating: "",
  is_favorite: false,
  access_mode: "",
  permissions_required: "",
  cost: "",
  google_maps_url: "",
  apple_maps_url: "",
  openstreetmap_url: "",
  recommended_weather: "",
  recommended_seasons: [],
  season_pick: "",
  notes: "",
  tags_text: "",
  recommended_gear_text: "",
  tags: [],
  recommended_gear: [],
};

export function LocationsPage() {
  const toast = useToast();
  const resource = usePaginatedResource(locationsApi.list, {
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

  function openCreate() {
    setEditing(null);
    setForm(defaults);
    setFormError("");
    setFormOpen(true);
  }

  function openEdit(location) {
    setEditing(location);
    setForm({
      ...defaults,
      ...location,
      tags_text: location.tags?.join(", ") ?? "",
      recommended_gear_text: location.recommended_gear?.join(", ") ?? "",
      recommended_seasons: location.recommended_seasons ?? [],
    });
    setFormError("");
    setFormOpen(true);
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setFormError("");

    try {
      const payload = normalizeLocation(form);
      if (editing) {
        await locationsApi.update(editing.id, payload);
        toast.success("Localizacion actualizada.");
      } else {
        await locationsApi.create(payload);
        toast.success("Localizacion creada.");
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
    await locationsApi.remove(deleting.id);
    toast.success("Localizacion eliminada.");
    setDeleting(null);
    await resource.refresh();
  }

  return (
    <>
      <PageHeader
        eyebrow="Locations"
        title="Localizaciones"
        description="Guarda spots fotograficos con coordenadas, mejor hora, dificultad, tags y equipo recomendado."
        action={<Button onClick={openCreate}>Nueva localizacion</Button>}
      />

      <LocationFilters resource={resource} />
      {resource.error ? <ErrorState message={resource.error} /> : null}
      {resource.loading ? (
        <LocationSkeleton />
      ) : resource.items.length === 0 ? (
        <EmptyState
          title="Sin localizaciones"
          description="Crea tu primera localizacion fotografica."
          action={<Button onClick={openCreate}>Crear localizacion</Button>}
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {resource.items.map((location) => (
              <LocationCard
                key={location.id}
                location={location}
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
        title={editing ? "Editar localizacion" : "Nueva localizacion"}
        onClose={() => setFormOpen(false)}
      >
        <LocationForm
          form={form}
          setForm={setForm}
          onSubmit={submit}
          error={formError}
          saving={saving}
        />
      </Modal>
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Eliminar localizacion"
        description="Esta accion elimina la localizacion guardada. No afecta a las sesiones asociadas."
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}

function normalizeLocation(form) {
  return {
    name: form.name,
    city: form.city || null,
    country: form.country || null,
    latitude: Number(form.latitude),
    longitude: Number(form.longitude),
    type: form.type,
    best_time: form.best_time || null,
    access_difficulty: form.access_difficulty,
    rating: form.rating === "" ? null : Number(form.rating),
    is_favorite: Boolean(form.is_favorite),
    access_mode: form.access_mode || null,
    permissions_required: form.permissions_required || null,
    cost: form.cost === "" ? null : Number(form.cost),
    google_maps_url: form.google_maps_url || null,
    apple_maps_url: form.apple_maps_url || null,
    openstreetmap_url: form.openstreetmap_url || null,
    recommended_weather: form.recommended_weather || null,
    recommended_seasons: form.recommended_seasons ?? [],
    notes: form.notes || null,
    tags: splitList(form.tags_text),
    recommended_gear: splitList(form.recommended_gear_text),
  };
}

function splitList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function LocationSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton key={index} className="h-96" />
      ))}
    </div>
  );
}
