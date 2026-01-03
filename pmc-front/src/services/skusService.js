// src/services/skusService.js
import api from './api'

const skusService = {
  /**
   * NEW: Live (on-demand) typeahead search
   * GET /skus/search
   * @param {Object} params
   * @param {string} params.q
   * @param {number} [params.limit=8]      1..50
   * @param {'prefix'|'contains'} [params.mode='prefix']
   * @param {boolean} [params.includeInactive=false]
   */
  search: async ({ q, limit = 8, mode = 'prefix', includeInactive = false } = {}) => {
    const qs = new URLSearchParams()
    if (typeof q === 'string') qs.set('q', q)
    if (limit) qs.set('limit', String(Math.max(1, Math.min(50, limit))))
    if (mode) qs.set('mode', mode)
    if (includeInactive) qs.set('includeInactive', 'true')
    const { data } = await api.get(`/skus/search?${qs.toString()}`)
    // { status, q, results:[{ id, sku, productName, label, score }] }
    return data
  },

  /**
   * List SKUs (server-side pagination & filtering)
   * GET /skus
   */
  list: async ({ q, page = 1, limit = 20, isActive } = {}) => {
    const query = new URLSearchParams()
    if (q) query.set('q', q)
    if (page) query.set('page', page)
    if (limit) query.set('limit', limit)
    if (typeof isActive === 'boolean') query.set('isActive', String(isActive))
    const { data } = await api.get(`/skus?${query.toString()}`)
    // backend: { status, page, limit, total, results:[...] }
    return data
  },

  /**
   * Import SKUs via Excel (multipart)
   */
  importExcel: async (file) => {
    const fd = new FormData()
    fd.append('file', file)
    const { data } = await api.post('/skus/import', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data // { status, message, stats:{ total, upserted, modified } }
  },

  /**
   * Add / Update / Delete
   */
  add: async (payload) => {
    const { data } = await api.post('/skus', payload)
    return data
  },

  update: async (skuId, payload) => {
    const { data } = await api.put(`/skus/${skuId}`, payload)
    return data
  },

  remove: async (skuId) => {
    const { data } = await api.delete(`/skus/${skuId}`)
    return data
  },
}

export default skusService
