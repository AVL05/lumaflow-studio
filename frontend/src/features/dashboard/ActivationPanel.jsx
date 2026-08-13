import { useState } from "react";
import { Link } from "react-router-dom";
import { dashboardApi } from "../../api/dashboard";
import { getApiError } from "../../api/client";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

export function ActivationPanel({ activation, onRefresh }) {
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function enableBookings() {
    setBusy("bookings");
    setError("");
    try {
      await dashboardApi.enableBookings();
      await onRefresh();
    } catch (err) {
      setError(getApiError(err, "No pudimos activar las reservas."));
    } finally {
      setBusy("");
    }
  }

  async function activateSample() {
    setBusy("sample");
    setError("");
    try {
      await dashboardApi.activateSampleWorkspace();
      await onRefresh();
    } catch (err) {
      setError(getApiError(err, "No pudimos cargar los datos de ejemplo."));
    } finally {
      setBusy("");
    }
  }

  async function copyBookingUrl() {
    if (!activation.booking_url) return;
    await navigator.clipboard.writeText(activation.booking_url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  if (activation.operational) {
    return (
      <Card className="border-emerald-300/20 bg-[linear-gradient(135deg,rgba(16,52,39,.62),rgba(13,17,14,.96))] p-6 md:p-7">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
              Estudio operativo
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-50">
              Ya has alcanzado tu primer valor real en LumaFlow.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-300/80">
              {activation.operational_milestone === "completed_work"
                ? "Tienes un trabajo entregado. Tu flujo ya cubre desde la producción hasta el cliente."
                : "Tu enlace público de reservas está activo y ya puede convertir solicitudes en sesiones."}
            </p>
          </div>
          {activation.booking_url ? (
            <div className="flex flex-wrap gap-3">
              <a
                href={activation.booking_url}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-white/10 bg-white/[0.07] px-4 py-2 text-sm font-semibold text-stone-100 hover:bg-white/[0.11]"
              >
                Abrir enlace
              </a>
              <Button type="button" onClick={copyBookingUrl}>
                {copied ? "Copiado" : "Copiar enlace"}
              </Button>
            </div>
          ) : null}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 md:p-7">
      <div className="flex flex-col gap-7 xl:flex-row xl:justify-between">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">
            Primeros pasos · {activation.completed}/{activation.total}
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-50">
            Construye la base operativa de tu estudio
          </h2>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/[0.07]">
            <div
              className="h-full rounded-full bg-amber-200 transition-[width] duration-500"
              style={{ width: `${(activation.completed / activation.total) * 100}%` }}
            />
          </div>
          {!activation.sample_workspace_activated && activation.completed <= 1 ? (
            <button
              type="button"
              className="mt-4 text-sm font-medium text-stone-400 underline decoration-white/20 underline-offset-4 hover:text-amber-100"
              disabled={Boolean(busy)}
              onClick={activateSample}
            >
              {busy === "sample"
                ? "Preparando ejemplo..."
                : "Prefiero explorar con datos de ejemplo"}
            </button>
          ) : null}
          {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
        </div>

        <ol className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2 xl:max-w-2xl">
          {activation.steps.map((step) => (
            <li key={step.key}>
              {step.key === "bookings" && !step.completed ? (
                <button
                  type="button"
                  disabled={Boolean(busy)}
                  onClick={enableBookings}
                  className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-3 text-left hover:border-amber-200/25 hover:bg-white/[0.06] disabled:opacity-50"
                >
                  <StepMark completed={false} />
                  <span className="text-sm text-stone-200">
                    {busy === "bookings" ? "Activando reservas..." : step.label}
                  </span>
                </button>
              ) : (
                <Link
                  to={step.completed ? "/app/dashboard" : step.href}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-3 hover:border-amber-200/25 hover:bg-white/[0.06]"
                >
                  <StepMark completed={step.completed} />
                  <span
                    className={
                      step.completed
                        ? "text-sm text-stone-500 line-through"
                        : "text-sm text-stone-200"
                    }
                  >
                    {step.label}
                  </span>
                </Link>
              )}
            </li>
          ))}
        </ol>
      </div>
    </Card>
  );
}

function StepMark({ completed }) {
  return (
    <span
      aria-hidden="true"
      className={`grid size-6 shrink-0 place-items-center rounded-full border text-xs ${completed ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-200" : "border-white/15 text-stone-600"}`}
    >
      {completed ? "✓" : "·"}
    </span>
  );
}
