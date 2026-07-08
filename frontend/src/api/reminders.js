import { apiClient } from "./client";

export const remindersApi = {
  list: (params) =>
    apiClient
      .get("/reminders", { params })
      .then((res) => (params ? res.data : res.data.data)),
  create: (payload) =>
    apiClient.post("/reminders", payload).then((res) => res.data.data),
  update: (id, payload) =>
    apiClient.put(`/reminders/${id}`, payload).then((res) => res.data.data),
  remove: (id) => apiClient.delete(`/reminders/${id}`),
};
