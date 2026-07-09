export function Card({ children, className = "" }) {
  return (
    <article
      className={`group/card relative overflow-hidden rounded-xl border border-white/10 bg-[linear-gradient(145deg,rgba(28,26,22,.92),rgba(14,13,11,.94))] shadow-[0_24px_70px_rgba(0,0,0,.22)] ring-1 ring-white/[0.03] transition duration-300 hover:-translate-y-0.5 hover:border-amber-200/20 hover:shadow-[0_28px_90px_rgba(0,0,0,.34)] ${className}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-100/30 to-transparent opacity-60" />
      {children}
    </article>
  );
}
