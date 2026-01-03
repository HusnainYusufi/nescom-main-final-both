// src/services/assemblyService.js
import api from './api'

const assemblyService = {
  getAll: async () => {
    const { data } = await api.get('/assembly/all')
    if (!Array.isArray(data?.result)) {
      throw new Error(data?.message || 'Unexpected response while loading assemblies')
    }
    return data.result
  },
  add: async (payload) => {
    const { data } = await api.post('/assembly/add', payload)
    if (!data?.result) throw new Error(data?.message || 'Failed to create assembly')
    return data.result
  },

  addQcReport: async (assemblyId, payload) => {
    const { data } = await api.post(`/assembly/${assemblyId}/qc-report`, payload)
    if (!data?.result) throw new Error(data?.message || 'Failed to add QC report')
    return data.result
  },
}

export default assemblyService

