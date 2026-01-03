// src/services/issueService.js
import api from './api'

const issueService = {
  getAll: async () => {
    const { data } = await api.get('/issue/all')
    if (!Array.isArray(data?.result)) {
      throw new Error(data?.message || 'Unexpected response while loading issues')
    }
    return data.result
  },

  add: async (payload) => {
    const { data } = await api.post('/issue/add', payload)
    if (!data?.result) {
      throw new Error(data?.message || 'Failed to create issue')
    }
    return data.result
  },
}

export default issueService

