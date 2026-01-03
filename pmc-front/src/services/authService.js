// src/services/authService.js
import api from './api'

const authService = {
  // Perform login
  login: async ({ email, password }) => {
    const payload = { identifier: (email || '').trim(), password }
    const { data } = await api.post('/auth/login', payload)
    const result = data?.result
    if (!result?.token) {
      throw new Error(data?.message || 'Invalid response from server')
    }

    const user = result.user || {}
    const accessToken = result.token
    const expiresAt = result.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // backend issues 1d JWT

    // Store for later
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('expiresAt', expiresAt)
    localStorage.setItem('userId', user.id || user._id || '')
    localStorage.setItem('userName', user.username || user.name || '')
    localStorage.setItem('userEmail', user.email || '')
    localStorage.setItem('userRole', user.role || '')
    localStorage.removeItem('refreshToken') // backend does not issue refresh tokens

    return {
      status: data.status,
      message: data.message,
      user,
      accessToken,
      expiresAt,
    }
  },

  // Logout
  logout: () => {
    localStorage.clear()
  },

  // Auth check
  isAuthenticated: () => {
    const token = localStorage.getItem('accessToken')
    const expiresAt = localStorage.getItem('expiresAt')
    if (!token || !expiresAt) return false
    return new Date(expiresAt) > new Date()
  },

  // ----- Compatibility Helpers -----
  getCurrentNameFromToken: () => {
    return localStorage.getItem('userName') || ''
  },

  getCurrentEmailFromToken: () => {
    return localStorage.getItem('userEmail') || ''
  },

  getCurrentRoleFromToken: () => {
    return localStorage.getItem('userRole') || ''
  },

  getCurrentUserIdFromToken: () => {
    return localStorage.getItem('userId') || ''
  },
  // ---------------------------------

  getUser: () => ({
    id: localStorage.getItem('userId'),
    name: localStorage.getItem('userName'),
    email: localStorage.getItem('userEmail'),
    role: localStorage.getItem('userRole'),
  }),

  getAccessToken: () => localStorage.getItem('accessToken'),
  getRefreshToken: () => localStorage.getItem('refreshToken'),
}

export default authService
