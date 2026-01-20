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

  getById: async (id) => {
    const { data } = await api.get(`/part/${id}`)
    if (!data?.result) {
      throw new Error(data?.message || 'Part not found')
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

  update: async (id, payload) => {
    const { data } = await api.put(`/part/${id}`, payload)
    if (!data?.result) {
      throw new Error(data?.message || 'Failed to update part')
    }
    return data.result
  },

  delete: async (id) => {
    const { data } = await api.delete(`/part/${id}`)
    if (!data?.result) {
      throw new Error(data?.message || 'Failed to delete part')
    }
    return data.result
  },

  getTree: async (projectId, setId) => {
    const { data } = await api.get(`/part/tree/${projectId}/${setId}`)
    if (!Array.isArray(data?.result)) {
      throw new Error(data?.message || 'Unexpected response while loading tree')
    }
    return data.result
  },

  addToTree: async (payload) => {
    const { data } = await api.post('/part/tree', payload)
    if (!data?.result) {
      throw new Error(data?.message || 'Failed to add part to tree')
    }
    return data.result
  },

  removeFromTree: async (partId) => {
    const { data } = await api.delete(`/part/tree/${partId}`)
    if (!data?.result) {
      throw new Error(data?.message || 'Failed to remove part from tree')
    }
    return data.result
  },

  searchByDrawingNo: async (drawingNo) => {
    const { data } = await api.get(`/part/by-drawing/${drawingNo}`)
    if (!Array.isArray(data?.result)) {
      throw new Error(data?.message || 'Unexpected response while searching parts')
    }
    return data.result
  },

  getByProjectAndSet: async (projectId, setId) => {
    const { data } = await api.get('/part/all', { params: { project: projectId, set: setId } })
    if (!Array.isArray(data?.result)) {
      throw new Error(data?.message || 'Unexpected response while loading parts')
    }
    return data.result
  },
}

export default partService

