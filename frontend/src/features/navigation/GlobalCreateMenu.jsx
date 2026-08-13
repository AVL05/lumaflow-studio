import { useNavigate } from "react-router-dom";

const actions = [
  ["Trabajo", "/app/jobs?create=1", "Proyecto comercial"],
  ["Cliente", "/app/clients?create=1", "Contacto o lead"],
  ["Sesión", "/app/sessions?create=1", "Producción fotográfica"],
  ["Presupuesto", "/app/quotes?create=1", "Propuesta económica"],
  ["Factura", "/app/invoices?create=1", "Cobro desde presupuesto"],
  ["Tarea", "/app/tasks?create=1", "Acción pendiente"],
  ["Entrega", "/app/deliveries?create=1&kind=delivery", "Galería para cliente"],
];

export function GlobalCreateMenu({ open, onClose }) {
  const navigate = useNavigate();
  if (!open) return null;

  function choose(url) {
    onClose();
    navigate(url);
  }

  return (
    <div className="fixed inset-0 z-[75] bg-black/55 px-4 pt-20 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Crear en LumaFlow"
        className="ml-auto w-full max-w-md rounded-2xl border border-white/10 bg-[#12110f] p-3 shadow-2xl shadow-black/60"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between px-2 py-2">
          <div>
            <h2 className="font-semibold text-stone-50">Crear</h2>
            <p className="mt-1 text-xs text-stone-400">Empieza desde cualquier pantalla.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm text-stone-400 hover:bg-white/[0.06] hover:text-stone-100"
          >
            Cerrar
          </button>
        </div>
        <div className="mt-2 grid gap-1 sm:grid-cols-2">
          {actions.map(([label, url, detail]) => (
            <button
              key={`${label}-${url}`}
              type="button"
              onClick={() => choose(url)}
              className="rounded-xl px-3 py-3 text-left transition hover:bg-white/[0.065] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/60"
            >
              <span className="block text-sm font-semibold text-stone-100">{label}</span>
              <span className="mt-1 block text-xs text-stone-500">{detail}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
