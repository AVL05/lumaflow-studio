import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { bookingRequestsApi } from "../api/bookingRequests";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { PageHeader } from "../components/ui/PageHeader";
import { Pagination } from "../components/ui/Pagination";
import { Select } from "../components/ui/Select";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/states/EmptyState";
import { ErrorState } from "../components/states/ErrorState";
import { useAuth } from "../features/auth/AuthContext";
import { useToast } from "../features/notifications/ToastContext";
import { usePaginatedResource } from "../hooks/usePaginatedResource";
import { bookingRequestStatuses, labelFor, toneFor } from "../utils/catalogs";

export function BookingRequestsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const resource = usePaginatedResource(bookingRequestsApi.list, {
    per_page: 12,
    sort: "created_at",
    direction: "desc",
  });
  const [deleting, setDeleting] = useState(null);
  const [copied, setCopied] = useState(false);

  const bookingUrl = user?.studio_slug
    ? `${window.location.origin}/book/${user.studio_slug}`
    : null;

  async function copyLink() {
    await navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  async function setStatus(booking, status) {
    await bookingRequestsApi.updateStatus(booking.id, status);
    toast.success("Estado actualizado.");
    await resource.refresh();
  }

  async function convert(booking) {
    await bookingRequestsApi.convert(booking.id);
    toast.success("Convertido a cliente.");
    await resource.refresh();
    navigate("/app/clients");
  }

  async function confirmDelete() {
    await bookingRequestsApi.remove(deleting.id);
    toast.success("Solicitud eliminada.");
    setDeleting(null);
    await resource.refresh();
  }

  return (
    <>
      <PageHeader
        eyebrow="Business"
        title="Solicitudes de reserva"
        description="Leads recibidos desde tu pagina publica de reserva."
      />

      {bookingUrl ? (
        <Card className="mb-6 flex flex-wrap items-center justify-between gap-3 p-5">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
              Tu enlace publico de reserva
            </p>
            <p className="mt-1 truncate text-sm text-amber-100">{bookingUrl}</p>
          </div>
          <Button variant="secondary" onClick={copyLink}>
            {copied ? "Copiado" : "Copiar enlace"}
          </Button>
        </Card>
      ) : null}

      <div className="mb-6 grid gap-3 sm:grid-cols-[200px]">
        <Select
          value={resource.filters.status ?? ""}
          onChange={(e) => resource.updateFilter("status", e.target.value)}
          options={[{ value: "", label: "Todos los estados" }, ...bookingRequestStatuses]}
        />
      </div>

      {resource.error ? <ErrorState message={resource.error} /> : null}
      {resource.loading ? (
        <BookingSkeleton />
      ) : resource.items.length === 0 ? (
        <EmptyState
          title="Sin solicitudes"
          description="Comparte tu enlace de reserva para empezar a recibir peticiones de clientes."
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {resource.items.map((booking) => (
              <Card key={booking.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold text-stone-50">{booking.name}</h2>
                    <p className="mt-1 truncate text-sm text-stone-400">{booking.email}</p>
                  </div>
                  <Badge variant={toneFor(bookingRequestStatuses, booking.status)}>
                    {labelFor(bookingRequestStatuses, booking.status)}
                  </Badge>
                </div>
                <div className="mt-4 space-y-1 text-sm text-stone-400">
                  {booking.session_type ? <p>Tipo: {booking.session_type}</p> : null}
                  {booking.preferred_date ? <p>Fecha preferida: {booking.preferred_date}</p> : null}
                  {booking.phone ? <p>Telefono: {booking.phone}</p> : null}
                </div>
                {booking.message ? (
                  <p className="mt-3 line-clamp-3 text-sm text-stone-300">{booking.message}</p>
                ) : null}
                <div className="mt-5 flex flex-wrap gap-2">
                  {booking.status === "new" ? (
                    <Button variant="secondary" onClick={() => setStatus(booking, "contacted")}>
                      Marcar contactada
                    </Button>
                  ) : null}
                  {booking.status !== "converted" ? (
                    <Button variant="secondary" onClick={() => convert(booking)}>
                      Convertir a cliente
                    </Button>
                  ) : null}
                  {booking.status !== "archived" ? (
                    <Button variant="secondary" onClick={() => setStatus(booking, "archived")}>
                      Archivar
                    </Button>
                  ) : null}
                  <Button variant="danger" onClick={() => setDeleting(booking)}>
                    Eliminar
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          <Pagination meta={resource.meta} onPage={resource.setPage} />
        </>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Eliminar solicitud"
        description="Esta accion elimina la solicitud de reserva permanentemente."
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}

function BookingSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton key={index} className="h-56" />
      ))}
    </div>
  );
}
