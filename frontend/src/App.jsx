import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import CustomerDashboard from './CustomerAccount'

//Đã cập nhật: Thêm cho Staff
import StaffPortal, { SEED_USERS as STAFF_ACCOUNTS } from './FacilityStaffAccount'
//Đã thêm: 04/10/2026

//Đã cập nhật: Thêm cho FqcilityManager
import FacilityManagerDashboard, { MANAGER_ACCOUNTS } from './FacilityManagerAccount'
//Đã thêm: 05/10/2026

// Thêm: System Admin & Business Operations
import Admin from './AdminAccount'
import BusinessOperations from './BusinessOperations'

// Kết nối API thực — frontend lấy dữ liệu từ backend thay vì hard-code
import { fetchCatalog } from './api.js'

const SYSTEM_ACCOUNTS = [
  { fullName: 'System Admin', email: 'admin@storespace.vn', password: 'Admin@123', role: 'SYSTEM_ADMIN' },
  { fullName: 'Business Operations', email: 'business@storespace.vn', password: 'Business@123', role: 'BUSINESS_OPERATIONS' }
]

// Đường dẫn trang làm việc theo role
function roleHome(role) {
  switch (role) {
    case 'SYSTEM_ADMIN': return '/admin'
    case 'BUSINESS_OPERATIONS': return '/business'
    case 'FACILITY_MANAGER': return '/manager'
    case 'FACILITY_STAFF': return '/staff'
    default: return '/customer'
  }
}

// ============================================================
// DỮ LIỆU CƠ SỞ – khớp 100% với SelfStorageDB.sql (FacilityID 1-5)
// ============================================================
const facilities = [
  {
    id: 1,
    name: 'Cơ sở Lưu trữ Quận 1',
    location: '123 Lê Lợi, Quận 1, TP.HCM',
    image: 'https://images.unsplash.com/photo-1586528116493-da8b0d2f8e52?auto=format&fit=crop&w=1200&q=85',
    available: 8, total: 10,
    tags: ['Khu trung tâm', 'Dễ tiếp cận'],
    phone: '0812345678', status: 'Active'
  },
  {
    id: 2,
    name: 'Cơ sở Lưu trữ Tân Bình',
    location: '456 Cộng Hòa, Tân Bình, TP.HCM',
    image: 'https://images.unsplash.com/photo-1565610222536-ef125c59da2e?auto=format&fit=crop&w=1200&q=85',
    available: 9, total: 10,
    tags: ['Gần sân bay', 'An ninh 24/7'],
    phone: '0812345679', status: 'Active'
  },
  {
    id: 3,
    name: 'Cơ sở Lưu trữ Thủ Đức',
    location: '123 Võ Văn Ngân, Thủ Đức, TP.HCM',
    image: 'https://images.unsplash.com/photo-1565793298595-6a879b1d9492?auto=format&fit=crop&w=1200&q=85',
    available: 10, total: 10,
    tags: ['Rộng rãi', 'Có bãi xe'],
    phone: '0812345680', status: 'Active'
  },
  {
    id: 4,
    name: 'Cơ sở Lưu trữ Quận 2',
    location: '456 Trần Não, Quận 2, TP.HCM',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=85',
    available: 10, total: 10,
    tags: ['Khu đô thị mới', 'Hiện đại'],
    phone: '0812345681', status: 'Active'
  },
  {
    id: 5,
    name: 'Cơ sở Lưu trữ Quận 3',
    location: '789 Cách Mạng Tháng 8, Quận 3, TP.HCM',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=85',
    available: 10, total: 10,
    tags: ['Trung tâm thành phố', 'Premium'],
    phone: '0812345682', status: 'Active'
  }
]

// ============================================================
// DỮ LIỆU KHO – khớp 100% với SelfStorageDB.sql (StorageUnit)
// UnitSize: S1=Locker<2.5m | S2=2x2m | S3=2x4m | M1=2x6m
//           M2=4x4m | L1=4x6m | L2=4x8m | L3=4x10m | V1=8x4m
// UnitType: 1=Climate-Control | 2=Drive-up | 3=Basic | 4=Indoor
// ============================================================
const storageUnits = {
  // FacilityID = 1 – Cơ sở Lưu trữ Quận 1
  'Cơ sở Lưu trữ Quận 1': [
    { id: 'Q1-U01', type: 'Climate-Control Unit', size: 'S1: Locker (<2.5m)', price: '300.000đ/tháng', available: true },
    { id: 'Q1-U02', type: 'Climate-Control Unit', size: 'S2: 2x2m',          price: '500.000đ/tháng', available: true },
    { id: 'Q1-U03', type: 'Indoor Unit',          size: 'M1: 2x6m',          price: '800.000đ/tháng', available: true },
    { id: 'Q1-U04', type: 'Indoor Unit',          size: 'M2: 4x4m',          price: '1.000.000đ/tháng', available: false },
    { id: 'Q1-U05', type: 'Basic Unit',           size: 'S2: 2x2m',          price: '400.000đ/tháng', available: true },
    { id: 'Q1-U06', type: 'Basic Unit',           size: 'S3: 2x4m',          price: '600.000đ/tháng', available: true },
    { id: 'Q1-U07', type: 'Drive-up Unit',        size: 'L3: 4x10m',         price: '2.000.000đ/tháng', available: true },
    { id: 'Q1-U08', type: 'Drive-up Unit',        size: 'V1: 8x4m',          price: '2.500.000đ/tháng', available: true },
    { id: 'Q1-U09', type: 'Climate-Control Unit', size: 'S3: 2x4m',          price: '700.000đ/tháng', available: false },
    { id: 'Q1-U10', type: 'Indoor Unit',          size: 'L1: 4x6m',          price: '1.200.000đ/tháng', available: true }
  ],
  // FacilityID = 2 – Cơ sở Lưu trữ Tân Bình
  'Cơ sở Lưu trữ Tân Bình': [
    { id: 'TB-U01', type: 'Climate-Control Unit', size: 'S1: Locker (<2.5m)', price: '280.000đ/tháng', available: true },
    { id: 'TB-U02', type: 'Climate-Control Unit', size: 'S2: 2x2m',          price: '450.000đ/tháng', available: true },
    { id: 'TB-U03', type: 'Basic Unit',           size: 'M1: 2x6m',          price: '750.000đ/tháng', available: false },
    { id: 'TB-U04', type: 'Indoor Unit',          size: 'M2: 4x4m',          price: '900.000đ/tháng', available: true },
    { id: 'TB-U05', type: 'Basic Unit',           size: 'S2: 2x2m',          price: '380.000đ/tháng', available: true },
    { id: 'TB-U06', type: 'Basic Unit',           size: 'S3: 2x4m',          price: '550.000đ/tháng', available: true },
    { id: 'TB-U07', type: 'Drive-up Unit',        size: 'L3: 4x10m',         price: '1.800.000đ/tháng', available: true },
    { id: 'TB-U08', type: 'Drive-up Unit',        size: 'V1: 8x4m',          price: '2.200.000đ/tháng', available: true },
    { id: 'TB-U09', type: 'Indoor Unit',          size: 'L1: 4x6m',          price: '1.100.000đ/tháng', available: true },
    { id: 'TB-U10', type: 'Climate-Control Unit', size: 'S3: 2x4m',          price: '650.000đ/tháng', available: true }
  ],
  // FacilityID = 3 – Cơ sở Lưu trữ Thủ Đức
  'Cơ sở Lưu trữ Thủ Đức': [
    { id: 'TD-U01', type: 'Climate-Control Unit', size: 'S1: Locker (<2.5m)', price: '300.000đ/tháng', available: true },
    { id: 'TD-U02', type: 'Climate-Control Unit', size: 'S2: 2x2m',          price: '500.000đ/tháng', available: true },
    { id: 'TD-U03', type: 'Indoor Unit',          size: 'M1: 2x6m',          price: '800.000đ/tháng', available: true },
    { id: 'TD-U04', type: 'Indoor Unit',          size: 'M2: 4x4m',          price: '1.000.000đ/tháng', available: true },
    { id: 'TD-U05', type: 'Basic Unit',           size: 'S2: 2x2m',          price: '400.000đ/tháng', available: true },
    { id: 'TD-U06', type: 'Basic Unit',           size: 'S3: 2x4m',          price: '600.000đ/tháng', available: true },
    { id: 'TD-U07', type: 'Drive-up Unit',        size: 'L3: 4x10m',         price: '2.000.000đ/tháng', available: true },
    { id: 'TD-U08', type: 'Drive-up Unit',        size: 'V1: 8x4m',          price: '2.500.000đ/tháng', available: true },
    { id: 'TD-U09', type: 'Climate-Control Unit', size: 'S3: 2x4m',          price: '700.000đ/tháng', available: true },
    { id: 'TD-U10', type: 'Indoor Unit',          size: 'L1: 4x6m',          price: '1.200.000đ/tháng', available: true }
  ],
  // FacilityID = 4 – Cơ sở Lưu trữ Quận 2
  'Cơ sở Lưu trữ Quận 2': [
    { id: 'Q2-U01', type: 'Climate-Control Unit', size: 'S1: Locker (<2.5m)', price: '350.000đ/tháng', available: true },
    { id: 'Q2-U02', type: 'Climate-Control Unit', size: 'S2: 2x2m',          price: '550.000đ/tháng', available: true },
    { id: 'Q2-U03', type: 'Indoor Unit',          size: 'M1: 2x6m',          price: '850.000đ/tháng', available: true },
    { id: 'Q2-U04', type: 'Indoor Unit',          size: 'M2: 4x4m',          price: '1.050.000đ/tháng', available: true },
    { id: 'Q2-U05', type: 'Basic Unit',           size: 'S2: 2x2m',          price: '450.000đ/tháng', available: true },
    { id: 'Q2-U06', type: 'Basic Unit',           size: 'S3: 2x4m',          price: '650.000đ/tháng', available: true },
    { id: 'Q2-U07', type: 'Drive-up Unit',        size: 'L3: 4x10m',         price: '2.100.000đ/tháng', available: true },
    { id: 'Q2-U08', type: 'Drive-up Unit',        size: 'V1: 8x4m',          price: '2.600.000đ/tháng', available: true },
    { id: 'Q2-U09', type: 'Climate-Control Unit', size: 'S3: 2x4m',          price: '750.000đ/tháng', available: true },
    { id: 'Q2-U10', type: 'Indoor Unit',          size: 'L1: 4x6m',          price: '1.250.000đ/tháng', available: true }
  ],
  // FacilityID = 5 – Cơ sở Lưu trữ Quận 3
  'Cơ sở Lưu trữ Quận 3': [
    { id: 'Q3-U01', type: 'Climate-Control Unit', size: 'S1: Locker (<2.5m)', price: '400.000đ/tháng', available: true },
    { id: 'Q3-U02', type: 'Climate-Control Unit', size: 'S2: 2x2m',          price: '600.000đ/tháng', available: true },
    { id: 'Q3-U03', type: 'Indoor Unit',          size: 'M1: 2x6m',          price: '900.000đ/tháng', available: true },
    { id: 'Q3-U04', type: 'Indoor Unit',          size: 'M2: 4x4m',          price: '1.100.000đ/tháng', available: true },
    { id: 'Q3-U05', type: 'Basic Unit',           size: 'S2: 2x2m',          price: '500.000đ/tháng', available: true },
    { id: 'Q3-U06', type: 'Basic Unit',           size: 'S3: 2x4m',          price: '700.000đ/tháng', available: true },
    { id: 'Q3-U07', type: 'Drive-up Unit',        size: 'L3: 4x10m',         price: '2.200.000đ/tháng', available: true },
    { id: 'Q3-U08', type: 'Drive-up Unit',        size: 'V1: 8x4m',          price: '2.700.000đ/tháng', available: true },
    { id: 'Q3-U09', type: 'Climate-Control Unit', size: 'S3: 2x4m',          price: '800.000đ/tháng', available: true },
    { id: 'Q3-U10', type: 'Indoor Unit',          size: 'L1: 4x6m',          price: '1.300.000đ/tháng', available: true }
  ]
}

// Demo rental – khớp Reservation #1 trong DB (customer1 / Q1-U04)
const customerRental = {
  facility: 'Cơ sở Lưu trữ Quận 1',
  unitId: 'Q1-U04',
  type: 'Indoor Unit',
  size: 'M2: 4x4m',
  price: '1.000.000đ/tháng',
  startDate: '01/09/2026',
  endDate: '01/12/2026',
  totalDays: 91,
  remainingDays: 48,
  progress: 47
}

const AUTH_KEY = 'storespace_users'
const CURRENT_USER_KEY = 'storespace_current_user'
const PENDING_BOOKING_KEY = 'storespace_pending_booking'
// Đã thêm: Key dữ liệu kho/hợp đồng do Staff ghi (FacilityStaffAccount.jsx), App chỉ đọc
const STAFF_DB_KEY = 'storespace_staff_db_v2'
// Đã thêm: 05/10/2026

function createSlug(name) {
  return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function navigate(path) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY) || '[]')
  } catch {
    return []
  }
}

// Đã thêm: Thêm hàm getAllUsers() gộp tài khoản staff và fmanager với khách đã đăng ký
function getAllUsers() {
  const staff = STAFF_ACCOUNTS.map(u => ({ name: u.fullName, email: u.email, password: u.password, role: u.role, facilityId: u.facilityId }))
  const managers = MANAGER_ACCOUNTS.map(u => ({ name: u.fullName, email: u.email, password: u.password, role: u.role, facilityId: u.facilityId }))
  const system = SYSTEM_ACCOUNTS.map(u => ({ name: u.fullName, email: u.email, password: u.password, role: u.role }))
  return [...system, ...staff, ...managers, ...getUsers()]
}
// Đã thêm: 04/10/2026

function saveUsers(users) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(users))
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || 'null')
  } catch {
    return null
  }
}

function getPendingBooking() {
  try {
    return JSON.parse(localStorage.getItem(PENDING_BOOKING_KEY) || 'null')
  } catch {
    return null
  }
}

// Đã cập nhật: Đọc dữ liệu Staff đã bàn giao để Customer thấy kho đã thuê
function getStaffDb() {
  try {
    return JSON.parse(localStorage.getItem(STAFF_DB_KEY) || 'null')
  } catch {
    return null
  }
}

// Đã cập nhật: Kho đồng bộ real-time, lấy cả kho mới tạo và cập nhật trạng thái (RENTED / RESERVED)
function getStorageUnits(facilityName) {
  const base = storageUnits[facilityName] || []
  const db = getStaffDb()
  if (!db || !db.units) return base
  // 1. Tìm các kho do Manager mới tạo thêm trong LocalStorage
  const managerCreatedUnits = db.units
    .filter(u => u.facilityId === facilityName && !base.some(b => b.id === u.id))
    .map(u => ({
      id: u.id,
      type: u.type,
      size: u.sizeM2 ? u.sizeM2 + 'm²' : '10m²',
      price: new Intl.NumberFormat('vi-VN').format(u.pricePerMonth || 0) + 'đ/tháng',
      available: u.status === 'AVAILABLE'
    }))

  // 2. Gộp danh sách kho
  const allUnits = [...base, ...managerCreatedUnits]

  // 3. Cập nhật thông tin & trạng thái khả dụng
  return allUnits.map(unit => {
    const live = db.units.find(item => item.id === unit.id)
    if (live) {
      return {
        ...unit,
        type: live.type || unit.type,
        size: live.sizeM2 ? live.sizeM2 + 'm²' : unit.size,
        price: live.pricePerMonth ? new Intl.NumberFormat('vi-VN').format(live.pricePerMonth) + 'đ/tháng' : unit.price,
        // Chỉ khả dụng khi status đúng là AVAILABLE (RENTED hoặc RESERVED sẽ là false)
        available: live.status === 'AVAILABLE'
      }
    }
    return unit
  })
}
//Đã thêm: 05/10/2026

function getAllStorageUnits() {
  return Object.fromEntries(Object.keys(storageUnits).map(name => [name, getStorageUnits(name)]))
}

// Các kho khách đã được Staff bàn giao, mới nhất đứng đầu
function getMyRentals(user) {
  const db = getStaffDb()
  if (!db || !db.reservations || !user) return []
  const email = String(user.email || '').toLowerCase()
  const dmy = iso => (iso ? iso.split('-').reverse().join('/') : '—')
  const dayMs = 24 * 60 * 60 * 1000
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return db.reservations
    .filter(r => r.status === 'HANDED_OVER' && String(r.customerEmail || '').toLowerCase() === email)
    .sort((a, b) => String(b.handedOverAt || '').localeCompare(String(a.handedOverAt || '')))
    .map(r => {
      const unit = (db.units || []).find(item => item.id === r.assignedUnitId) || {}
      const contract = (db.contracts || []).find(item => item.reservationId === r.id) || {}
      const start = new Date(r.startDate + 'T00:00:00')
      const end = new Date((contract.endDate || r.startDate) + 'T00:00:00')
      const totalDays = Math.max(1, Math.round((end - start) / dayMs))
      const elapsed = Math.min(totalDays, Math.max(0, Math.round((today - start) / dayMs)))
      const monthly = r.months ? Math.round(r.rentalFee / r.months) : unit.pricePerMonth
      return {
        facility: r.facilityId,
        unitId: r.assignedUnitId,
        type: unit.type || r.unitType,
        size: unit.sizeM2 ? unit.sizeM2 + 'm²' : '',
        price: new Intl.NumberFormat('vi-VN').format(monthly) + 'đ/tháng',
        startDate: dmy(r.startDate),
        endDate: dmy(contract.endDate),
        totalDays,
        remainingDays: totalDays - elapsed,
        progress: Math.round((elapsed / totalDays) * 100),
        contractId: r.contractId,
        accessType: contract.accessType,
        accessValue: contract.accessValue
      }
    })
}
// Đã thêm: 05/10/2026

function SearchIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 5 5" /></svg>
}

function ArrowIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13" /><path d="m13 6 6 6-6 6" /></svg>
}

function ChevronIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
}

function MenuIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></svg>
}

function PinIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>
}

function ShieldIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 20 6v5c0 5-3.3 8.3-8 10-4.7-1.7-8-5-8-10V6l8-3Z" /><path d="m8.5 12 2.2 2.2 4.8-5" /></svg>
}

function HomeIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 10 8-7 8 7" /><path d="M6 9v11h12V9" /><path d="M10 20v-6h4v6" /></svg>
}

function SiteHeader() {
  const [storageOpen, setStorageOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileStorageOpen, setMobileStorageOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState(getCurrentUser())

  const go = path => {
    setMenuOpen(false)
    setStorageOpen(false)
    setMobileStorageOpen(false)
    navigate(path)
  }

  const logout = () => {
    localStorage.removeItem(CURRENT_USER_KEY)
    setCurrentUser(null)
    navigate('/')
  }

  return (
    <>
      <header className="site-header">
        <button className="brand" type="button" onClick={() => go('/')}>
          <span className="brand-mark">S</span>
          <span className="brand-copy"><strong>StoreSpace</strong><small>Your Space. Your Freedom.</small></span>
        </button>
        <nav className="desktop-nav">
          <button type="button" onClick={() => go('/search')}>Tìm kho</button>
          <button className="nav-dropdown" type="button" onClick={() => setStorageOpen(v => !v)}>Loại kho <ChevronIcon /></button>
          {storageOpen && (
            <div className="type-menu">
              <button type="button" onClick={() => go('/search?type=Kho%20tiêu%20chuẩn')}>Kho tiêu chuẩn</button>
              <button type="button" onClick={() => go('/search?type=Kho%20mát%20%2F%20Cool')}>Kho mát / Cool</button>
              <button type="button" onClick={() => go('/search?type=Kho%20lạnh%20%2F%20Frozen')}>Kho lạnh / Frozen</button>
              <button type="button" onClick={() => go('/search?type=Kho%20lớn')}>Kho lớn</button>
            </div>
          )}
        </nav>
        <div className="header-actions">
          {currentUser ? (
            <div className="user-actions">
              <span className="user-greeting">Xin chào, <strong>{currentUser.name}</strong></span>
              {currentUser.role && currentUser.role !== 'customer' && <button className="login-link" type="button" onClick={() => go(roleHome(currentUser.role))}>Trang làm việc</button>}
              <button className="logout-link" type="button" onClick={logout}>Đăng xuất</button>
            </div>
          ) : (
            <button className="login-link" type="button" onClick={() => go('/login')}>Đăng nhập</button>
          )}
          <button className="menu-button" type="button" onClick={() => setMenuOpen(v => !v)} aria-label="Mở menu"><MenuIcon /></button>
        </div>
      </header>
      {menuOpen && (
        <>
          <div className="mobile-menu-overlay" onClick={() => setMenuOpen(false)} />
          <aside className="mobile-menu">
            <div className="mobile-menu-header">
              <div><span className="mobile-menu-brand">StoreSpace</span><small>Your Space. Your Freedom.</small></div>
              <button className="mobile-menu-close" type="button" onClick={() => setMenuOpen(false)}>×</button>
            </div>
            <div className="mobile-menu-content">
              <div className="mobile-menu-section">
                <div className="mobile-menu-title">KHÁM PHÁ</div>
                {currentUser && <button className="mobile-menu-item" type="button" onClick={() => go(roleHome(currentUser.role))}>⌂ <span>{currentUser.role && currentUser.role !== 'customer' ? 'Trang làm việc' : 'Hồ sơ của tôi'}</span></button>}
                <button className="mobile-menu-item" type="button" onClick={() => go('/')}>⌂ <span>Trang chủ</span></button>
                <button className="mobile-menu-item" type="button" onClick={() => go('/search')}>⌕ <span>Tìm kho</span></button>
                <button className="mobile-menu-item mobile-menu-button" type="button" onClick={() => setMobileStorageOpen(v => !v)}>▣ <span>Loại kho</span><span>›</span></button>
                {mobileStorageOpen && (
                  <div className="mobile-submenu">
                    <button type="button" onClick={() => go('/search?type=Kho%20tiêu%20chuẩn')}>Kho tiêu chuẩn</button>
                    <button type="button" onClick={() => go('/search?type=Kho%20mát%20%2F%20Cool')}>Kho mát / Cool</button>
                    <button type="button" onClick={() => go('/search?type=Kho%20lạnh%20%2F%20Frozen')}>Kho lạnh / Frozen</button>
                    <button type="button" onClick={() => go('/search?type=Kho%20lớn')}>Kho lớn</button>
                  </div>
                )}
                <button className="mobile-menu-item" type="button" onClick={() => go('/facilities')}>⌖ <span>Cơ sở lưu trữ</span></button>
                <button className="mobile-menu-item" type="button" onClick={() => { setMenuOpen(false); document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }) }}>◇ <span>Về StoreSpace</span></button>
              </div>
              <div className="mobile-menu-section">
                <div className="mobile-menu-title">HỖ TRỢ</div>
                <button className="mobile-menu-item" type="button" onClick={() => { setMenuOpen(false); document.getElementById('support')?.scrollIntoView({ behavior: 'smooth' }) }}>? <span>Trung tâm hỗ trợ</span></button>
                <a className="mobile-menu-item" href="mailto:support@storespace.vn">✉ <span>Liên hệ</span></a>
              </div>
              <div className="mobile-menu-section account-section">
                <div className="mobile-menu-title">TÀI KHOẢN</div>
                {currentUser ? (
                  <button className="mobile-account-item" type="button" onClick={logout}>→ <strong>Đăng xuất</strong></button>
                ) : (
                  <>
                    <div className="item-column">
                      <button className="mobile-account-item" type="button" onClick={() => go('/login')}>→ <strong>Đăng nhập</strong></button>
                      <button className="mobile-account-item register-item" type="button" onClick={() => go('/register')}>✦ <strong>Đăng ký tài khoản</strong></button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  )
}

function SiteFooter() {
  return <footer className="footer"><div className="container footer-inner"><div className="footer-brand"><span className="footer-mark">S</span><strong>StoreSpace</strong><span>Self-Storage Facility Rental & Management System</span></div><span>© 2026 StoreSpace</span></div></footer>
}

function FacilityCard({ facility, index }) {
  return (
    <article className="facility-card">
      <button className="facility-card-link" type="button" onClick={() => navigate(`/facilities/${createSlug(facility.name)}`)} aria-label={`Xem chi tiết ${facility.name}`}>
        <div className="facility-image">
          <img src={facility.image} alt={`Cơ sở ${facility.name}`} />
          <span className="availability-badge"><i /> {facility.available} kho trống</span>
          <span className="facility-index">{String(index + 1).padStart(2, '0')}</span>
        </div>
        <div className="facility-body">
          <div className="facility-title-row">
            <div><h3>{facility.name}</h3><p><PinIcon /> {facility.location}</p></div>
            <span className="home-icon"><HomeIcon /></span>
          </div>
          <div className="tag-row">{facility.tags.map(tag => <span key={tag}>{tag}</span>)}</div>
          <div className="facility-footer"><span>{facility.available} / {facility.total} kho còn trống</span><span className="facility-arrow"><ArrowIcon /></span></div>
        </div>
      </button>
    </article>
  )
}

function FacilitiesPage() {
  return (
    <div className="app">
      <SiteHeader />
      <main className="listing-page">
        <div className="container">
          <div className="listing-heading"><div className="eyebrow">OUR FACILITIES</div><h1>Các cơ sở lưu trữ</h1><p>Chọn cơ sở phù hợp để xem các kho đang có sẵn.</p></div>
          <div className="facility-grid">{facilities.map((f, i) => <FacilityCard key={f.name} facility={f} index={i} />)}</div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

function FacilityDetailPage({ facility }) {

  //Đã cập nhật: Trang cơ sở lấy trạng thái kho đã cập nhật
  const units = getStorageUnits(facility.name)
  //Đã thêm: 05/10/2026


  const [query, setQuery] = useState('')
  const [type, setType] = useState('all')
  const [size, setSize] = useState('all')
  const [availability, setAvailability] = useState('all')
  const [priceRange, setPriceRange] = useState('all')
  const types = [...new Set(units.map(unit => unit.type))]
  const sizes = [...new Set(units.map(unit => unit.size))]
  const filteredUnits = units.filter(unit => {
    const q = query.trim().toLowerCase()
    const price = Number(unit.price.replace(/\D/g, ''))
    const matchSearch = !q || `${unit.id} ${unit.type} ${unit.size}`.toLowerCase().includes(q)
    const matchType = type === 'all' || unit.type === type
    const matchSize = size === 'all' || unit.size === size
    const matchAvailability = availability === 'all' || (availability === 'available' ? unit.available : !unit.available)
    const matchPrice = priceRange === 'all' || (priceRange === 'under1' ? price < 1000000 : priceRange === '1to2' ? price >= 1000000 && price <= 2000000 : price > 2000000)
    return matchSearch && matchType && matchSize && matchAvailability && matchPrice
  })
  const resetFilters = () => {
    setQuery('')
    setType('all')
    setSize('all')
    setAvailability('all')
    setPriceRange('all')
  }

  return (
    <div className="app">
      <SiteHeader />
      <main className="facility-detail-page">
        <div className="container">
          <button className="back-link" type="button" onClick={() => navigate('/facilities')}>← Tất cả cơ sở</button>
          <div className="facility-detail-hero">
            <img src={facility.image} alt={facility.name} />
            <div className="facility-detail-info">
              <div className="eyebrow">STORESPACE FACILITY</div>
              <h1>{facility.name}</h1>
              <p className="facility-location"><PinIcon /> {facility.location}</p>
              <div className="tag-row">{facility.tags.map(tag => <span key={tag}>{tag}</span>)}</div>
              <p>Hiện có <strong>{facility.available}</strong> kho đang sẵn sàng cho thuê.</p>
            </div>
          </div>
          <div className="units-heading">
            <div><div className="eyebrow">AVAILABLE UNITS</div><h2>Các kho tại {facility.name}</h2></div>
            <span>{filteredUnits.length} / {units.length} kho phù hợp</span>
          </div>
          <div className="unit-filter-panel">
            <div className="unit-filter-search"><SearchIcon /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm mã kho, loại kho, diện tích..." /></div>
            <div className="unit-filter-row">
              <select value={type} onChange={e => setType(e.target.value)}><option value="all">Tất cả loại kho</option>{types.map(item => <option key={item} value={item}>{item}</option>)}</select>
              <select value={size} onChange={e => setSize(e.target.value)}><option value="all">Tất cả diện tích</option>{sizes.map(item => <option key={item} value={item}>{item}</option>)}</select>
              <select value={availability} onChange={e => setAvailability(e.target.value)}><option value="all">Tất cả tình trạng</option><option value="available">Còn trống</option><option value="rented">Đã thuê</option></select>
              <select value={priceRange} onChange={e => setPriceRange(e.target.value)}><option value="all">Tất cả mức giá</option><option value="under1">Dưới 1 triệu</option><option value="1to2">1 - 2 triệu</option><option value="over2">Trên 2 triệu</option></select>
              <button type="button" className="filter-reset" onClick={resetFilters}>Đặt lại</button>
            </div>
          </div>
          <div className="unit-grid">
            {filteredUnits.map(unit => (
              <article className="unit-card" key={unit.id}>
                <div className="unit-card-top"><span className="unit-id">{unit.id}</span><span className={unit.available ? 'unit-status available' : 'unit-status'}>{unit.available ? 'Còn trống' : 'Đã thuê'}</span></div>
                <h3>{unit.type}</h3>
                <div className="unit-info"><span>Diện tích</span><strong>{unit.size}</strong></div>
                <div className="unit-info"><span>Giá thuê</span><strong>{unit.price}</strong></div>
                <button className="unit-button" type="button" disabled={!unit.available} onClick={() => unit.available && navigate(`/facilities/${createSlug(facility.name)}/unit/${unit.id}`)}>{unit.available ? 'Xem kho' : 'Đã thuê'}{unit.available && <ArrowIcon />}</button>
              </article>
            ))}
          </div>
          {filteredUnits.length === 0 && <div className="empty-state unit-empty-state">Không tìm thấy kho phù hợp với bộ lọc.</div>}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

function UnitDetailPage({ facility, unit }) {
  return (
    <div className="app">
      <SiteHeader />
      <main className="unit-detail-page">
        <div className="container">
          <button className="back-link" type="button" onClick={() => navigate(`/facilities/${createSlug(facility.name)}`)}>← Quay lại {facility.name}</button>
          <div className="unit-detail-layout">
            <div className="unit-detail-image"><img src={facility.image} alt={unit.id} /><span className="unit-detail-status">● Còn trống</span></div>
            <div className="unit-detail-content">
              <span className="customer-eyebrow">STORAGE UNIT</span>
              <h1>{unit.id}</h1>
              <h2>{unit.type}</h2>
              <p className="unit-detail-location"><PinIcon /> {facility.name} · {facility.location}</p>
              <div className="unit-detail-price"><small>Giá thuê</small><strong>{unit.price}</strong></div>
              <div className="unit-detail-info-grid">
                <div><small>Diện tích</small><strong>{unit.size}</strong></div>
                <div><small>Tình trạng</small><strong className="available-text">Còn trống</strong></div>
                <div><small>An ninh</small><strong>24/7</strong></div>
                <div><small>Ra vào</small><strong>Access Card</strong></div>
              </div>
              <div className="unit-detail-features"><div><span>✓</span>Camera giám sát 24/7</div><div><span>✓</span>Kiểm soát ra vào</div><div><span>✓</span>Hỗ trợ khách hàng</div><div><span>✓</span>Giá thuê minh bạch</div></div>
              <div className="unit-detail-actions">
                <button className="dashboard-primary-btn" type="button" onClick={() => navigate(`/facilities/${createSlug(facility.name)}/unit/${unit.id}/booking`)}>Đặt kho này <ArrowIcon /></button>
                <button className="dashboard-secondary-btn" type="button" onClick={() => navigate(`/facilities/${createSlug(facility.name)}`)}>Xem các kho khác</button>
              </div>
            </div>
          </div>
          <section className="unit-detail-description"><span className="customer-eyebrow">ABOUT THIS UNIT</span><h2>Thông tin về kho</h2><p>{unit.type} tại {facility.name} phù hợp cho nhu cầu lưu trữ cá nhân, hồ sơ, đồ gia dụng và các vật dụng cần không gian riêng biệt. Kho được quản lý và kiểm soát ra vào theo tiêu chuẩn của StoreSpace.</p></section>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

function BookingPage({ facility, unit }) {
  const [step, setStep] = useState(1)

  const [startDay, setStartDay] = useState('')
  const [startMonth, setStartMonth] = useState('')
  const [startYear, setStartYear] = useState('')

  const [duration, setDuration] = useState(1)
  const [paymentMode, setPaymentMode] = useState('cycle')
  const [paymentCycle, setPaymentCycle] = useState(1)

  const [error, setError] = useState('')
  const [booking, setBooking] = useState(null)
  const [depositPaid, setDepositPaid] = useState(false)

  const monthlyPrice = Number(unit.price.replace(/\D/g, ''))
  const totalMonths = Number(duration)
  const totalRent = monthlyPrice * totalMonths
  const deposit = Math.round(totalRent * 0.2)

  const years = Array.from(
    { length: 6 },
    (_, index) => new Date().getFullYear() + index
  )

  const months = Array.from({ length: 12 }, (_, index) => index + 1)
  const days = Array.from({ length: 31 }, (_, index) => index + 1)

  const formatPrice = value =>
    new Intl.NumberFormat('vi-VN').format(value) + 'đ'

  const formatDate = date => {
    if (!date || Number.isNaN(date.getTime())) return '—'

    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()

    return `${day}/${month}/${year}`
  }

  const getStartDate = () => {
    if (!startDay || !startMonth || !startYear) return null

    const day = Number(startDay)
    const month = Number(startMonth)
    const year = Number(startYear)
    const date = new Date(year, month - 1, day)

    // Reject impossible dates such as 31/02.
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null
    }

    return date
  }

  const startDate = getStartDate()

  const calculateEndDate = () => {
    if (!startDate) return null

    const date = new Date(startDate)
    date.setMonth(date.getMonth() + totalMonths)
    return date
  }

  const endDate = calculateEndDate()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const isValidStartDate =
    !!startDate && startDate.getTime() >= today.getTime()

  const canConfirm =
    !!startDate &&
    isValidStartDate &&
    duration >= 1 &&
    duration <= 12

  const handleConfirmBooking = async () => {
    setError('')

    if (!startDate) {
      setError('Vui lòng chọn đầy đủ ngày, tháng và năm bắt đầu thuê.')
      return
    }

    if (!isValidStartDate) {
      setError('Ngày bắt đầu thuê không được ở trong quá khứ.')
      return
    }

    const currentUser = getCurrentUser()

    if (!currentUser) {
      setError('Vui lòng đăng nhập trước khi đặt kho.')
      return
    }

    try {
      const payload = {
        CustomerEmail: currentUser.email,
        UnitNumber: unit.id,
        StartDate: startDate.toISOString(),
        Months: totalMonths,
        TotalEstimatedCost: deposit + totalRent
      }
      const res = await fetch('http://localhost:5046/api/Reservation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.message || 'Đặt kho thất bại.')
        return
      }

      const bookingData = {
        id: data.reservationId ? `BK-${data.reservationId}` : `BK-${Date.now()}`,
        customerName: currentUser.name,
        customerEmail: currentUser.email,
        facility: facility.name,
        unitId: unit.id,
        unitType: unit.type,
        size: unit.size,
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        durationMonths: totalMonths,
        monthlyPrice,
        totalRent,
        paymentMode,
        paymentCycle: paymentMode === 'cycle'
          ? Number(paymentCycle)
          : totalMonths,
        deposit,
        status: 'PENDING_DEPOSIT_PAYMENT',
        createdAt: new Date().toISOString()
      }

      localStorage.setItem(
        PENDING_BOOKING_KEY,
        JSON.stringify(bookingData)
      )

      setBooking(bookingData)
      setDepositPaid(false)
      setStep(2)
    } catch (err) {
      setError('Lỗi kết nối Backend.')
    }
  }

  //Đã cập nhật: Đơn chuyển qua Facility Manager duyệt
  const handleDepositPaid = () => {
    if (!booking) return

    const updatedBooking = {
      ...booking,
      depositPaid: true,
      depositPaidAt: new Date().toISOString(),
      status: 'PENDING_APPROVAL', // Nhảy thẳng sang Manager chờ duyệt
      paymentStatus: 'PAID'       // Đã cọc thành công
    }

    localStorage.setItem(
      PENDING_BOOKING_KEY,
      JSON.stringify(updatedBooking)
    )

    // Đồng bộ trực tiếp dữ liệu vào Database chung
    const db = getStaffDb() || { facilities: [], units: [], reservations: [], contracts: [], activity: [] }
    const start = booking.startDate ? booking.startDate.split('/').reverse().join('-') : ''

    const newReservation = {
      id: booking.id,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      customerPhone: '—',
      facilityId: booking.facility,
      unitId: booking.unitId,
      unitType: `${booking.unitType} ${booking.size}`,
      startDate: start,
      months: booking.durationMonths,
      appointmentDate: start,
      appointmentTime: 'Cả ngày',
      deposit: booking.deposit,
      rentalFee: booking.totalRent,
      paymentStatus: 'PAID',          // Đánh dấu đã nhận cọc
      paymentTxn: `TXN-${booking.id}`,
      status: 'PENDING_APPROVAL',     // Đẩy sang cho Manager duyệt
      assignedUnitId: null,
      contractId: null,
      source: 'live'
    }

    // Ghi đè/Thêm mới đơn vào danh sách reservations
    const updatedReservations = [newReservation, ...(db.reservations || []).filter(r => r.id !== booking.id)]

    // Khóa kho sang trạng thái RESERVED (Giữ chỗ)
    const updatedUnits = (db.units || []).map(u =>
      u.id === booking.unitId && u.status === 'AVAILABLE' ? { ...u, status: 'RESERVED' } : u
    )

    localStorage.setItem(STAFF_DB_KEY, JSON.stringify({ ...db, reservations: updatedReservations, units: updatedUnits }))

    setBooking(updatedBooking)
    setDepositPaid(true)
  }
  //Đã thêm: 05/10/2026

  const paymentCycleOptions = [1, 3, 6, 12].filter(
    value => value <= totalMonths
  )

  const handleDurationChange = value => {
    const nextDuration = Math.max(1, Math.min(12, value))
    setDuration(nextDuration)

    if (paymentCycle > nextDuration) {
      setPaymentCycle(1)
    }
  }

  return (
    <div className="app">
      <SiteHeader />

      <main className="booking-page">
        <div className="container">
          <button
            className="back-link"
            type="button"
            onClick={() => {
              if (step === 2) {
                setStep(1)
                setError('')
              } else {
                navigate(`/facilities/${createSlug(facility.name)}/unit/${unit.id}`)
              }
            }}
          >
            ← {step === 2 ? 'Quay lại thông tin thuê' : 'Quay lại thông tin kho'}
          </button>

          <div className="customer-page-heading">
            <div>
              <span className="customer-eyebrow">BOOK STORAGE</span>
              <h1>
                {step === 1 ? 'Đặt kho' : 'Thanh toán tiền cọc'}
              </h1>
              <p>
                {step === 1
                  ? `Chọn ngày bắt đầu, thời gian thuê và phương thức thanh toán cho kho ${unit.id}.`
                  : 'Thanh toán 20% tiền cọc trước khi chờ Facility Manager phê duyệt.'}
              </p>
            </div>

            <div className="booking-step-indicator">
              <span className="active">1</span>
              <i />
              <span className={step >= 2 ? 'active' : ''}>2</span>
            </div>
          </div>

          {error && (
            <div className="auth-message error booking-page-message">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="booking-layout">
              <section className="booking-unit-summary">
                <div className="booking-unit-image">
                  <img src={facility.image} alt={facility.name} />
                </div>

                <div className="booking-unit-summary-body">
                  <span className="storage-facility-name">{facility.name}</span>
                  <h2>{unit.id}</h2>
                  <p>{unit.type} · {unit.size}</p>

                  <div className="booking-summary-info">
                    <div>
                      <small>Giá thuê / tháng</small>
                      <strong>{formatPrice(monthlyPrice)}</strong>
                    </div>

                    <div>
                      <small>Trạng thái</small>
                      <strong className="available-text">Còn trống</strong>
                    </div>
                  </div>

                  <div className="booking-features">
                    <span>✓ Camera giám sát 24/7</span>
                    <span>✓ Kiểm soát ra vào</span>
                    <span>✓ Hỗ trợ khách hàng</span>
                    <span>✓ Giá thuê minh bạch</span>
                  </div>
                </div>
              </section>

              <section className="booking-form-card">
                <div className="booking-form-heading">
                  <span>01</span>
                  <div>
                    <h2>Thông tin thuê</h2>
                    <p>Điền đầy đủ thông tin để hệ thống tính tiền tự động.</p>
                  </div>
                </div>

                <div className="booking-large-field">
                  <label>Ngày bắt đầu thuê</label>

                  <div className="date-select-grid">
                    <select
                      value={startDay}
                      onChange={e => {
                        setStartDay(e.target.value)
                        setError('')
                      }}
                    >
                      <option value="">Ngày</option>
                      {days.map(day => (
                        <option key={day} value={day}>
                          {String(day).padStart(2, '0')}
                        </option>
                      ))}
                    </select>

                    <select
                      value={startMonth}
                      onChange={e => {
                        setStartMonth(e.target.value)
                        setError('')
                      }}
                    >
                      <option value="">Tháng</option>
                      {months.map(month => (
                        <option key={month} value={month}>
                          {String(month).padStart(2, '0')}
                        </option>
                      ))}
                    </select>

                    <select
                      value={startYear}
                      onChange={e => {
                        setStartYear(e.target.value)
                        setError('')
                      }}
                    >
                      <option value="">Năm</option>
                      {years.map(year => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>

                  {startDate && (
                    <div className="selected-date-preview">
                      Ngày bắt đầu:
                      <strong>{formatDate(startDate)}</strong>
                    </div>
                  )}
                </div>

                <div className="booking-large-field">
                  <label>Thời gian thuê</label>

                  <div className="duration-picker">
                    <button
                      type="button"
                      onClick={() => handleDurationChange(duration - 1)}
                      aria-label="Giảm thời gian thuê"
                    >
                      −
                    </button>

                    <div className="duration-value">
                      <strong>{duration}</strong>
                      <span>tháng</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDurationChange(duration + 1)}
                      aria-label="Tăng thời gian thuê"
                    >
                      +
                    </button>
                  </div>

                  <div className="duration-slider-wrap">
                    <input
                      type="range"
                      min="1"
                      max="12"
                      value={duration}
                      onChange={e => handleDurationChange(Number(e.target.value))}
                    />

                    <div className="duration-slider-label">
                      <span>1 tháng</span>
                      <span>12 tháng</span>
                    </div>
                  </div>
                </div>

                <div className="booking-period-summary">
                  <div>
                    <small>Ngày bắt đầu</small>
                    <strong>{formatDate(startDate)}</strong>
                  </div>

                  <div>
                    <small>Ngày kết thúc dự kiến</small>
                    <strong>{formatDate(endDate)}</strong>
                  </div>

                  <div>
                    <small>Thời gian thuê</small>
                    <strong>{duration} tháng</strong>
                  </div>
                </div>

                <div className="booking-large-field">
                  <label>Phương thức thanh toán tiền thuê</label>

                  <div className="payment-mode-grid">
                    <button
                      type="button"
                      className={paymentMode === 'cycle' ? 'payment-mode-card active' : 'payment-mode-card'}
                      onClick={() => setPaymentMode('cycle')}
                    >
                      <span className="payment-mode-icon">↻</span>
                      <strong>Thanh toán theo chu kỳ</strong>
                      <small>Thanh toán tiền thuê theo từng chu kỳ sau khi Manager phê duyệt.</small>
                    </button>

                    <button
                      type="button"
                      className={paymentMode === 'full' ? 'payment-mode-card active' : 'payment-mode-card'}
                      onClick={() => setPaymentMode('full')}
                    >
                      <span className="payment-mode-icon">✓</span>
                      <strong>Thanh toán toàn bộ</strong>
                      <small>Thanh toán toàn bộ tiền thuê một lần sau khi Manager phê duyệt.</small>
                    </button>
                  </div>
                </div>

                {paymentMode === 'cycle' && (
                  <div className="cycle-select-box">
                    <label>Chu kỳ thanh toán</label>
                    <select
                      value={paymentCycle}
                      onChange={e => setPaymentCycle(Number(e.target.value))}
                    >
                      {paymentCycleOptions.map(value => (
                        <option key={value} value={value}>
                          Mỗi {value} tháng
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="booking-price-breakdown">
                  <div>
                    <span>Giá thuê / tháng</span>
                    <strong>{formatPrice(monthlyPrice)}</strong>
                  </div>

                  <div>
                    <span>Thời gian thuê</span>
                    <strong>{duration} tháng</strong>
                  </div>

                  <div>
                    <span>Hình thức thanh toán</span>
                    <strong>
                      {paymentMode === 'cycle'
                        ? `Theo chu kỳ ${paymentCycle} tháng`
                        : 'Thanh toán toàn bộ'}
                    </strong>
                  </div>

                  <div className="price-divider" />

                  <div>
                    <span>Tổng tiền thuê</span>
                    <strong className="main-price">{formatPrice(totalRent)}</strong>
                  </div>

                  <div className="deposit-row">
                    <div>
                      <span>Tiền cọc bắt buộc</span>
                      <small>20% tổng giá thuê</small>
                    </div>
                    <strong className="deposit-price">{formatPrice(deposit)}</strong>
                  </div>
                </div>

                <div className="deposit-notice">
                  <div className="deposit-notice-icon">$</div>
                  <div>
                    <strong>Quy trình thanh toán</strong>
                    <p>
                      Bước 1: thanh toán tiền cọc {formatPrice(deposit)}.
                    </p>
                    <p>
                      Bước 2: hệ thống chuyển yêu cầu cho Facility Manager duyệt.
                    </p>
                    <p>
                      Bước 3: chỉ sau khi được duyệt, bạn mới thanh toán tiền thuê theo hình thức đã chọn.
                    </p>
                  </div>
                </div>

                <div className="booking-actions">
                  <button
                    className="dashboard-secondary-btn"
                    type="button"
                    onClick={() => navigate(`/facilities/${createSlug(facility.name)}/unit/${unit.id}`)}
                  >
                    Quay lại
                  </button>

                  <button
                    className="dashboard-primary-btn booking-submit"
                    type="button"
                    disabled={!canConfirm}
                    onClick={handleConfirmBooking}
                  >
                    Xác nhận đặt kho <ArrowIcon />
                  </button>
                </div>
              </section>
            </div>
          )}

          {step === 2 && booking && (
            <div className="deposit-payment-page">
              <div className="deposit-payment-header">
                <span className="customer-eyebrow">DEPOSIT PAYMENT</span>
                <h2>Thanh toán tiền cọc</h2>
                <p>
                  Đặt chỗ <strong>{booking.id}</strong> đã được tạo. Chỉ thanh toán tiền cọc 20% trước; tiền thuê sẽ thanh toán sau khi Manager duyệt.
                </p>
              </div>

              <div className="deposit-payment-layout">
                <div className="deposit-qr-card">
                  <div className="deposit-qr-title">
                    <strong>Quét mã QR để thanh toán</strong>
                    <span>Tiền cọc 20% tổng giá thuê</span>
                  </div>

                  <div className="qr-wrapper">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
                        `StoreSpace|${booking.id}|Deposit|${booking.deposit}`
                      )}`}
                      alt="QR thanh toán tiền cọc"
                    />
                  </div>

                  <strong className="qr-amount">
                    {formatPrice(booking.deposit)}
                  </strong>

                  <p className="qr-note">
                    Nội dung chuyển khoản:
                    <strong>{' '}{booking.id}</strong>
                  </p>

                  <button
                    className="dashboard-primary-btn full"
                    type="button"
                    onClick={handleDepositPaid}
                    disabled={depositPaid}
                  >
                    {depositPaid ? 'Đã ghi nhận thanh toán cọc' : 'Tôi đã thanh toán tiền cọc'}
                  </button>
                </div>

                <div className="deposit-payment-info">
                  <div className="payment-info-block">
                    <span>THÔNG TIN THANH TOÁN</span>

                    <div>
                      <small>Người nhận</small>
                      <strong>StoreSpace</strong>
                    </div>

                    <div>
                      <small>Ngân hàng</small>
                      <strong>NGÂN HÀNG DEMO</strong>
                    </div>

                    <div>
                      <small>Số tài khoản</small>
                      <strong>0000 0000 0000</strong>
                    </div>

                    <div>
                      <small>Số tiền cọc</small>
                      <strong className="payment-highlight">{formatPrice(booking.deposit)}</strong>
                    </div>

                    <div>
                      <small>Nội dung chuyển khoản</small>
                      <strong>{booking.id}</strong>
                    </div>
                  </div>

                  <div className="payment-booking-summary">
                    <span>ĐẶT KHO</span>
                    <strong>{booking.facility}</strong>
                    <p>{booking.unitId} · {booking.unitType} · {booking.size}</p>

                    <div>
                      <span>Ngày bắt đầu</span>
                      <strong>{booking.startDate}</strong>
                    </div>

                    <div>
                      <span>Ngày kết thúc</span>
                      <strong>{booking.endDate}</strong>
                    </div>

                    <div>
                      <span>Thời gian</span>
                      <strong>{booking.durationMonths} tháng</strong>
                    </div>

                    <div>
                      <span>Tổng tiền thuê</span>
                      <strong>{formatPrice(booking.totalRent)}</strong>
                    </div>

                    <div>
                      <span>Phương thức thuê</span>
                      <strong>
                        {booking.paymentMode === 'cycle'
                          ? `Chu kỳ ${booking.paymentCycle} tháng`
                          : 'Thanh toán toàn bộ'}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="payment-warning">
                <strong>Lưu ý:</strong>
                <span>
                  Đây là bản demo happy case. Sau khi bạn xác nhận đã thanh toán cọc, trạng thái đơn chuyển thành PENDING_MANAGER_APPROVAL để Manager xét duyệt.
                </span>
              </div>

              <div className="deposit-status">
                <div className="deposit-status-dot" />
                <div>
                  <strong>
                    {depositPaid
                      ? 'Đã thanh toán cọc — đang chờ Manager duyệt'
                      : 'Đang chờ thanh toán cọc'}
                  </strong>
                  <small>
                    Mã đặt chỗ: {booking.id}
                  </small>
                </div>
                <span>
                  {depositPaid ? 'PENDING APPROVAL' : 'PENDING'}
                </span>
              </div>
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
function SearchPage() {
  const params = new URLSearchParams(window.location.search)
  const initial = params.get('q') || ''
  const type = params.get('type') || ''
  const [query, setQuery] = useState(initial)
  const results = facilities.filter(f => {
    const text = `${f.name} ${f.location} ${f.tags.join(' ')}`.toLowerCase()
    const keywordOK = !query || text.includes(query.trim().toLowerCase())

    //Đã cập nhật: Trang tìm kiếm lấy trạng thái kho đã cập nhật
    const typeOK = !type || getStorageUnits(f.name).some(u => u.type.toLowerCase() === type.toLowerCase())
    //Đã thêm: 05/10/2026

    return keywordOK && typeOK
  })
  const search = e => {
    e.preventDefault()
    const q = query.trim()
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search')
  }
  return (
    <div className="app">
      <SiteHeader />
      <main className="listing-page">
        <div className="container">
          <div className="listing-heading"><div className="eyebrow">SEARCH STORAGE</div><h1>Tìm kho phù hợp với bạn.</h1><p>Tìm kiếm cơ sở, vị trí hoặc loại kho bạn đang cần.</p></div>
          <form className="search-box listing-search" onSubmit={search}><div className="search-input-wrap"><SearchIcon />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm kho, cơ sở, loại kho..." />
          </div>
            <button type="submit">Tìm kho</button></form>
          {type && <div className="search-result-note">Loại kho: <strong>{type}</strong></div>}
          <div className="listing-top"><h2>{results.length} cơ sở phù hợp</h2></div>
          <div className="facility-grid">{results.map((f, i) => <FacilityCard key={f.name} facility={f} index={i} />)}</div>
          {results.length === 0 && <div className="empty-state">Không tìm thấy cơ sở phù hợp.</div>}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

function AuthShell({ children, title, subtitle }) {
  return (
    <div className="auth-page">
      <div className="auth-background auth-bg-one" />
      <div className="auth-background auth-bg-two" />
      <div className="auth-card">
        <button className="auth-brand" type="button" onClick={() => navigate('/')}><span className="brand-mark">S</span><span><strong>StoreSpace</strong><small>Your Space. Your Freedom.</small></span></button>
        <div className="auth-heading"><div className="eyebrow"><span /> STORESPACE ACCOUNT</div><h1>{title}</h1><p>{subtitle}</p></div>
        {children}
      </div>
    </div>
  )
}

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const login = async e => {
    e.preventDefault()
    setError('')

    try {
      const res = await fetch('http://localhost:5046/api/Auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        return setError(data.message || 'Đăng nhập thất bại.')
      }

      const role = data.roleName || 'customer'
      
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify({ 
        name: data.fullName, 
        email: data.email, 
        role: role, 
        facilityId: '*'
      }))

      setSuccess(`Đăng nhập thành công. Chào ${data.fullName}!`)

      setTimeout(() => {
        navigate(roleHome(role))
      }, 500)
    } catch (err) {
      setError('Lỗi kết nối Backend.')
    }
  }
  return (
    <AuthShell title="Chào mừng trở lại" subtitle="Đăng nhập để tiếp tục quản lý việc thuê kho của bạn.">
      <form className="auth-form" onSubmit={login}>{error && <div className="auth-message error">{error}</div>}{success && <div className="auth-message success">{success}</div>}<label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required /></label><label>Mật khẩu<input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Nhập mật khẩu" required /></label><button className="auth-submit" type="submit">Đăng nhập</button></form>
      <p className="auth-switch">Chưa có tài khoản? <button className="inline-link" type="button" onClick={() => navigate('/register')}>Đăng ký ngay</button></p>
      <button className="back-home" type="button" onClick={() => navigate('/')}>← Quay lại trang chủ</button>
    </AuthShell>
  )
}

function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const register = async e => {
    e.preventDefault()
    setError('')
    if (password.length < 6) return setError('Mật khẩu phải có ít nhất 6 ký tự.')
    if (password !== confirm) return setError('Mật khẩu xác nhận không khớp.')

    try {
      const res = await fetch('http://localhost:5046/api/Auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fullName: name.trim(), 
          email: email.trim(), 
          password: password, 
          roleName: 'Storage Customer' 
        })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        return setError(data.message || 'Đăng ký thất bại.')
      }

      navigate('/login')
    } catch (err) {
      setError('Lỗi kết nối Backend.')
    }
  }
  return (
    <AuthShell title="Tạo tài khoản" subtitle="Đăng ký tài khoản StoreSpace để bắt đầu hành trình thuê kho.">
      <form className="auth-form" onSubmit={register}>{error && <div className="auth-message error">{error}</div>}<label>Họ và tên<input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nguyễn Văn A" required /></label>
        <label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required /></label>
        <label>Mật khẩu<input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Ít nhất 6 ký tự" required /></label>
        <label>Xác nhận mật khẩu<input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Nhập lại mật khẩu" required /></label>
        <button className="auth-submit" type="submit">Tạo tài khoản</button></form>
      <p className="auth-switch">Đã có tài khoản? <button className="inline-link" type="button" onClick={() => navigate('/login')}>Đăng nhập</button></p>
      <button className="back-home" type="button" onClick={() => navigate('/')}>← Quay lại trang chủ</button>
    </AuthShell>
  )
}

function HomePage() {
  const [query, setQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const visible = facilities.filter(f => `${f.name} ${f.location} ${f.tags.join(' ')}`.toLowerCase().includes(query.trim().toLowerCase()))
  const search = e => {
    e.preventDefault()
    setSubmittedQuery(query.trim())
    document.getElementById('facilities')?.scrollIntoView({ behavior: 'smooth' })
  }
  return (
    <div className="app">
      <SiteHeader />
      <main id="top">
        <section className="hero">
          <div className="hero-glow hero-glow-blue" /><div className="hero-glow hero-glow-yellow" />
          <div className="hero-inner container">
            <div className="hero-content">
              <div className="eyebrow"><span /> STORESPACE · SELF-STORAGE</div>
              <h1>Không gian lưu trữ<br /><em>theo cách của bạn.</em></h1>
              <p className="hero-description">Tìm kho phù hợp, xem thông tin trước khi đặt và theo dõi toàn bộ hành trình thuê kho một cách rõ ràng.</p>
              <form className="search-box" onSubmit={search}><div className="search-input-wrap"><SearchIcon /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm kho, cơ sở, loại kho..." /></div><button type="submit">Tìm kho</button></form>
              <div className="hero-benefits"><span><ShieldIcon /> Giá rõ ràng</span><span><ShieldIcon /> Theo dõi hợp đồng</span><span><ShieldIcon /> Hỗ trợ khi cần</span></div>
            </div>
            <div className="hero-visual">
              <div className="hero-photo-card"><img src="https://images.unsplash.com/photo-1601584115197-04ecc0da31d8?auto=format&fit=crop&w=1400&q=90" alt="Không gian kho lưu trữ hiện đại" /><div className="photo-overlay" /><div className="floating-label floating-label-top"><span className="live-dot" /> Đang có kho trống <strong>36</strong></div><div className="floating-label floating-label-bottom"><span className="mini-icon"><ShieldIcon /></span><div><strong>An tâm lưu trữ</strong><small>Kiểm soát ra vào & camera</small></div></div></div>
              <div className="hero-yellow-block" /><div className="hero-number">01<span>/03</span></div>
            </div>
          </div>
        </section>
        <section className="trust-strip"><div className="container trust-inner"><div><strong>36+</strong><span>kho đang sẵn sàng</span></div><div><strong>3</strong><span>cơ sở tại TP.HCM</span></div><div><strong>24/7</strong><span>hỗ trợ & an ninh</span></div><div><strong>100%</strong><span>minh bạch chi phí</span></div></div></section>
        <section className="facilities section" id="facilities"><div className="container"><div className="section-heading"><div><div className="eyebrow green">OUR FACILITIES</div><h2>Cơ sở lưu trữ</h2><p>Mỗi cơ sở có nhiều loại kho và kích thước để bạn lựa chọn.</p></div><button className="text-link" type="button" onClick={() => navigate('/facilities')}>Xem tất cả <ArrowIcon /></button></div>{submittedQuery && <div className="search-result-note">Đang hiển thị kết quả cho <strong>“{submittedQuery}”</strong></div>}<div className="facility-grid">{visible.map((f, i) => <FacilityCard key={f.name} facility={f} index={i} />)}</div>{visible.length === 0 && <div className="empty-state">Không tìm thấy cơ sở phù hợp. Hãy thử từ khóa khác.</div>}</div></section>
        <section className="types section" id="types"><div className="container types-layout"><div className="types-image-wrap"><img src="https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?auto=format&fit=crop&w=1300&q=90" alt="Các kho lưu trữ với nhiều kích thước" /><div className="image-caption"><span>SPACE THAT FITS</span><strong>Chọn đúng không gian<br />cho đúng nhu cầu.</strong></div></div><div className="types-content"><div className="eyebrow green">STORAGE TYPES</div><h2>Từ vài chiếc hộp<br />đến cả một căn phòng.</h2><p>Không cần thuê quá nhiều. Chọn loại kho và diện tích vừa đủ với đồ đạc, thời gian và ngân sách của bạn.</p><div className="type-list"><div className="type-item"><span>01</span><div><strong>Kho tiêu chuẩn</strong><small>Phù hợp đồ gia dụng, hồ sơ và vật dụng cá nhân.</small></div><ArrowIcon /></div><div className="type-item"><span>02</span><div><strong>Kho mát / Cool</strong><small>Kiểm soát nhiệt độ cho nhóm hàng cần môi trường ổn định.</small></div><ArrowIcon /></div><div className="type-item"><span>03</span><div><strong>Kho lạnh / Frozen</strong><small>Dành cho nhu cầu lưu trữ đặc thù với điều kiện nhiệt độ phù hợp.</small></div><ArrowIcon /></div></div></div></div></section>
        <section className="about section" id="about"><div className="container about-grid"><div><div className="eyebrow green">ABOUT STORESPACE</div><h2>Lưu trữ đơn giản,<br />quản lý rõ ràng.</h2></div><div className="about-copy"><p>StoreSpace kết nối khách hàng với các cơ sở lưu trữ và hỗ trợ toàn bộ vòng đời thuê kho — từ tìm kiếm, đặt kho, thanh toán đến bàn giao và theo dõi hợp đồng.</p><div className="process-list"><div><b>01</b><span>Chọn cơ sở, loại kho, kích thước và thời gian thuê.</span></div><div><b>02</b><span>Giá, tiền cọc, thanh toán và hợp đồng được theo dõi rõ ràng.</span></div><div><b>03</b><span>Quy trình kiểm tra, bàn giao và quản lý quyền truy cập.</span></div></div></div></div></section>
        <section className="support" id="support"><div className="container"><div className="support-card"><div><div className="eyebrow">NEED HELP?</div><h2>Bạn cần hỗ trợ về kho?</h2><p>Đội ngũ StoreSpace sẵn sàng hỗ trợ thông tin về cơ sở, loại kho, đặt kho và quy trình thuê.</p></div><a className="primary-dark-button" href="mailto:support@storespace.vn">Bắt đầu ngay <ArrowIcon /></a></div></div></section>
      </main>
      <SiteFooter />
    </div>
  )
}

function getRoute() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  if (path === '/') return { type: 'home' }
  if (path === '/login') return { type: 'login' }
  if (path === '/register') return { type: 'register' }
  if (path === '/search') return { type: 'search' }
  if (path === '/facilities') return { type: 'facilities' }
  if (path === '/customer') return { type: 'customer' }

  //Đã cập nhật: Route /staff trong getRoute()
  if (path === '/staff') return { type: 'staff' }
  //Đã thêm: 05/10/2026

  //Đã cập nhật: Route /manager trong getRoute()
  if (path === '/manager') return { type: 'manager' }
  //Đã thêm 05/10/2026

  if (path === '/admin') return { type: 'admin' }
  if (path === '/business') return { type: 'business' }

  if (path.startsWith('/facilities/')) {
    const parts = path.replace('/facilities/', '').split('/')
    const facility = facilities.find(item => createSlug(item.name) === parts[0])
    if (!facility) return { type: 'home' }
    if (parts[1] === 'unit' && parts[2]) {
      const unit = getStorageUnits(facility.name).find(item => item.id.toLowerCase() === parts[2].toLowerCase())
      if (!unit) return { type: 'home' }

      //Đã cập nhật: Đường dẫn kho đã thuê thì quay về trang cơ sở
      if (!unit.available) return { type: 'detail', facility }
      //Đã thêm: 05/10/2026


      if (parts[3] === 'booking') return { type: 'booking', facility, unit }
      return { type: 'unit-detail', facility, unit }
    }
    return { type: 'detail', facility }
  }
  return { type: 'home' }
}

//Đã cập nhật: Component chuyển hướng
function RedirectTo({ path }) {
  useEffect(() => { navigate(path) }, [path])
  return null
}
// Đã thêm: 05/10/2026

// ================================================================
// useCatalog() — Hook lấy dữ liệu từ API, fallback về data tĩnh
// Kiến trúc đúng: Frontend không cần sửa code khi DB thay đổi.
// ================================================================
function useCatalog() {
  const [liveFacilities, setLiveFacilities] = useState(null)       // null = chưa load xong
  const [liveUnits, setLiveUnits] = useState(null)
  const [apiStatus, setApiStatus] = useState('loading')           // 'loading' | 'live' | 'offline'

  useEffect(() => {
    let cancelled = false
    fetchCatalog().then(result => {
      if (cancelled) return
      if (result) {
        // ✅ Backend online — dùng dữ liệu thực từ DB
        setLiveFacilities(result.facilities)
        setLiveUnits(result.storageUnitsByFacility)
        setApiStatus('live')
        console.log('[API] Đã tải', result.facilities.length, 'cơ sở,',
          Object.values(result.storageUnitsByFacility).flat().length, 'kho từ backend')
      } else {
        // ⚠️ Backend offline — fallback về seed data tĩnh
        setLiveFacilities(facilities)          // facilities tĩnh trong file này
        setLiveUnits(storageUnits)             // storageUnits tĩnh trong file này
        setApiStatus('offline')
        console.warn('[API] Backend offline — dùng seed data tạm thời')
      }
    })
    return () => { cancelled = true }
  }, [])

  return { liveFacilities, liveUnits, apiStatus }
}

function Router() {
  const [route, setRoute] = useState(getRoute())
  const { liveFacilities, liveUnits, apiStatus } = useCatalog()

  useEffect(() => {
    const onPop = () => {
      setRoute(getRoute())
      window.scrollTo(0, 0)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [route.type, route.facility?.name, route.unit?.id])

  // Hiển thị loading khi chưa có dữ liệu
  if (!liveFacilities) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', flexDirection:'column', gap:'16px', background:'#0d0d1a', color:'#e2e8f0' }}>
        <div style={{ fontSize:'2rem' }}>⌛</div>
        <div style={{ fontSize:'1.1rem' }}>Đang kết nối hệ thống...</div>
        <div style={{ fontSize:'0.85rem', opacity:0.5 }}>Kết nối tới backend API tại localhost:5046</div>
      </div>
    )
  }

  // Badge trạng thái API — chỉ hiện trong dev
  const ApiBadge = () => (
    <div style={{ position:'fixed', bottom:'12px', right:'12px', zIndex:9999,
      background: apiStatus === 'live' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
      border: `1px solid ${apiStatus === 'live' ? '#10b981' : '#f59e0b'}`,
      borderRadius:'8px', padding:'6px 12px', fontSize:'0.75rem', fontFamily:'monospace',
      color: apiStatus === 'live' ? '#10b981' : '#f59e0b', backdropFilter:'blur(8px)' }}>
      {apiStatus === 'live' ? '🟢 API Live — dữ liệu từ DB' : '🟡 API Offline — dữ liệu tạm (seed)'}
    </div>
  )

  if (route.type === 'login') return <><ApiBadge/><LoginPage /></>
  if (route.type === 'register') return <><ApiBadge/><RegisterPage /></>
  if (route.type === 'search') return <><ApiBadge/><SearchPage /></>
  if (route.type === 'facilities') return <><ApiBadge/><FacilitiesPage /></>

  // Chỉ đúng role mới được vào khu Admin / Business
  if (route.type === 'admin') {
    return getCurrentUser()?.role === 'SYSTEM_ADMIN' ? <Admin /> : <RedirectTo path="/login" />
  }
  if (route.type === 'business') {
    return getCurrentUser()?.role === 'BUSINESS_OPERATIONS' ? <BusinessOperations /> : <RedirectTo path="/login" />
  }

  //Đã cập nhật: Router render StaffPortal
  if (route.type === 'staff') {
    return <><ApiBadge/><StaffPortal embedded currentUser={getCurrentUser()} navigate={navigate} currentUserKey={CURRENT_USER_KEY} /></>
  }
  //Đã thêm: 05/10/2026

  //Đã cập nhật: Router render FacilityManagerDashboard
  if (route.type === 'manager') {
    return <><ApiBadge/><FacilityManagerDashboard embedded currentUser={getCurrentUser()} navigate={navigate} currentUserKey={CURRENT_USER_KEY} /></>
  }
  //Đã thêm: 05/10/2026

  if (route.type === 'customer') {
    //Đã cập nhật: Staff vào /customer thì chuyển sang /staff
    { const r = getCurrentUser()?.role; if (r && r !== 'customer') return <RedirectTo path={roleHome(r)} /> }
    //Đã thêm: 05/10/2026

    //Đã cập nhật: Truyền dữ liệu từ API (hoặc fallback) xuống CustomerDashboard
    return <><ApiBadge/><CustomerDashboard
      facilities={liveFacilities}
      storageUnits={liveUnits}
      customerRental={customerRental}
      customerRentals={[...getMyRentals(getCurrentUser()), customerRental]}
      getCurrentUser={getCurrentUser}
      navigate={navigate}
      currentUserKey={CURRENT_USER_KEY}
    /></>
    //Đã thêm: 05/10/2026
  }
  if (route.type === 'booking') return <><ApiBadge/><BookingPage facility={route.facility} unit={route.unit} /></>
  if (route.type === 'unit-detail') return <><ApiBadge/><UnitDetailPage facility={route.facility} unit={route.unit} /></>
  if (route.type === 'detail') return <><ApiBadge/><FacilityDetailPage facility={route.facility} /></>
  return <><ApiBadge/><HomePage facilities={liveFacilities} storageUnits={liveUnits} /></>
}

createRoot(document.getElementById('root')).render(<Router />)
