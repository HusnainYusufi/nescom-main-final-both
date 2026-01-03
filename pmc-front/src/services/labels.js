// src/services/labels.js
import api from './api' // axios instance with baseURL from env + JWT header

export default {
  // POST /labels  { orderNos: [...] }
  generate: async (orderNos) => {
    const { data } = await api.post('/labels', { orderNos })
    return data
  },

  // GET /labels
  list: async () => {
    const { data } = await api.get('/labels')
    return data
  },

  // GET /labels/order/:orderNo
  getByOrderNo: async (orderNo) => {
    const { data } = await api.get(`/labels/order/${orderNo}`)
    if (!data.labels || data.labels.length === 0) {
      throw new Error('Label not found')
    }
    return data.labels[0].pdfUrl
  },
}
