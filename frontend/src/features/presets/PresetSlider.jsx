export function PresetSlider({ label, value, min = -100, max = 100 }) {
  const pct = ((Number(value) - min) / (max - min)) * 100;

  return (
    <div>
      <div className="mb-2 flex justify-between text-xs text-stone-400">
        <span>{label}</span>
        <span className="text-stone-200">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/[0.07]">
        <div
          className="h-full rounded-full bg-amber-200/80"
          style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
        />
      </div>
    </div>
  );
}
