import { apiClient } from "./client";

export const publicApi = {
  studio: (slug) => apiClient.get(`/public/studios/${slug}`).then((res) => res.data.data),
  book: (slug, payload) =>
    apiClient.post(`/public/studios/${slug}/bookings`, payload).then((res) => res.data),
  delivery: (token) => apiClient.get(`/public/deliveries/${token}`).then((res) => res.data.data),
  approveDelivery: (token) =>
    apiClient.post(`/public/deliveries/${token}/approve`).then((res) => res.data.data),
  requestDeliveryChanges: (token, message) =>
    apiClient
      .post(`/public/deliveries/${token}/request-changes`, { message })
      .then((res) => res.data.data),
  contract: (token) => apiClient.get(`/public/contracts/${token}`).then((res) => res.data),
  acceptContract: (token) =>
    apiClient.post(`/public/contracts/${token}/accept`).then((res) => res.data),
  rejectContract: (token, message) =>
    apiClient.post(`/public/contracts/${token}/reject`, { message }).then((res) => res.data),
};
