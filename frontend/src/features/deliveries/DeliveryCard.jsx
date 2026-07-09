import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { deliveryStatuses, paymentStatuses } from "../../utils/catalogs";

export function DeliveryCard({ delivery, onEdit, onDelete }) {
  const [copied, setCopied] = useState(false);

  async function copyPortalLink() {
    const url = `${window.location.origin}/deliver/${delivery.public_token}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold">{delivery.title}</h2>
          <p className="mt-1 text-sm text-stone-400">
            {delivery.client?.name || "Sin cliente"} · {delivery.session?.name || "Sin sesion"}
          </p>
        </div>
        <StatusBadge options={deliveryStatuses} value={delivery.status} />
      </div>
      <div className="mt-5 space-y-2 text-sm text-stone-400">
        <p>Fecha: {delivery.delivery_date || "Sin fecha"}</p>
        <div className="flex items-center gap-2">
          <span>
            Presupuesto: {delivery.budget ? `${delivery.budget} EUR` : "Sin presupuesto"}
          </span>
          {delivery.budget ? <StatusBadge options={paymentStatuses} value={delivery.payment_status} /> : null}
        </div>
        {delivery.client_message ? (
          <p className="rounded-md border border-amber-200/20 bg-amber-200/[0.06] px-3 py-2 text-amber-100">
            Cliente pide cambios: {delivery.client_message}
          </p>
        ) : null}
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link to={`/app/deliveries/${delivery.id}`}>
          <Button variant="secondary">Detalle</Button>
        </Link>
        <Button variant="secondary" onClick={() => onEdit(delivery)}>
          Editar
        </Button>
        <Button variant="secondary" onClick={copyPortalLink}>
          {copied ? "Enlace copiado" : "Portal del cliente"}
        </Button>
        <Button variant="danger" onClick={() => onDelete(delivery)}>
          Eliminar
        </Button>
      </div>
    </Card>
  );
}
