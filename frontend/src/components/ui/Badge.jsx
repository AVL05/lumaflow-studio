const variants = {
  neutral: "border-white/10 bg-white/[0.05] text-stone-300",
  warm: "border-amber-200/20 bg-amber-200/10 text-amber-100",
  green: "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
  red: "border-red-300/20 bg-red-300/10 text-red-100",
};

export function Badge({ children, variant = "neutral" }) {
  return (
    <span
      className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,.05)] ${variants[variant]}`}
    >
      {children}
    </span>
  );
}
