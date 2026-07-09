import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { authApi } from "../api/auth";
import { getApiError } from "../api/client";
import { Button } from "../components/ui/Button";
import { Field, inputClass } from "../components/ui/Field";
import { ErrorState } from "../components/states/ErrorState";
import { AuthShell } from "../features/auth/AuthShell";
import { useAuth } from "../features/auth/AuthContext";

export function ResetPasswordPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const emailFromLink = searchParams.get("email") ?? "";
  const [form, setForm] = useState({
    email: emailFromLink,
    password: "",
    password_confirmation: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const missingToken = useMemo(() => token.trim() === "", [token]);

  if (isAuthenticated) {
    return <Navigate to="/app/dashboard" replace />;
  }

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await authApi.resetPassword({ ...form, token });
      navigate("/login?password_reset=1", { replace: true });
    } catch (err) {
      setError(getApiError(err, "No se pudo actualizar el password."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Nuevo password"
      title="Define un acceso nuevo"
      description="El enlace solo puede usarse una vez y caduca por seguridad."
      footer={
        <>
          Volver a{" "}
          <Link className="font-medium text-stone-200 transition hover:text-amber-100" to="/login">
            iniciar sesion
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={submit}>
        {missingToken ? <ErrorState message="El enlace de recuperacion no contiene token." /> : null}
        {error ? <ErrorState message={error} /> : null}
        <Field label="Email">
          <input
            className={inputClass}
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
          />
        </Field>
        <Field label="Nuevo password">
          <input
            className={inputClass}
            type="password"
            autoComplete="new-password"
            placeholder="Minimo 8 caracteres"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
          />
        </Field>
        <Field label="Confirmar password">
          <input
            className={inputClass}
            type="password"
            autoComplete="new-password"
            placeholder="Repite el password"
            value={form.password_confirmation}
            onChange={(event) =>
              setForm({ ...form, password_confirmation: event.target.value })
            }
          />
        </Field>
        <Button className="mt-2 w-full py-3" disabled={loading || missingToken}>
          {loading ? "Guardando..." : "Actualizar password"}
        </Button>
      </form>
    </AuthShell>
  );
}
