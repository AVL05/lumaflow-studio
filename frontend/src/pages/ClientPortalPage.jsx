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
import { sessionTypes } from "../utils/catalogs";

const paymentLabels = {
  pending: ["Pago pendiente", "red"],
  partial: ["Pago parcial", "warm"],
  paid: ["Pagado", "green"],
};

const statusHeadings = {
  draft: "Tu entrega se está preparando",
  pending: "Tu entrega está en camino",
  delivered: "Tu sesión está lista",
  approved: "Entrega aprobada · Gracias",
  archived: "Entrega archivada",
};

function formatLongDate(value) {
  if (!value) return "";
  const [year, month, day] = String(value).split("-").map(Number);
  if (!year || !month || !day) return String(value);
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

export function ClientPortalPage() {
  const { token } = useParams();
  const [delivery, setDelivery] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showChangesForm, setShowChangesForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

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

  async function copyPassword() {
    if (!delivery?.gallery_password) return;
    try {
      await navigator.clipboard.writeText(delivery.gallery_password);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("No se pudo copiar la contraseña.");
    }
  }

  if (notFound) {
    return (
      <PublicShell>
        <ErrorState message="Este enlace de entrega no existe o ha caducado." />
      </PublicShell>
    );
  }

  if (!delivery) {
    return (
      <PublicShell>
        <Card className="p-8 text-center text-sm text-stone-400">Cargando tu entrega...</Card>
      </PublicShell>
    );
  }

  const [paymentLabel, paymentTone] = paymentLabels[delivery.payment_status] ?? [
    "Sin datos",
    "neutral",
  ];
  const canRespond = !["approved", "archived"].includes(delivery.status);
  const sessionTypeLabel = sessionTypes.find((type) => type.value === delivery.session_type)?.label;
  const eventDate = formatLongDate(delivery.session_date ?? delivery.delivery_date);
  const sessionLine = [sessionTypeLabel, eventDate].filter(Boolean).join(" · ");

  return (
    <PublicShell studioName={delivery.studio_name}>
      {error ? (
        <div className="mb-5">
          <ErrorState message={error} />
        </div>
      ) : null}

      <Card className="p-6 text-center sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">
          {statusHeadings[delivery.status] ?? "Tu entrega"}
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-stone-50">
          {delivery.client_name || delivery.title}
        </h1>
        {sessionLine ? <p className="mt-2 text-sm text-stone-400">{sessionLine}</p> : null}
        {delivery.title && delivery.client_name ? (
          <p className="mt-1 text-xs text-stone-500">{delivery.title}</p>
        ) : null}

        <div className="mt-8">
          {delivery.gallery_url ? (
            <a href={delivery.gallery_url} target="_blank" rel="noreferrer" className="inline-flex">
              <Button>Ver fotografías</Button>
            </a>
          ) : (
            <p className="text-sm text-stone-400">
              El estudio todavía no ha compartido el enlace de tu galería.
            </p>
          )}
        </div>

        {delivery.gallery_url ? (
          <dl className="mx-auto mt-6 max-w-sm space-y-2 text-sm">
            {delivery.gallery_provider ? (
              <div className="flex items-center justify-between gap-4">
                <dt className="text-stone-500">Proveedor</dt>
                <dd className="font-medium text-stone-200">{delivery.gallery_provider}</dd>
              </div>
            ) : null}
            {delivery.gallery_password ? (
              <div className="flex items-center justify-between gap-4">
                <dt className="text-stone-500">Contraseña</dt>
                <dd className="flex items-center gap-2 font-medium text-stone-200">
                  <span>{showPassword ? delivery.gallery_password : "•••••••"}</span>
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="text-xs font-semibold text-amber-200 hover:text-amber-100"
                  >
                    {showPassword ? "Ocultar" : "Mostrar"}
                  </button>
                  <button
                    type="button"
                    onClick={copyPassword}
                    className="text-xs font-semibold text-amber-200 hover:text-amber-100"
                  >
                    {copied ? "Copiada" : "Copiar"}
                  </button>
                </dd>
              </div>
            ) : null}
            {delivery.gallery_expires_at ? (
              <p className="pt-1 text-xs text-stone-500">
                Enlace disponible hasta el {formatLongDate(delivery.gallery_expires_at)}.
              </p>
            ) : null}
          </dl>
        ) : null}

        <p className="mx-auto mt-6 max-w-sm text-xs leading-5 text-stone-500">
          Tus fotografías viven en tu galería externa y nunca pasan por nuestros servidores.
        </p>
      </Card>

      <Card className="mt-4 p-6 sm:p-8">
        {delivery.budget ? (
          <div className="grid gap-3 sm:grid-cols-3">
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

        {delivery.client_message ? (
          <div className="mt-6 rounded-lg border border-amber-200/20 bg-amber-200/[0.06] p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-amber-200">
              Ultimo mensaje enviado al estudio
            </p>
            <p className="mt-2 text-sm leading-6 text-stone-300">{delivery.client_message}</p>
          </div>
        ) : null}

        {canRespond ? (
          <div className="mt-6 flex flex-wrap gap-3">
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
          <p className="mt-6 text-sm text-emerald-100">Ya has aprobado esta entrega. Gracias.</p>
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

      <footer className="mt-8 text-center">
        {delivery.studio_name ? (
          <p className="text-sm text-stone-400">Entregado por {delivery.studio_name}</p>
        ) : null}
        <p className="mt-1 text-xs text-stone-600">Powered by LumaFlow</p>
      </footer>
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
