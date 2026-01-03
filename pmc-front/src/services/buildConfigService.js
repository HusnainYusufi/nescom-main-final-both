// src/services/buildConfigService.js
import api from './api'

const buildConfigService = {
  getAll: async (params = {}) => {
    const { data } = await api.get('/build-config/all', { params })
    if (!Array.isArray(data?.result)) {
      throw new Error(data?.message || 'Unexpected response while loading build configurations')
    }
    return data.result
  },

  add: async (payload) => {
    const { data } = await api.post('/build-config/add', payload)
    if (!data?.result) {
      throw new Error(data?.message || 'Failed to create build configuration')
    }
    return data.result
  },
}

export default buildConfigService

