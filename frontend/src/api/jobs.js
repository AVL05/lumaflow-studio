import { apiClient } from "./client";

export const jobsApi = {
  list: (params) => apiClient.get("/jobs", { params }).then((res) => res.data.data),
  workflows: () => apiClient.get("/jobs/workflows").then((res) => res.data),
  show: (id) => apiClient.get(`/jobs/${id}`).then((res) => res.data.data),
  create: (payload) => apiClient.post("/jobs", payload).then((res) => res.data.data),
  update: (id, payload) => apiClient.put(`/jobs/${id}`, payload).then((res) => res.data.data),
  remove: (id) => apiClient.delete(`/jobs/${id}`),
  page: (params) =>
    apiClient.get("/jobs", { params: { ...params, paginate: 1 } }).then((res) => res.data),
  options: (id, params) =>
    apiClient.get(id ? `/jobs/${id}/options` : "/jobs/options", { params }).then((res) => res.data),
  briefing: (id, briefing, revision) =>
    apiClient.put(`/jobs/${id}/briefing`, { briefing, revision }).then((res) => res.data.data),
};
