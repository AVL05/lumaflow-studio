export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
        {label}
      </span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-lg border border-white/10 bg-black/25 px-3.5 py-2.5 text-sm text-stone-100 outline-none shadow-[inset_0_1px_0_rgba(255,255,255,.035)] transition duration-200 placeholder:text-stone-400 hover:border-white/15 focus:border-amber-200/50 focus:bg-black/35 focus:ring-2 focus:ring-amber-200/10";
