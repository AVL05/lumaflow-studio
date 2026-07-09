export function Panel({ children, className = "" }) {
  return (
    <section
      className={`rounded-xl border border-white/10 bg-[linear-gradient(145deg,rgba(27,25,21,.9),rgba(14,13,11,.94))] shadow-[0_22px_70px_rgba(0,0,0,.24)] ring-1 ring-white/[0.03] ${className}`}
    >
      {children}
    </section>
  );
}
