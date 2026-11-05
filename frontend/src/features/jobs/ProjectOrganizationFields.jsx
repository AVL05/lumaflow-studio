import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { Input } from "../../components/ui/Input";
import { ProjectResourcePicker } from "./ProjectResourcePicker";

export function ProjectOrganizationFields({ form, setForm, jobId }) {
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  function row(key, index, field, value) {
    setForm((current) => ({
      ...current,
      [key]: current[key].map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }));
  }
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["start_date", "Inicio"],
          ["end_date", "Fin"],
          ["delivery_due_date", "Entrega prevista"],
        ].map(([key, label]) => (
          <Field key={key} label={label}>
            <Input
              type="date"
              min={key === "end_date" ? form.start_date || undefined : undefined}
              value={form[key]}
              onChange={(e) => set(key, e.target.value)}
            />
          </Field>
        ))}
      </div>
      <fieldset className="space-y-3">
        <legend className="mb-2 text-sm font-semibold text-stone-200">Participantes</legend>
        <p className="text-xs text-stone-400">
          Equipo humano del proyecto. Los permisos se gestionan en el estudio.
        </p>
        {form.participants.map((person, index) => (
          <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <Input
              aria-label={`Nombre participante ${index + 1}`}
              required
              maxLength={120}
              placeholder="Nombre"
              value={person.name}
              onChange={(e) => row("participants", index, "name", e.target.value)}
            />
            <Input
              aria-label={`Rol participante ${index + 1}`}
              maxLength={120}
              placeholder="Función"
              value={person.role ?? ""}
              onChange={(e) => row("participants", index, "role", e.target.value)}
            />
            <Button
              type="button"
              variant="ghost"
              aria-label={`Quitar participante ${index + 1}`}
              onClick={() =>
                set(
                  "participants",
                  form.participants.filter((_, i) => i !== index),
                )
              }
            >
              Quitar
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="secondary"
          disabled={form.participants.length >= 25}
          onClick={() => set("participants", [...form.participants, { name: "", role: "" }])}
        >
          Añadir participante
        </Button>
      </fieldset>
      <fieldset className="space-y-3">
        <legend className="mb-2 text-sm font-semibold text-stone-200">Enlaces externos</legend>
        {form.external_links.map((link, index) => (
          <div key={index} className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
            <Input
              aria-label={`Nombre enlace ${index + 1}`}
              required
              maxLength={120}
              placeholder="Nombre"
              value={link.label}
              onChange={(e) => row("external_links", index, "label", e.target.value)}
            />
            <Input
              aria-label={`URL enlace ${index + 1}`}
              type="url"
              pattern="https?://.*"
              required
              maxLength={2048}
              placeholder="https://…"
              value={link.url}
              onChange={(e) => row("external_links", index, "url", e.target.value)}
            />
            <Button
              type="button"
              variant="ghost"
              aria-label={`Quitar enlace ${index + 1}`}
              onClick={() =>
                set(
                  "external_links",
                  form.external_links.filter((_, i) => i !== index),
                )
              }
            >
              Quitar
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="secondary"
          disabled={form.external_links.length >= 20}
          onClick={() => set("external_links", [...form.external_links, { label: "", url: "" }])}
        >
          Añadir enlace
        </Button>
      </fieldset>
      {jobId && (
        <>
          <ProjectResourcePicker
            jobId={jobId}
            resource="locations"
            label="Localización principal"
            single
            selected={form.location_id ? [Number(form.location_id)] : []}
            onChange={(ids) => set("location_id", ids[0] ?? "")}
          />
          <ProjectResourcePicker
            jobId={jobId}
            resource="locations"
            label="Otras localizaciones"
            selected={form.location_ids}
            onChange={(ids) => set("location_ids", ids)}
          />
          <ProjectResourcePicker
            jobId={jobId}
            resource="gear"
            label="Equipo necesario"
            selected={form.gear_item_ids}
            onChange={(ids) => set("gear_item_ids", ids)}
          />
        </>
      )}
    </div>
  );
}
