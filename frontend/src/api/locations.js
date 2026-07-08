import { apiClient } from './client'

export const locationsApi = {
  list: (params) => apiClient.get('/locations', { params }).then((res) => (params ? res.data : res.data.data)),
  show: (id) => apiClient.get(`/locations/${id}`).then((res) => res.data.data),
  create: (payload) => apiClient.post('/locations', payload).then((res) => res.data.data),
  update: (id, payload) => apiClient.put(`/locations/${id}`, payload).then((res) => res.data.data),
  remove: (id) => apiClient.delete(`/locations/${id}`),
}
