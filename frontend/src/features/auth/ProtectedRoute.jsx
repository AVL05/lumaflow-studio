import { Navigate } from "react-router-dom";
import { LoadingState } from "../../components/states/LoadingState";
import { useAuth } from "./AuthContext";
import { getAuthDestination } from "./getAuthDestination";

export function ProtectedRoute({ children }) {
  const { booting, isAuthenticated, user } = useAuth();

  if (booting) {
    return <LoadingState label="Preparando workspace seguro..." />;
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
