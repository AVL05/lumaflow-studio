import { apiClient } from "./client";

export const sessionsApi = {
  list: (params) =>
    apiClient
      .get("/sessions", { params })
      .then((res) => (params ? res.data : res.data.data)),
  create: (payload) =>
    apiClient.post("/sessions", payload).then((res) => res.data.data),
  update: (id, payload) =>
    apiClient.put(`/sessions/${id}`, payload).then((res) => res.data.data),
  remove: (id) => apiClient.delete(`/sessions/${id}`),
};
