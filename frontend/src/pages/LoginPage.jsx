import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Field, inputClass } from "../components/ui/Field";
import { ErrorState } from "../components/states/ErrorState";
import { getApiError } from "../api/client";
import { AuthShell } from "../features/auth/AuthShell";
import { useAuth } from "../features/auth/AuthContext";

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/app/dashboard" replace />;
  }

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(form);
      navigate("/app/dashboard");
    } catch (err) {
      setError(getApiError(err, "No se pudo iniciar sesion."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Entrar al workspace"
      description="Accede a tu base privada de sesiones, equipo, presets, fotos e IA."
      footer={
        <>
          No tienes cuenta?{" "}
          <Link className="text-stone-200" to="/register">
            Crear cuenta
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={submit}>
        {error ? <ErrorState message={error} /> : null}
        <Field label="Email">
          <input
            className={inputClass}
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </Field>
        <Field label="Password">
          <input
            className={inputClass}
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </Field>
        <Button className="w-full" disabled={loading}>
          {loading ? "Entrando..." : "Login"}
        </Button>
      </form>
    </AuthShell>
  );
}
