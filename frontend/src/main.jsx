import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./app/router.jsx";
import { AppProviders } from "./app/providers.jsx";
import { AppErrorBoundary } from "./components/states/AppErrorBoundary.jsx";
import { initSentry } from "./app/sentry.js";
import "./styles/main.css";
import { registerSW } from "virtual:pwa-register";

initSentry();
registerSW({ immediate: true });

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppErrorBoundary>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </AppErrorBoundary>
  </StrictMode>,
);
