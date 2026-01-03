// src/services/partService.js
import api from './api'

const partService = {
  getAll: async (params = {}) => {
    const { data } = await api.get('/part/all', { params })
    if (!Array.isArray(data?.result)) {
      throw new Error(data?.message || 'Unexpected response while loading parts')
    }
    return data.result
  },

  add: async (payload) => {
    const { data } = await api.post('/part/add', payload)
    if (!data?.result) {
      throw new Error(data?.message || 'Failed to create part')
    }
    return data.result
  },
}

export default partService

