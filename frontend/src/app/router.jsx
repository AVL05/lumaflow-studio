import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { ProtectedRoute } from "../features/auth/ProtectedRoute";
import { lazyRoute } from "./lazyRoute";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";
import { ForgotPasswordPage } from "../pages/ForgotPasswordPage";
import { ResetPasswordPage } from "../pages/ResetPasswordPage";
import { DashboardPage } from "../pages/DashboardPage";
import { SessionsPage } from "../pages/SessionsPage";
import { GearPage } from "../pages/GearPage";
import { ClientsPage } from "../pages/ClientsPage";
import { ClientDetailPage } from "../pages/ClientDetailPage";
import { DeliveriesPage } from "../pages/DeliveriesPage";
import { DeliveryDetailPage } from "../pages/DeliveryDetailPage";
import { LocationsPage } from "../pages/LocationsPage";
import { LocationDetailPage } from "../pages/LocationDetailPage";
import { AiAssistantPage } from "../pages/AiAssistantPage";
import { TasksPage } from "../pages/TasksPage";
import { BookingRequestsPage } from "../pages/BookingRequestsPage";
import { BookingPage } from "../pages/BookingPage";
import { ClientPortalPage } from "../pages/ClientPortalPage";
import { SystemPage } from "../pages/SystemPage";
import { NotFoundPage } from "../pages/NotFoundPage";

const errorElement = <NotFoundPage asErrorBoundary />;

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/app/dashboard" replace />, errorElement },
  { path: "/login", element: <LoginPage />, errorElement },
  { path: "/register", element: <RegisterPage />, errorElement },
  { path: "/forgot-password", element: <ForgotPasswordPage />, errorElement },
  { path: "/reset-password", element: <ResetPasswordPage />, errorElement },
  {
    path: "/about-project",
    element: lazyRoute(() => import("../pages/AboutProjectPage"), "AboutProjectPage"),
    errorElement,
  },
  { path: "/book/:slug", element: <BookingPage />, errorElement },
  { path: "/deliver/:token", element: <ClientPortalPage />, errorElement },
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
      { path: "dashboard", element: <DashboardPage /> },
      {
        path: "calendar",
        element: lazyRoute(() => import("../pages/CalendarPage"), "CalendarPage"),
      },
      { path: "tasks", element: <TasksPage /> },
      {
        path: "analytics",
        element: lazyRoute(() => import("../pages/AnalyticsPage"), "AnalyticsPage"),
      },
      { path: "sessions", element: <SessionsPage /> },
      { path: "gear", element: <GearPage /> },
      { path: "clients", element: <ClientsPage /> },
      { path: "clients/:id", element: <ClientDetailPage /> },
      { path: "deliveries", element: <DeliveriesPage /> },
      { path: "deliveries/:id", element: <DeliveryDetailPage /> },
      { path: "booking-requests", element: <BookingRequestsPage /> },
      { path: "locations", element: <LocationsPage /> },
      { path: "locations/:id", element: <LocationDetailPage /> },
      { path: "ai-assistant", element: <AiAssistantPage /> },
      { path: "system", element: <SystemPage /> },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);
