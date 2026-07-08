import { apiClient } from "./client";

export const photosApi = {
  list: (params) =>
    apiClient
      .get("/photos", { params })
      .then((res) => (params ? res.data : res.data.data)),
  upload: (payload) =>
    apiClient
      .post("/photos/upload", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => res.data.data),
  update: (id, payload) =>
    apiClient.put(`/photos/${id}`, payload).then((res) => res.data.data),
  remove: (id) => apiClient.delete(`/photos/${id}`),
};
