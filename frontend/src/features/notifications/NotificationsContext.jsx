import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { notificationsApi } from "../../api/notifications";
import { useAuth } from "../auth/AuthContext";

const NotificationsContext = createContext(null);

const POLL_MS = 60_000;

/**
 * Centro de notificaciones persistidas en BD. Distinto de los toasts efimeros:
 * este contexto mantiene el contador global y la lista paginada.
 */
export function NotificationsProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const refreshCount = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setUnread(await notificationsApi.unreadCount());
    } catch {
      // Silencioso: el contador no debe bloquear la navegacion.
    }
  }, [isAuthenticated]);

  const refreshList = useCallback(async () => {
    if (!isAuthenticated) return;

    setLoading(true);

    try {
      const response = await notificationsApi.list({ per_page: 30 });
      setItems(response.data);
      setUnread(response.unread ?? 0);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnread(0);
      setItems([]);

      return undefined;
    }

    refreshCount();
    const timer = window.setInterval(refreshCount, POLL_MS);

    return () => window.clearInterval(timer);
  }, [isAuthenticated, refreshCount]);

  const markRead = useCallback(async (id) => {
    await notificationsApi.markRead(id);
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, is_read: true, read_at: new Date().toISOString() } : item,
      ),
    );
    setUnread((current) => Math.max(0, current - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await notificationsApi.markAllRead();
    setItems((current) => current.map((item) => ({ ...item, is_read: true })));
    setUnread(0);
  }, []);

  const remove = useCallback(
    async (id) => {
      await notificationsApi.remove(id);
      setItems((current) => current.filter((item) => item.id !== id));
      await refreshCount();
    },
    [refreshCount],
  );

  const clearRead = useCallback(async () => {
    await notificationsApi.clear("read");
    setItems((current) => current.filter((item) => !item.is_read));
  }, []);

  const value = useMemo(
    () => ({
      unread,
      items,
      loading,
      refreshCount,
      refreshList,
      markRead,
      markAllRead,
      remove,
      clearRead,
    }),
    [unread, items, loading, refreshCount, refreshList, markRead, markAllRead, remove, clearRead],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNotifications() {
  const context = useContext(NotificationsContext);

  if (!context) {
    throw new Error("useNotifications debe usarse dentro de NotificationsProvider");
  }

  return context;
}
