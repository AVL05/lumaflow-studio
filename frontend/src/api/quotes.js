import { apiClient } from "./client";

export const quotesApi = {
  list: (params) =>
    apiClient.get("/quotes", { params }).then((res) => (params ? res.data : res.data.data)),
  create: (payload) => apiClient.post("/quotes", payload).then((res) => res.data.data),
  update: (id, payload) => apiClient.put(`/quotes/${id}`, payload).then((res) => res.data.data),
  status: (id, status) =>
    apiClient.patch(`/quotes/${id}/status`, { status }).then((res) => res.data.data),
  remove: (id) => apiClient.delete(`/quotes/${id}`),
  pdf: (id) => apiClient.get(`/quotes/${id}/pdf`, { responseType: "blob" }).then((res) => res.data),
};
