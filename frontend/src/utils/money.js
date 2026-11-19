const euros = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

/**
 * Importe en euros con formato español ("1.754,50 €").
 * Sin `fallback`, un valor vacío se muestra como 0 €; con él, se muestra el texto.
 */
export function formatMoney(value, fallback) {
  if ((value === null || value === undefined || value === "") && fallback !== undefined) {
    return fallback;
  }

  return euros.format(Number(value || 0));
}
