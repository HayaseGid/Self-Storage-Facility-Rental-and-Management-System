/**
 * api/client.js — apiFetch duy nhất của toàn bộ frontend.
 *
 * Mọi lệnh gọi HTTP đều đi qua đây. Muốn:
 *  - Đổi base URL → sửa VITE_API_URL trong .env
 *  - Thêm JWT header → sửa 1 chỗ duy nhất ở đây
 *  - Thêm global error handling → sửa ở đây
 *  Không cần đụng vào auth.js, reservations.js...
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5046/api'

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('storespace_token')

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `HTTP ${res.status}`)
  }

  if (res.status === 204) return null
  return res.json()
}
