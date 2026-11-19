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
  { value: "automotive", label: "Automoción" },
  { value: "nature", label: "Naturaleza" },
  { value: "other", label: "Otro" },
];

export const gearCategories = [
  { value: "camera", label: "Cámara", icon: "CAM" },
  { value: "lens", label: "Objetivo", icon: "LEN" },
  { value: "filter", label: "Filtro", icon: "FLT" },
  { value: "flash", label: "Flash", icon: "FLS" },
  { value: "light", label: "Luz", icon: "LGT" },
  { value: "tripod", label: "Trípode", icon: "TRI" },
  { value: "gimbal", label: "Gimbal", icon: "GIM" },
  { value: "drone", label: "Dron", icon: "DRN" },
  { value: "gopro", label: "GoPro", icon: "GOP" },
  { value: "mobile", label: "Móvil", icon: "MOB" },
  { value: "accessory", label: "Accesorio", icon: "ACC" },
  { value: "battery", label: "Batería", icon: "BAT" },
  { value: "sd_card", label: "Tarjeta SD", icon: "SD" },
];

export const gearConditions = [
  { value: "active", label: "Activo" },
  { value: "maintenance", label: "Mantenimiento" },
  { value: "retired", label: "Retirado" },
];

export const locationTypes = [
  { value: "urban", label: "Urbana" },
  { value: "nature", label: "Naturaleza" },
  { value: "studio", label: "Estudio" },
  { value: "beach", label: "Playa" },
  { value: "mountain", label: "Montaña" },
  { value: "forest", label: "Bosque" },
  { value: "interior", label: "Interior" },
  { value: "industrial", label: "Industrial" },
  { value: "street", label: "Calle" },
  { value: "architecture", label: "Arquitectura" },
  { value: "automotive", label: "Automoción" },
  { value: "other", label: "Otra" },
];

export const accessDifficulties = [
  { value: "easy", label: "Fácil" },
  { value: "medium", label: "Media" },
  { value: "hard", label: "Difícil" },
];

export const accessModes = [
  { value: "car", label: "Coche" },
  { value: "walking", label: "Andando" },
  { value: "public_transport", label: "Transporte público" },
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

export const paymentStatuses = [
  { value: "pending", label: "Pendiente", tone: "red" },
  { value: "partial", label: "Parcial", tone: "warm" },
  { value: "paid", label: "Pagado", tone: "green" },
];

export const galleryProviders = [
  "Vimeo",
  "YouTube (no listado)",
  { value: "Pixieset", label: "Pixieset" },
  { value: "Pic-Time", label: "Pic-Time" },
  { value: "Lightroom", label: "Lightroom Gallery" },
  { value: "Google Drive", label: "Google Drive" },
  { value: "Dropbox", label: "Dropbox" },
  { value: "OneDrive", label: "OneDrive" },
  { value: "WeTransfer", label: "WeTransfer" },
  { value: "Otro", label: "Otro / enlace propio" },
];

export const quoteStatuses = [
  { value: "draft", label: "Borrador", tone: "neutral" },
  { value: "sent", label: "Enviado", tone: "warm" },
  { value: "accepted", label: "Aceptado", tone: "green" },
  { value: "rejected", label: "Rechazado", tone: "red" },
  { value: "expired", label: "Caducado", tone: "red" },
];

export const contractStatuses = [
  { value: "draft", label: "Borrador", tone: "neutral" },
  { value: "sent", label: "Enviado", tone: "warm" },
  { value: "accepted", label: "Aceptado", tone: "green" },
  { value: "rejected", label: "Rechazado", tone: "red" },
  { value: "expired", label: "Caducado", tone: "red" },
];

export const invoiceStatuses = [
  { value: "draft", label: "Borrador", tone: "neutral" },
  { value: "sent", label: "Enviada", tone: "warm" },
  { value: "paid", label: "Pagada", tone: "green" },
  { value: "overdue", label: "Vencida", tone: "red" },
  { value: "cancelled", label: "Cancelada", tone: "neutral" },
];

export const bookingRequestStatuses = [
  { value: "new", label: "Nueva", tone: "warm" },
  { value: "contacted", label: "Contactada", tone: "neutral" },
  { value: "converted", label: "Convertida", tone: "green" },
  { value: "archived", label: "Archivada", tone: "neutral" },
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
  { value: "preparation", label: "Preparación" },
  { value: "editing", label: "Edición" },
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
  { value: "delivery_revision", label: "Revisión de entrega" },
  { value: "delivery_portal", label: "Portal de entrega" },
  { value: "template_applied", label: "Plantilla aplicada" },
  { value: "stage_updated", label: "Etapa actualizada" },
  { value: "shot_updated", label: "Toma actualizada" },
  { value: "production_updated", label: "Producción actualizada" },
  { value: "briefing_updated", label: "Briefing actualizado" },
];

/** Nombre visible del recurso de una actividad (`subject_type` es el modelo Laravel). */
export const activitySubjects = [
  { value: "Job", label: "Proyecto" },
  { value: "Session", label: "Sesión" },
  { value: "Delivery", label: "Entrega" },
  { value: "Client", label: "Cliente" },
  { value: "Task", label: "Tarea" },
  { value: "Location", label: "Localización" },
  { value: "GearItem", label: "Equipo" },
  { value: "Quote", label: "Presupuesto" },
  { value: "Invoice", label: "Factura" },
  { value: "Contract", label: "Contrato" },
  { value: "Checklist", label: "Checklist" },
  { value: "BookingRequest", label: "Reserva" },
  { value: "Preset", label: "Preset" },
  { value: "Shot", label: "Toma" },
  { value: "PostproductionStage", label: "Etapa" },
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
