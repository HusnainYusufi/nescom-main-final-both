import api from './api'

const ORDERS_BASE = import.meta.env.VITE_ORDERS_API_BASE || api.defaults.baseURL

const call = async (method, url, { params, data, headers } = {}) => {
  const res = await api.request({
    method,
    url,
    params,
    data,
    headers,
    baseURL: ORDERS_BASE,
  })
  return res.data
}

const orderService = {
  getList: async (params = {}) => call('get', '/orders', { params }),

  getMyAssigned: async (params = {}) => call('get', '/orders/my-assigned', { params }),

  getAll: async () => {
    const data = await call('get', '/orders')
    return data.orders
  },

  // POST /imports/upload (form-data key = orderSheet)
  importSheet: async (file) => {
    const formData = new FormData()
    formData.append('orderSheet', file)
    return call('post', '/imports/upload', {
      data: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  // POST /orders/:orderNo/boxes
  createBox: async (orderNo, box) => call('post', `/orders/${orderNo}/boxes`, { data: box }),

  // POST /orders/manual
  createManual: async (orderData) => call('post', '/orders/manual', { data: orderData }),

  // POST /orders/royal-box/bulk
  markRoyalBoxBulk: async (orderNos) =>
    call('post', '/orders/royal-box/bulk', { data: { orderNos } }),

  // POST /orders/:orderNo/royal-box/disable
  unmarkRoyalBox: async (orderNo) => call('post', `/orders/${orderNo}/royal-box/disable`),

  assignWarehouse: async (orderNo, userId) =>
    call('post', `/orders/${orderNo}/assign-warehouse`, { data: { userId } }),

  // POST /orders/:orderNo/assign-royal      
  assignRoyal: async (orderNo, userA, userB) =>
    call('post', `/orders/${orderNo}/assign-royal`, { data: { userA, userB } }),

  // ===== Item Allocation (claim picks) =====
  allocateItems: async (orderNo, userId, picks) =>
    call('post', `/orders/${orderNo}/items/allocate`, { data: { userId, picks } }),

  // ===== Prep flow =====
  startPrep: async (orderNo) => call('post', `/orders/${orderNo}/prep/start`),

  completePrep: async (orderNo) => call('post', `/orders/${orderNo}/prep/complete`),

  // GET /orders/:orderNo/next-statuses
  getNextStatuses: async (orderNo) => call('get', `/orders/${orderNo}/next-statuses`),

  // POST /orders/:orderNo/scan
  scanStatus: async (orderNo, payload) =>
    call('post', `/orders/${orderNo}/scan`, { data: payload }),

  getCarriers: async () => call('get', '/carriers'),

  selectCarrier: async (orderNo, carrierCode) =>
    call('post', `/orders/${orderNo}/select-carrier`, { data: { carrierCode } }),

  getLineCarriers: async (orderNo) => call('get', `/orders/${orderNo}/line-carriers`),

  setLineCarriers: async (orderNo, lines, mode) =>
    call('post', `/orders/${orderNo}/line-carriers`, {
      data: { lines },
      params: mode ? { mode } : undefined,
    }),

  mergeLineCarriers: async (orderNo, lines) =>
    call('post', `/orders/${orderNo}/line-carriers`, { data: lines, params: { mode: 'merge' } }),

  previewDispatchPlan: async (orderNo, lines) =>
    call('post', `/orders/${orderNo}/dispatch-plan/preview`, { data: { lines } }),

  createDispatchPlan: async (orderNo, lines) =>
    call('post', `/orders/${orderNo}/dispatch-plan`, { data: { lines } }),
}

export default orderService
