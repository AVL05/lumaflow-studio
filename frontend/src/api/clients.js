import { apiClient } from './client'

export const clientsApi = {
  list: (params) => apiClient.get('/clients', { params }).then((res) => (params ? res.data : res.data.data)),
  show: (id) => apiClient.get(`/clients/${id}`).then((res) => res.data.data),
  create: (payload) => apiClient.post('/clients', payload).then((res) => res.data.data),
  update: (id, payload) => apiClient.put(`/clients/${id}`, payload).then((res) => res.data.data),
  remove: (id) => apiClient.delete(`/clients/${id}`),
}
