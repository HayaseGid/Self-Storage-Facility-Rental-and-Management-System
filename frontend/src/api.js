
/**
 * ============================================================
 * api.js — Frontend API Service Layer
 * ============================================================
 * Tất cả dữ liệu được lấy từ Backend API (http://localhost:5046).
 * Nếu backend chưa chạy → tự động fallback về seed data tĩnh.
 *
 * Khi backend thêm kho mới, facility mới, hoặc thay đổi giá:
 *   → Frontend KHÔNG cần sửa code gì cả.
 *   → Chỉ cần reload trang là dữ liệu cập nhật tự động.
 * ============================================================
 */

const BASE_URL = 'http://localhost:5046/api'

// ─── Fetch helper ─────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `HTTP ${res.status}`)
  }
  return res.json()
}

// ─── CATALOG: Facilities & Storage Units ──────────────────────

/**
 * Lấy danh sách Facilities và StorageUnits từ API.
 * Trả về { facilities, storageUnitsByFacility }
 *
 * Khi backend OFFLINE → trả về null (caller tự fallback).
 */
export async function fetchCatalog() {
  try {
    const data = await apiFetch('/catalog/state')
    // data = { facilities: [...], units: [...] }

    // Chuyển đổi facilities từ API sang format mà App.jsx dùng
    const facilities = data.facilities.map(f => ({
      id: f.id,
      name: f.name,
      location: f.address,
      image: getFacilityImage(f.id),   // ảnh tĩnh theo ID
      available: data.units.filter(u => u.facility === f.id && u.status === 'Available').length,
      total: data.units.filter(u => u.facility === f.id).length,
      tags: getFacilityTags(f.name),
      status: f.status,
      depositPercent: f.depositPercent,
    }))

    // Chuyển đổi units → nhóm theo tên facility
    const storageUnitsByFacility = {}
    for (const f of facilities) {
      storageUnitsByFacility[f.name] = data.units
        .filter(u => u.facility === String(f.id))
        .map(u => ({
          id: u.id,
          unitId: u.unitId,
          type: u.type,
          unitTypeId: u.unitTypeId,
          size: u.size,           // UnitSize.Dimensions từ DB, vd: "S1: Locker (<2.5m)"
          unitSizeId: u.unitSizeId,
          depositPercent: f.depositPercent,
          price: formatPrice(u.price),
          available: u.status === 'Available',
        }))
    }

    return { facilities, storageUnitsByFacility, raw: data }
  } catch (err) {
    console.warn('[API] fetchCatalog thất bại, dùng fallback:', err.message)
    return null   // null = backend offline
  }
}

// ─── AUTH: Login ──────────────────────────────────────────────

/**
 * Đăng nhập qua API.
 * Trả về { ok: true, user } hoặc { ok: false, message }
 */
export async function apiLogin(username, password) {
  try {
    const user = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
    return { ok: true, user }
  } catch (err) {
    return { ok: false, message: err.message || 'Đăng nhập thất bại' }
  }
}

/**
 * Đăng ký tài khoản mới qua API.
 */
export async function apiRegister(fullName, email, phone, password) {
  try {
    const result = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, phoneNumber: phone, password }),
    })
    return { ok: true, message: result.message }
  } catch (err) {
    return { ok: false, message: err.message || 'Đăng ký thất bại' }
  }
}

// ─── RESERVATION: Đặt kho ─────────────────────────────────────

/**
 * Tạo reservation mới qua API.
 */
export async function apiCreateReservation({ customerEmail, unitNumber, startDate, months, totalEstimatedCost }) {
  try {
    const result = await apiFetch('/reservation', {
      method: 'POST',
      body: JSON.stringify({ customerEmail, unitNumber, startDate, months, totalEstimatedCost }),
    })
    return { ok: true, reservationId: result.reservationId, message: result.message }
  } catch (err) {
    return { ok: false, message: err.message || 'Đặt kho thất bại' }
  }
}

// ─── Helpers ──────────────────────────────────────────────────

function formatPrice(amount) {
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ/tháng'
}

/** Ảnh đại diện cho từng facility (theo FacilityID từ DB) */
function getFacilityImage(facilityId) {
  const images = {
    '1': 'https://images.unsplash.com/photo-1586528116493-da8b0d2f8e52?auto=format&fit=crop&w=1200&q=85',
    '2': 'https://images.unsplash.com/photo-1565610222536-ef125c59da2e?auto=format&fit=crop&w=1200&q=85',
    '3': 'https://images.unsplash.com/photo-1565793298595-6a879b1d9492?auto=format&fit=crop&w=1200&q=85',
    '4': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=85',
    '5': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=85',
  }
  return images[String(facilityId)] || images['1']
}

/** Tag mô tả ngắn cho từng facility */
function getFacilityTags(name) {
  if (name.includes('Quận 1')) return ['Khu trung tâm', 'Dễ tiếp cận']
  if (name.includes('Tân Bình')) return ['Gần sân bay', 'An ninh 24/7']
  if (name.includes('Thủ Đức')) return ['Rộng rãi', 'Có bãi xe']
  if (name.includes('Quận 2')) return ['Khu đô thị mới', 'Hiện đại']
  if (name.includes('Quận 3')) return ['Trung tâm thành phố', 'Premium']
  return []
}
