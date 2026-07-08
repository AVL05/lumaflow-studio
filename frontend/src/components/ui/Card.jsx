export function Card({ children, className = "" }) {
  return (
    <article
      className={`rounded-lg border border-white/10 bg-[#141311]/85 shadow-xl shadow-black/15 transition hover:border-white/15 hover:bg-[#181714] ${className}`}
    >
      {children}
    </article>
  );
}
