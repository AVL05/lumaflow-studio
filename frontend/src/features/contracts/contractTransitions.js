/**
 * Transiciones del lifecycle contractual (reflejo del backend).
 * Fuente unica para habilitar/deshabilitar acciones en la UI.
 */
export const CONTRACT_TRANSITIONS = {
  draft: ["sent"],
  sent: ["accepted", "rejected", "expired"],
  accepted: [],
  rejected: [],
  expired: [],
};

export function allowedTransitions(status) {
  return CONTRACT_TRANSITIONS[status] ?? [];
}

export function canEditContract(status) {
  return status === "draft";
}

export function canDeleteContract(status) {
  return status === "draft";
}
