import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { deliveriesApi } from "../api/deliveries";
import { getApiError } from "../api/client";
import { Button } from "../components/ui/Button";
import { PageHeader } from "../components/ui/PageHeader";
import { Skeleton } from "../components/ui/Skeleton";
import { ErrorState } from "../components/states/ErrorState";
import { DeliveryDetail } from "../features/deliveries/DeliveryDetail";

export function DeliveryDetailPage() {
  const { id } = useParams();
  const [delivery, setDelivery] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    deliveriesApi
      .show(id)
      .then(setDelivery)
      .catch((err) => setError(getApiError(err)));
  }, [id]);

  return (
    <>
      <PageHeader
        eyebrow="Entrega"
        title={delivery?.title || "Detalle de entrega"}
        description="Estado comercial y operativo de la entrega al cliente."
        action={
          <Link to="/app/deliveries">
            <Button variant="secondary">Volver</Button>
          </Link>
        }
      />
      {error ? <ErrorState message={error} /> : null}
      {!delivery && !error ? <Skeleton className="h-80" /> : null}
      {delivery ? <DeliveryDetail delivery={delivery} /> : null}
    </>
  );
}
