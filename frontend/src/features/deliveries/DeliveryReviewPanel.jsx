import { useCallback, useEffect, useRef, useState } from "react";
import { deliveriesApi } from "../../api/deliveries";
import { publicApi } from "../../api/public";
import { getApiError } from "../../api/client";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Field } from "../../components/ui/Field";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";

const reviewLabels = {
  sent: "Enviada",
  received: "Recibida",
  in_review: "En revisión",
  changes_requested: "Cambios solicitados",
  approved: "Aprobada",
};

function externalLink(value) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function DeliveryReviewPanel({ delivery, token, onChanged }) {
  const [history, setHistory] = useState(null);
  const [pages, setPages] = useState({ revision_page: 1, event_page: 1 });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(null);
  const [preview, setPreview] = useState(false);
  const [portalAction, setPortalAction] = useState("");
  const [expires, setExpires] = useState(delivery.gallery_expires_at || "");
  const commentId = useRef(null);
  const publishId = useRef(null);
  const state = delivery.review_state;

  const load = useCallback(async () => {
    try {
      const result = token
        ? await publicApi.deliveryHistory(token, pages)
        : await deliveriesApi.history(delivery.id, pages);
      setHistory(result);
      setError("");
    } catch (err) {
      setError(getApiError(err, "No se pudo cargar el historial."));
    }
  }, [delivery.id, token, pages]);

  useEffect(() => {
    load();
  }, [load, delivery.version, delivery.revision_number, delivery.client_responded_at]);

  async function run(action) {
    setBusy(true);
    setError("");
    try {
      const updated = await action();
      onChanged(updated);
      return true;
    } catch (err) {
      setError(getApiError(err, "No se pudo guardar. Conserva tus notas y recarga la entrega."));
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function respond(action) {
    commentId.current ??= crypto.randomUUID();
    const saved = await run(() => {
      const payload = {
        revision_number: delivery.revision_number,
        ...(["comment", "request-changes"].includes(action)
          ? { request_id: commentId.current, message }
          : {}),
      };
      return token
        ? publicApi.respondDelivery(token, action, payload)
        : deliveriesApi.respond(delivery.id, action, payload);
    });
    if (saved && action === "request-changes") {
      setMessage("");
      commentId.current = null;
    }
    return saved;
  }

  async function reload() {
    setBusy(true);
    try {
      const fresh = token ? await publicApi.delivery(token) : await deliveriesApi.show(delivery.id);
      if (fresh.revision_number !== delivery.revision_number) commentId.current = null;
      onChanged(fresh);
      await load();
    } catch (err) {
      setError(
        getApiError(err, "No se pudo actualizar la entrega. Conserva tus notas y reintenta."),
      );
    } finally {
      setBusy(false);
    }
  }

  async function comment(event) {
    event.preventDefault();
    if (await respond("comment")) {
      setMessage("");
      commentId.current = null;
    }
  }

  async function publish() {
    publishId.current ??= crypto.randomUUID();
    if (
      await run(() =>
        deliveriesApi.publish(delivery.id, {
          ...form,
          delivery_date: form.delivery_date || null,
          version: delivery.version,
          request_id: publishId.current,
        }),
      )
    ) {
      setForm(null);
      setPreview(false);
      publishId.current = null;
    }
  }

  return (
    <Card className="mt-4 space-y-5 p-5 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Revisiones y seguimiento</h2>
          <p className="mt-1 text-sm text-amber-200" role="status">
            Revisión {delivery.revision_number} · {reviewLabels[state] || "Borrador"}
          </p>
        </div>
        <Button variant="secondary" onClick={reload} disabled={busy}>
          Actualizar entrega
        </Button>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-red-200">
          {error}
        </p>
      ) : null}
      <p className="text-xs leading-5 text-stone-400">
        La recepción se confirma expresamente. El portal autoriza a quien tenga su enlace; no
        verifica la identidad de la persona. Los permisos y la disponibilidad del material dependen
        del proveedor externo.
      </p>
      {state && state !== "approved" ? (
        <div className="flex flex-wrap gap-3">
          {state === "sent" ? (
            <Button disabled={busy} onClick={() => respond("receive")}>
              Confirmar recepción
            </Button>
          ) : null}
          {["sent", "received"].includes(state) ? (
            <Button variant="secondary" disabled={busy} onClick={() => respond("review")}>
              Iniciar revisión
            </Button>
          ) : null}
          {!token ? (
            <Button disabled={busy} onClick={() => respond("approve")}>
              Registrar aprobación
            </Button>
          ) : null}
        </div>
      ) : null}
      <form onSubmit={comment} className="space-y-3">
        <Field label="Observaciones sobre esta revisión">
          <Textarea
            required
            maxLength={2000}
            value={message}
            onChange={(event) => {
              setMessage(event.target.value);
              commentId.current = null;
            }}
          />
        </Field>
        <div className="flex flex-wrap gap-3">
          <Button disabled={busy || !message.trim()}>Añadir comentario</Button>
          {!token && state && state !== "approved" ? (
            <Button
              type="button"
              variant="secondary"
              disabled={busy || !message.trim()}
              onClick={() => respond("request-changes")}
            >
              Registrar cambios solicitados
            </Button>
          ) : null}
        </div>
      </form>
      {!token ? (
        <section className="space-y-3 border-t border-white/10 pt-5" aria-label="Publicar revisión">
          {!form ? (
            <Button
              variant="secondary"
              onClick={() => {
                setForm({
                  gallery_url: "",
                  gallery_provider: delivery.gallery_provider || "",
                  gallery_password: "",
                  delivery_date: "",
                  notes: "",
                });
                setPreview(false);
              }}
            >
              Nueva revisión
            </Button>
          ) : (
            <form
              className="grid gap-3 sm:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                setPreview(true);
              }}
            >
              <Field label="Enlace HTTPS de la revisión">
                <Input
                  required
                  type="url"
                  pattern="https://.*"
                  value={form.gallery_url}
                  onChange={(e) => {
                    setForm({ ...form, gallery_url: e.target.value });
                    setPreview(false);
                    publishId.current = null;
                  }}
                />
              </Field>
              <Field label="Proveedor de la revisión">
                <Input
                  maxLength={50}
                  value={form.gallery_provider}
                  onChange={(e) => {
                    setForm({ ...form, gallery_provider: e.target.value });
                    setPreview(false);
                    publishId.current = null;
                  }}
                />
              </Field>
              <Field label="Contraseña externa (opcional)">
                <Input
                  maxLength={255}
                  value={form.gallery_password}
                  onChange={(e) => {
                    setForm({ ...form, gallery_password: e.target.value });
                    setPreview(false);
                    publishId.current = null;
                  }}
                />
              </Field>
              <Field label="Fecha de entrega de la revisión">
                <Input
                  type="date"
                  value={form.delivery_date}
                  onChange={(e) => {
                    setForm({ ...form, delivery_date: e.target.value });
                    setPreview(false);
                    publishId.current = null;
                  }}
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Notas para el destinatario">
                  <Textarea
                    maxLength={3000}
                    value={form.notes}
                    onChange={(e) => {
                      setForm({ ...form, notes: e.target.value });
                      setPreview(false);
                      publishId.current = null;
                    }}
                  />
                </Field>
              </div>
              <div className="flex flex-wrap gap-3 sm:col-span-2">
                <Button disabled={busy}>Previsualizar revisión</Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => {
                    setForm(null);
                    setPreview(false);
                  }}
                >
                  Cancelar revisión
                </Button>
              </div>
              {preview ? (
                <div className="space-y-3 rounded-lg border border-amber-200/20 p-4 sm:col-span-2">
                  <p className="break-all text-sm">
                    Se publicará una nueva revisión: {form.gallery_url}. Se conservará el historial
                    y se solicitará una nueva aprobación.
                  </p>
                  <Button type="button" disabled={busy} onClick={publish}>
                    Confirmar publicación
                  </Button>
                </div>
              ) : null}
            </form>
          )}
          <p className="text-xs text-stone-400">
            No compartas un nuevo enlace si el proveedor todavía no ha concedido acceso al
            destinatario.
          </p>
        </section>
      ) : null}
      <section
        aria-label="Versiones anteriores"
        className="space-y-3 border-t border-white/10 pt-5"
      >
        <h3 className="font-semibold">Versiones</h3>
        {!history ? (
          <p className="text-sm text-stone-400">Cargando historial…</p>
        ) : !history.revisions.data.length ? (
          <p className="text-sm text-stone-400">
            El historial comenzará al registrar una acción o publicar una revisión.
          </p>
        ) : (
          history.revisions.data.map((revision) => (
            <article
              key={revision.number}
              className="space-y-2 rounded-lg border border-white/10 p-4 text-sm"
            >
              <h4 className="font-semibold">
                Revisión {revision.number}
                {revision.legacy ? " · Histórica" : ""}
              </h4>
              {externalLink(revision.gallery_url) ? (
                <a
                  className="break-all text-amber-200 underline"
                  href={revision.gallery_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir revisión {revision.number}
                </a>
              ) : null}
              {revision.notes ? (
                <p className="whitespace-pre-wrap text-stone-300">{revision.notes}</p>
              ) : null}
              {revision.legacy_client_message ? (
                <p className="text-stone-300">
                  Comentario conservado: {revision.legacy_client_message}
                </p>
              ) : null}
              <p className="text-xs text-stone-400">
                {revision.gallery_provider}{" "}
                {revision.delivery_date ? `· Entrega: ${revision.delivery_date}` : ""} ·{" "}
                {revision.author || "Importación histórica"} · Registro:{" "}
                {new Date(revision.recorded_at).toLocaleString("es-ES")}
              </p>
              {revision.gallery_password ? (
                <p>Contraseña externa: {revision.gallery_password}</p>
              ) : null}
            </article>
          ))
        )}
        {history ? (
          <HistoryPager
            page={history.revisions}
            busy={busy}
            onPage={(revision_page) => setPages({ ...pages, revision_page })}
          />
        ) : null}
      </section>
      <section
        aria-label="Historial de acciones"
        className="space-y-3 border-t border-white/10 pt-5"
      >
        <h3 className="font-semibold">Historial</h3>
        {history?.events.data.map((event, index) => (
          <article
            className="border-l border-amber-200/30 pl-4 text-sm"
            key={`${event.at}-${index}`}
          >
            <p className="whitespace-pre-wrap">{event.description}</p>
            <p className="mt-1 text-xs text-stone-400">
              {event.actor} · Revisión {event.revision_number || "histórica"} ·{" "}
              {new Date(event.at).toLocaleString("es-ES")}
            </p>
          </article>
        ))}
        {history ? (
          <HistoryPager
            page={history.events}
            busy={busy}
            onPage={(event_page) => setPages({ ...pages, event_page })}
          />
        ) : null}
      </section>
      {!token ? (
        <section className="space-y-3 border-t border-white/10 pt-5" aria-label="Acceso al portal">
          <h3 className="font-semibold">Acceso al portal</h3>
          <p className="text-sm text-stone-400">
            {delivery.portal_revoked_at
              ? "Portal revocado"
              : "Portal habilitado si la entrega está publicada y no ha caducado"}
            . Revocar o caducar este portal no elimina ni protege los enlaces del proveedor.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              disabled={busy || !!delivery.portal_revoked_at}
              onClick={() => setPortalAction("revoke")}
            >
              Revocar portal
            </Button>
            <Button variant="secondary" disabled={busy} onClick={() => setPortalAction("rotate")}>
              Renovar enlace del portal
            </Button>
          </div>
          <Field label="Caducidad del portal (fin del día UTC)">
            <Input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} />
          </Field>
          <Button variant="secondary" disabled={busy} onClick={() => setPortalAction("expiry")}>
            Guardar caducidad
          </Button>
          {portalAction ? (
            <div className="space-y-3 rounded-lg border border-amber-200/20 p-4">
              <p className="text-sm">
                {portalAction === "revoke"
                  ? "El portal dejará de admitir consultas y respuestas."
                  : portalAction === "rotate"
                    ? "El enlace anterior dejará de funcionar. Comparte el nuevo enlace con el destinatario."
                    : "Solo cambiará la caducidad del portal de LumaFlow."}
              </p>
              <div className="flex gap-3">
                <Button
                  disabled={busy}
                  onClick={async () => {
                    if (
                      await run(() =>
                        deliveriesApi.portal(delivery.id, {
                          version: delivery.version,
                          action: portalAction,
                          expires_on: expires || null,
                        }),
                      )
                    )
                      setPortalAction("");
                  }}
                >
                  Confirmar cambio de acceso
                </Button>
                <Button variant="secondary" disabled={busy} onClick={() => setPortalAction("")}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}
    </Card>
  );
}

function HistoryPager({ page, onPage, busy }) {
  if (page.last_page <= 1) return null;
  return (
    <div className="flex items-center gap-3">
      <Button
        variant="secondary"
        disabled={busy || page.current_page <= 1}
        onClick={() => onPage(page.current_page - 1)}
      >
        Anterior
      </Button>
      <span className="text-xs">
        {page.current_page} / {page.last_page}
      </span>
      <Button
        variant="secondary"
        disabled={busy || page.current_page >= page.last_page}
        onClick={() => onPage(page.current_page + 1)}
      >
        Siguiente
      </Button>
    </div>
  );
}
