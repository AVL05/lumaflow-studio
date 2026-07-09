import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { clientStatuses } from "../../utils/catalogs";

export function ClientCard({ client, onEdit, onDelete }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold">{client.name}</h2>
          <p className="mt-1 text-sm text-stone-400">
            {client.company || client.email || "Sin empresa/email"}
          </p>
        </div>
        <StatusBadge options={clientStatuses} value={client.status} />
      </div>
      <div className="mt-5 space-y-2 text-sm text-stone-400">
        <p>{client.email || "Sin email"}</p>
        <p>
          {client.phone || "Sin telefono"} · {client.instagram || "Sin Instagram"}
        </p>
        <p>{client.deliveries_count ?? 0} entregas</p>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link to={`/app/clients/${client.id}`}>
          <Button variant="secondary">Detalle</Button>
        </Link>
        <Button variant="secondary" onClick={() => onEdit(client)}>
          Editar
        </Button>
        <Button variant="danger" onClick={() => onDelete(client)}>
          Eliminar
        </Button>
      </div>
    </Card>
  );
}
