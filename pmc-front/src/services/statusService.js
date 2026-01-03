// src/services/statusService.js
import api from './api'

const statusService = {
  getAll: async (params = {}) => {
    const { data } = await api.get('/status-entry/all', { params })
    if (!Array.isArray(data?.result)) {
      throw new Error(data?.message || 'Unexpected response while loading status entries')
    }
    return data.result
  },
  add: async (payload) => {
    const { data } = await api.post('/status-entry/add', payload)
    if (!data?.result) throw new Error(data?.message || 'Failed to create status entry')
    return data.result
  },
  update: async (id, payload) => {
    const { data } = await api.put(`/status-entry/${id}`, payload)
    if (!data?.result) throw new Error(data?.message || 'Failed to update status entry')
    return data.result
  },
}

export default statusService

