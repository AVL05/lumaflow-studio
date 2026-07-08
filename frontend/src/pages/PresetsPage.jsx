import { useState } from "react";
import { presetsApi } from "../api/presets";
import { getApiError } from "../api/client";
import { Button } from "../components/ui/Button";
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
import { PresetCard } from "../features/presets/PresetCard";
import { PresetPreview } from "../features/presets/PresetPreview";
import { useToast } from "../features/notifications/ToastContext";
import { usePaginatedResource } from "../hooks/usePaginatedResource";
import { labelFor, presetCategories, presetStyles } from "../utils/catalogs";

const sliders = [
  "contrast",
  "shadows",
  "highlights",
  "whites",
  "blacks",
  "clarity",
  "texture",
  "intensity",
  "saturation",
  "vibrance",
  "temperature",
  "tint",
  "sharpness",
  "noise_reduction",
  "grain",
  "vignette",
];
const defaults = Object.fromEntries(
  sliders.map((key) => [key, key === "intensity" ? 50 : 0]),
);

const defaultPreset = {
  name: "",
  description: "",
  category: "color",
  style: "cinematic",
  ...defaults,
  recommended_use: "",
  is_favorite: false,
  color: "#d6b17a",
  version: "1.0",
};

export function PresetsPage() {
  const toast = useToast();
  const resource = usePaginatedResource(presetsApi.list, {
    per_page: 12,
    sort: "created_at",
    direction: "desc",
  });
  const [form, setForm] = useState(defaultPreset);
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  function openCreate() {
    setEditing(null);
    setForm(defaultPreset);
    setFormError("");
    setFormOpen(true);
  }

  function openEdit(preset) {
    setEditing(preset);
    setForm({ ...defaultPreset, ...preset });
    setFormError("");
    setFormOpen(true);
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setFormError("");

    try {
      if (editing) {
        await presetsApi.update(editing.id, form);
        toast.success("Preset actualizado.");
      } else {
        await presetsApi.create(form);
        toast.success("Preset creado.");
      }
      setFormOpen(false);
      await resource.refresh();
    } catch (err) {
      setFormError(getApiError(err));
    } finally {
      setSaving(false);
    }
  }

  async function duplicate(preset) {
    await presetsApi.duplicate(preset.id);
    toast.success("Preset duplicado.");
    await resource.refresh();
  }

  async function confirmDelete() {
    await presetsApi.remove(deleting.id);
    toast.success("Preset eliminado.");
    setDeleting(null);
    await resource.refresh();
  }

  return (
    <>
      <PageHeader
        eyebrow="Color system"
        title="Presets"
        description="Sistema profesional de presets con versionado, favoritos, color identificativo y simulacion visual de ajustes."
        action={<Button onClick={openCreate}>Nuevo preset</Button>}
      />

      <div className="mb-6 grid gap-3 lg:grid-cols-[1fr_190px_190px_150px_140px]">
        <SearchBar
          value={resource.filters.search ?? ""}
          onChange={(value) => resource.updateFilter("search", value)}
          placeholder="Buscar presets"
        />
        <Select
          value={resource.filters.category ?? ""}
          onChange={(e) => resource.updateFilter("category", e.target.value)}
          options={[
            { value: "", label: "Todas las categorias" },
            ...presetCategories,
          ]}
        />
        <Select
          value={resource.filters.style ?? ""}
          onChange={(e) => resource.updateFilter("style", e.target.value)}
          options={[{ value: "", label: "Todos los estilos" }, ...presetStyles]}
        />
        <Select
          value={resource.filters.favorites ?? ""}
          onChange={(e) => resource.updateFilter("favorites", e.target.value)}
          options={[
            { value: "", label: "Todos" },
            { value: "true", label: "Favoritos" },
          ]}
        />
        <Select
          value={resource.filters.sort ?? "created_at"}
          onChange={(e) => resource.updateFilter("sort", e.target.value)}
          options={[
            { value: "created_at", label: "Reciente" },
            { value: "name", label: "Nombre" },
            { value: "usage_count", label: "Uso" },
          ]}
        />
      </div>

      {resource.error ? <ErrorState message={resource.error} /> : null}
      {resource.loading ? (
        <PresetSkeleton />
      ) : resource.items.length === 0 ? (
        <EmptyState
          title="Sin presets"
          description="No hay presets que coincidan con los filtros actuales."
          action={<Button onClick={openCreate}>Crear preset</Button>}
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {resource.items.map((preset) => (
              <PresetCard
                key={preset.id}
                preset={preset}
                onDetail={setDetail}
                onEdit={openEdit}
                onDuplicate={duplicate}
                onDelete={setDeleting}
              />
            ))}
          </div>
          <Pagination meta={resource.meta} onPage={resource.setPage} />
        </>
      )}

      <Modal
        open={formOpen}
        title={editing ? "Editar preset" : "Nuevo preset"}
        onClose={() => setFormOpen(false)}
      >
        <PresetForm
          form={form}
          setForm={setForm}
          onSubmit={submit}
          error={formError}
          saving={saving}
        />
      </Modal>
      <Modal
        open={Boolean(detail)}
        title={detail?.name}
        onClose={() => setDetail(null)}
      >
        {detail ? <PresetDetail preset={detail} /> : null}
      </Modal>
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Eliminar preset"
        description="Esta accion eliminara el preset de tu biblioteca de color."
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}

function PresetForm({ form, setForm, onSubmit, error, saving }) {
  const setValue = (name, value) =>
    setForm((current) => ({ ...current, [name]: value }));

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
      {error ? (
        <div className="md:col-span-2">
          <ErrorState message={error} />
        </div>
      ) : null}
      <Field label="Nombre">
        <Input
          required
          value={form.name}
          onChange={(e) => setValue("name", e.target.value)}
        />
      </Field>
      <Field label="Version">
        <Input
          required
          value={form.version}
          onChange={(e) => setValue("version", e.target.value)}
        />
      </Field>
      <Field label="Categoria">
        <Select
          value={form.category}
          onChange={(e) => setValue("category", e.target.value)}
          options={presetCategories}
        />
      </Field>
      <Field label="Estilo">
        <Select
          value={form.style}
          onChange={(e) => setValue("style", e.target.value)}
          options={presetStyles}
        />
      </Field>
      <Field label="Color">
        <Input
          type="color"
          value={form.color}
          onChange={(e) => setValue("color", e.target.value)}
        />
      </Field>
      <label className="flex items-center gap-3 text-sm text-stone-300">
        <input
          className="h-5 w-5 accent-amber-200"
          type="checkbox"
          checked={Boolean(form.is_favorite)}
          onChange={(e) => setValue("is_favorite", e.target.checked)}
        />
        Favorito
      </label>
      <div className="md:col-span-2">
        <Field label="Descripcion">
          <Textarea
            rows="3"
            value={form.description ?? ""}
            onChange={(e) => setValue("description", e.target.value)}
          />
        </Field>
      </div>
      {sliders.map((key) => (
        <Field key={key} label={key.replace("_", " ")}>
          <Input
            type="number"
            min={
              ["grain", "sharpness", "noise_reduction", "intensity"].includes(
                key,
              )
                ? 0
                : -100
            }
            max="100"
            value={form[key]}
            onChange={(e) => setValue(key, Number(e.target.value))}
          />
        </Field>
      ))}
      <div className="md:col-span-2">
        <Field label="Uso recomendado">
          <Textarea
            rows="3"
            value={form.recommended_use ?? ""}
            onChange={(e) => setValue("recommended_use", e.target.value)}
          />
        </Field>
      </div>
      <div className="md:col-span-2 flex justify-end">
        <Button disabled={saving}>
          {saving ? "Guardando..." : "Guardar preset"}
        </Button>
      </div>
    </form>
  );
}

function PresetDetail({ preset }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
      <div className="space-y-4 text-sm text-stone-400">
        <p>
          <span className="text-stone-100">Categoria:</span>{" "}
          {labelFor(presetCategories, preset.category)}
        </p>
        <p>
          <span className="text-stone-100">Estilo:</span>{" "}
          {labelFor(presetStyles, preset.style)}
        </p>
        <p>
          <span className="text-stone-100">Version:</span> {preset.version}
        </p>
        <p>
          <span className="text-stone-100">Uso:</span>{" "}
          {preset.recommended_use || "Sin uso recomendado"}
        </p>
        <p>{preset.description || "Sin descripcion."}</p>
      </div>
      <PresetPreview preset={preset} />
    </div>
  );
}

function PresetSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton key={index} className="h-96" />
      ))}
    </div>
  );
}
