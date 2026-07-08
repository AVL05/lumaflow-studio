import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("lumaflow_token");

    if (!token) {
      setBooting(false);
      return;
    }

    authApi
      .me()
      .then(setUser)
      .catch(() => localStorage.removeItem("lumaflow_token"))
      .finally(() => setBooting(false));
  }, []);

  async function login(payload) {
    const data = await authApi.login(payload);
    localStorage.setItem("lumaflow_token", data.token);
    setUser(data.user);
  }

  async function register(payload) {
    const data = await authApi.register(payload);
    localStorage.setItem("lumaflow_token", data.token);
    setUser(data.user);
  }

  async function logout() {
    try {
      await authApi.logout();
    } finally {
      localStorage.removeItem("lumaflow_token");
      setUser(null);
    }
  }

  const value = useMemo(
    () => ({
      user,
      booting,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
    }),
    [user, booting],
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
