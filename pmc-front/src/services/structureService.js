// src/services/structureService.js
import api from './api'

const structureService = {
  getAll: async () => {
    const { data } = await api.get('/structure/all')
    if (!Array.isArray(data?.result)) throw new Error(data?.message || 'Unexpected structure response')
    return data.result
  },
  add: async (payload) => {
    const { data } = await api.post('/structure/add', payload)
    if (!data?.result) throw new Error(data?.message || 'Failed to create structure')
    return data.result
  },
}

export default structureService

