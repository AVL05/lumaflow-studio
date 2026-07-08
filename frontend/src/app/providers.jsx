import { AuthProvider } from "../features/auth/AuthContext";
import { NotificationsProvider } from "../features/notifications/NotificationsContext";
import { ToastProvider } from "../features/notifications/ToastContext";

export function AppProviders({ children }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <NotificationsProvider>{children}</NotificationsProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
