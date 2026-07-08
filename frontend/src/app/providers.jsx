import { AuthProvider } from "../features/auth/AuthContext";
import { ToastProvider } from "../features/notifications/ToastContext";

export function AppProviders({ children }) {
  return (
    <ToastProvider>
      <AuthProvider>{children}</AuthProvider>
    </ToastProvider>
  );
}
