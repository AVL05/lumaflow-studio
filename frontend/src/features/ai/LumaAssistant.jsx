import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BrandLogo } from "../../components/branding/BrandLogo";
import { Button } from "../../components/ui/Button";
import { useHotkey } from "../../hooks/useHotkey";

  const contextByPath = [
    ["/app/dashboard", "Dashboard y prioridades del estudio"],
    ["/app/jobs", "Trabajo abierto, pipeline y contexto comercial"],
    ["/app/deliveries", "Entregas y galerías"],
  ["/app/calendar", "Calendario"],
  ["/app/clients", "Clientes"],
  ["/app/quotes", "Presupuestos"],
  ["/app/invoices", "Facturas"],
  ["/app/booking-requests", "Reservas"],
  ["/app/sessions", "Sesiones"],
  ["/app/gear", "Equipo"],
  ["/app/locations", "Localizaciones"],
  ["/app/tasks", "Tareas"],
  ["/app/presets", "Presets"],
  ["/app/analytics", "Analítica"],
  ["/app/settings", "Configuración"],
];

export function LumaAssistant({ open, onOpen, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const context = contextByPath.find(([path]) => location.pathname.startsWith(path))?.[1] ?? "LumaFlow";

  useHotkey("mod+l", () => (open ? onClose() : onOpen()), { allowInInput: true });
  useHotkey("escape", onClose, { allowInInput: true, enabled: open });

  function startConversation(event) {
    event.preventDefault();
    const question = prompt.trim();
    onClose();
    navigate("/app/ai-assistant", {
      state: {
        initialPrompt: question,
        pageContext: context,
        sourcePath: location.pathname,
      },
    });
    setPrompt("");
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[75] bg-black/60 p-4 pt-16 backdrop-blur-sm" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Luma, asistente global"
        className="ml-auto flex max-h-[calc(100dvh-5rem)] w-full max-w-lg flex-col rounded-2xl border border-white/10 bg-[#12110f] shadow-2xl shadow-black/60"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-white/10 p-5">
          <div className="flex items-center gap-3">
            <BrandLogo className="size-10 rounded-xl" />
            <div>
              <h2 className="font-semibold text-stone-50">Luma</h2>
              <p className="mt-1 text-xs text-stone-400">Asistente global de tu estudio</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-sm text-stone-400 hover:bg-white/[0.06] hover:text-stone-100">Cerrar</button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className="rounded-xl border border-amber-200/15 bg-amber-100/[0.045] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-200">Contexto actual</p>
            <p className="mt-2 text-sm text-stone-200">{context}</p>
            <p className="mt-1 text-xs text-stone-500">Luma añadirá esta pantalla a la conversación.</p>
          </div>
          <div className="mt-5 grid gap-2">
            {["¿Qué requiere atención aquí?", "Ayúdame a preparar el siguiente paso", "Resume la situación de este módulo"].map((suggestion) => (
              <button key={suggestion} type="button" onClick={() => setPrompt(suggestion)} className="rounded-xl border border-white/10 px-4 py-3 text-left text-sm text-stone-300 hover:border-amber-200/20 hover:bg-white/[0.05]">{suggestion}</button>
            ))}
          </div>
        </div>

        <form onSubmit={startConversation} className="border-t border-white/10 p-5">
          <label htmlFor="luma-prompt" className="text-sm font-semibold text-stone-200">Pregunta a Luma</label>
          <textarea id="luma-prompt" rows="3" value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Ejemplo: prepara los próximos pasos para este trabajo" className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-stone-100 outline-none placeholder:text-stone-600 focus:border-amber-200/35 focus:ring-2 focus:ring-amber-200/15" />
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-xs text-stone-500">Ctrl/Cmd + L</span>
            <Button disabled={!prompt.trim()}>Abrir conversación</Button>
          </div>
        </form>
      </aside>
    </div>
  );
}
