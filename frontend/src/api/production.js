import { apiClient } from "./client";

const path = (id) => `/jobs/${id}`;
export const productionApi = {
  shots: (id, params) => apiClient.get(`${path(id)}/shots`, { params }).then((r) => r.data),
  createShot: (id, data) => apiClient.post(`${path(id)}/shots`, data).then((r) => r.data.data),
  updateShot: (id, shot, data) =>
    apiClient.patch(`${path(id)}/shots/${shot}`, data).then((r) => r.data.data),
  duplicate: (id, shot) =>
    apiClient.post(`${path(id)}/shots/${shot}/duplicate`).then((r) => r.data.data),
  remove: (id, shot) => apiClient.delete(`${path(id)}/shots/${shot}`),
  move: (id, shot, direction) => apiClient.put(`${path(id)}/shots/${shot}/move`, { direction }),
  days: (id, params) =>
    apiClient.get(`${path(id)}/production-days`, { params }).then((r) => r.data),
  createDay: (id, data) =>
    apiClient.post(`${path(id)}/production-days`, data).then((r) => r.data.data),
  updateDay: (id, day, data) =>
    apiClient.put(`${path(id)}/production-days/${day}`, data).then((r) => r.data.data),
  pdf: (id, sessionId) =>
    apiClient
      .get(`${path(id)}/production/pdf`, {
        params: { session_id: sessionId || undefined },
        responseType: "blob",
      })
      .then((r) => r.data),
};
