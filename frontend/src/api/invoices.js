import { apiClient } from "./client";

export const invoicesApi = {
  list: (params) =>
    apiClient.get("/invoices", { params }).then((res) => (params ? res.data : res.data.data)),
  create: (payload) => apiClient.post("/invoices", payload).then((res) => res.data.data),
  status: (id, status) =>
    apiClient.patch(`/invoices/${id}/status`, { status }).then((res) => res.data.data),
  pdf: (id) =>
    apiClient.get(`/invoices/${id}/pdf`, { responseType: "blob" }).then((res) => res.data),
};
