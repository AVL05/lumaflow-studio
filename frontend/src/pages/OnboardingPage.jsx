import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { ErrorState } from "../components/states/ErrorState";
import { Field, inputClass } from "../components/ui/Field";
import { getApiError } from "../api/client";
import { useAuth } from "../features/auth/AuthContext";
import { getAuthDestination } from "../features/auth/getAuthDestination";
import { OnboardingShell } from "../features/auth/OnboardingShell";

const specialties = [
  ["wedding", "Bodas"],
  ["portrait", "Retrato"],
  ["family", "Familia"],
  ["events", "Eventos"],
  ["product", "Producto"],
  ["automotive", "Automoción"],
  ["real_estate", "Inmobiliaria"],
  ["fashion", "Moda"],
  ["food", "Gastronomía"],
  ["sports", "Deporte"],
  ["other", "Otra"],
];

const countries = [
  ["ES", "España"],
  ["PT", "Portugal"],
  ["FR", "Francia"],
  ["IT", "Italia"],
  ["DE", "Alemania"],
  ["GB", "Reino Unido"],
  ["US", "Estados Unidos"],
  ["MX", "México"],
  ["AR", "Argentina"],
  ["CO", "Colombia"],
  ["CL", "Chile"],
];

const currencies = [
  ["EUR", "EUR - Euro"],
  ["USD", "USD - Dólar estadounidense"],
  ["GBP", "GBP - Libra esterlina"],
  ["MXN", "MXN - Peso mexicano"],
  ["ARS", "ARS - Peso argentino"],
  ["COP", "COP - Peso colombiano"],
  ["CLP", "CLP - Peso chileno"],
];

const goals = [
  ["organize_sessions", "Organizar mis próximas sesiones", "Calendario, tareas y producción."],
  ["manage_clients", "Ordenar clientes y solicitudes", "Contactos y reservas en contexto."],
  ["prepare_shoots", "Preparar mejor cada sesión", "Equipo, presets y checklists."],
  ["create_quotes", "Crear presupuestos y facturas", "Seguimiento comercial sin hojas sueltas."],
  ["deliver_galleries", "Entregar galerías a clientes", "Favoritas, revisión y aprobación."],
  ["explore_ai", "Explorar la IA local", "Planificación con WebGPU en el navegador."],
];

const stepCopy = [
  [
    "¿Cómo se llama tu estudio?",
    "Este nombre aparecerá en reservas, galerías y comunicaciones con clientes.",
  ],
  [
    "¿Qué tipo de fotografía haces?",
    "Elige hasta cinco especialidades. Podrás cambiarlas más adelante.",
  ],
  ["¿Dónde trabajas y cómo cobras?", "Usaremos estos datos como referencia económica y regional."],
  ["¿Qué quieres resolver primero?", "Abriremos LumaFlow con una prioridad clara para tu estudio."],
];

export function OnboardingPage() {
  const { user, booting, isAuthenticated, completeOnboarding } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    studio_name: user?.studio_name ?? "",
    photography_specialties: user?.photography_specialties ?? [],
    country: user?.country ?? "ES",
    currency: user?.currency ?? "EUR",
    onboarding_goal: user?.onboarding_goal ?? "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (booting) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user.email_verified) return <Navigate to="/verify-email" replace />;
  if (user.onboarding_completed) return <Navigate to={getAuthDestination(user)} replace />;

  function toggleSpecialty(value) {
    setError("");
    setForm((current) => {
      const selected = current.photography_specialties.includes(value);
      if (!selected && current.photography_specialties.length >= 5) return current;

      return {
        ...current,
        photography_specialties: selected
          ? current.photography_specialties.filter((item) => item !== value)
          : [...current.photography_specialties, value],
      };
    });
  }

  function continueToNext() {
    const validation = validateStep(step, form);
    if (validation) {
      setError(validation);
      return;
    }
    setError("");
    setStep((current) => Math.min(current + 1, stepCopy.length - 1));
  }

  async function finish() {
    const validation = validateStep(step, form);
    if (validation) {
      setError(validation);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const completed = await completeOnboarding(form);
      navigate(getAuthDestination(completed), { replace: true });
    } catch (err) {
      setError(getApiError(err, "No pudimos guardar la configuración."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <OnboardingShell
      current={step + 1}
      total={stepCopy.length}
      title={stepCopy[step][0]}
      description={stepCopy[step][1]}
    >
      <div className="flex min-h-[25rem] flex-col">
        <div className="flex-1">
          {error ? (
            <div className="mb-5">
              <ErrorState message={error} />
            </div>
          ) : null}
          {step === 0 ? (
            <Field label="Nombre del estudio">
              <input
                className={inputClass}
                autoFocus
                autoComplete="organization"
                placeholder="Luz Norte Fotografía"
                value={form.studio_name}
                onChange={(event) => setForm({ ...form, studio_name: event.target.value })}
              />
            </Field>
          ) : null}

          {step === 1 ? (
            <fieldset>
              <legend className="sr-only">Especialidades fotográficas</legend>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {specialties.map(([value, label]) => {
                  const selected = form.photography_specialties.includes(value);
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={selected}
                      className={`min-h-14 rounded-xl border px-3 py-3 text-left text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/60 ${selected ? "border-amber-200/45 bg-amber-100/10 text-amber-100" : "border-white/10 bg-white/[0.035] text-stone-300 hover:border-white/20 hover:bg-white/[0.06]"}`}
                      onClick={() => toggleSpecialty(value)}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-4 text-xs text-stone-500">
                {form.photography_specialties.length} de 5 seleccionadas
              </p>
            </fieldset>
          ) : null}

          {step === 2 ? (
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="País">
                <select
                  className={inputClass}
                  value={form.country}
                  onChange={(event) => setForm({ ...form, country: event.target.value })}
                >
                  {countries.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Moneda">
                <select
                  className={inputClass}
                  value={form.currency}
                  onChange={(event) => setForm({ ...form, currency: event.target.value })}
                >
                  {currencies.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          ) : null}

          {step === 3 ? (
            <fieldset>
              <legend className="sr-only">Primera prioridad</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {goals.map(([value, title, description]) => {
                  const selected = form.onboarding_goal === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={selected}
                      className={`rounded-xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/60 ${selected ? "border-amber-200/45 bg-amber-100/10" : "border-white/10 bg-white/[0.035] hover:border-white/20 hover:bg-white/[0.06]"}`}
                      onClick={() => setForm({ ...form, onboarding_goal: value })}
                    >
                      <span className="block text-sm font-semibold text-stone-100">{title}</span>
                      <span className="mt-1 block text-xs leading-5 text-stone-500">
                        {description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ) : null}
        </div>

        <div className="mt-8 flex items-center justify-between gap-3 border-t border-white/10 pt-6">
          <Button
            type="button"
            variant="ghost"
            disabled={step === 0 || loading}
            onClick={() => {
              setError("");
              setStep((current) => current - 1);
            }}
          >
            Atrás
          </Button>
          {step < stepCopy.length - 1 ? (
            <Button type="button" onClick={continueToNext}>
              Continuar
            </Button>
          ) : (
            <Button type="button" onClick={finish} disabled={loading}>
              {loading ? "Guardando..." : "Abrir mi estudio"}
            </Button>
          )}
        </div>
      </div>
    </OnboardingShell>
  );
}

function validateStep(step, form) {
  if (step === 0 && form.studio_name.trim().length < 2) return "Escribe el nombre del estudio.";
  if (step === 1 && form.photography_specialties.length === 0)
    return "Elige al menos una especialidad.";
  if (step === 2 && (!form.country || !form.currency)) return "Selecciona país y moneda.";
  if (step === 3 && !form.onboarding_goal) return "Elige qué quieres resolver primero.";
  return "";
}
