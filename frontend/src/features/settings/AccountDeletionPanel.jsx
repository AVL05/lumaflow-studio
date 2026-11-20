import { useState } from "react";
import { cancelAccountDeletion, requestAccountDeletion } from "../../api/account";
import { getApiError } from "../../api/client";
import { Button } from "../../components/ui/Button";
import { Field, inputClass } from "../../components/ui/Field";
import { Panel } from "../../components/ui/Panel";
import { useAuth } from "../auth/AuthContext";

function formatDate(value) {
  return new Date(value).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function AccountDeletionPanel() {
  const { user, refreshUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [blockedBy, setBlockedBy] = useState([]);
  const [loading, setLoading] = useState(false);

  const scheduledFor = user?.deletion_scheduled_for;

  async function run(action) {
    setLoading(true);
    setError("");
    setBlockedBy([]);
    try {
      await action();
      await refreshUser();
    } catch (err) {
      setError(getApiError(err, "No se pudo completar la operación."));
      setBlockedBy(err.response?.status === 409 ? (err.response.data?.workspaces ?? []) : []);
    } finally {
      setLoading(false);
    }
  }

  const schedule = (event) => {
    event.preventDefault();
    return run(async () => {
      await requestAccountDeletion(password);
      setPassword("");
      setOpen(false);
    });
  };

  const cancel = () => run(() => cancelAccountDeletion());

  return (
    <Panel className="mt-5 p-6">
      <h2 className="text-lg font-semibold">Eliminar cuenta</h2>

      {scheduledFor ? (
        <div className="mt-3 space-y-3">
          <p role="status" className="text-sm leading-6 text-amber-100">
            Tu cuenta y los datos de tu estudio se eliminarán definitivamente el{" "}
            <strong>{formatDate(scheduledFor)}</strong>. Hasta entonces puedes seguir usándola y
            cancelar el borrado.
          </p>
          <Button variant="secondary" onClick={cancel} disabled={loading}>
            Cancelar la eliminación
          </Button>
        </div>
      ) : (
        <>
          <p className="mt-3 text-sm leading-6 text-stone-400">
            Elimina tu cuenta y todos los datos de tu estudio. Hay un periodo de gracia de 30 días
            en el que puedes cancelarlo. Antes puedes descargar tus datos con «Exportar mis datos».
            La eliminación es definitiva y no se puede deshacer.
          </p>
          {!open ? (
            <Button className="mt-4" variant="secondary" onClick={() => setOpen(true)}>
              Eliminar mi cuenta
            </Button>
          ) : (
            <form className="mt-4 space-y-4" onSubmit={schedule}>
              <Field label="Confirma con tu contraseña">
                <input
                  className={inputClass}
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>
              <div className="flex flex-wrap gap-3">
                <Button disabled={loading || password === ""}>Programar eliminación</Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setOpen(false);
                    setPassword("");
                    setError("");
                  }}
                >
                  No eliminar
                </Button>
              </div>
            </form>
          )}
        </>
      )}

      {error ? (
        <div role="alert" className="mt-3 text-sm text-red-300">
          <p>{error}</p>
          {blockedBy.length > 0 ? (
            <p className="mt-1 text-stone-400">
              Estudios con otros miembros: {blockedBy.join(", ")}
            </p>
          ) : null}
        </div>
      ) : null}
    </Panel>
  );
}
