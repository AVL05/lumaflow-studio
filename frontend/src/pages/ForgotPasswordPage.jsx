import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { authApi } from "../api/auth";
import { getApiError } from "../api/client";
import { Button } from "../components/ui/Button";
import { Field, inputClass } from "../components/ui/Field";
import { ErrorState } from "../components/states/ErrorState";
import { AuthShell } from "../features/auth/AuthShell";
import { useAuth } from "../features/auth/AuthContext";

export function ForgotPasswordPage() {
  const { isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/app/dashboard" replace />;
  }

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await authApi.forgotPassword({ email });
      setMessage(response.message);
    } catch (err) {
      setError(getApiError(err, "No se pudo enviar el enlace de recuperacion."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Recuperacion"
      title="Recupera el acceso"
      description="Te enviaremos un enlace seguro para crear un password nuevo."
      footer={
        <>
          Recuerdas el password?{" "}
          <Link className="font-medium text-stone-200 transition hover:text-amber-100" to="/login">
            Entrar
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={submit}>
        {error ? <ErrorState message={error} /> : null}
        {message ? (
          <div className="rounded-md border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">
            {message}
          </div>
        ) : null}
        <Field label="Email">
          <input
            className={inputClass}
            type="email"
            autoComplete="email"
            placeholder="alex@studio.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <Button className="mt-2 w-full py-3" disabled={loading}>
          {loading ? "Enviando..." : "Enviar enlace"}
        </Button>
      </form>
    </AuthShell>
  );
}
