import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { deliveryStatuses } from "../../utils/catalogs";

export function DeliveryCard({ delivery, onEdit, onDelete }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold">{delivery.title}</h2>
          <p className="mt-1 text-sm text-stone-500">
            {delivery.client?.name || "Sin cliente"} · {delivery.session?.name || "Sin sesion"}
          </p>
        </div>
        <StatusBadge options={deliveryStatuses} value={delivery.status} />
      </div>
      <div className="mt-5 space-y-2 text-sm text-stone-400">
        <p>Fecha: {delivery.delivery_date || "Sin fecha"}</p>
        <p>Presupuesto: {delivery.budget ? `${delivery.budget} EUR` : "Sin presupuesto"}</p>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link to={`/app/deliveries/${delivery.id}`}>
          <Button variant="secondary">Detalle</Button>
        </Link>
        <Button variant="secondary" onClick={() => onEdit(delivery)}>
          Editar
        </Button>
        <Button variant="danger" onClick={() => onDelete(delivery)}>
          Eliminar
        </Button>
      </div>
    </Card>
  );
}
