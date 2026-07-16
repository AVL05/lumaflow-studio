import { apiClient } from "./client";

export const bookingRequestsApi = {
  list: (params) =>
    apiClient
      .get("/booking-requests", { params })
      .then((res) => (params ? res.data : res.data.data)),
  updateStatus: (id, status) =>
    apiClient.patch(`/booking-requests/${id}`, { status }).then((res) => res.data.data),
  convert: (id) => apiClient.post(`/booking-requests/${id}/convert`).then((res) => res.data.data),
  remove: (id) => apiClient.delete(`/booking-requests/${id}`),
};
