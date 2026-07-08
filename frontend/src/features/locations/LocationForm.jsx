import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Textarea } from "../../components/ui/Textarea";
import { ErrorState } from "../../components/states/ErrorState";
import { accessDifficulties, accessModes, locationTypes, seasons } from "../../utils/catalogs";
import { LocationMap } from "./LocationMap";

export function LocationForm({ form, setForm, photos = [], onSubmit, error, saving }) {
  const setValue = (name, value) => setForm((current) => ({ ...current, [name]: value }));
  const selectedPhotoIds = new Set(form.photo_ids ?? []);

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
      {error ? (
        <div className="md:col-span-2">
          <ErrorState message={error} />
        </div>
      ) : null}
      <div className="md:col-span-2">
        <LocationMap
          location={{
            latitude: form.latitude,
            longitude: form.longitude,
            name: form.name || "Nueva localizacion",
          }}
          selectable
          onSelect={({ latitude, longitude }) =>
            setForm((current) => ({ ...current, latitude, longitude }))
          }
        />
        <p className="mt-2 text-xs text-stone-500">
          Haz clic en el mapa o busca coordenadas para seleccionar el punto exacto.
        </p>
      </div>
      <Field label="Nombre">
        <Input
          required
          value={form.name}
          onChange={(event) => setValue("name", event.target.value)}
        />
      </Field>
      <Field label="Tipo">
        <Select
          value={form.type}
          onChange={(event) => setValue("type", event.target.value)}
          options={locationTypes}
        />
      </Field>
      <Field label="Ciudad">
        <Input value={form.city ?? ""} onChange={(event) => setValue("city", event.target.value)} />
      </Field>
      <Field label="Pais">
        <Input
          value={form.country ?? ""}
          onChange={(event) => setValue("country", event.target.value)}
        />
      </Field>
      <Field label="Latitud">
        <Input
          required
          type="number"
          step="0.0000001"
          value={form.latitude}
          onChange={(event) => setValue("latitude", event.target.value)}
        />
      </Field>
      <Field label="Longitud">
        <Input
          required
          type="number"
          step="0.0000001"
          value={form.longitude}
          onChange={(event) => setValue("longitude", event.target.value)}
        />
      </Field>
      <Field label="Mejor hora">
        <Input
          value={form.best_time ?? ""}
          onChange={(event) => setValue("best_time", event.target.value)}
        />
      </Field>
      <Field label="Dificultad">
        <Select
          value={form.access_difficulty}
          onChange={(event) => setValue("access_difficulty", event.target.value)}
          options={accessDifficulties}
        />
      </Field>
      <Field label="Rating">
        <Input
          type="number"
          min="1"
          max="5"
          value={form.rating ?? ""}
          onChange={(event) => setValue("rating", event.target.value)}
        />
      </Field>
      <Field label="Acceso">
        <Select
          value={form.access_mode ?? ""}
          onChange={(event) => setValue("access_mode", event.target.value)}
          options={[{ value: "", label: "Sin definir" }, ...accessModes]}
        />
      </Field>
      <Field label="Coste">
        <Input
          type="number"
          min="0"
          step="0.01"
          value={form.cost ?? ""}
          onChange={(event) => setValue("cost", event.target.value)}
        />
      </Field>
      <Field label="Clima recomendado">
        <Input
          value={form.recommended_weather ?? ""}
          onChange={(event) => setValue("recommended_weather", event.target.value)}
        />
      </Field>
      <label className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-stone-300">
        <input
          type="checkbox"
          checked={Boolean(form.is_favorite)}
          onChange={(event) => setValue("is_favorite", event.target.checked)}
        />
        Favorita
      </label>
      <Field label="Estaciones">
        <Select
          value={form.season_pick ?? ""}
          onChange={(event) => {
            const value = event.target.value;
            if (!value) return;
            setForm((current) => ({
              ...current,
              recommended_seasons: Array.from(
                new Set([...(current.recommended_seasons ?? []), value]),
              ),
              season_pick: "",
            }));
          }}
          options={[{ value: "", label: "Anadir estacion" }, ...seasons]}
        />
      </Field>
      <div className="md:col-span-2 flex flex-wrap gap-2">
        {(form.recommended_seasons ?? []).map((season) => (
          <button
            key={season}
            type="button"
            className="rounded-md bg-white/[0.06] px-3 py-1 text-xs text-stone-300"
            onClick={() =>
              setForm((current) => ({
                ...current,
                recommended_seasons: current.recommended_seasons.filter((item) => item !== season),
              }))
            }
          >
            {season} x
          </button>
        ))}
      </div>
      <div className="md:col-span-2">
        <Field label="Permisos necesarios">
          <Textarea
            rows="3"
            value={form.permissions_required ?? ""}
            onChange={(event) => setValue("permissions_required", event.target.value)}
          />
        </Field>
      </div>
      <Field label="Google Maps">
        <Input
          type="url"
          value={form.google_maps_url ?? ""}
          onChange={(event) => setValue("google_maps_url", event.target.value)}
        />
      </Field>
      <Field label="Apple Maps">
        <Input
          type="url"
          value={form.apple_maps_url ?? ""}
          onChange={(event) => setValue("apple_maps_url", event.target.value)}
        />
      </Field>
      <div className="md:col-span-2">
        <Field label="OpenStreetMap">
          <Input
            type="url"
            value={form.openstreetmap_url ?? ""}
            onChange={(event) => setValue("openstreetmap_url", event.target.value)}
          />
        </Field>
      </div>
      <Field label="Portada">
        <Select
          value={form.cover_photo_id ?? ""}
          onChange={(event) => setValue("cover_photo_id", event.target.value)}
          options={[
            { value: "", label: "Sin portada" },
            ...photos.map((photo) => ({
              value: String(photo.id),
              label: photo.title || photo.file_name || `Foto ${photo.id}`,
            })),
          ]}
        />
      </Field>
      <div className="md:col-span-2">
        <p className="mb-2 text-xs uppercase tracking-[0.16em] text-stone-500">Galeria</p>
        <div className="grid max-h-52 gap-2 overflow-auto rounded-md border border-white/10 bg-white/[0.03] p-3 sm:grid-cols-2">
          {photos.length === 0 ? (
            <p className="text-sm text-stone-500">
              Sube fotos para asociarlas a esta localizacion.
            </p>
          ) : (
            photos.map((photo) => (
              <label key={photo.id} className="flex items-center gap-2 text-sm text-stone-300">
                <input
                  type="checkbox"
                  checked={selectedPhotoIds.has(photo.id)}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      photo_ids: event.target.checked
                        ? Array.from(new Set([...(current.photo_ids ?? []), photo.id]))
                        : (current.photo_ids ?? []).filter((id) => id !== photo.id),
                    }))
                  }
                />
                {photo.title || photo.file_name || `Foto ${photo.id}`}
              </label>
            ))
          )}
        </div>
      </div>
      <div className="md:col-span-2">
        <Field label="Tags">
          <Input
            value={form.tags_text ?? ""}
            onChange={(event) => setValue("tags_text", event.target.value)}
            placeholder="blue hour, editorial, cars"
          />
        </Field>
      </div>
      <div className="md:col-span-2">
        <Field label="Equipo recomendado">
          <Input
            value={form.recommended_gear_text ?? ""}
            onChange={(event) => setValue("recommended_gear_text", event.target.value)}
            placeholder="35mm, tripod, flash"
          />
        </Field>
      </div>
      <div className="md:col-span-2">
        <Field label="Notas">
          <Textarea
            rows="4"
            value={form.notes ?? ""}
            onChange={(event) => setValue("notes", event.target.value)}
          />
        </Field>
      </div>
      <div className="md:col-span-2 flex justify-end">
        <Button disabled={saving}>{saving ? "Guardando..." : "Guardar localizacion"}</Button>
      </div>
    </form>
  );
}
