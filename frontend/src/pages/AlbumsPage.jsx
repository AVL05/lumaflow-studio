import { useState } from "react";
import { albumsApi } from "../api/albums";
import { getApiError } from "../api/client";
import { AlbumCard } from "../features/albums/AlbumCard";
import { useToast } from "../features/notifications/ToastContext";
import { usePaginatedResource } from "../hooks/usePaginatedResource";
import { Button } from "../components/ui/Button";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Field } from "../components/ui/Field";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { PageHeader } from "../components/ui/PageHeader";
import { Pagination } from "../components/ui/Pagination";
import { SearchBar } from "../components/ui/SearchBar";
import { Skeleton } from "../components/ui/Skeleton";
import { Textarea } from "../components/ui/Textarea";
import { EmptyState } from "../components/states/EmptyState";
import { ErrorState } from "../components/states/ErrorState";

const defaults = {
  name: "",
  description: "",
  color: "#d6b17a",
  date: "",
  cover_photo_id: "",
  photo_ids: [],
};

export function AlbumsPage() {
  const toast = useToast();
  const resource = usePaginatedResource(albumsApi.list, { per_page: 12 });
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

  function openEdit(album) {
    setEditing(album);
    setForm({
      ...defaults,
      ...album,
      cover_photo_id: album.cover_photo_id ?? "",
      date: album.date ?? "",
    });
    setFormError("");
    setFormOpen(true);
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setFormError("");

    const payload = {
      ...form,
      cover_photo_id: form.cover_photo_id || null,
      date: form.date || null,
    };

    try {
      if (editing) {
        await albumsApi.update(editing.id, payload);
        toast.success("Album actualizado.");
      } else {
        await albumsApi.create(payload);
        toast.success("Album creado.");
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
    await albumsApi.remove(deleting.id);
    toast.success("Album eliminado.");
    setDeleting(null);
    await resource.refresh();
  }

  return (
    <>
      <PageHeader
        eyebrow="Collections"
        title="Álbumes"
        description="Organiza fotos por colecciones visuales preparadas para entregas, portfolios y futuras comparaciones."
        action={<Button onClick={openCreate}>Nuevo album</Button>}
      />
      <div className="mb-6 max-w-xl">
        <SearchBar
          value={resource.filters.search ?? ""}
          onChange={(value) => resource.updateFilter("search", value)}
          placeholder="Buscar albumes"
        />
      </div>
      {resource.error ? <ErrorState message={resource.error} /> : null}
      {resource.loading ? (
        <AlbumSkeleton />
      ) : resource.items.length === 0 ? (
        <EmptyState
          title="Sin albumes"
          description="Crea una coleccion para agrupar fotos por proyecto o entrega."
          action={<Button onClick={openCreate}>Crear album</Button>}
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {resource.items.map((album) => (
              <AlbumCard
                key={album.id}
                album={album}
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
        title={editing ? "Editar album" : "Nuevo album"}
        onClose={() => setFormOpen(false)}
      >
        <form className="space-y-4" onSubmit={submit}>
          {formError ? <ErrorState message={formError} /> : null}
          <Field label="Nombre">
            <Input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="Color">
            <Input
              type="color"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
            />
          </Field>
          <Field label="Fecha">
            <Input
              type="date"
              value={form.date ?? ""}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </Field>
          <Field label="Descripcion">
            <Textarea
              rows="4"
              value={form.description ?? ""}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </Field>
          <Button disabled={saving}>
            {saving ? "Guardando..." : "Guardar album"}
          </Button>
        </form>
      </Modal>
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Eliminar album"
        description="El album se eliminara, pero las fotos seguiran en la biblioteca."
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}

function AlbumSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton key={index} className="h-64" />
      ))}
    </div>
  );
}
