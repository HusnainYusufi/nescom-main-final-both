// src/services/skuBundlesService.js
import api from './api'

/**
 * SKU Bundles (Associations) Service
 * Base path: /sku-bundles
 *
 * Notes:
 * - Canonical key for lookups is parentSku (string), but update/delete use :id
 * - All endpoints assume Bearer auth is already configured in api
 */
const skuBundlesService = {
  /**
   * Search (typeahead-friendly, but we'll call it on button click)
   * params: { q (required), limit=8, mode='prefix' | 'contains', includeComponents=false }
   */
  search: async ({ q, limit = 8, mode = 'prefix', includeComponents = false } = {}) => {
    const qs = new URLSearchParams()
    if (typeof q === 'string') qs.set('q', q)
    if (limit) qs.set('limit', String(Math.max(1, Math.min(50, limit))))
    if (mode) qs.set('mode', mode)
    if (includeComponents) qs.set('includeComponents', 'true')
    const { data } = await api.get(`/sku-bundles/search?${qs.toString()}`)
    return data // { status, q, results:[{ id, parentSku, name, label, sampleComponents? }] }
  },

  create: async (payload) => {
    const { data } = await api.post('/sku-bundles', payload)
    return data
  },

  list: async ({ q, includeInactive = false, page = 1, limit = 20, sort = '-updatedAt' } = {}) => {
    const qs = new URLSearchParams()
    if (q) qs.set('q', q)
    if (includeInactive) qs.set('includeInactive', 'true')
    if (page) qs.set('page', page)
    if (limit) qs.set('limit', limit)
    if (sort) qs.set('sort', sort)
    const { data } = await api.get(`/sku-bundles?${qs.toString()}`)
    return data // { status, page, limit, total, results:[] }
  },

  getById: async (id) => {
    const { data } = await api.get(`/sku-bundles/${id}`)
    return data
  },

  getBySku: async (parentSku) => {
    const { data } = await api.get(`/sku-bundles/by-sku/${encodeURIComponent(parentSku)}`)
    return data
  },

  update: async (id, payload) => {
    const { data } = await api.put(`/sku-bundles/${id}`, payload)
    return data
  },

  remove: async (id) => {
    const { data } = await api.delete(`/sku-bundles/${id}`)
    return data
  },

  expandBySku: async (parentSku, qty = 1) => {
    const { data } = await api.get(`/sku-bundles/${encodeURIComponent(parentSku)}/expand?qty=${Number(qty) || 1}`)
    return data
  },

  expandCart: async (payload) => {
    const { data } = await api.post('/sku-bundles/expand', payload)
    return data
  },
}

export default skuBundlesService
