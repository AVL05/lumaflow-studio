import { Card } from "../../components/ui/Card";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { clientStatuses } from "../../utils/catalogs";

export function ClientDetail({ client }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{client.name}</h1>
          <p className="mt-2 text-sm text-stone-500">{client.company || "Sin empresa"}</p>
        </div>
        <StatusBadge options={clientStatuses} value={client.status} />
      </div>
      <div className="mt-6 grid gap-4 text-sm text-stone-400 md:grid-cols-2">
        <p>
          <span className="text-stone-100">Email:</span> {client.email || "Sin email"}
        </p>
        <p>
          <span className="text-stone-100">Telefono:</span> {client.phone || "Sin telefono"}
        </p>
        <p>
          <span className="text-stone-100">Instagram:</span> {client.instagram || "Sin Instagram"}
        </p>
        <p>
          <span className="text-stone-100">Entregas:</span> {client.deliveries_count ?? 0}
        </p>
      </div>
      <p className="mt-6 text-sm leading-6 text-stone-400">{client.notes || "Sin notas."}</p>
    </Card>
  );
}
