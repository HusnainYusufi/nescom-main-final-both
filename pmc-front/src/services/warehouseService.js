// src/services/warehouseService.js
import api from './api'

const warehouseService = {
  // Fetch all warehouses
  getAll: async () => {
    const { data } = await api.get('/warehouse')
    return data.result
  },

  // Add a new warehouse
  add: async (warehouse) => {
    const { data } = await api.post('/warehouse/add', warehouse)
    return data
  },
}

export default warehouseService
