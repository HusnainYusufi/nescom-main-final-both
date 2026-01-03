// src/services/projectService.js
import api from './api'

const projectService = {
  getAll: async () => {
    const { data } = await api.get('/project/all')
    if (!Array.isArray(data?.result)) {
      throw new Error(data?.message || 'Unexpected response while loading projects')
    }
    return data.result
  },

  add: async (payload) => {
    const { data } = await api.post('/project/add', payload)
    if (!data?.result) {
      throw new Error(data?.message || 'Failed to create project')
    }
    return data.result
  },

  update: async (projectId, payload) => {
    const { data } = await api.put(`/project/${projectId}`, payload)
    if (!data?.result) {
      throw new Error(data?.message || 'Failed to update project')
    }
    return data.result
  },

  updateStatus: async (projectId, status) => {
    const { data } = await api.put(`/project/${projectId}/status`, { status })
    if (!data?.result) {
      throw new Error(data?.message || 'Failed to update project status')
    }
    return data.result
  },
}

export default projectService
