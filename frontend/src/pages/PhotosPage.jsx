import { memo, useCallback, useEffect, useState } from "react";
import { albumsApi } from "../api/albums";
import { bulkApi } from "../api/bulk";
import { getApiError } from "../api/client";
import { exportsApi } from "../api/exports";
import { photosApi } from "../api/photos";
import { sessionsApi } from "../api/sessions";
import { tagsApi } from "../api/tags";
import { Badge } from "../components/ui/Badge";
import { BulkActionBar } from "../components/ui/BulkActionBar";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Checkbox } from "../components/ui/Checkbox";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Field } from "../components/ui/Field";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { PageHeader } from "../components/ui/PageHeader";
import { Pagination } from "../components/ui/Pagination";
import { SearchBar } from "../components/ui/SearchBar";
import { Select } from "../components/ui/Select";
import { Skeleton } from "../components/ui/Skeleton";
import { Textarea } from "../components/ui/Textarea";
import { EmptyState } from "../components/states/EmptyState";
import { ErrorState } from "../components/states/ErrorState";
import { ExifPanel } from "../features/gallery/ExifPanel";
import { GalleryViewSwitcher } from "../features/gallery/GalleryViewSwitcher";
import { TagSelector } from "../features/tags/TagSelector";
import { usePaginatedResource } from "../hooks/usePaginatedResource";
import { useSelection } from "../hooks/useSelection";
import { useToast } from "../features/notifications/ToastContext";

const defaults = {
  title: "",
  description: "",
  category: "",
  session_id: "",
  taken_at: "",
  is_favorite: false,
  album_ids: [],
  tag_ids: [],
};

export function PhotosPage() {
  const toast = useToast();
  const resource = usePaginatedResource(photosApi.list, {
    per_page: 18,
    sort: "created_at",
    direction: "desc",
  });
  const [sessions, setSessions] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [tags, setTags] = useState([]);
  const [view, setView] = useState("grid");
  const [uploadForm, setUploadForm] = useState({ ...defaults, photo: null });
  const [editing, setEditing] = useState(null);
  const [preview, setPreview] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const selection = useSelection();
  const [bulkTag, setBulkTag] = useState("");
  const [bulkAlbum, setBulkAlbum] = useState("");

  // Estable para no invalidar la memoizacion de PhotoCard en cada render.
  const startEditing = useCallback((photo) => setEditing(photoToForm(photo)), []);

  async function runBulk(action, payload) {
    try {
      const { affected } = await bulkApi.run("photos", action, selection.selected, payload);
      toast.success(`${affected} fotos actualizadas.`);
      selection.clear();
      await resource.refresh();
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  useEffect(() => {
    Promise.all([
      sessionsApi.list({ per_page: 100, sort: "date", direction: "desc" }),
      albumsApi.list({ per_page: 100 }),
      tagsApi.list({ per_page: 200 }),
    ])
      .then(([sessionData, albumData, tagData]) => {
        setSessions(sessionData.data);
        setAlbums(albumData.data);
        setTags(tagData.data);
      })
      .catch(() => {
        setSessions([]);
        setAlbums([]);
        setTags([]);
      });
  }, []);

  async function upload(event) {
    event.preventDefault();
    setSaving(true);
    setUploadError("");

    const data = new FormData();
    appendPhotoPayload(data, uploadForm);
    data.append("photo", uploadForm.photo);

    try {
      await photosApi.upload(data);
      toast.success("Foto subida con metadata y EXIF.");
      setUploadForm({ ...defaults, photo: null });
      event.target.reset();
      await resource.refresh();
    } catch (err) {
      setUploadError(getApiError(err));
    } finally {
      setSaving(false);
    }
  }

  async function update(event) {
    event.preventDefault();
    setSaving(true);
    setFormError("");

    try {
      await photosApi.update(editing.id, normalizePhotoPayload(editing));
      toast.success("Foto actualizada.");
      setEditing(null);
      await resource.refresh();
    } catch (err) {
      setFormError(getApiError(err));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    await photosApi.remove(deleting.id);
    toast.success("Foto y archivo eliminados.");
    setDeleting(null);
    await resource.refresh();
  }

  return (
    <>
      <PageHeader
        eyebrow="Library"
        title="Biblioteca fotografica"
        description="Galeria avanzada con albumes, tags, filtros EXIF, favoritos, preview rapido y metadata editable."
        action={<GalleryViewSwitcher value={view} onChange={setView} />}
      />

      <div className="mb-6 grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card className="p-5">
          <h2 className="text-lg font-semibold">Subir imagen</h2>
          <PhotoForm
            form={uploadForm}
            setForm={setUploadForm}
            sessions={sessions}
            albums={albums}
            tags={tags}
            onSubmit={upload}
            error={uploadError}
            saving={saving}
            upload
          />
        </Card>
        <GalleryFilters resource={resource} albums={albums} tags={tags} sessions={sessions} />
      </div>

      {resource.error ? <ErrorState message={resource.error} /> : null}
      {resource.loading ? (
        <PhotoSkeleton view={view} />
      ) : resource.items.length === 0 ? (
        <EmptyState
          title="Sin fotos"
          description="No hay imagenes que coincidan con los filtros actuales."
        />
      ) : (
        <>
          <div
            className={
              view === "grid"
                ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
                : "space-y-3"
            }
          >
            {resource.items.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                view={view}
                selected={selection.isSelected(photo.id)}
                onSelect={selection.toggle}
                onPreview={setPreview}
                onEdit={startEditing}
                onDelete={setDeleting}
              />
            ))}
          </div>
          <Pagination meta={resource.meta} onPage={resource.setPage} />
        </>
      )}

      <BulkActionBar count={selection.count} onClear={selection.clear}>
        <Select
          value={bulkTag}
          onChange={(e) => setBulkTag(e.target.value)}
          options={[
            { value: "", label: "Etiqueta..." },
            ...tags.map((tag) => ({ value: String(tag.id), label: tag.name })),
          ]}
        />
        <Button
          variant="secondary"
          disabled={!bulkTag}
          onClick={() => runBulk("tags", { tag_ids: [Number(bulkTag)] })}
        >
          Anadir etiqueta
        </Button>
        <Select
          value={bulkAlbum}
          onChange={(e) => setBulkAlbum(e.target.value)}
          options={[
            { value: "", label: "Album..." },
            ...albums.map((album) => ({ value: String(album.id), label: album.name })),
          ]}
        />
        <Button
          variant="secondary"
          disabled={!bulkAlbum}
          onClick={() => runBulk("album", { album_id: Number(bulkAlbum) })}
        >
          Mover a album
        </Button>
        <Button variant="secondary" onClick={() => exportsApi.csv("photos", selection.selected)}>
          Exportar
        </Button>
        <Button variant="danger" onClick={() => runBulk("delete")}>
          Eliminar
        </Button>
      </BulkActionBar>

      <Modal
        open={Boolean(preview)}
        title={preview?.title || preview?.file_name || "Preview"}
        onClose={() => setPreview(null)}
      >
        {preview ? <PhotoQuickPreview photo={preview} /> : null}
      </Modal>
      <Modal open={Boolean(editing)} title="Editar foto" onClose={() => setEditing(null)}>
        {editing ? (
          <PhotoForm
            form={editing}
            setForm={setEditing}
            sessions={sessions}
            albums={albums}
            tags={tags}
            onSubmit={update}
            error={formError}
            saving={saving}
          />
        ) : null}
      </Modal>
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Eliminar foto"
        description="Se eliminara el registro y tambien el archivo fisico guardado en Storage."
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}

function GalleryFilters({ resource, albums, tags, sessions }) {
  return (
    <Card className="p-5">
      <div className="grid gap-3 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <SearchBar
            value={resource.filters.search ?? ""}
            onChange={(value) => resource.updateFilter("search", value)}
            placeholder="Buscar por nombre, tag, sesion, album o descripcion"
          />
        </div>
        <Input
          value={resource.filters.category ?? ""}
          onChange={(e) => resource.updateFilter("category", e.target.value)}
          placeholder="Categoria"
        />
        <Select
          value={resource.filters.favorites ?? ""}
          onChange={(e) => resource.updateFilter("favorites", e.target.value)}
          options={[
            { value: "", label: "Todas" },
            { value: "true", label: "Favoritas" },
            { value: "false", label: "No favoritas" },
          ]}
        />
        <Select
          value={resource.filters.album_id ?? ""}
          onChange={(e) => resource.updateFilter("album_id", e.target.value)}
          options={[
            { value: "", label: "Todos los albumes" },
            ...albums.map((album) => ({
              value: String(album.id),
              label: album.name,
            })),
          ]}
        />
        <Select
          value={resource.filters.session_id ?? ""}
          onChange={(e) => resource.updateFilter("session_id", e.target.value)}
          options={[
            { value: "", label: "Todas las sesiones" },
            ...sessions.map((session) => ({
              value: String(session.id),
              label: session.name,
            })),
          ]}
        />
        <Select
          value={resource.filters.tag_id ?? ""}
          onChange={(e) => resource.updateFilter("tag_id", e.target.value)}
          options={[
            { value: "", label: "Todas las etiquetas" },
            ...tags.map((tag) => ({ value: String(tag.id), label: tag.name })),
          ]}
        />
        <Input
          value={resource.filters.camera ?? ""}
          onChange={(e) => resource.updateFilter("camera", e.target.value)}
          placeholder="Camara"
        />
        <Input
          value={resource.filters.lens ?? ""}
          onChange={(e) => resource.updateFilter("lens", e.target.value)}
          placeholder="Objetivo"
        />
        <Input
          value={resource.filters.iso ?? ""}
          onChange={(e) => resource.updateFilter("iso", e.target.value)}
          placeholder="ISO"
        />
        <Input
          type="date"
          value={resource.filters.date ?? ""}
          onChange={(e) => resource.updateFilter("date", e.target.value)}
        />
        <Select
          value={resource.filters.sort ?? "created_at"}
          onChange={(e) => resource.updateFilter("sort", e.target.value)}
          options={[
            { value: "created_at", label: "Reciente" },
            { value: "title", label: "Titulo" },
            { value: "category", label: "Categoria" },
            { value: "taken_at", label: "Fecha captura" },
          ]}
        />
      </div>
    </Card>
  );
}

/** Memoizada: la galeria muestra hasta 60 tarjetas y la seleccion cambia a menudo. */
const PhotoCard = memo(function PhotoCard({
  photo,
  view,
  selected,
  onSelect,
  onPreview,
  onEdit,
  onDelete,
}) {
  const content = (
    <>
      <button
        className={view === "grid" ? "block w-full text-left" : "shrink-0"}
        onClick={() => onPreview(photo)}
      >
        <img
          loading="lazy"
          decoding="async"
          src={photo.url}
          alt={photo.title || photo.file_name || "Foto"}
          className={
            view === "grid"
              ? "aspect-[4/3] w-full object-cover transition duration-300 hover:scale-[1.02]"
              : "h-28 w-36 rounded-md object-cover"
          }
        />
      </button>
      <div className={view === "grid" ? "p-4" : "min-w-0 flex-1 p-4"}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <Checkbox
              checked={selected}
              onChange={() => onSelect(photo.id)}
              aria-label={`Seleccionar ${photo.title || photo.file_name}`}
              className="mt-1"
            />
            <div className="min-w-0">
              <h2 className="truncate font-medium">{photo.title || "Sin titulo"}</h2>
              <p className="mt-1 text-xs text-stone-400">
                {formatBytes(photo.file_size)} · {photo.exif_summary?.camera_model || "Sin camara"}
              </p>
            </div>
          </div>
          {photo.is_favorite ? <Badge variant="warm">Fav</Badge> : null}
        </div>
        <p className="mt-3 text-sm text-stone-400">
          {photo.category || "Sin categoria"} · {photo.session?.name || "Sin sesion"}
        </p>
        <div className="mt-3 flex flex-wrap gap-1">
          {photo.tags?.slice(0, 3).map((tag) => (
            <Badge key={tag.id}>{tag.name}</Badge>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => onPreview(photo)}>
            Preview
          </Button>
          <Button variant="secondary" onClick={() => onEdit(photo)}>
            Editar
          </Button>
          <Button variant="danger" onClick={() => onDelete(photo)}>
            Eliminar
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <Card className={view === "grid" ? "overflow-hidden" : "flex overflow-hidden"}>{content}</Card>
  );
});

function PhotoQuickPreview({ photo }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
      <img
        src={photo.url}
        alt={photo.title || "Preview"}
        className="max-h-[70vh] w-full rounded-md object-contain"
      />
      <div className="space-y-5">
        <div>
          <p className="text-sm text-stone-400">{photo.description || "Sin descripcion."}</p>
          <p className="mt-2 text-xs text-stone-400">
            {photo.category || "Sin categoria"} · {photo.taken_at || "Sin fecha"}
          </p>
        </div>
        <ExifPanel exif={photo.exif_summary} />
      </div>
    </div>
  );
}

function PhotoForm({
  form,
  setForm,
  sessions,
  albums,
  tags,
  onSubmit,
  error,
  saving,
  upload = false,
}) {
  const setValue = (name, value) => setForm((current) => ({ ...current, [name]: value }));

  return (
    <form className="mt-5 space-y-4" onSubmit={onSubmit}>
      {error ? <ErrorState message={error} /> : null}
      {upload ? (
        <Field label="Archivo">
          <Input
            required
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            onChange={(e) => setValue("photo", e.target.files[0])}
          />
        </Field>
      ) : null}
      <Field label="Titulo">
        <Input value={form.title ?? ""} onChange={(e) => setValue("title", e.target.value)} />
      </Field>
      <Field label="Descripcion">
        <Textarea
          rows="3"
          value={form.description ?? ""}
          onChange={(e) => setValue("description", e.target.value)}
        />
      </Field>
      <Field label="Sesion">
        <Select
          value={form.session_id ?? ""}
          onChange={(e) => setValue("session_id", e.target.value)}
          options={[
            { value: "", label: "Sin sesion" },
            ...sessions.map((session) => ({
              value: String(session.id),
              label: session.name,
            })),
          ]}
        />
      </Field>
      <Field label="Album">
        <Select
          value={form.album_ids?.[0] ? String(form.album_ids[0]) : ""}
          onChange={(e) => setValue("album_ids", e.target.value ? [Number(e.target.value)] : [])}
          options={[
            { value: "", label: "Sin album" },
            ...albums.map((album) => ({
              value: String(album.id),
              label: album.name,
            })),
          ]}
        />
      </Field>
      <Field label="Categoria">
        <Input value={form.category ?? ""} onChange={(e) => setValue("category", e.target.value)} />
      </Field>
      <Field label="Fecha">
        <Input
          type="date"
          value={form.taken_at ?? ""}
          onChange={(e) => setValue("taken_at", e.target.value)}
        />
      </Field>
      <Field label="Etiquetas">
        <TagSelector
          tags={tags}
          selected={form.tag_ids ?? []}
          onChange={(ids) => setValue("tag_ids", ids)}
        />
      </Field>
      <label className="flex items-center gap-3 text-sm text-stone-300">
        <input
          className="h-5 w-5 accent-amber-200"
          type="checkbox"
          checked={Boolean(form.is_favorite)}
          onChange={(e) => setValue("is_favorite", e.target.checked)}
        />
        Marcar como favorita
      </label>
      <Button disabled={saving || (upload && !form.photo)}>
        {saving ? "Guardando..." : upload ? "Subir foto" : "Guardar cambios"}
      </Button>
    </form>
  );
}

function appendPhotoPayload(data, form) {
  Object.entries(normalizePhotoPayload(form)).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => data.append(`${key}[]`, item));
      return;
    }
    if (value !== "" && value !== null && value !== undefined) data.append(key, value);
  });
}

function normalizePhotoPayload(form) {
  return {
    title: form.title || null,
    description: form.description || null,
    category: form.category || null,
    session_id: form.session_id || null,
    taken_at: form.taken_at || null,
    is_favorite: Boolean(form.is_favorite),
    album_ids: form.album_ids ?? [],
    tag_ids: form.tag_ids ?? [],
  };
}

function photoToForm(photo) {
  return {
    ...defaults,
    ...photo,
    session_id: photo.session_id ?? "",
    album_ids: photo.albums?.map((album) => album.id) ?? [],
    tag_ids: photo.tags?.map((tag) => tag.id) ?? [],
  };
}

function formatBytes(bytes) {
  if (!bytes) return "Sin peso";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function PhotoSkeleton({ view }) {
  return (
    <div
      className={
        view === "grid" ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" : "space-y-3"
      }
    >
      {Array.from({ length: 8 }, (_, index) => (
        <Skeleton key={index} className={view === "grid" ? "h-72" : "h-32"} />
      ))}
    </div>
  );
}
