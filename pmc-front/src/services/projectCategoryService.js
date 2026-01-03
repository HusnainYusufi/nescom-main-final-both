// src/services/projectCategoryService.js
import api from './api'

const projectCategoryService = {
  getAll: async () => {
    const { data } = await api.get('/project-category/all')
    if (!Array.isArray(data?.result)) {
      throw new Error(data?.message || 'Unexpected response while loading categories')
    }
    return data.result
  },
  add: async (payload) => {
    const { data } = await api.post('/project-category/add', payload)
    if (!data?.result) {
      throw new Error(data?.message || 'Failed to create category')
    }
    return data.result
  },
}

export default projectCategoryService

