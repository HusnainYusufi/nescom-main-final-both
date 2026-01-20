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

  getById: async (id) => {
    const { data } = await api.get(`/assembly/${id}`)
    if (!data?.result) throw new Error(data?.message || 'Assembly not found')
    return data.result
  },

  add: async (payload) => {
    const { data } = await api.post('/assembly/add', payload)
    if (!data?.result) throw new Error(data?.message || 'Failed to create assembly')
    return data.result
  },

  update: async (id, payload) => {
    const { data } = await api.put(`/assembly/${id}`, payload)
    if (!data?.result) throw new Error(data?.message || 'Failed to update assembly')
    return data.result
  },

  delete: async (id) => {
    const { data } = await api.delete(`/assembly/${id}`)
    if (!data?.result) throw new Error(data?.message || 'Failed to delete assembly')
    return data.result
  },

  addQcReport: async (assemblyId, payload) => {
    const { data } = await api.post(`/assembly/${assemblyId}/qc-report`, payload)
    if (!data?.result) throw new Error(data?.message || 'Failed to add QC report')
    return data.result
  },
}

export default assemblyService

