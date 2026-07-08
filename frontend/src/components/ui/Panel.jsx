export function Panel({ children, className = "" }) {
  return (
    <section
      className={`rounded-lg border border-white/10 bg-[#141311]/85 shadow-2xl shadow-black/20 ${className}`}
    >
      {children}
    </section>
  );
}
