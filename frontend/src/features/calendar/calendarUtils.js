export const weekdayLabels = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];

const monthNames = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

/** Fecha local en formato ISO corto, sin desplazamiento por zona horaria. */
export function toIsoDate(date) {
  const offset = date.getTimezoneOffset() * 60000;

  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export function parseIsoDate(iso) {
  const [year, month, day] = iso.split("-").map(Number);

  return new Date(year, month - 1, day);
}

export function todayIso() {
  return toIsoDate(new Date());
}

export function addDays(iso, days) {
  const date = parseIsoDate(iso);
  date.setDate(date.getDate() + days);

  return toIsoDate(date);
}

export function addMonths(iso, months) {
  const date = parseIsoDate(iso);
  date.setDate(1);
  date.setMonth(date.getMonth() + months);

  return toIsoDate(date);
}

/** Indice 0-6 con lunes como primer dia de la semana. */
function mondayIndex(date) {
  return (date.getDay() + 6) % 7;
}

export function startOfWeek(iso) {
  const date = parseIsoDate(iso);
  date.setDate(date.getDate() - mondayIndex(date));

  return toIsoDate(date);
}

export function monthLabel(iso) {
  const date = parseIsoDate(iso);

  return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

export function dayLabel(iso) {
  const date = parseIsoDate(iso);

  return `${weekdayLabels[mondayIndex(date)]} ${date.getDate()} ${monthNames[date.getMonth()]}`;
}

export function dayNumber(iso) {
  return parseIsoDate(iso).getDate();
}

export function isSameMonth(iso, referenceIso) {
  return iso.slice(0, 7) === referenceIso.slice(0, 7);
}

/** Rejilla de 6 semanas (42 dias) que contiene el mes de `iso`. */
export function monthGrid(iso) {
  const first = parseIsoDate(iso);
  first.setDate(1);
  const gridStart = startOfWeek(toIsoDate(first));

  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
}

export function weekGrid(iso) {
  const start = startOfWeek(iso);

  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

/** Rango consultado al backend segun la vista activa. */
export function rangeForView(view, cursor) {
  if (view === "day") return { from: cursor, to: cursor };

  if (view === "week") {
    const days = weekGrid(cursor);

    return { from: days[0], to: days[6] };
  }

  if (view === "agenda" || view === "list") {
    return { from: cursor, to: addDays(cursor, 60) };
  }

  const days = monthGrid(cursor);

  return { from: days[0], to: days[41] };
}

export function groupByDate(events) {
  return events.reduce((groups, event) => {
    (groups[event.date] ??= []).push(event);

    return groups;
  }, {});
}

export const sourceStyles = {
  session: "border-amber-200/25 bg-amber-200/10 text-amber-100",
  delivery: "border-emerald-300/25 bg-emerald-300/10 text-emerald-100",
  task: "border-sky-300/25 bg-sky-300/10 text-sky-100",
};

export const sourceDots = {
  session: "bg-amber-200",
  delivery: "bg-emerald-300",
  task: "bg-sky-300",
};
