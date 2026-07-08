import { apiClient } from "./client";

export const presetsApi = {
  list: (params) =>
    apiClient.get("/presets", { params }).then((res) => (params ? res.data : res.data.data)),
  create: (payload) => apiClient.post("/presets", payload).then((res) => res.data.data),
  update: (id, payload) => apiClient.put(`/presets/${id}`, payload).then((res) => res.data.data),
  duplicate: (id) => apiClient.post(`/presets/${id}/duplicate`).then((res) => res.data.data),
  remove: (id) => apiClient.delete(`/presets/${id}`),
};
