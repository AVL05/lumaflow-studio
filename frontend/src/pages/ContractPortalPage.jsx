import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getApiError } from "../api/client";
import { publicApi } from "../api/public";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { ErrorState } from "../components/states/ErrorState";
import { BrandLogo } from "../components/branding/BrandLogo";

const decidedCopy = {
  accepted: "Has aceptado este contrato. Gracias.",
  rejected: "Has rechazado este contrato. El estudio revisará tu comentario.",
  expired: "Este contrato ha caducado.",
};

export function ContractPortalPage() {
  const { token } = useParams();
  const [view, setView] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  function load() {
    publicApi
      .contract(token)
      .then(setView)
      .catch(() => setNotFound(true));
  }

  useEffect(load, [token]);

  const contract = view?.data ?? null;
  const canRespond = contract?.status === "sent";

  async function accept() {
    setSaving(true);
    setError("");
    try {
      setView(await publicApi.acceptContract(token));
    } catch (err) {
      setError(getApiError(err, "No se pudo registrar la aceptación."));
    } finally {
      setSaving(false);
    }
  }

  async function reject(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      setView(await publicApi.rejectContract(token, message || undefined));
      setShowRejectForm(false);
      setMessage("");
    } catch (err) {
      setError(getApiError(err, "No se pudo registrar el rechazo."));
    } finally {
      setSaving(false);
    }
  }

  if (notFound) {
    return (
      <PublicShell studioName="">
        <ErrorState message="Este enlace de contrato no existe o ya no está disponible." />
      </PublicShell>
    );
  }

  if (!contract) {
    return (
      <PublicShell studioName="">
        <Card className="p-8 text-center text-sm text-stone-400">Cargando tu contrato…</Card>
      </PublicShell>
    );
  }

  return (
    <PublicShell studioName={contract.studio_name}>
      <Card className="p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">
          Contrato {contract.contract_number}
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-stone-50">{contract.title}</h1>
        <p className="mt-2 text-sm text-stone-400">
          {contract.client_name ? `Para ${contract.client_name} · ` : ""}
          {contract.service || "Servicio fotográfico"}
        </p>
        {error ? (
          <div className="mt-4">
            <ErrorState message={error} />
          </div>
        ) : null}
        <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap text-sm leading-7 text-stone-200">
            {contract.content}
          </pre>
        </div>
        <p className="mt-4 text-xs leading-5 text-stone-500">
          Esta acción registra tu aceptación del contenido mostrado. No constituye una firma
          electrónica certificada.
        </p>
        {contract.expires_at ? (
          <p className="mt-2 text-xs text-stone-500">
            Enlace disponible hasta el {contract.expires_at.slice(0, 10)}
          </p>
        ) : null}
        {canRespond ? (
          <div className="mt-6 flex flex-wrap gap-3">
            <Button disabled={saving} onClick={accept}>
              {saving ? "Registrando…" : "Aceptar contrato"}
            </Button>
            <Button
              variant="secondary"
              disabled={saving}
              onClick={() => setShowRejectForm((current) => !current)}
            >
              Rechazar
            </Button>
          </div>
        ) : (
          <p
            role="status"
            className="mt-6 rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm text-stone-200"
          >
            {decidedCopy[contract.status] ?? "Este contrato ya fue procesado."}
            {contract.decided_at ? ` (${contract.decided_at.slice(0, 10)})` : null}
          </p>
        )}
        {canRespond && showRejectForm ? (
          <form onSubmit={reject} className="mt-4 space-y-3">
            <label className="block text-sm text-stone-300">
              Comentario opcional para el estudio
              <textarea
                className="mt-1 min-h-24 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-stone-100"
                rows={4}
                maxLength={2000}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Cuéntanos qué quieres ajustar…"
              />
            </label>
            <Button disabled={saving}>{saving ? "Enviando…" : "Confirmar rechazo"}</Button>
          </form>
        ) : null}
      </Card>
    </PublicShell>
  );
}

function PublicShell({ studioName, children }) {
  return (
    <div className="min-h-dvh bg-[#090908] px-4 py-10">
      <div className="mx-auto w-full max-w-2xl">
        <p className="mb-6 flex items-center gap-3 text-sm font-semibold text-stone-200">
          <BrandLogo className="h-8 w-8 rounded-lg" />
          {studioName ? `${studioName} · LumaFlow` : "LumaFlow"}
        </p>
        {children}
      </div>
    </div>
  );
}
