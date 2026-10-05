import { Navigate } from "react-router-dom";
import { LoadingState } from "../../components/states/LoadingState";
import { ServiceUnavailable } from "../../components/states/ServiceUnavailable";
import { useAuth } from "./AuthContext";
import { getAuthDestination } from "./getAuthDestination";
import { AUTH_STATUS_UNAVAILABLE } from "./AuthContext";

export function ProtectedRoute({ children }) {
  const { booting, isAuthenticated, user, authStatus, bootError, retryBoot, logout } = useAuth();

  if (booting) {
    return <LoadingState label="Preparando workspace seguro..." />;
  }

  // Fallo transitorio con sesion local potencialmente valida: estado
  // degradado con reintento, nunca redireccion a login.
  if (authStatus === AUTH_STATUS_UNAVAILABLE) {
    return <ServiceUnavailable message={bootError} onRetry={retryBoot} onLogout={logout} />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const destination = getAuthDestination(user);

  if (destination !== "/app/dashboard") {
    return <Navigate to={destination} replace />;
  }

  return children;
}
