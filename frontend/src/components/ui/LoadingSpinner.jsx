export function LoadingSpinner({ label = "Cargando..." }) {
  return (
    <div className="flex items-center gap-3 text-sm text-stone-400">
      <span className="h-4 w-4 animate-spin rounded-full border border-white/20 border-t-amber-200" />
      {label}
    </div>
  );
}
