import { LandingPage } from "../pages/LandingPage";
import { FeaturesPage } from "../pages/FeaturesPage";
import { PricingPage } from "../pages/PricingPage";
import { PrivacyPage } from "../pages/PrivacyPage";
import { AboutProjectPage } from "../pages/AboutProjectPage";
import { SupportPage } from "../pages/SupportPage";

export const publicRoutes = [
  { path: "/", element: <LandingPage /> },
  { path: "/features", element: <FeaturesPage /> },
  { path: "/pricing", element: <PricingPage /> },
  { path: "/privacy", element: <PrivacyPage /> },
  { path: "/about-project", element: <AboutProjectPage /> },
  { path: "/support", element: <SupportPage /> },
];
