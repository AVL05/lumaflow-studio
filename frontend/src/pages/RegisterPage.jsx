import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Field, inputClass } from "../components/ui/Field";
import { ErrorState } from "../components/states/ErrorState";
import { getApiError } from "../api/client";
import { AuthShell } from "../features/auth/AuthShell";
import { useAuth } from "../features/auth/AuthContext";

export function RegisterPage() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });
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
      await register(form);
      navigate("/app/dashboard");
    } catch (err) {
      setError(getApiError(err, "No se pudo crear la cuenta."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Nuevo workspace"
      title="Crea tu cuenta"
      description="Configura las credenciales de tu espacio de trabajo."
      footer={
        <>
          Ya tienes cuenta?{" "}
          <Link className="font-medium text-stone-200 transition hover:text-amber-100" to="/login">
            Entrar
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={submit}>
        {error ? <ErrorState message={error} /> : null}
        <Field label="Nombre">
          <input
            className={inputClass}
            autoComplete="name"
            placeholder="Alex Vicente"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Field>
        <Field label="Email">
          <input
            className={inputClass}
            type="email"
            autoComplete="email"
            placeholder="alex@studio.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </Field>
        <Field label="Password">
          <input
            className={inputClass}
            type="password"
            autoComplete="new-password"
            placeholder="Minimo 8 caracteres"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </Field>
        <Field label="Confirmar password">
          <input
            className={inputClass}
            type="password"
            autoComplete="new-password"
            placeholder="Repite el password"
            value={form.password_confirmation}
            onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
          />
        </Field>
        <Button className="mt-2 w-full py-3" disabled={loading}>
          {loading ? "Creando..." : "Crear cuenta"}
        </Button>
      </form>
    </AuthShell>
  );
}
