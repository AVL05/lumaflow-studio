import { apiClient } from "./client";

export const checklistsApi = {
  list: (params) =>
    apiClient.get("/checklists", { params }).then((res) => res.data.data),
  show: (id) => apiClient.get(`/checklists/${id}`).then((res) => res.data.data),
  create: (payload) =>
    apiClient.post("/checklists", payload).then((res) => res.data.data),
  update: (id, payload) =>
    apiClient.put(`/checklists/${id}`, payload).then((res) => res.data.data),
  remove: (id) => apiClient.delete(`/checklists/${id}`),
  duplicate: (id) =>
    apiClient.post(`/checklists/${id}/duplicate`).then((res) => res.data.data),
  reorder: (id, items) =>
    apiClient
      .put(`/checklists/${id}/reorder`, { items })
      .then((res) => res.data.data),
  templates: () =>
    apiClient.get("/checklists/templates").then((res) => res.data.data),
  addItem: (checklistId, payload) =>
    apiClient
      .post(`/checklists/${checklistId}/items`, payload)
      .then((res) => res.data.data),
  updateItem: (itemId, payload) =>
    apiClient
      .put(`/checklist-items/${itemId}`, payload)
      .then((res) => res.data.data),
  toggleItem: (itemId, isCompleted) =>
    apiClient
      .patch(`/checklist-items/${itemId}/toggle`, { is_completed: isCompleted })
      .then((res) => res.data.data),
  removeItem: (itemId) => apiClient.delete(`/checklist-items/${itemId}`),
};
