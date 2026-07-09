export function ProgressBar({ value = 0, label }) {
  const clamped = Math.min(100, Math.max(0, Math.round(value)));

  return (
    <div>
      <div className="flex items-center justify-between text-xs text-stone-400">
        <span>{label ?? "Progreso"}</span>
        <span className="tabular-nums text-stone-300">{clamped}%</span>
      </div>
      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.08]"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-amber-200/80 transition-[width] duration-300"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
