import { useEffect, useState } from "react";
import { contractsApi } from "../../api/contracts";
import { getApiError } from "../../api/client";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { Input } from "../../components/ui/Input";
import { ErrorState } from "../../components/states/ErrorState";

/**
 * Controles del enlace público dentro del detalle interno.
 * El token plano solo existe en memoria tras generar/regenerar.
 */
export function ContractPortalPanel({ contract }) {
  const [link, setLink] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");
  const [token, setToken] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    contractsApi
      .portal(contract.id)
      .then((data) => {
        if (alive) setLink(data);
      })
      .catch((err) => {
        if (alive) setError(getApiError(err, "No se pudo cargar el enlace."));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [contract.id]);

  const portalUrl = token ? `${window.location.origin}/contract/${token}` : "";

  async function generate(regenerate) {
    setSaving(true);
    setError("");
    try {
      const payload = regenerate
        ? await contractsApi.regeneratePortal(contract.id, expiresAt || null)
        : await contractsApi.generatePortal(contract.id, expiresAt || null);
      setToken(payload.meta.token);
      setLink(payload.data);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setSaving(false);
    }
  }

  async function revoke() {
    setSaving(true);
    setError("");
    try {
      await contractsApi.revokePortal(contract.id);
      setToken("");
      setLink(null);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setSaving(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(portalUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("No se pudo copiar. Selecciona el enlace manualmente.");
    }
  }

  if (loading) return <p className="text-sm text-stone-400">Cargando enlace…</p>;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <h3 className="text-sm font-semibold text-stone-100">Enlace público</h3>
      {contract.status === "draft" ? (
        <p className="mt-2 text-sm text-stone-400">
          Envía el contrato para poder generar su enlace de revisión.
        </p>
      ) : null}
      {contract.status !== "draft" && !link ? (
        <div className="mt-3 space-y-3">
          <Field label="Caducidad (opcional, 30 días por defecto)">
            <Input
              type="date"
              value={expiresAt}
              onChange={(event) => setExpiresAt(event.target.value)}
            />
          </Field>
          <Button disabled={saving} onClick={() => generate(false)}>
            {saving ? "Generando…" : "Generar enlace"}
          </Button>
        </div>
      ) : null}
      {link ? (
        <div className="mt-3 space-y-3">
          <p className="text-sm text-stone-300">
            {link.active ? "Enlace activo" : "Enlace no disponible"}
            {link.expires_at ? ` · expira el ${link.expires_at.slice(0, 10)}` : null}
          </p>
          {portalUrl ? (
            <div className="space-y-2">
              <p className="break-all font-mono text-xs text-amber-100">{portalUrl}</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" disabled={saving} onClick={copy}>
                  {copied ? "Copiado" : "Copiar enlace"}
                </Button>
                <Button variant="secondary" disabled={saving} onClick={() => generate(true)}>
                  {saving ? "Regenerando…" : "Regenerar"}
                </Button>
                <Button variant="danger" disabled={saving} onClick={revoke}>
                  Revocar
                </Button>
              </div>
              <p className="text-xs text-stone-500">
                El enlace anterior deja de funcionar al regenerar. El código solo se muestra esta
                vez.
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" disabled={saving} onClick={() => generate(true)}>
                {saving ? "Regenerando…" : "Regenerar enlace"}
              </Button>
              <Button variant="danger" disabled={saving} onClick={revoke}>
                Revocar
              </Button>
            </div>
          )}
        </div>
      ) : null}
      {["accepted", "rejected"].includes(contract.status) ? (
        <div className="mt-3 border-t border-white/10 pt-3 text-sm text-stone-300">
          <p>
            {contract.status === "accepted" ? "Aceptado" : "Rechazado"}
            {contract.client_responded_at
              ? ` el ${contract.client_responded_at.slice(0, 10)}`
              : null}
          </p>
          {contract.client_message ? (
            <p className="mt-2 rounded-lg bg-white/[0.04] p-3 text-stone-200">
              “{contract.client_message}”
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
