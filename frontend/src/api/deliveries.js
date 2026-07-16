import { apiClient } from "./client";

export const deliveriesApi = {
  list: (params) =>
    apiClient.get("/deliveries", { params }).then((res) => (params ? res.data : res.data.data)),
  show: (id) => apiClient.get(`/deliveries/${id}`).then((res) => res.data.data),
  create: (payload) => apiClient.post("/deliveries", payload).then((res) => res.data.data),
  update: (id, payload) => apiClient.put(`/deliveries/${id}`, payload).then((res) => res.data.data),
  remove: (id) => apiClient.delete(`/deliveries/${id}`),
  uploadImages: (id, images) => {
    const data = new FormData();
    images.forEach((image) => data.append("images[]", image));
    return apiClient.post(`/deliveries/${id}/images`, data).then((res) => res.data.data);
  },
  removeImage: (deliveryId, imageId) =>
    apiClient.delete(`/deliveries/${deliveryId}/images/${imageId}`),
};
