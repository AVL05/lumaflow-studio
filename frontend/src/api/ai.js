import { apiClient } from "./client";

export const aiApi = {
  status: () => apiClient.get("/ai/status").then((res) => res.data),
  chat: (payload, config = {}) =>
    apiClient.post("/ai/chat", payload, config).then((res) => res.data),
  analyze: (payload) => apiClient.post("/ai/analyze", payload).then((res) => res.data.data),
  preset: (payload) => apiClient.post("/ai/preset", payload).then((res) => res.data.data),
  sessionPlan: (payload) =>
    apiClient.post("/ai/session-plan", payload).then((res) => res.data.data),
  recommendGear: (payload) =>
    apiClient.post("/ai/recommend-gear", payload).then((res) => res.data.data),
  history: (params) => apiClient.get("/ai/history", { params }).then((res) => res.data),
  showHistory: (id) => apiClient.get(`/ai/history/${id}`).then((res) => res.data.data),
  updateHistory: (id, payload) =>
    apiClient.patch(`/ai/history/${id}`, payload).then((res) => res.data.data),
  deleteHistory: (id) => apiClient.delete(`/ai/history/${id}`),
};
