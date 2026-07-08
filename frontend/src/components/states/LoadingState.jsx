export function LoadingState({ label = "Cargando..." }) {
  return (
    <div className="grid min-h-screen place-items-center bg-[#090908] text-stone-200">
      <div className="rounded-lg border border-white/10 bg-white/[0.04] px-5 py-4 shadow-2xl shadow-black/30">
        <div className="mb-3 h-1 w-32 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-16 animate-pulse rounded-full bg-amber-300/80" />
        </div>
        <p className="text-sm text-stone-300">{label}</p>
      </div>
    </div>
  );
}
