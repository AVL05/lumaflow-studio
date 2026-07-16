import { useState } from "react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { deliveryStatuses, paymentStatuses } from "../../utils/catalogs";

export function DeliveryDetail({ delivery }) {
  const [copied, setCopied] = useState(false);
  const portalUrl = `${window.location.origin}/deliver/${delivery.public_token}`;

  async function copyPortalLink() {
    await navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{delivery.title}</h1>
          <p className="mt-2 text-sm text-stone-400">
            {delivery.client?.name || "Sin cliente"} · {delivery.session?.name || "Sin sesion"}
          </p>
        </div>
        <StatusBadge options={deliveryStatuses} value={delivery.status} />
      </div>
      <div className="mt-6 grid gap-4 text-sm text-stone-400 md:grid-cols-2">
        <p>
          <span className="text-stone-100">Fecha:</span> {delivery.delivery_date || "Sin fecha"}
        </p>
        <p>
          <span className="text-stone-100">Presupuesto:</span>{" "}
          {delivery.budget ? `${delivery.budget} EUR` : "Sin presupuesto"}
        </p>
        <p>
          <span className="text-stone-100">Pagado:</span> {delivery.amount_paid ?? 0} EUR
        </p>
        <p className="flex items-center gap-2">
          <span className="text-stone-100">Estado de pago:</span>{" "}
          <StatusBadge options={paymentStatuses} value={delivery.payment_status} />
        </p>
        <p className="md:col-span-2">
          <span className="text-stone-100">Galeria:</span> {delivery.gallery_url || "Sin URL"}
        </p>
      </div>
      {delivery.client_message ? (
        <div className="mt-6 rounded-lg border border-amber-200/20 bg-amber-200/[0.06] p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-amber-200">Mensaje del cliente</p>
          <p className="mt-2 text-sm leading-6 text-stone-300">{delivery.client_message}</p>
        </div>
      ) : null}
      <p className="mt-6 text-sm leading-6 text-stone-400">
        {delivery.private_notes || "Sin notas privadas."}
      </p>
      <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-5">
        <p className="min-w-0 flex-1 truncate text-xs text-stone-400">{portalUrl}</p>
        <Button variant="secondary" onClick={copyPortalLink}>
          {copied ? "Copiado" : "Copiar portal del cliente"}
        </Button>
      </div>
    </Card>
  );
}
