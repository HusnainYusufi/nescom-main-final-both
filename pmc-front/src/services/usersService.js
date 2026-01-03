// src/services/usersService.js
import api from './api'

const usersService = {
  // GET /users  -> returns { status, result: [...] }
  getAll: async () => {
    const res = await api.get('/user/all')
    return res.data.result
  },

  // POST /users  -> body: { name, email, phone, password, role, warehouseId }
  add: async (payload) => {
    const res = await api.post('/user/add', payload)
    return res.data
  },
}

export default usersService
