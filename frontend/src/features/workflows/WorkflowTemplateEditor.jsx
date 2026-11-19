import { Field } from "../../components/ui/Field";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { Button } from "../../components/ui/Button";
import { workflowPhases } from "./workflowFormUtils";

function ChecklistFields({ value, onChange, prefix }) {
  return (
    <div className="space-y-3">
      {value.map((check, index) => (
        <fieldset key={index} className="space-y-3 rounded-lg border border-white/10 p-3">
          <legend className="text-sm text-stone-400">Checklist {index + 1}</legend>
          <Field label={`${prefix} · nombre checklist ${index + 1}`}>
            <Input
              required
              maxLength={120}
              value={check.name}
              onChange={(e) =>
                onChange(value.map((c, i) => (i === index ? { ...c, name: e.target.value } : c)))
              }
            />
          </Field>
          <Field label={`${prefix} · controles ${index + 1} (uno por línea)`}>
            <Textarea
              rows={3}
              maxLength={3600}
              value={check.items}
              onChange={(e) =>
                onChange(value.map((c, i) => (i === index ? { ...c, items: e.target.value } : c)))
              }
            />
          </Field>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onChange(value.filter((_, i) => i !== index))}
          >
            Retirar checklist {index + 1}
          </Button>
        </fieldset>
      ))}
      <Button
        type="button"
        variant="secondary"
        disabled={value.length >= 4}
        onClick={() => onChange([...value, { name: "", items: "" }])}
      >
        Añadir checklist · {prefix}
      </Button>
    </div>
  );
}

export function WorkflowTemplateEditor({ form, setForm, saving, onSubmit }) {
  function updateStage(index, patch) {
    setForm((f) => ({
      ...f,
      stages: f.stages.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    }));
  }
  function addStage() {
    let index = form.stages.length + 1;
    while (form.stages.some((s) => s.key === `custom_${index}`)) index++;
    setForm((f) => ({
      ...f,
      stages: [...f.stages, { key: `custom_${index}`, label: "", tasks: "", checklists: [] }],
    }));
  }
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <fieldset disabled={saving} className="min-w-0 space-y-5">
        <Field label="Nombre de la plantilla">
          <Input
            required
            maxLength={120}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </Field>
        <Field label="Descripción de la plantilla">
          <Textarea
            rows={2}
            maxLength={1000}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </Field>
        <p className="text-sm text-stone-400">
          Define acciones y controles. Las fechas, responsables y recursos se eligen en cada
          proyecto.
        </p>
        {workflowPhases.map(([key, label]) => (
          <Field key={key} label={`Tareas de ${label.toLowerCase()} (una por línea)`}>
            <Textarea
              rows={3}
              maxLength={4320}
              value={form.phases[key]}
              onChange={(e) =>
                setForm((f) => ({ ...f, phases: { ...f.phases, [key]: e.target.value } }))
              }
            />
          </Field>
        ))}
        <ChecklistFields
          prefix="Proyecto"
          value={form.checklists}
          onChange={(checklists) => setForm((f) => ({ ...f, checklists }))}
        />
        <h3 className="text-lg font-semibold">Etapas de postproducción</h3>
        {form.stages.map((stage, index) => (
          <details key={stage.key} className="rounded-xl border border-white/10 p-4">
            <summary className="cursor-pointer font-medium">
              {index + 1}. {stage.label || "Nueva etapa"}
            </summary>
            <div className="mt-4 space-y-4">
              <Field label={`Nombre etapa ${index + 1}`}>
                <Input
                  required
                  maxLength={120}
                  value={stage.label}
                  onChange={(e) => updateStage(index, { label: e.target.value })}
                />
              </Field>
              <Field label={`Tareas etapa ${index + 1} (una por línea)`}>
                <Textarea
                  rows={3}
                  maxLength={2880}
                  value={stage.tasks}
                  onChange={(e) => updateStage(index, { tasks: e.target.value })}
                />
              </Field>
              <ChecklistFields
                prefix={`Etapa ${index + 1}`}
                value={stage.checklists}
                onChange={(checklists) => updateStage(index, { checklists })}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!index}
                  onClick={() =>
                    setForm((f) => {
                      const stages = [...f.stages];
                      [stages[index - 1], stages[index]] = [stages[index], stages[index - 1]];
                      return { ...f, stages };
                    })
                  }
                >
                  Subir etapa {index + 1}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    setForm((f) => ({ ...f, stages: f.stages.filter((_, i) => i !== index) }))
                  }
                >
                  Retirar etapa {index + 1}
                </Button>
              </div>
            </div>
          </details>
        ))}
        <Button
          type="button"
          variant="secondary"
          disabled={form.stages.length >= 16}
          onClick={addStage}
        >
          Añadir etapa a la plantilla
        </Button>
      </fieldset>
      <Button disabled={saving}>{saving ? "Guardando..." : "Guardar plantilla"}</Button>
    </form>
  );
}
