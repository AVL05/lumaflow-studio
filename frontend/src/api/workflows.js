import { apiClient } from "./client";
const root = (id) => `/jobs/${id}/workflow`;
export const workflowsApi = {
  createTask: (id, data) => apiClient.post(`${root(id)}/tasks`, data).then((r) => r.data.data),
  createChecklist: (id, data) =>
    apiClient.post(`${root(id)}/checklists`, data).then((r) => r.data.data),
  show: (id) => apiClient.get(root(id)).then((r) => r.data.data),
  templates: (id, page = 1) =>
    apiClient.get(`${root(id)}/templates`, { params: { page } }).then((r) => r.data),
  preview: (id, key) =>
    apiClient.get(`${root(id)}/templates/${key}/preview`).then((r) => r.data.data),
  apply: (id, key, hash) =>
    apiClient
      .post(`${root(id)}/templates/${key}/apply`, { confirmed: true, preview_hash: hash })
      .then((r) => r.data.data),
  saveTemplate: (id, key, data) =>
    (key
      ? apiClient.put(`${root(id)}/templates/${key}`, data)
      : apiClient.post(`${root(id)}/templates`, data)
    ).then((r) => r.data.data),
  initialize: (id) => apiClient.post(`${root(id)}/initialize`, { confirmed: true }),
  createStage: (id, data) => apiClient.post(`${root(id)}/stages`, data).then((r) => r.data.data),
  updateStage: (id, stage, data) =>
    apiClient.put(`${root(id)}/stages/${stage}`, data).then((r) => r.data.data),
  moveStage: (id, stage, direction, revision) =>
    apiClient.put(`${root(id)}/stages/${stage}/move`, { direction, revision }),
};
