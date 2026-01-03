// src/services/api.js
import axios from 'axios'

// API base URL resolution:
// - If VITE_API_BASE_URL is provided at build time, we use it (absolute or relative).
//   Examples:
//     - VITE_API_BASE_URL=/api              (when using a reverse proxy on the same origin)
//     - VITE_API_BASE_URL=http://10.0.0.5:3254/api  (explicit backend host/port)
// - Otherwise, default to "same host as the frontend, port 3254, /api".
const resolveApiBaseUrl = () => {
  const raw = (import.meta.env.VITE_API_BASE_URL || '').trim()
  if (raw) return raw

  const protocol = window.location.protocol // keep http/https consistent with where the UI is served
  const host = window.location.hostname
  return `${protocol}//${host}:3254/api`
}

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 20000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Auto logout on 401 or expired token
    if (err?.response?.status === 401) {
      localStorage.clear()
      window.location.hash = '#/login'
    }
    return Promise.reject(err)
  },
)

export default api
