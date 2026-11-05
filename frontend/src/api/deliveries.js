import { apiClient } from "./client";

export const deliveriesApi = {
  list: (params) =>
    apiClient.get("/deliveries", { params }).then((res) => (params ? res.data : res.data.data)),
  show: (id) => apiClient.get(`/deliveries/${id}`).then((res) => res.data.data),
  create: (payload) =>
    apiClient
      .post(payload.job_id ? `/jobs/${payload.job_id}/deliveries` : "/deliveries", payload)
      .then((res) => res.data.data),
  update: (id, payload) => apiClient.put(`/deliveries/${id}`, payload).then((res) => res.data.data),
  history: (id, params) =>
    apiClient.get(`/deliveries/${id}/history`, { params }).then((res) => res.data),
  publish: (id, payload) =>
    apiClient.post(`/deliveries/${id}/revisions`, payload).then((res) => res.data.data),
  respond: (id, action, payload) =>
    apiClient.post(`/deliveries/${id}/actions/${action}`, payload).then((res) => res.data.data),
  portal: (id, payload) =>
    apiClient.post(`/deliveries/${id}/portal`, payload).then((res) => res.data.data),
  remove: (id) => apiClient.delete(`/deliveries/${id}`),
};
