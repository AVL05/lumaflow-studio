import { apiClient } from "./client";

export const gearApi = {
  list: (params) =>
    apiClient.get("/gear", { params }).then((res) => (params ? res.data : res.data.data)),
  create: (payload) => apiClient.post("/gear", payload).then((res) => res.data.data),
  update: (id, payload) => apiClient.put(`/gear/${id}`, payload).then((res) => res.data.data),
  remove: (id) => apiClient.delete(`/gear/${id}`),
};
