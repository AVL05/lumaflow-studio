import { memo, useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartPanel } from "./ChartPanel";
import { axisProps, colorAt, gridProps, monthTick, tooltipProps } from "./chartTheme";
import {
  clientStatuses,
  deliveryStatuses,
  labelFor,
  sessionTypes,
  taskStatuses,
} from "../../utils/catalogs";

/** Traduce las etiquetas crudas del backend usando los catalogos existentes. */
function translate(rows, options) {
  return rows.map((row) => ({ ...row, label: labelFor(options, row.label) }));
}

export const SessionsByMonthChart = memo(function SessionsByMonthChart({ data }) {
  return (
    <ChartPanel title="Sesiones por mes" description="Volumen de trabajo en el rango" data={data}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="sessionsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colorAt(0)} stopOpacity={0.35} />
            <stop offset="100%" stopColor={colorAt(0)} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="bucket" tickFormatter={monthTick} {...axisProps} />
        <YAxis allowDecimals={false} {...axisProps} />
        <Tooltip {...tooltipProps} labelFormatter={monthTick} />
        <Area
          type="monotone"
          dataKey="total"
          name="Sesiones"
          stroke={colorAt(0)}
          strokeWidth={2}
          fill="url(#sessionsFill)"
        />
      </AreaChart>
    </ChartPanel>
  );
});

export const SessionTypesChart = memo(function SessionTypesChart({ data }) {
  const rows = useMemo(() => translate(data, sessionTypes), [data]);

  return (
    <ChartPanel title="Tipos de sesion" description="Distribucion por especialidad" data={rows}>
      <PieChart>
        <Pie data={rows} dataKey="total" nameKey="label" innerRadius={55} outerRadius={90} paddingAngle={2}>
          {rows.map((row, index) => (
            <Cell key={row.label} fill={colorAt(index)} stroke="#12110f" />
          ))}
        </Pie>
        <Tooltip {...tooltipProps} cursor={false} />
        <Legend wrapperStyle={{ fontSize: 11, color: "#a8a29e" }} />
      </PieChart>
    </ChartPanel>
  );
});

export const ProjectStatusChart = memo(function ProjectStatusChart({ data }) {
  const rows = useMemo(() => translate(data, deliveryStatuses), [data]);

  return (
    <ChartPanel title="Estado de proyectos" description="Entregas por estado" data={rows}>
      <BarChart data={rows}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis allowDecimals={false} {...axisProps} />
        <Tooltip {...tooltipProps} />
        <Bar dataKey="total" name="Entregas" radius={[4, 4, 0, 0]}>
          {rows.map((row, index) => (
            <Cell key={row.label} fill={colorAt(index)} />
          ))}
        </Bar>
      </BarChart>
    </ChartPanel>
  );
});

export const PresetUsageChart = memo(function PresetUsageChart({ data }) {
  return (
    <ChartPanel title="Uso de presets" description="Presets mas aplicados" data={data} height={300}>
      <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
        <CartesianGrid {...gridProps} horizontal={false} vertical />
        <XAxis type="number" allowDecimals={false} {...axisProps} />
        <YAxis type="category" dataKey="label" width={140} {...axisProps} />
        <Tooltip {...tooltipProps} />
        <Bar dataKey="total" name="Usos" radius={[0, 4, 4, 0]} fill={colorAt(0)} />
      </BarChart>
    </ChartPanel>
  );
});

export const AiUsageChart = memo(function AiUsageChart({ data }) {
  const hasData = data.some((row) => row.analyses + row.conversations + row.plans > 0);

  return (
    <ChartPanel
      title="Uso de IA"
      description="Analisis, conversaciones y planes por mes"
      data={hasData ? data : []}
    >
      <LineChart data={data}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="bucket" tickFormatter={monthTick} {...axisProps} />
        <YAxis allowDecimals={false} {...axisProps} />
        <Tooltip {...tooltipProps} labelFormatter={monthTick} />
        <Legend wrapperStyle={{ fontSize: 11, color: "#a8a29e" }} />
        <Line type="monotone" dataKey="analyses" name="Analisis" stroke={colorAt(0)} strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="conversations" name="Chats" stroke={colorAt(1)} strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="plans" name="Planes" stroke={colorAt(2)} strokeWidth={2} dot={false} />
      </LineChart>
    </ChartPanel>
  );
});

export const PhotosByCategoryChart = memo(function PhotosByCategoryChart({ data }) {
  return (
    <ChartPanel title="Fotografias por categoria" description="Biblioteca clasificada" data={data}>
      <PieChart>
        <Pie data={data} dataKey="total" nameKey="label" outerRadius={90} paddingAngle={2}>
          {data.map((row, index) => (
            <Cell key={row.label} fill={colorAt(index)} stroke="#12110f" />
          ))}
        </Pie>
        <Tooltip {...tooltipProps} cursor={false} />
        <Legend wrapperStyle={{ fontSize: 11, color: "#a8a29e" }} />
      </PieChart>
    </ChartPanel>
  );
});

export const GearUsageChart = memo(function GearUsageChart({ data }) {
  return (
    <ChartPanel
      title="Equipo mas utilizado"
      description="Derivado del EXIF real de las fotografias"
      data={data}
      height={300}
    >
      <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
        <CartesianGrid {...gridProps} horizontal={false} vertical />
        <XAxis type="number" allowDecimals={false} {...axisProps} />
        <YAxis type="category" dataKey="label" width={160} {...axisProps} />
        <Tooltip {...tooltipProps} />
        <Bar dataKey="total" name="Fotos" radius={[0, 4, 4, 0]}>
          {data.map((row) => (
            <Cell key={row.label} fill={row.owned ? colorAt(0) : colorAt(1)} />
          ))}
        </Bar>
      </BarChart>
    </ChartPanel>
  );
});

export const ClientsByStatusChart = memo(function ClientsByStatusChart({ data }) {
  const rows = useMemo(() => translate(data, clientStatuses), [data]);

  return (
    <ChartPanel title="Clientes por estado" description="Cartera actual" data={rows}>
      <BarChart data={rows}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis allowDecimals={false} {...axisProps} />
        <Tooltip {...tooltipProps} />
        <Bar dataKey="total" name="Clientes" radius={[4, 4, 0, 0]}>
          {rows.map((row, index) => (
            <Cell key={row.label} fill={colorAt(index)} />
          ))}
        </Bar>
      </BarChart>
    </ChartPanel>
  );
});

export const TasksByStatusChart = memo(function TasksByStatusChart({ data }) {
  const rows = useMemo(() => translate(data, taskStatuses), [data]);

  return (
    <ChartPanel title="Tareas por estado" description="Carga operativa" data={rows}>
      <BarChart data={rows}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis allowDecimals={false} {...axisProps} />
        <Tooltip {...tooltipProps} />
        <Bar dataKey="total" name="Tareas" radius={[4, 4, 0, 0]}>
          {rows.map((row, index) => (
            <Cell key={row.label} fill={colorAt(index)} />
          ))}
        </Bar>
      </BarChart>
    </ChartPanel>
  );
});
