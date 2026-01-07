// src/services/qualificationTestService.js
import api from './api'

const qualificationTestService = {
  getAll: async (params = {}) => {
    const { data } = await api.get('/qualification-test/all', { params })
    if (!Array.isArray(data?.result)) {
      throw new Error(data?.message || 'Unexpected response while loading qualification tests')
    }
    return data.result
  },

  add: async (payload) => {
    const { data } = await api.post('/qualification-test/add', payload)
    if (!data?.result) {
      throw new Error(data?.message || 'Failed to create qualification test')
    }
    return data.result
  },
  upload: async (file) => {
    const formData = new FormData()
    formData.append('document', file)
    const { data } = await api.post('/qualification-test/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    if (!data?.result) {
      throw new Error(data?.message || 'Failed to upload document')
    }
    return data.result
  },
}

export default qualificationTestService
