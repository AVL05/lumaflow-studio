/**
 * Siguiente accion util del estudio (Issue #6).
 *
 * Fuente unica para el checklist y el panel: se deriva del estado real de
 * activacion que devuelve el backend. Sin cliente primero el cliente, despues
 * el trabajo, despues la sesion; con el flujo inicial completo, activar
 * reservas; en otro caso no hay CTA (el panel muestra el estado operativo).
 */
export function getNextAction(activation) {
  if (!activation || !Array.isArray(activation.steps)) return null;

  const byKey = Object.fromEntries(activation.steps.map((step) => [step.key, step]));

  for (const key of ["client", "job", "session"]) {
    const step = byKey[key];
    if (step && !step.completed) return { key: step.key, label: step.label, href: step.href };
  }

  const bookings = byKey.bookings;
  if (bookings && !bookings.completed) {
    return { key: bookings.key, label: bookings.label, href: bookings.href };
  }

  return null;
}

export function isActivationComplete(activation) {
  if (!activation || !Array.isArray(activation.steps) || activation.steps.length === 0)
    return false;

  return activation.steps.every((step) => step.completed);
}
