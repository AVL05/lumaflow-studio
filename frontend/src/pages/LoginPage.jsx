import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Field, inputClass } from "../components/ui/Field";
import { ErrorState } from "../components/states/ErrorState";
import { getApiError } from "../api/client";
import { AuthShell } from "../features/auth/AuthShell";
import { useAuth } from "../features/auth/AuthContext";
import { getAuthDestination } from "../features/auth/getAuthDestination";

export function LoginPage() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={getAuthDestination(user)} replace />;
  }

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const authenticatedUser = await login(form);
      navigate(getAuthDestination(authenticatedUser));
    } catch (err) {
      setError(getApiError(err, "No se pudo iniciar sesion."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Inicia sesión"
      description="Accede a tu espacio de trabajo."
      footer={
        <>
          No tienes cuenta?{" "}
          <Link
            className="font-medium text-stone-200 transition hover:text-amber-100"
            to="/register"
          >
            Crear cuenta
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={submit}>
        {error ? <ErrorState message={error} /> : null}
        {searchParams.get("password_reset") === "1" ? (
          <div className="rounded-md border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">
            Password actualizado. Ya puedes iniciar sesion.
          </div>
        ) : null}
        <Field label="Email">
          <input
            className={inputClass}
            type="email"
            autoComplete="email"
            placeholder="tu@email.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </Field>
        <Field label="Password">
          <input
            className={inputClass}
            type="password"
            autoComplete="current-password"
            placeholder="Password del workspace"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </Field>
        <div className="flex justify-end">
          <Link
            className="text-sm font-medium text-stone-400 transition hover:text-amber-100"
            to="/forgot-password"
          >
            He olvidado mi password
          </Link>
        </div>
        <Button className="mt-2 w-full py-3" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </AuthShell>
  );
}
