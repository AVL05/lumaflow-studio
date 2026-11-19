import { renderToString } from "react-dom/server";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { publicRoutes } from "./publicRoutes";
import { RouteMetadata } from "./RouteMetadata";
import { NotFoundPage } from "../pages/NotFoundPage";
import { AppProviders } from "./providers";

function renderRoutes(routes, pathname) {
  const router = createMemoryRouter([{ element: <RouteMetadata />, children: routes }], {
    initialEntries: [pathname],
  });
  try {
    return renderToString(
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>,
    );
  } finally {
    router.dispose();
  }
}

export function renderPublicPage(pathname) {
  if (!publicRoutes.some((route) => route.path === pathname)) {
    throw new Error("Only commercial routes can be prerendered");
  }
  return renderRoutes(publicRoutes, pathname);
}

export function renderNotFoundPage() {
  return renderRoutes([{ path: "*", element: <NotFoundPage /> }], "/404");
}
