const dayFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/**
 * Fecha legible para mostrar en listados ("19 nov 2026").
 *
 * Las fechas de la API llegan como `YYYY-MM-DD`; `new Date("2026-11-19")` las
 * interpreta en UTC y en zonas al oeste de Greenwich mostraría el día anterior,
 * así que se construyen en hora local. Valores vacíos devuelven `fallback` y
 * valores no reconocibles se muestran tal cual para no ocultar datos.
 */
export function formatDate(value, fallback = "Sin fecha") {
  if (!value) return fallback;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
  const date = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return dayFormatter.format(date).replace(/\./g, "");
}

const dateTimeFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** Fecha y hora legibles para historiales y actividad ("18 oct 2026, 12:11"). */
export function formatDateTime(value, fallback = "") {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return dateTimeFormatter.format(date).replace(/\./g, "");
}
