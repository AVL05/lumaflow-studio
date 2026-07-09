export const sessionStatuses = [
  { value: "planned", label: "Planificada", tone: "neutral" },
  { value: "confirmed", label: "Confirmada", tone: "warm" },
  { value: "completed", label: "Realizada", tone: "green" },
  { value: "editing", label: "Editando", tone: "warm" },
  { value: "delivered", label: "Entregada", tone: "green" },
  { value: "cancelled", label: "Cancelada", tone: "red" },
];

export const sessionTypes = [
  { value: "portrait", label: "Retrato" },
  { value: "wedding", label: "Boda" },
  { value: "product", label: "Producto" },
  { value: "urban", label: "Urbano" },
  { value: "landscape", label: "Paisaje" },
  { value: "event", label: "Evento" },
  { value: "automotive", label: "Automocion" },
  { value: "nature", label: "Naturaleza" },
  { value: "other", label: "Otro" },
];

export const gearCategories = [
  { value: "camera", label: "Camara", icon: "CAM" },
  { value: "lens", label: "Objetivo", icon: "LEN" },
  { value: "filter", label: "Filtro", icon: "FLT" },
  { value: "flash", label: "Flash", icon: "FLS" },
  { value: "light", label: "Luz", icon: "LGT" },
  { value: "tripod", label: "Tripode", icon: "TRI" },
  { value: "gimbal", label: "Gimbal", icon: "GIM" },
  { value: "drone", label: "Drone", icon: "DRN" },
  { value: "gopro", label: "GoPro", icon: "GOP" },
  { value: "mobile", label: "Movil", icon: "MOB" },
  { value: "accessory", label: "Accesorio", icon: "ACC" },
  { value: "battery", label: "Bateria", icon: "BAT" },
  { value: "sd_card", label: "Tarjeta SD", icon: "SD" },
];

export const gearConditions = [
  { value: "active", label: "Activo" },
  { value: "maintenance", label: "Mantenimiento" },
  { value: "retired", label: "Retirado" },
];

export const locationTypes = [
  { value: "urban", label: "Urban" },
  { value: "nature", label: "Nature" },
  { value: "studio", label: "Studio" },
  { value: "beach", label: "Beach" },
  { value: "mountain", label: "Mountain" },
  { value: "forest", label: "Forest" },
  { value: "interior", label: "Interior" },
  { value: "industrial", label: "Industrial" },
  { value: "street", label: "Street" },
  { value: "architecture", label: "Architecture" },
  { value: "automotive", label: "Automotive" },
  { value: "other", label: "Other" },
];

export const accessDifficulties = [
  { value: "easy", label: "Facil" },
  { value: "medium", label: "Media" },
  { value: "hard", label: "Dificil" },
];

export const accessModes = [
  { value: "car", label: "Coche" },
  { value: "walking", label: "Andando" },
  { value: "public_transport", label: "Transporte publico" },
  { value: "mixed", label: "Mixto" },
];

export const seasons = [
  { value: "spring", label: "Primavera" },
  { value: "summer", label: "Verano" },
  { value: "autumn", label: "Otono" },
  { value: "winter", label: "Invierno" },
];

export const clientStatuses = [
  { value: "active", label: "Activo", tone: "green" },
  { value: "inactive", label: "Inactivo", tone: "neutral" },
  { value: "lead", label: "Lead", tone: "warm" },
  { value: "archived", label: "Archivado", tone: "neutral" },
];

export const deliveryStatuses = [
  { value: "draft", label: "Borrador", tone: "neutral" },
  { value: "pending", label: "Pendiente", tone: "warm" },
  { value: "delivered", label: "Entregado", tone: "green" },
  { value: "approved", label: "Aprobado", tone: "green" },
  { value: "archived", label: "Archivado", tone: "neutral" },
];

export const taskStatuses = [
  { value: "todo", label: "Por hacer", tone: "neutral" },
  { value: "in_progress", label: "En curso", tone: "warm" },
  { value: "waiting", label: "En espera", tone: "warm" },
  { value: "completed", label: "Completada", tone: "green" },
  { value: "cancelled", label: "Cancelada", tone: "red" },
];

export const taskPriorities = [
  { value: "low", label: "Baja", tone: "neutral" },
  { value: "medium", label: "Media", tone: "neutral" },
  { value: "high", label: "Alta", tone: "warm" },
  { value: "urgent", label: "Urgente", tone: "red" },
];

export const checklistTypes = [
  { value: "gear", label: "Equipo" },
  { value: "preparation", label: "Preparacion" },
  { value: "editing", label: "Edicion" },
  { value: "delivery", label: "Entrega" },
  { value: "custom", label: "Personalizada" },
];

export const notificationTypes = [
  { value: "success", label: "Exito", tone: "green" },
  { value: "warning", label: "Aviso", tone: "warm" },
  { value: "error", label: "Error", tone: "red" },
  { value: "info", label: "Info", tone: "neutral" },
  { value: "system", label: "Sistema", tone: "neutral" },
];

export const calendarSources = [
  { value: "session", label: "Sesiones" },
  { value: "delivery", label: "Entregas" },
  { value: "task", label: "Tareas" },
];

export const activityTypes = [
  { value: "created", label: "Creado" },
  { value: "updated", label: "Editado" },
  { value: "deleted", label: "Eliminado" },
  { value: "status_changed", label: "Cambio de estado" },
  { value: "ai_plan", label: "Plan IA" },
  { value: "delivered", label: "Entregado" },
  { value: "checklist_completed", label: "Checklist completada" },
  { value: "comment", label: "Comentario" },
];

export function toneFor(options, value) {
  return options.find((option) => option.value === value)?.tone ?? "neutral";
}

export function labelFor(options, value) {
  return options.find((option) => option.value === value)?.label ?? value;
}

export function toneForStatus(status) {
  return sessionStatuses.find((option) => option.value === status)?.tone ?? "neutral";
}
