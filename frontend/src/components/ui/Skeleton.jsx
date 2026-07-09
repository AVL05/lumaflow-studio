export function Skeleton({ className = "" }) {
  return (
    <div
      className={`animate-pulse rounded-xl border border-white/10 bg-[linear-gradient(110deg,rgba(255,255,255,.04),rgba(255,255,255,.08),rgba(255,255,255,.04))] ${className}`}
    />
  );
}
