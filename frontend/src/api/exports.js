import { apiClient } from "./client";

/**
 * Descarga la exportacion como blob para respetar el interceptor de auth.
 * PDF queda fuera de esta fase: el backend solo acepta csv y json.
 */
async function download(resource, format, ids) {
  const response = await apiClient.post(
    `/exports/${resource}`,
    { format, ids },
    { responseType: "blob" },
  );

  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = filenameFrom(response.headers, resource, format);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function filenameFrom(headers, resource, format) {
  const disposition = headers?.["content-disposition"] ?? "";
  const match = disposition.match(/filename="?([^"]+)"?/);

  return match?.[1] ?? `lumaflow-${resource}.${format}`;
}

export const exportsApi = {
  csv: (resource, ids = []) => download(resource, "csv", ids),
  json: (resource, ids = []) => download(resource, "json", ids),
};
