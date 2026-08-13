import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { ProtectedRoute } from "../features/auth/ProtectedRoute";
import { lazyRoute } from "./lazyRoute";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";
import { EmailVerificationPage } from "../pages/EmailVerificationPage";
import { OnboardingPage } from "../pages/OnboardingPage";
import { GettingStartedPage } from "../pages/GettingStartedPage";
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
import { TasksPage } from "../pages/TasksPage";
import { QuotesPage } from "../pages/QuotesPage";
import { InvoicesPage } from "../pages/InvoicesPage";
import { PresetsPage } from "../pages/PresetsPage";
import { BookingRequestsPage } from "../pages/BookingRequestsPage";
import { BookingPage } from "../pages/BookingPage";
import { ClientPortalPage } from "../pages/ClientPortalPage";
import { SystemPage } from "../pages/SystemPage";
import { SettingsPage } from "../pages/SettingsPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { LandingPage } from "../pages/LandingPage";
import { JobsPage } from "../pages/JobsPage";
import { JobDetailPage } from "../pages/JobDetailPage";

const errorElement = <NotFoundPage asErrorBoundary />;

export const router = createBrowserRouter([
  { path: "/", element: <LandingPage />, errorElement },
  {
    path: "/demo",
    element: lazyRoute(() => import("../pages/DemoPage"), "DemoPage"),
    errorElement,
  },
  {
    path: "/features",
    element: lazyRoute(() => import("../pages/FeaturesPage"), "FeaturesPage"),
    errorElement,
  },
  {
    path: "/pricing",
    element: lazyRoute(() => import("../pages/PricingPage"), "PricingPage"),
    errorElement,
  },
  {
    path: "/privacy",
    element: lazyRoute(() => import("../pages/PrivacyPage"), "PrivacyPage"),
    errorElement,
  },
  { path: "/security", element: <Navigate to="/privacy" replace />, errorElement },
  { path: "/login", element: <LoginPage />, errorElement },
  { path: "/register", element: <RegisterPage />, errorElement },
  { path: "/verify-email", element: <EmailVerificationPage />, errorElement },
  { path: "/onboarding", element: <OnboardingPage />, errorElement },
  { path: "/getting-started", element: <GettingStartedPage />, errorElement },
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
      { path: "jobs", element: <JobsPage /> },
      { path: "jobs/:id", element: <JobDetailPage /> },
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
      { path: "presets", element: <PresetsPage /> },
      { path: "clients", element: <ClientsPage /> },
      { path: "clients/:id", element: <ClientDetailPage /> },
      { path: "deliveries", element: <DeliveriesPage /> },
      { path: "deliveries/:id", element: <DeliveryDetailPage /> },
      { path: "quotes", element: <QuotesPage /> },
      { path: "invoices", element: <InvoicesPage /> },
      { path: "booking-requests", element: <BookingRequestsPage /> },
      { path: "locations", element: <LocationsPage /> },
      { path: "locations/:id", element: <LocationDetailPage /> },
      {
        path: "ai-assistant",
        element: lazyRoute(() => import("../pages/AiAssistantPage"), "AiAssistantPage"),
      },
      { path: "system", element: <Navigate to="/app/settings/advanced" replace /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "settings/advanced", element: <SystemPage /> },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);
