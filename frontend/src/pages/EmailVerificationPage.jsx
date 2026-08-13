import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { ErrorState } from "../components/states/ErrorState";
import { getApiError } from "../api/client";
import { AuthShell } from "../features/auth/AuthShell";
import { useAuth } from "../features/auth/AuthContext";
import { getAuthDestination } from "../features/auth/getAuthDestination";

export function EmailVerificationPage() {
  const { user, booting, isAuthenticated, refreshUser, resendVerification, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [checking, setChecking] = useState(searchParams.get("verified") === "1");
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState(
    location.state?.verificationEmailSent === false
      ? "La cuenta está creada, pero el primer envío falló. Puedes solicitar otro enlace."
      : "Te hemos enviado un enlace de verificación.",
  );
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated || searchParams.get("verified") !== "1") return;

    refreshUser()
      .then((refreshed) => navigate(getAuthDestination(refreshed), { replace: true }))
      .catch((err) => setError(getApiError(err, "No pudimos confirmar la verificación.")))
      .finally(() => setChecking(false));
  }, [isAuthenticated, navigate, refreshUser, searchParams]);

  if (booting || checking) {
    return (
      <AuthShell
        eyebrow="Verificación de email"
        title="Confirmando tu enlace"
        description="Estamos comprobando la dirección asociada a tu cuenta."
      >
        <p className="text-sm text-stone-400">Un momento...</p>
      </AuthShell>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user.email_verified) return <Navigate to={getAuthDestination(user)} replace />;

  async function checkVerification() {
    setChecking(true);
    setError("");

    try {
      const refreshed = await refreshUser();
      if (refreshed.email_verified) {
        navigate(getAuthDestination(refreshed), { replace: true });
        return;
      }
      setMessage("Todavía no aparece como verificado. Abre el enlace del email y vuelve a probar.");
    } catch (err) {
      setError(getApiError(err, "No pudimos comprobar el email."));
    } finally {
      setChecking(false);
    }
  }

  async function resend() {
    setResending(true);
    setError("");

    try {
      const response = await resendVerification();
      setMessage(response.message);
    } catch (err) {
      setError(getApiError(err, "No pudimos reenviar el enlace."));
    } finally {
      setResending(false);
    }
  }

  async function useAnotherAccount() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <AuthShell
      eyebrow="Verificación de email"
      title="Revisa tu bandeja de entrada"
      description={`Confirma ${user.email} para continuar con la configuración del estudio.`}
      footer={
        <button
          type="button"
          className="font-medium text-stone-300 transition hover:text-amber-100"
          onClick={useAnotherAccount}
        >
          Usar otra cuenta
        </button>
      }
    >
      <div className="space-y-5">
        {error ? <ErrorState message={error} /> : null}
        <div className="rounded-xl border border-amber-200/15 bg-amber-100/[0.06] p-4 text-sm leading-6 text-stone-300">
          {message}
        </div>
        <Button className="w-full py-3" onClick={checkVerification} disabled={checking}>
          {checking ? "Comprobando..." : "Ya he verificado mi email"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="w-full py-3"
          onClick={resend}
          disabled={resending}
        >
          {resending ? "Enviando..." : "Reenviar enlace"}
        </Button>
        <p className="text-xs leading-5 text-stone-500">
          Revisa también las carpetas de spam y promociones. El enlace caduca en 60 minutos.
        </p>
      </div>
    </AuthShell>
  );
}
