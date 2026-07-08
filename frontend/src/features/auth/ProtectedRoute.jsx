import { Navigate } from "react-router-dom";
import { LoadingState } from "../../components/states/LoadingState";
import { useAuth } from "./AuthContext";

export function ProtectedRoute({ children }) {
  const { booting, isAuthenticated } = useAuth();

  if (booting) {
    return <LoadingState label="Preparando workspace seguro..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
