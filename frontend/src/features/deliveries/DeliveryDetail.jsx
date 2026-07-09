import { Card } from "../../components/ui/Card";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { deliveryStatuses } from "../../utils/catalogs";

export function DeliveryDetail({ delivery }) {
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
        <p className="md:col-span-2">
          <span className="text-stone-100">Galeria:</span> {delivery.gallery_url || "Sin URL"}
        </p>
      </div>
      <p className="mt-6 text-sm leading-6 text-stone-400">
        {delivery.private_notes || "Sin notas privadas."}
      </p>
    </Card>
  );
}
