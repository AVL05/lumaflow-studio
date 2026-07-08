import { apiClient } from "./client";

export const albumsApi = {
  list: (params) =>
    apiClient
      .get("/albums", { params })
      .then((res) => (params ? res.data : res.data.data)),
  create: (payload) =>
    apiClient.post("/albums", payload).then((res) => res.data.data),
  update: (id, payload) =>
    apiClient.put(`/albums/${id}`, payload).then((res) => res.data.data),
  remove: (id) => apiClient.delete(`/albums/${id}`),
};
