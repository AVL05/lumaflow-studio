import { apiClient } from "./client";

export const tagsApi = {
  list: (params) =>
    apiClient
      .get("/tags", { params })
      .then((res) => (params ? res.data : res.data.data)),
  create: (payload) =>
    apiClient.post("/tags", payload).then((res) => res.data.data),
  update: (id, payload) =>
    apiClient.put(`/tags/${id}`, payload).then((res) => res.data.data),
  remove: (id) => apiClient.delete(`/tags/${id}`),
};
