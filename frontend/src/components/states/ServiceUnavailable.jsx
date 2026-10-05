import { useState } from "react";
import { ErrorState } from "./ErrorState";

export function ServiceUnavailable({ message, onRetry, onLogout }) {
  const [retrying, setRetrying] = useState(false);

  async function handleRetry() {
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-[#090908] px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">
          LumaFlow Studio
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-stone-50">Sin conexión con el servidor</h1>
        <p className="mt-3 text-sm leading-6 text-stone-400">
          LumaFlow no puede conectar con el servidor en este momento. Tu sesión sigue guardada en
          este dispositivo: no necesitas volver a iniciar sesión.
        </p>
        <div className="mt-5">
          <ErrorState message={message} />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleRetry}
            disabled={retrying}
            className="rounded-lg bg-amber-200 px-4 py-2 text-sm font-semibold text-stone-950 hover:bg-amber-100 disabled:opacity-50"
          >
            {retrying ? "Reintentando…" : "Reintentar"}
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-lg border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-stone-200 hover:bg-white/[0.09]"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
