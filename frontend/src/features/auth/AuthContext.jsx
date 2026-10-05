import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../../api/auth";
import { getApiError } from "../../api/client";
import { identifySentryUser } from "../../app/sentry";
import { isUnauthorized } from "./authErrors";

const AuthContext = createContext(null);

export const AUTH_STATUS_BOOTING = "booting";
export const AUTH_STATUS_AUTHENTICATED = "authenticated";
export const AUTH_STATUS_UNAUTHENTICATED = "unauthenticated";
export const AUTH_STATUS_UNAVAILABLE = "unavailable";

function clearLocalSession() {
  localStorage.removeItem("lumaflow_token");
  identifySentryUser(null);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authStatus, setAuthStatus] = useState(AUTH_STATUS_BOOTING);
  const [bootError, setBootError] = useState("");

  async function confirmSession() {
    const me = await authApi.me();
    setUser(me);
    identifySentryUser(me?.id);
    setBootError("");
    setAuthStatus(AUTH_STATUS_AUTHENTICATED);
    return me;
  }

  function applySessionError(error) {
    // Solo un 401 demuestra sesion invalida. Cualquier otro fallo
    // conserva el token local y deja la app en estado degradado.
    if (isUnauthorized(error)) {
      clearLocalSession();
      setUser(null);
      setBootError("");
      setAuthStatus(AUTH_STATUS_UNAUTHENTICATED);
    } else {
      setBootError(getApiError(error, "No se pudo conectar con el servidor."));
      setAuthStatus(AUTH_STATUS_UNAVAILABLE);
    }
  }

  async function checkSession() {
    try {
      return await confirmSession();
    } catch (error) {
      applySessionError(error);
      throw error;
    }
  }

  useEffect(() => {
    if (!localStorage.getItem("lumaflow_token")) {
      setAuthStatus(AUTH_STATUS_UNAUTHENTICATED);
      return;
    }

    checkSession().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function retryBoot() {
    setAuthStatus(AUTH_STATUS_BOOTING);

    if (!localStorage.getItem("lumaflow_token")) {
      setAuthStatus(AUTH_STATUS_UNAUTHENTICATED);
      return null;
    }

    try {
      return await confirmSession();
    } catch (error) {
      applySessionError(error);
      return null;
    }
  }

  async function login(payload) {
    const data = await authApi.login(payload);
    localStorage.setItem("lumaflow_token", data.token);
    setUser(data.user);
    identifySentryUser(data.user?.id);
    setBootError("");
    setAuthStatus(AUTH_STATUS_AUTHENTICATED);
    return data.user;
  }

  async function register(payload) {
    const data = await authApi.register(payload);
    localStorage.setItem("lumaflow_token", data.token);
    setUser(data.user);
    identifySentryUser(data.user?.id);
    setBootError("");
    setAuthStatus(AUTH_STATUS_AUTHENTICATED);
    return data;
  }

  async function refreshUser() {
    try {
      return await confirmSession();
    } catch (error) {
      applySessionError(error);
      throw error;
    }
  }

  async function resendVerification() {
    return authApi.resendVerification();
  }

  async function completeOnboarding(payload) {
    const completed = await authApi.completeOnboarding(payload);
    setUser(completed);
    return completed;
  }

  async function completeGettingStarted(choice) {
    const completed = await authApi.completeGettingStarted(choice);
    setUser(completed);
    return completed;
  }

  async function logout() {
    // Logout manual: limpia local aunque el backend falle.
    try {
      await authApi.logout();
    } finally {
      clearLocalSession();
      setUser(null);
      setBootError("");
      setAuthStatus(AUTH_STATUS_UNAUTHENTICATED);
    }
  }

  const value = useMemo(
    () => ({
      user,
      booting: authStatus === AUTH_STATUS_BOOTING,
      isAuthenticated: authStatus === AUTH_STATUS_AUTHENTICATED,
      authStatus,
      bootError,
      retryBoot,
      login,
      register,
      refreshUser,
      resendVerification,
      completeOnboarding,
      completeGettingStarted,
      logout,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, authStatus, bootError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }

  return context;
}
