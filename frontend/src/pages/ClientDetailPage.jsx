import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { clientsApi } from "../api/clients";
import { getApiError } from "../api/client";
import { Button } from "../components/ui/Button";
import { PageHeader } from "../components/ui/PageHeader";
import { Skeleton } from "../components/ui/Skeleton";
import { ErrorState } from "../components/states/ErrorState";
import { ClientDetail } from "../features/clients/ClientDetail";

export function ClientDetailPage() {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    clientsApi
      .show(id)
      .then(setClient)
      .catch((err) => setError(getApiError(err)));
  }, [id]);

  return (
    <>
      <PageHeader
        eyebrow="Cliente"
        title={client?.name || "Detalle de cliente"}
        description="Ficha operativa de contacto y relacion con entregas."
        action={
          <Link to="/app/clients">
            <Button variant="secondary">Volver</Button>
          </Link>
        }
      />
      {error ? <ErrorState message={error} /> : null}
      {!client && !error ? <Skeleton className="h-80" /> : null}
      {client ? <ClientDetail client={client} /> : null}
    </>
  );
}
