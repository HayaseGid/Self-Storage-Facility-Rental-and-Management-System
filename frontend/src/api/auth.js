/**
 * api/auth.js — Đăng nhập và Đăng ký
 *
 * Backend DTO LoginRequestDTO: { Email, Password }
 * Backend DTO RegisterRequestDTO: { FullName, Email, Password, RoleName }
 * Backend trả AuthResponseDTO: { userID, fullName, email, roleName, status }
 */

import { apiFetch } from './client.js'
import { RoleNames } from '../constants/roles.js'

/**
 * Đăng nhập.
 * Trả { ok: true, user: AuthResponseDTO } hoặc { ok: false, message }
 */
export async function login(email, password) {
  try {
    const user = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    return { ok: true, user }
  } catch (err) {
    return { ok: false, message: err.message || 'Đăng nhập thất bại' }
  }
}

/**
 * Đăng ký tài khoản khách hàng mới.
 * Luôn gửi roleName = 'Storage Customer'.
 * Trả { ok: true, message } hoặc { ok: false, message }
 */
export async function register(fullName, email, password) {
  try {
    const result = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        fullName,
        email,
        password,
        roleName: RoleNames.StorageCustomer,
      }),
    })
    return { ok: true, message: result.message }
  } catch (err) {
    return { ok: false, message: err.message || 'Đăng ký thất bại' }
  }
}
