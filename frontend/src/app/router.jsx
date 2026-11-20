import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { ProtectedRoute } from "../features/auth/ProtectedRoute";
import { lazyRoute } from "./lazyRoute";
import { LoginPage } from "../pages/LoginPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { publicRoutes } from "./publicRoutes";
import { RouteMetadata } from "./RouteMetadata";

const errorElement = <NotFoundPage asErrorBoundary />;

export const router = createBrowserRouter([
  {
    element: <RouteMetadata />,
    errorElement,
    children: [
      ...publicRoutes,
      {
        path: "/demo",
        element: lazyRoute(() => import("../pages/DemoPage"), "DemoPage"),
        errorElement,
      },
      { path: "/security", element: <Navigate to="/privacy" replace />, errorElement },
      { path: "/login", element: <LoginPage />, errorElement },
      {
        path: "/register",
        element: lazyRoute(() => import("../pages/RegisterPage"), "RegisterPage"),
        errorElement,
      },
      {
        path: "/verify-email",
        // Ya no se verifica el email: los enlaces antiguos llevan a la app.
        element: <Navigate to="/app/dashboard" replace />,
        errorElement,
      },
      {
        path: "/onboarding",
        element: lazyRoute(() => import("../pages/OnboardingPage"), "OnboardingPage"),
        errorElement,
      },
      {
        path: "/getting-started",
        element: lazyRoute(() => import("../pages/GettingStartedPage"), "GettingStartedPage"),
        errorElement,
      },
      {
        path: "/forgot-password",
        element: lazyRoute(() => import("../pages/ForgotPasswordPage"), "ForgotPasswordPage"),
        errorElement,
      },
      {
        path: "/reset-password",
        element: lazyRoute(() => import("../pages/ResetPasswordPage"), "ResetPasswordPage"),
        errorElement,
      },
      {
        path: "/book/:slug",
        element: lazyRoute(() => import("../pages/BookingPage"), "BookingPage"),
        errorElement,
      },
      {
        path: "/deliver/:token",
        element: lazyRoute(() => import("../pages/ClientPortalPage"), "ClientPortalPage"),
        errorElement,
      },
      {
        path: "/contract/:token",
        element: lazyRoute(() => import("../pages/ContractPortalPage"), "ContractPortalPage"),
        errorElement,
      },
      {
        path: "/app",
        element: (
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        ),
        errorElement,
        children: [
          { index: true, element: <Navigate to="/app/dashboard" replace /> },
          {
            path: "dashboard",
            element: lazyRoute(() => import("../pages/DashboardPage"), "DashboardPage"),
          },
          { path: "jobs", element: lazyRoute(() => import("../pages/JobsPage"), "JobsPage") },
          {
            path: "jobs/:id",
            element: lazyRoute(() => import("../pages/JobDetailPage"), "JobDetailPage"),
          },
          {
            path: "calendar",
            element: lazyRoute(() => import("../pages/CalendarPage"), "CalendarPage"),
          },
          { path: "tasks", element: lazyRoute(() => import("../pages/TasksPage"), "TasksPage") },
          {
            path: "analytics",
            element: lazyRoute(() => import("../pages/AnalyticsPage"), "AnalyticsPage"),
          },
          {
            path: "sessions",
            element: lazyRoute(() => import("../pages/SessionsPage"), "SessionsPage"),
          },
          { path: "gear", element: lazyRoute(() => import("../pages/GearPage"), "GearPage") },
          {
            path: "presets",
            element: lazyRoute(() => import("../pages/PresetsPage"), "PresetsPage"),
          },
          {
            path: "clients",
            element: lazyRoute(() => import("../pages/ClientsPage"), "ClientsPage"),
          },
          {
            path: "clients/:id",
            element: lazyRoute(() => import("../pages/ClientDetailPage"), "ClientDetailPage"),
          },
          {
            path: "deliveries",
            element: lazyRoute(() => import("../pages/DeliveriesPage"), "DeliveriesPage"),
          },
          {
            path: "deliveries/:id",
            element: lazyRoute(() => import("../pages/DeliveryDetailPage"), "DeliveryDetailPage"),
          },
          { path: "quotes", element: lazyRoute(() => import("../pages/QuotesPage"), "QuotesPage") },
          {
            path: "contracts",
            element: lazyRoute(() => import("../pages/ContractsPage"), "ContractsPage"),
          },
          {
            path: "invoices",
            element: lazyRoute(() => import("../pages/InvoicesPage"), "InvoicesPage"),
          },
          {
            path: "booking-requests",
            element: lazyRoute(() => import("../pages/BookingRequestsPage"), "BookingRequestsPage"),
          },
          {
            path: "locations",
            element: lazyRoute(() => import("../pages/LocationsPage"), "LocationsPage"),
          },
          {
            path: "locations/:id",
            element: lazyRoute(() => import("../pages/LocationDetailPage"), "LocationDetailPage"),
          },
          {
            path: "ai-assistant",
            element: lazyRoute(() => import("../pages/AiAssistantPage"), "AiAssistantPage"),
          },
          { path: "system", element: <Navigate to="/app/settings/advanced" replace /> },
          {
            path: "settings",
            element: lazyRoute(() => import("../pages/SettingsPage"), "SettingsPage"),
          },
          {
            path: "settings/advanced",
            element: lazyRoute(() => import("../pages/SystemPage"), "SystemPage"),
          },
        ],
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
