// src/services/setService.js
import api from './api'

const setService = {
  getAll: async (params = {}) => {
    const { data } = await api.get('/set/all', { params })
    if (!Array.isArray(data?.result)) {
      throw new Error(data?.message || 'Unexpected response while loading sets')
    }
    return data.result
  },
  add: async (payload) => {
    const { data } = await api.post('/set/add', payload)
    if (!data?.result) throw new Error(data?.message || 'Failed to create set')
    return data.result
  },
  update: async (id, payload) => {
    const { data } = await api.put(`/set/${id}`, payload)
    if (!data?.result) throw new Error(data?.message || 'Failed to update set')
    return data.result
  },
}

export default setService

