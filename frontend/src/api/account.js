import { apiClient } from "./client";

/** Descarga la exportación completa de datos como blob (respeta el interceptor de auth). */
export async function downloadAccountExport() {
  const response = await apiClient.get("/account/export", { responseType: "blob" });
  const disposition = response.headers?.["content-disposition"] ?? "";
  const filename = disposition.match(/filename="?([^"]+)"?/)?.[1] ?? "lumaflow-datos.json";

  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
