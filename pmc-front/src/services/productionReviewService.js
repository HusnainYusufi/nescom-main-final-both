import api from './api'

const productionReviewService = {
  getMeetings: async (params = {}) => {
    const { data } = await api.get('/production-review/meetings', { params })
    if (!Array.isArray(data?.result)) {
      throw new Error(data?.message || 'Unexpected response while loading meetings')
    }
    return data.result
  },
  addMeeting: async (payload) => {
    const { data } = await api.post('/production-review/meetings', payload)
    if (!data?.result) throw new Error(data?.message || 'Failed to create meeting')
    return data.result
  },
  updateMeeting: async (id, payload) => {
    const { data } = await api.put(`/production-review/meetings/${id}`, payload)
    if (!data?.result) throw new Error(data?.message || 'Failed to update meeting')
    return data.result
  },
  getDiscussionPoints: async (params = {}) => {
    const { data } = await api.get('/production-review/discussion-points', { params })
    if (!Array.isArray(data?.result)) {
      throw new Error(data?.message || 'Unexpected response while loading discussion points')
    }
    return data.result
  },
  addDiscussionPoint: async (payload) => {
    const { data } = await api.post('/production-review/discussion-points', payload)
    if (!data?.result) throw new Error(data?.message || 'Failed to create discussion point')
    return data.result
  },
}

export default productionReviewService
