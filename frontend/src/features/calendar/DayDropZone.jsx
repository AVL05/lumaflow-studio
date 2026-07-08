import { useState } from "react";

/**
 * Zona de soltado para el drag & drop nativo del calendario.
 * Encapsula el manejo de dataTransfer para que las vistas no lo repitan.
 */
export function DayDropZone({ date, onMove, className = "", children }) {
  const [over, setOver] = useState(false);

  function handleDragOver(event) {
    if (!event.dataTransfer.types.includes("application/lumaflow-event")) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setOver(true);
  }

  function handleDrop(event) {
    event.preventDefault();
    setOver(false);

    const raw = event.dataTransfer.getData("application/lumaflow-event");
    if (!raw) return;

    const payload = JSON.parse(raw);
    onMove?.({ ...payload, date });
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={() => setOver(false)}
      onDrop={handleDrop}
      className={`${className} ${over ? "bg-amber-200/[0.08] ring-1 ring-inset ring-amber-200/40" : ""}`}
    >
      {children}
    </div>
  );
}
