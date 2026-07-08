import { createContext, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);

const styles = {
  success: "border-emerald-300/20 bg-emerald-300/10 text-emerald-50",
  error: "border-red-300/20 bg-red-300/10 text-red-50",
  warning: "border-amber-200/20 bg-amber-200/10 text-amber-50",
  info: "border-sky-200/20 bg-sky-200/10 text-sky-50",
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  function push(type, message) {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, type, message }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4200);
  }

  const value = useMemo(
    () => ({
      success: (message) => push("success", message),
      error: (message) => push("error", message),
      warning: (message) => push("warning", message),
      info: (message) => push("info", message),
    }),
    [],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-[60] w-full max-w-sm space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded-lg border px-4 py-3 text-sm shadow-2xl shadow-black/30 backdrop-blur ${styles[toast.type]}`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast debe usarse dentro de ToastProvider");
  }

  return context;
}
