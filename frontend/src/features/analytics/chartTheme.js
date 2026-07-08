/** Paleta y estilos compartidos por todas las graficas Recharts. */
export const chartPalette = [
  "#d6a15f",
  "#7c8ea6",
  "#8fbf9f",
  "#c98f8f",
  "#a99ac4",
  "#d4c48a",
  "#6f9ab0",
  "#b98b6a",
];

export const axisProps = {
  stroke: "#57534e",
  tick: { fill: "#78716c", fontSize: 11 },
  tickLine: false,
  axisLine: false,
};

export const gridProps = {
  stroke: "#ffffff14",
  strokeDasharray: "3 3",
  vertical: false,
};

export const tooltipProps = {
  cursor: { fill: "#ffffff08" },
  contentStyle: {
    background: "#12110f",
    border: "1px solid #ffffff1a",
    borderRadius: "0.5rem",
    color: "#e7e5e4",
    fontSize: 12,
  },
  labelStyle: { color: "#a8a29e" },
};

export function colorAt(index) {
  return chartPalette[index % chartPalette.length];
}

/** Traduce los buckets "YYYY-MM" a etiquetas legibles del eje X. */
export function monthTick(bucket) {
  const [year, month] = bucket.split("-");

  return `${month}/${year.slice(2)}`;
}
