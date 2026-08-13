import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { getApiError } from "../api/client";
import { ErrorState } from "../components/states/ErrorState";
import { OnboardingShell } from "../features/auth/OnboardingShell";
import { useAuth } from "../features/auth/AuthContext";
import { getAuthDestination } from "../features/auth/getAuthDestination";

const options = [
  {
    value: "create_first_job",
    index: "01",
    title: "Crear mi primer trabajo",
    description:
      "Crea el encargo central y controla cliente, presupuesto, sesión, tareas y entrega.",
    destination: "/app/jobs",
    accent: "Recomendado para empezar",
  },
  {
    value: "sample_workspace",
    index: "02",
    title: "Explorar con datos de ejemplo",
    description:
      "Carga clientes, sesiones, tareas y una entrega ficticia. Nada se marca como completado.",
    destination: "/app/dashboard",
    accent: "Vista completa en segundos",
  },
  {
    value: "import_clients",
    index: "03",
    title: "Importar mis clientes",
    description: "Sube un CSV y empieza con tus contactos reales sin copiarlos uno a uno.",
    destination: "/app/clients?import=1",
    accent: "Hasta 250 contactos",
  },
];

export function GettingStartedPage() {
  const { user, booting, isAuthenticated, completeGettingStarted } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState("");
  const [error, setError] = useState("");

  if (booting) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user.email_verified || !user.onboarding_completed)
    return <Navigate to={getAuthDestination(user)} replace />;
  if (user.getting_started_completed && !selected)
    return <Navigate to={getAuthDestination(user)} replace />;

  async function choose(option) {
    setSelected(option.value);
    setError("");
    try {
      await completeGettingStarted(option.value);
      navigate(option.destination, { replace: true });
    } catch (err) {
      setError(getApiError(err, "No pudimos preparar este primer paso."));
      setSelected("");
    }
  }

  return (
    <OnboardingShell
      current={4}
      total={4}
      title="¿Cómo quieres empezar?"
      description="Elige una ruta. Después podrás usar las otras desde el producto."
    >
      {error ? <ErrorState message={error} /> : null}
      <div className="mt-2 grid gap-4">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={Boolean(selected)}
            onClick={() => choose(option)}
            className="group rounded-2xl border border-white/10 bg-white/[0.035] p-5 text-left transition hover:-translate-y-0.5 hover:border-amber-200/35 hover:bg-white/[0.065] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/60 disabled:cursor-wait disabled:opacity-55 sm:p-6"
          >
            <div className="flex items-start gap-4">
              <span className="font-mono text-xs tracking-[0.18em] text-amber-200/70">
                {option.index}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-semibold text-stone-50 sm:text-lg">
                  {selected === option.value ? "Preparando..." : option.title}
                </span>
                <span className="mt-2 block text-sm leading-6 text-stone-400">
                  {option.description}
                </span>
                <span className="mt-4 block text-xs font-semibold uppercase tracking-[0.15em] text-amber-100/70">
                  {option.accent}
                </span>
              </span>
              <span
                aria-hidden="true"
                className="text-xl text-stone-600 group-hover:text-amber-100"
              >
                →
              </span>
            </div>
          </button>
        ))}
      </div>
    </OnboardingShell>
  );
}
