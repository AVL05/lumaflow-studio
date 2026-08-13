import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { publicApi } from "../api/public";
import { getApiError } from "../api/client";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Field, inputClass } from "../components/ui/Field";
import { Textarea } from "../components/ui/Textarea";
import { ErrorState } from "../components/states/ErrorState";
import { BrandLogo } from "../components/branding/BrandLogo";
import { deliveryStatuses } from "../utils/catalogs";

const paymentLabels = {
  pending: ["Pago pendiente", "red"],
  partial: ["Pago parcial", "warm"],
  paid: ["Pagado", "green"],
};

export function ClientPortalPage() {
  const { token } = useParams();
  const [delivery, setDelivery] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showChangesForm, setShowChangesForm] = useState(false);

  function load() {
    publicApi
      .delivery(token)
      .then(setDelivery)
      .catch(() => setNotFound(true));
  }

  useEffect(load, [token]);

  async function approve() {
    setSaving(true);
    setError("");

    try {
      setDelivery(await publicApi.approveDelivery(token));
    } catch (err) {
      setError(getApiError(err, "No se pudo registrar la aprobacion."));
    } finally {
      setSaving(false);
    }
  }

  async function submitChanges(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      setDelivery(await publicApi.requestDeliveryChanges(token, message));
      setShowChangesForm(false);
      setMessage("");
    } catch (err) {
      setError(getApiError(err, "No se pudo enviar el mensaje."));
    } finally {
      setSaving(false);
    }
  }

  async function favorite(image) {
    setSaving(true);
    setError("");
    try {
      setDelivery(await publicApi.favoriteImage(token, image.id));
    } catch (err) {
      setError(getApiError(err, "No se pudo guardar la selección."));
    } finally {
      setSaving(false);
    }
  }

  if (notFound) {
    return (
      <PublicShell>
        <ErrorState message="Este enlace de galeria no existe o ha caducado." />
      </PublicShell>
    );
  }

  if (!delivery) {
    return (
      <PublicShell>
        <Card className="p-8 text-center text-sm text-stone-400">Cargando tu galeria...</Card>
      </PublicShell>
    );
  }

  const [paymentLabel, paymentTone] = paymentLabels[delivery.payment_status] ?? [
    "Sin datos",
    "neutral",
  ];
  const canRespond = !["approved", "archived"].includes(delivery.status);

  return (
    <PublicShell studioName={delivery.studio_name}>
      <Card className="p-6 sm:p-8">
        {error ? (
          <div className="mb-5">
            <ErrorState message={error} />
          </div>
        ) : null}

        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">
          {delivery.studio_name}
        </p>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-stone-50">{delivery.title}</h1>
          <span className="rounded-md border px-2.5 py-1 text-xs font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,.05)] border-white/10 bg-white/[0.05] text-stone-300">
            {deliveryStatuses.find((s) => s.value === delivery.status)?.label ?? delivery.status}
          </span>
        </div>
        <p className="mt-2 text-sm text-stone-400">
          {delivery.session_name ? `Sesion: ${delivery.session_name} · ` : ""}
          {delivery.delivery_date
            ? `Fecha de entrega: ${delivery.delivery_date}`
            : "Sin fecha de entrega"}
        </p>

        {delivery.budget ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-stone-400">Presupuesto</p>
              <p className="mt-2 text-lg font-semibold tabular-nums text-stone-50">
                {delivery.budget} EUR
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-stone-400">Pagado</p>
              <p className="mt-2 text-lg font-semibold tabular-nums text-stone-50">
                {delivery.amount_paid} EUR
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-stone-400">Estado de pago</p>
              <div className="mt-2">
                <Badge variant={paymentTone}>{paymentLabel}</Badge>
              </div>
            </div>
          </div>
        ) : null}

        {delivery.gallery_url ? (
          <a
            href={delivery.gallery_url}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex"
          >
            <Button>Ver galeria completa</Button>
          </a>
        ) : null}

        {delivery.images?.length ? (
          <section className="mt-8">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">
                  Tu galería
                </p>
                <h2 className="mt-2 text-xl font-semibold">Selecciona tus favoritas</h2>
              </div>
              <p className="text-xs text-stone-400">
                {delivery.images.filter((image) => image.client_favorite).length} seleccionadas
              </p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {delivery.images.map((image) => (
                <button
                  key={image.id}
                  type="button"
                  disabled={saving}
                  onClick={() => favorite(image)}
                  className={`group relative overflow-hidden rounded-xl border text-left transition ${image.client_favorite ? "border-amber-200 ring-2 ring-amber-200/20" : "border-white/10 hover:border-white/25"}`}
                >
                  <img
                    src={image.url}
                    alt={image.filename}
                    className="aspect-[4/3] w-full object-cover"
                    loading="lazy"
                  />
                  <span
                    className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-semibold shadow-lg ${image.client_favorite ? "bg-amber-200 text-stone-950" : "bg-black/70 text-white"}`}
                  >
                    {image.client_favorite ? "Favorita" : "Seleccionar"}
                  </span>
                </button>
              ))}
            </div>
          </section>
        ) : (
          <p className="mt-6 text-sm text-stone-400">
            El estudio todavía no ha publicado fotografías en esta entrega.
          </p>
        )}

        {delivery.client_message ? (
          <div className="mt-6 rounded-lg border border-amber-200/20 bg-amber-200/[0.06] p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-amber-200">
              Ultimo mensaje enviado al estudio
            </p>
            <p className="mt-2 text-sm leading-6 text-stone-300">{delivery.client_message}</p>
          </div>
        ) : null}

        {canRespond ? (
          <div className="mt-8 flex flex-wrap gap-3 border-t border-white/10 pt-6">
            <Button onClick={approve} disabled={saving}>
              Aprobar entrega
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowChangesForm((current) => !current)}
              disabled={saving}
            >
              Pedir cambios
            </Button>
          </div>
        ) : (
          <p className="mt-8 border-t border-white/10 pt-6 text-sm text-emerald-100">
            Ya has aprobado esta entrega. Gracias.
          </p>
        )}

        {showChangesForm ? (
          <form className="mt-4 space-y-3" onSubmit={submitChanges}>
            <Field label="Que te gustaria cambiar?">
              <Textarea
                required
                rows="4"
                className={inputClass}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </Field>
            <div className="flex justify-end">
              <Button disabled={saving}>{saving ? "Enviando..." : "Enviar mensaje"}</Button>
            </div>
          </form>
        ) : null}
      </Card>
    </PublicShell>
  );
}

function PublicShell({ children, studioName }) {
  return (
    <main className="min-h-dvh bg-[#090908] text-stone-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(196,141,72,0.14),transparent_30rem),linear-gradient(145deg,#090908_0%,#12100d_48%,#080807_100%)]" />
      <div className="relative mx-auto flex min-h-dvh w-full max-w-2xl flex-col justify-center px-4 py-10">
        <Link to="/" className="mx-auto mb-8 flex items-center gap-3">
          <BrandLogo className="h-9 w-9 rounded-md" />
          <span className="text-sm font-semibold tracking-tight text-stone-50">
            {studioName ? `${studioName} · LumaFlow Studio` : "LumaFlow Studio"}
          </span>
        </Link>
        {children}
      </div>
    </main>
  );
}
