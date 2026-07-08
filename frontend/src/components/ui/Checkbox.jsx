export function Checkbox({ label, className = "", ...props }) {
  const input = (
    <input
      type="checkbox"
      className={`h-4 w-4 shrink-0 cursor-pointer rounded border-white/20 bg-stone-950/70 accent-amber-200 ${className}`}
      {...props}
    />
  );

  if (!label) return input;

  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-300">
      {input}
      <span>{label}</span>
    </label>
  );
}
