import { Outlet, useLocation } from "react-router-dom";
import { useDocumentMeta } from "../hooks/useDocumentMeta";

export function RouteMetadata() {
  const { pathname, search } = useLocation();
  useDocumentMeta(pathname, search);
  return <Outlet />;
}
