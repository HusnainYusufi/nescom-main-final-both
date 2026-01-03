// src/services/packagesService.js
import api from './api'

const packageService = {
  // Fetch saved packages + summary
  // GET /orders/:orderNo/packages
  getPackages: async (orderNo) => {
    const { data } = await api.get(`/orders/${orderNo}/packages`)
    return data // { packages, summary, totalWeight }
  },

  // Get a draft packing plan (optional)
  // POST /orders/:orderNo/packages/preview
  previewPackages: async (orderNo, payload) => {
    const { data } = await api.post(`/orders/${orderNo}/packages/preview`, payload || {})
    return data // { draft: [...] }
  },

  // Save/replace packages
  // POST /orders/:orderNo/packages
  savePackages: async (orderNo, payload) => {
    const { data } = await api.post(`/orders/${orderNo}/packages`, payload)
    return data // { packages, summary, totalWeight }
  },

  // Set carrier for one package (whole-package carrier)
  // PATCH /orders/:orderNo/packages/:packageId/carrier { carrierCode }
  setPackageCarrier: async (orderNo, packageId, carrierCode) => {
    const { data } = await api.patch(
      `/orders/${orderNo}/packages/${packageId}/carrier`,
      { carrierCode },
    )
    return data // { status: 200, order: {...} }
  },

  // Generate a label for a single package
  // POST /orders/:orderNo/packages/:packageId/label
  createPackageLabel: async (orderNo, packageId) => {
    const { data } = await api.post(`/orders/${orderNo}/packages/${packageId}/label`)
    return data // { status, label: { pdfUrl, ... } }
  },

  // (Helper) fetch labels for an order (useful if you want to list/view)
  // GET /labels/order/:orderNo[?packageId=...]
  getLabels: async (orderNo, packageId) => {
    const { data } = await api.get(`/labels/order/${orderNo}`, {
      params: packageId ? { packageId } : undefined,
    })
    return data // { labels: [...] }
  },

  // Quick helper to open one package's PDF (path on your server)
  getPackagePdfUrl: (orderNo, packageId) =>
    `/labels/${orderNo}/packages/${packageId}/pdf`,


  // POST /orders/:orderNo/packages/labels  { regenerate: true|false }
  generateAllPackageLabels: async (orderNo, body = { regenerate: true }) => {
    const { data } = await api.post(`/orders/${orderNo}/packages/labels`, {
      regenerate: true,
      ...(body || {}),
    })
    return data // { status, orderNo, results[...] } or {generated, skipped, errors}
  },

  // POST /orders/:orderNo/packages/select-carrier  { carrierCode, mode: "all" | "missing-only" }
  selectCarrierForPackages: async (orderNo, { carrierCode, mode = 'all' }) => {
    const { data } = await api.post(`/orders/${orderNo}/packages/select-carrier`, {
      carrierCode,
      mode,
    })
    return data // { status:200, ... }
  },
}

export default packageService
