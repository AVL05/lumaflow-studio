import { PresetSlider } from "./PresetSlider";

const previewFields = [
  ["Contraste", "contrast"],
  ["Sombras", "shadows"],
  ["Temperatura", "temperature"],
  ["Saturacion", "saturation"],
  ["Claridad", "clarity"],
  ["Grano", "grain", 0, 100],
];

export function PresetPreview({ preset }) {
  return (
    <div className="space-y-3">
      {previewFields.map(([label, key, min = -100, max = 100]) => (
        <PresetSlider key={key} label={label} value={preset[key] ?? 0} min={min} max={max} />
      ))}
    </div>
  );
}
