/**
 * api/catalog.js — Danh sách cơ sở và kho
 *
 * Backend GET /catalog/state trả { facilities: [...], units: [...] }
 * Hàm này chuyển đổi sang dạng UI cần.
 * Khi backend offline → trả null, caller tự fallback về dữ liệu tĩnh.
 */

import { apiFetch } from './client.js'

export async function fetchCatalog() {
  try {
    const data = await apiFetch('/catalog/state')

    const facilities = data.facilities.map(f => ({
      id: f.id,
      name: f.name,
      location: f.address,
      image: getFacilityImage(f.id),
      available: data.units.filter(u => u.facility === f.id && u.status === 'Available').length,
      total: data.units.filter(u => u.facility === f.id).length,
      depositPercent: f.depositPercent,
      tags: getFacilityTags(f.name),
      status: f.status,
    }))

    const storageUnitsByFacility = {}
    for (const f of facilities) {
      storageUnitsByFacility[f.name] = data.units
        .filter(u => u.facility === String(f.id))
        .map(u => ({
          id: u.id,         // UnitNumber từ DB, ví dụ "Q1-U01"
          unitId: u.unitId,
          type: u.type,
          unitTypeId: u.unitTypeId,
          size: u.size,     // UnitSize.Dimensions
          unitSizeId: u.unitSizeId,
          depositPercent: f.depositPercent,
          price: formatPrice(u.price), // chuyển số → chuỗi chỉ ở đây
          available: u.status === 'Available',
        }))
    }

    return { facilities, storageUnitsByFacility, raw: data }
  } catch (err) {
    console.warn('[API] fetchCatalog thất bại, dùng fallback:', err.message)
    return null
  }
}

// ─── Format helpers (chỉ nằm ở frontend) ─────────────────────

function formatPrice(amount) {
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ/tháng'
}

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

function getFacilityTags(name) {
  if (name.includes('Quận 1'))   return ['Khu trung tâm', 'Dễ tiếp cận']
  if (name.includes('Tân Bình')) return ['Gần sân bay', 'An ninh 24/7']
  if (name.includes('Thủ Đức')) return ['Rộng rãi', 'Có bãi xe']
  if (name.includes('Quận 2'))   return ['Khu đô thị mới', 'Hiện đại']
  if (name.includes('Quận 3'))   return ['Trung tâm thành phố', 'Premium']
  return []
}
