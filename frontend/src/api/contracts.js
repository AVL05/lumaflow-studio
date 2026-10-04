import { apiClient } from "./client";

export const contractsApi = {
  list: (params) => apiClient.get("/contracts", { params }).then((res) => res.data),
  show: (id) => apiClient.get(`/contracts/${id}`).then((res) => res.data.data),
  create: (payload) => apiClient.post("/contracts", payload).then((res) => res.data.data),
  update: (id, payload) => apiClient.put(`/contracts/${id}`, payload).then((res) => res.data.data),
  status: (id, status) =>
    apiClient.patch(`/contracts/${id}/status`, { status }).then((res) => res.data.data),
  remove: (id) => apiClient.delete(`/contracts/${id}`),
};
