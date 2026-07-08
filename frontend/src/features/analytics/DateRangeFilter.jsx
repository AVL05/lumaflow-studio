import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { Input } from "../../components/ui/Input";
import { addDays, todayIso } from "../calendar/calendarUtils";

const presets = [
  { label: "30 dias", days: 30 },
  { label: "90 dias", days: 90 },
  { label: "12 meses", days: 365 },
];

export function DateRangeFilter({ range, onChange, onExport }) {
  function applyPreset(days) {
    const to = todayIso();
    onChange({ from: addDays(to, -days), to });
  }

  return (
    <div className="mb-6 grid gap-3 lg:grid-cols-[160px_160px_1fr_auto]">
      <Field label="Desde">
        <Input
          type="date"
          value={range.from}
          onChange={(event) => onChange({ ...range, from: event.target.value })}
        />
      </Field>
      <Field label="Hasta">
        <Input
          type="date"
          value={range.to}
          onChange={(event) => onChange({ ...range, to: event.target.value })}
        />
      </Field>
      <div className="flex items-end gap-2">
        {presets.map((preset) => (
          <Button key={preset.days} variant="secondary" onClick={() => applyPreset(preset.days)}>
            {preset.label}
          </Button>
        ))}
      </div>
      <div className="flex items-end">
        <Button onClick={onExport}>Exportar CSV</Button>
      </div>
    </div>
  );
}
