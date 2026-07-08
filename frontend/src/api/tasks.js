import { apiClient } from "./client";

export const tasksApi = {
  list: (params) =>
    apiClient
      .get("/tasks", { params })
      .then((res) => (params ? res.data : res.data.data)),
  show: (id) => apiClient.get(`/tasks/${id}`).then((res) => res.data.data),
  create: (payload) =>
    apiClient.post("/tasks", payload).then((res) => res.data.data),
  update: (id, payload) =>
    apiClient.put(`/tasks/${id}`, payload).then((res) => res.data.data),
  remove: (id) => apiClient.delete(`/tasks/${id}`),
};
