export function Tabs({ options, value, onChange, className = "" }) {
  return (
    <div
      role="tablist"
      className={`inline-flex gap-1 rounded-md border border-white/10 bg-white/[0.03] p-1 ${className}`}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={option.value === value}
          onClick={() => onChange(option.value)}
          className={`rounded px-3 py-1.5 text-xs font-medium transition ${
            option.value === value
              ? "bg-stone-100 text-stone-950"
              : "text-stone-400 hover:bg-white/[0.06] hover:text-stone-100"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
