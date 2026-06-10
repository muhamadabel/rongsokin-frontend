import axios from 'axios'

// Default ke BE hosting (bukan rahasia) supaya app tetap jalan tanpa .env —
// .env* di-gitignore jadi tidak ikut ke-push. Override via NEXT_PUBLIC_API_URL kalau pakai BE lokal.
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://be-rongsokin.hallojanu.xyz/api/v1'

const api = axios.create({ baseURL: BASE_URL })

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Daftar route yang membutuhkan auth — jika 401 di sini, redirect ke /login
const PROTECTED_PATHS = ['/dashboard', '/orders', '/profile', '/collector', '/pengepul']

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      const currentPath = window.location.pathname
      const isProtected = PROTECTED_PATHS.some((p) => currentPath.startsWith(p))
      if (isProtected) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default api
