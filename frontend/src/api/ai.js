import { apiClient } from './client'

export const aiApi = {
  status: () => apiClient.get('/ai/status').then((res) => res.data),
  chat: (payload) => apiClient.post('/ai/chat', payload).then((res) => res.data),
  analyze: (payload) => apiClient.post('/ai/analyze', payload).then((res) => res.data.data),
  analyzePhoto: (payload) => apiClient.post('/ai/analyze-photo', payload).then((res) => res.data.data),
  assistant: (payload) => apiClient.post('/ai/assistant', payload).then((res) => res.data),
}
