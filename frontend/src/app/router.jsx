import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { ProtectedRoute } from "../features/auth/ProtectedRoute";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";
import { DashboardPage } from "../pages/DashboardPage";
import { SessionsPage } from "../pages/SessionsPage";
import { GearPage } from "../pages/GearPage";
import { PresetsPage } from "../pages/PresetsPage";
import { PhotosPage } from "../pages/PhotosPage";
import { AlbumsPage } from "../pages/AlbumsPage";
import { ClientsPage } from "../pages/ClientsPage";
import { ClientDetailPage } from "../pages/ClientDetailPage";
import { DeliveriesPage } from "../pages/DeliveriesPage";
import { DeliveryDetailPage } from "../pages/DeliveryDetailPage";
import { LocationsPage } from "../pages/LocationsPage";
import { LocationDetailPage } from "../pages/LocationDetailPage";
import { AiAssistantPage } from "../pages/AiAssistantPage";

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/app/dashboard" replace /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  {
    path: "/app",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/app/dashboard" replace /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "sessions", element: <SessionsPage /> },
      { path: "gear", element: <GearPage /> },
      { path: "presets", element: <PresetsPage /> },
      { path: "albums", element: <AlbumsPage /> },
      { path: "clients", element: <ClientsPage /> },
      { path: "clients/:id", element: <ClientDetailPage /> },
      { path: "deliveries", element: <DeliveriesPage /> },
      { path: "deliveries/:id", element: <DeliveryDetailPage /> },
      { path: "locations", element: <LocationsPage /> },
      { path: "locations/:id", element: <LocationDetailPage /> },
      { path: "photos", element: <PhotosPage /> },
      { path: "ai-assistant", element: <AiAssistantPage /> },
    ],
  },
]);
