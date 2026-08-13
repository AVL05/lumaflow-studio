import { apiClient } from "./client";

export const jobsApi = {
  list: (params) => apiClient.get("/jobs", { params }).then((res) => res.data.data),
  workflows: () => apiClient.get("/jobs/workflows").then((res) => res.data),
  show: (id) => apiClient.get(`/jobs/${id}`).then((res) => res.data.data),
  create: (payload) => apiClient.post("/jobs", payload).then((res) => res.data.data),
  update: (id, payload) => apiClient.put(`/jobs/${id}`, payload).then((res) => res.data.data),
  remove: (id) => apiClient.delete(`/jobs/${id}`),
};
