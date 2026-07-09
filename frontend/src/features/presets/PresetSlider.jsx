export function PresetSlider({ label, value, min = -100, max = 100 }) {
  const num = Number(value);
  const bidirectional = min < 0 && max > 0;

  return (
    <div>
      <div className="mb-2 flex justify-between text-xs text-stone-400">
        <span>{label}</span>
        <span className="text-stone-200">{num > 0 && bidirectional ? `+${num}` : num}</span>
      </div>
      <div className="relative h-2 overflow-hidden rounded-full bg-white/[0.07]">
        {bidirectional ? (
          <>
            <span className="absolute inset-y-0 left-1/2 w-px bg-white/20" />
            <div
              className={`absolute inset-y-0 rounded-full ${num >= 0 ? "bg-amber-200/80" : "bg-stone-400/70"}`}
              style={
                num >= 0
                  ? { left: "50%", width: `${Math.min(50, (num / max) * 50)}%` }
                  : { right: "50%", width: `${Math.min(50, (num / min) * 50)}%` }
              }
            />
          </>
        ) : (
          <div
            className="h-full rounded-full bg-amber-200/80"
            style={{ width: `${Math.max(0, Math.min(100, ((num - min) / (max - min)) * 100))}%` }}
          />
        )}
      </div>
    </div>
  );
}
