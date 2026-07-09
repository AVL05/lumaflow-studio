import { useState } from "react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";

const styles = [
  "cinematic",
  "moody",
  "urban",
  "street",
  "portrait",
  "wedding",
  "landscape",
  "nature",
  "automotive",
  "product",
  "editorial",
  "documentary",
  "travel",
  "black_white",
  "warm",
  "cold",
  "minimal",
  "film",
  "vintage",
  "custom",
];

export function PresetGenerator({ onGenerate, loading, preset }) {
  const [form, setForm] = useState({
    style: "cinematic",
    photo_type: "portrait",
    time_of_day: "",
    weather: "",
    location: "",
    gear: "",
  });

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <Card className="p-5">
      <h2 className="font-semibold">Presets inteligentes</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Select
          value={form.style}
          onChange={(event) => update("style", event.target.value)}
          options={styles.map((style) => ({ value: style, label: style }))}
        />
        <Input
          value={form.photo_type}
          onChange={(event) => update("photo_type", event.target.value)}
          placeholder="Tipo de fotografia"
        />
        <Input
          value={form.time_of_day}
          onChange={(event) => update("time_of_day", event.target.value)}
          placeholder="Hora del dia"
        />
        <Input
          value={form.weather}
          onChange={(event) => update("weather", event.target.value)}
          placeholder="Clima"
        />
        <Input
          value={form.location}
          onChange={(event) => update("location", event.target.value)}
          placeholder="Ubicacion"
        />
        <Input
          value={form.gear}
          onChange={(event) => update("gear", event.target.value)}
          placeholder="Equipo"
        />
      </div>
      <Button className="mt-4" onClick={() => onGenerate(form)} disabled={loading}>
        {loading ? "Generando..." : "Generar preset"}
      </Button>
      {preset ? (
        <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center gap-3">
            <span className="h-4 w-4 rounded-full" style={{ backgroundColor: preset.color }} />
            <div>
              <p className="font-medium">{preset.name}</p>
              <p className="text-sm text-stone-400">
                {preset.style} · {preset.category}
              </p>
            </div>
          </div>
          <p className="mt-3 text-sm text-stone-400">
            {preset.recommended_use || preset.description}
          </p>
        </div>
      ) : null}
    </Card>
  );
}
