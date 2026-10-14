import React, { useState, useEffect, useMemo } from 'react'
import './styles.css'
import './fmanagerstyles.css'

/* =========================================================
   StoreSpace — Facility Manager Portal (Frontend Only Demo)
   - Lưu/Đọc chung localStorage với App.jsx & FacilityStaffAccount.jsx:
     + "storespace_staff_db_v2" (Kho, Đặt chỗ, Hợp đồng, Nhật ký)
     + "storespace_pending_booking" (Đơn khách mới đặt)
   - Happy Case bao gồm:
     1. Khởi tạo & Cấu hình danh mục kho (Thêm, Sửa trạng thái kho)
     2. Xét duyệt đặt chỗ & Phân gán kho cụ thể (Assign Storage Unit)
     3. Phân công Facility Staff tại cơ sở
     4. Giám sát hợp đồng & trạng thái thanh toán
     5. Xem báo cáo vận hành cơ sở (Tỷ lệ lấp đầy, doanh thu)
   ========================================================= */

const DB_KEY = 'storespace_staff_db_v2'
const SESSION_KEY = 'storespace_manager_session_v1'
const PENDING_BOOKING_KEY = 'storespace_pending_booking'

/* Tài khoản Facility Manager – khớp Users DB (RoleID=3) */
export const MANAGER_ACCOUNTS = [
  { id: 'u-mgr-01', fullName: 'Nguyễn Quản Lý Cơ Sở 1', email: 'fm1@test.com', password: '123456', role: 'FACILITY_MANAGER', facilityId: 'Cơ sở Lưu trữ Quận 1' },
  { id: 'u-mgr-02', fullName: 'Trần Quản Lý Cơ Sở 2', email: 'fm2@test.com', password: '123456', role: 'FACILITY_MANAGER', facilityId: 'Cơ sở Lưu trữ Tân Bình' }
]

/* Danh sách Nhân viên thuộc cơ sở – khớp FacilityStaff DB */
const STAFF_LIST_BY_FACILITY = {
  'Cơ sở Lưu trữ Quận 1': [
    { id: 'u-staff-01', name: 'Lê Nhân Viên Một',   email: 'staff1@test.com', phone: '0902000001', shift: 'Ca sáng (07:00 - 15:00)' },
    { id: 'u-staff-02', name: 'Phạm Nhân Viên Hai', email: 'staff2@test.com', phone: '0902000002', shift: 'Ca chiều (15:00 - 23:00)' }
  ],
  'Cơ sở Lưu trữ Tân Bình': [
    { id: 'u-staff-03', name: 'Hoàng Nhân Viên Ba', email: 'staff3@test.com', phone: '0902000003', shift: 'Cả ngày (08:00 - 17:00)' }
  ],
  'Cơ sở Lưu trữ Thủ Đức': [],
  'Cơ sở Lưu trữ Quận 2': [],
  'Cơ sở Lưu trữ Quận 3': []
}

/* Helpers */
const fmtMoney = (n) => new Intl.NumberFormat('vi-VN').format(n || 0) + 'đ'
const fmtDate = (s) => (s ? s.split('-').reverse().join('/') : '—')
const pad = (n) => String(n).padStart(2, '0')
const todayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const RES_STATUS_MAP = {
  PENDING_PAYMENT: { label: 'Chờ trả cọc', tone: 'warn' },
  PENDING_CONFIRMATION: { label: 'Chờ xác nhận cọc', tone: 'warn' },
  PENDING_APPROVAL: { label: 'Chờ Manager duyệt', tone: 'info' },
  CONFIRMED: { label: 'Đã phân kho', tone: 'info' },
  HANDED_OVER: { label: 'Đã bàn giao', tone: 'ok' }
}

const UNIT_STATUS_MAP = {
  AVAILABLE: { label: 'Còn trống', tone: 'ok' },
  RESERVED: { label: 'Đã giữ chỗ', tone: 'info' },
  RENTED: { label: 'Đang thuê', tone: 'ok' },
  NEEDS_INSPECTION: { label: 'Cần kiểm tra', tone: 'warn' }
}

function syncLiveManager(db) {
  let b = null;
  try { b = JSON.parse(localStorage.getItem(PENDING_BOOKING_KEY) || "null"); } catch { /* ignore */ }
  if (!b || !b.id) return db;

  const existing = db.reservations.find((r) => r.id === b.id);
  const start = b.startDate ? b.startDate.split('/').reverse().join('-') : '';

  // Nếu là đơn mới do Customer vừa thanh toán cọc thành công
  if (!existing && b.depositPaid) {
    const newRes = {
      id: b.id,
      customerName: b.customerName,
      customerEmail: b.customerEmail,
      customerPhone: '—',
      facilityId: b.facility,
      unitId: b.unitId,
      unitType: `${b.unitType} ${b.size}`,
      startDate: start,
      months: b.durationMonths,
      appointmentDate: start,
      appointmentTime: 'Cả ngày',
      deposit: b.deposit,
      rentalFee: b.totalRent,
      paymentStatus: 'PAID',
      paymentTxn: `TXN-${b.id}`,
      status: 'PENDING_APPROVAL', // Chờ Manager duyệt
      assignedUnitId: null,
      contractId: null,
      source: 'live'
    };
    return {
      ...db,
      reservations: [newRes, ...(db.reservations || [])]
    };
  }
  return db;
}

function loadDb() {
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error(e)
  }
  return { facilities: [], units: [], reservations: [], contracts: [], activity: [] }
}

function saveDb(db) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db))
  } catch (e) {
    console.error(e)
  }
}

/* Badge Component */
function Badge({ map, value }) {
  const item = map[value] || { label: value, tone: 'info' }
  return <span className={`fm-badge fm-${item.tone}`}>{item.label}</span>
}

/* Modal Tạo/Chỉnh Sửa Kho */
function UnitFormModal({ facilityId, editingUnit, onClose, onSave }) {
  const [id, setId] = useState(editingUnit ? editingUnit.id : '')
  const [type, setType] = useState(editingUnit ? editingUnit.type : 'Kho tiêu chuẩn')
  const [sizeM2, setSizeM2] = useState(editingUnit ? editingUnit.sizeM2 : 3)
  const [pricePerMonth, setPricePerMonth] = useState(editingUnit ? editingUnit.pricePerMonth : 650000)
  const [status, setStatus] = useState(editingUnit ? editingUnit.status : 'AVAILABLE')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!id.trim()) return setError('Vui lòng nhập Mã kho (VD: CD-103)')
    onSave({
      id: id.trim().toUpperCase(),
      facilityId,
      type,
      sizeM2: Number(sizeM2),
      pricePerMonth: Number(pricePerMonth),
      status
    })
  }

  return (
    <div className="fm-modal-overlay">
      <div className="fm-modal-card">
        <div className="fm-modal-header">
          <h2>{editingUnit ? `Chỉnh sửa kho ${editingUnit.id}` : 'Tạo kho mới'}</h2>
          <button type="button" className="fm-modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="fm-modal-form">
          {error && <div className="auth-message error">{error}</div>}
          <label>
            Mã kho
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="VD: CD-103"
              disabled={!!editingUnit}
              required
            />
          </label>

          <div className="fm-form-row">
            <label>
              Loại kho
              <select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="Kho tiêu chuẩn">Kho tiêu chuẩn</option>
                <option value="Kho mát / Cool">Kho mát / Cool</option>

                <option value="Kho lớn">Kho lớn</option>
              </select>
            </label>

            <label>
              Diện tích (m²)
              <input
                type="number"
                min="1"
                value={sizeM2}
                onChange={(e) => setSizeM2(e.target.value)}
                required
              />
            </label>
          </div>

          <div className="fm-form-row">
            <label>
              Giá thuê (VNĐ/tháng)
              <input
                type="number"
                step="50000"
                value={pricePerMonth}
                onChange={(e) => setPricePerMonth(e.target.value)}
                required
              />
            </label>

            <label>
              Trạng thái
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="AVAILABLE">Còn trống</option>
                <option value="RESERVED">Đã giữ chỗ</option>
                <option value="RENTED">Đang thuê</option>
                <option value="NEEDS_INSPECTION">Cần kiểm tra</option>
              </select>
            </label>
          </div>

          <div className="fm-modal-actions">
            <button type="button" className="dashboard-secondary-btn" onClick={onClose}>Hủy</button>
            <button type="submit" className="dashboard-primary-btn">Lưu kho</button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* =========================================================
   MAIN DASHBOARD COMPONENT
   ========================================================= */
export default function FacilityManagerDashboard({ embedded = false, currentUser = null, navigate = null, currentUserKey = 'storespace_current_user' }) {
  const [db, setDb] = useState(loadDb)
  const [activeTab, setActiveTab] = useState('overview')
  const [query, setQuery] = useState('')
  const [editingUnit, setEditingUnit] = useState(null)
  const [showUnitModal, setShowUnitModal] = useState(false)
  const [selectedResId, setSelectedResId] = useState(null)
  const [selectedUnitForAssign, setSelectedUnitForAssign] = useState('')

  // Manager Session
  const manager = useMemo(() => {
    if (embedded && currentUser && currentUser.role === 'FACILITY_MANAGER') {
      return MANAGER_ACCOUNTS.find(m => m.email.toLowerCase() === currentUser.email.toLowerCase()) || MANAGER_ACCOUNTS[0]
    }
    try {
      const savedId = localStorage.getItem(SESSION_KEY)
      return MANAGER_ACCOUNTS.find(m => m.id === savedId) || MANAGER_ACCOUNTS[0]
    } catch {
      return MANAGER_ACCOUNTS[0]
    }
  }, [embedded, currentUser])

  // Reload DB khi focus tab
  useEffect(() => {
    const handleSync = () => setDb(loadDb())
    window.addEventListener('focus', handleSync)
    window.addEventListener('storage', handleSync)
    return () => {
      window.removeEventListener('focus', handleSync)
      window.removeEventListener('storage', handleSync)
    }
  }, [])

  const facilityName = manager.facilityId

  /* Dữ liệu đã lọc theo Cơ sở của Manager */
  const facilityUnits = useMemo(() => db.units.filter(u => u.facilityId === facilityName), [db, facilityName])
  const facilityReservations = useMemo(() => db.reservations.filter(r => r.facilityId === facilityName), [db, facilityName])
  const facilityContracts = useMemo(() => db.contracts.filter(c => {
    const res = db.reservations.find(r => r.id === c.reservationId)
    return res ? res.facilityId === facilityName : c.unitId.startsWith(facilityName.substring(0, 2))
  }), [db, facilityName])

  /* Thống kê Báo cáo (Reports & Analytics) */
  const stats = useMemo(() => {
    const totalUnits = facilityUnits.length
    const rentedUnits = facilityUnits.filter(u => u.status === 'RENTED').length
    const reservedUnits = facilityUnits.filter(u => u.status === 'RESERVED').length
    const availableUnits = facilityUnits.filter(u => u.status === 'AVAILABLE').length
    const occupancyRate = totalUnits > 0 ? Math.round((rentedUnits / totalUnits) * 100) : 0

    const totalRevenue = facilityReservations
      .filter(r => r.paymentStatus === 'PAID')
      .reduce((sum, r) => sum + (r.rentalFee || 0) + (r.deposit || 0), 0)

    const pendingApprovals = facilityReservations.filter(r => r.status === 'PENDING_APPROVAL').length

    return { totalUnits, rentedUnits, reservedUnits, availableUnits, occupancyRate, totalRevenue, pendingApprovals }
  }, [facilityUnits, facilityReservations])

  /* Xử lý Cập nhật DB */
  const updateDatabase = (newDb, logText) => {
    if (logText) {
      newDb.activity = [
        {
          id: `A-${Date.now()}`,
          at: new Date().toISOString(),
          facilityId: facilityName,
          staffName: manager.fullName + ' (Manager)',
          text: logText
        },
        ...(newDb.activity || [])
      ]
    }
    setDb(newDb)
    saveDb(newDb)
  }

  /* 1. Hành động: Xét duyệt & Phân kho cụ thể */
  const handleApproveAndAssign = (resId, unitId) => {
    if (!unitId) return alert('Vui lòng chọn một kho trống để phân bổ!')
    const res = db.reservations.find(r => r.id === resId)
    if (!res) return

    const nextReservations = db.reservations.map(r => r.id === resId ? { ...r, status: 'CONFIRMED', assignedUnitId: unitId } : r)
    const nextUnits = db.units.map(u => u.id === unitId ? { ...u, status: 'RESERVED' } : u)

    updateDatabase(
      { ...db, reservations: nextReservations, units: nextUnits },
      `Manager đã duyệt đơn ${res.id} và phân bổ kho ${unitId} cho khách hàng ${res.customerName}.`
    )
    setSelectedResId(null)
    setSelectedUnitForAssign('')
    alert(`Đã duyệt đơn ${res.id} và phân bổ kho ${unitId} thành công!`)
  }

  /* 2. Hành động: Thêm/Sửa thông tin kho */
  const handleSaveUnit = (unitData) => {
    const existingIndex = db.units.findIndex(u => u.id === unitData.id)
    let nextUnits = [...db.units]
    if (existingIndex >= 0) {
      nextUnits[existingIndex] = unitData
    } else {
      nextUnits.push(unitData)
    }

    updateDatabase(
      { ...db, units: nextUnits },
      `Manager đã ${existingIndex >= 0 ? 'cập nhật' : 'tạo mới'} thông tin kho ${unitData.id}.`
    )
    setShowUnitModal(false)
    setEditingUnit(null)
  }

  const handleLogout = () => {
    if (embedded && navigate) {
      localStorage.removeItem(currentUserKey)
      navigate('/login')
    } else {
      localStorage.removeItem(SESSION_KEY)
      window.location.reload()
    }
  }

  const pendingList = facilityReservations.filter(r => r.status === 'PENDING_APPROVAL')
  const staffList = STAFF_LIST_BY_FACILITY[facilityName] || []

  return (
    <div className="customer-layout fm-root">
      {/* SIDEBAR */}
      <aside className="customer-sidebar">
        <div className="customer-brand">
          <span className="brand-mark">S</span>
          <div>
            <strong>StoreSpace</strong>
            <small>Manager Portal</small>
          </div>
        </div>

        <div className="customer-profile-mini">
          <div className="customer-avatar">
            {manager.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <strong>{manager.fullName}</strong>
            <small>Facility Manager</small>
          </div>
        </div>

        <nav className="customer-nav">
          <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
            <span>⌂</span> Tổng quan & Báo cáo
          </button>
          <button className={activeTab === 'approvals' ? 'active' : ''} onClick={() => setActiveTab('approvals')}>
            <span>◷</span> Xét duyệt đặt chỗ {stats.pendingApprovals > 0 && <span className="fm-count-badge">{stats.pendingApprovals}</span>}
          </button>
          <button className={activeTab === 'units' ? 'active' : ''} onClick={() => setActiveTab('units')}>
            <span>▣</span> Quản lý kho cơ sở
          </button>
          <button className={activeTab === 'contracts' ? 'active' : ''} onClick={() => setActiveTab('contracts')}>
            <span>▤</span> Hợp đồng & Khách hàng
          </button>
          <button className={activeTab === 'staff' ? 'active' : ''} onClick={() => setActiveTab('staff')}>
            <span>👥</span> Nhân sự tại cơ sở
          </button>
        </nav>

        <div className="customer-sidebar-bottom">
          <button onClick={handleLogout}>
            <span>↪</span> Đăng xuất
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="customer-main">
        {/* TOPBAR */}
        <div className="customer-topbar">
          <div>
            <span className="customer-eyebrow">FACILITY MANAGER · {facilityName.toUpperCase()}</span>
            <h1>
              {activeTab === 'overview' && 'Tổng quan & Báo cáo cơ sở'}
              {activeTab === 'approvals' && 'Xét duyệt & Phân bổ kho'}
              {activeTab === 'units' && 'Danh mục kho tại cơ sở'}
              {activeTab === 'contracts' && 'Giám sát hợp đồng thuê'}
              {activeTab === 'staff' && 'Phân công nhân viên cơ sở'}
            </h1>
            <p>Quản lý vận hành, xét duyệt đặt kho và giám sát doanh thu cơ sở {facilityName}.</p>
          </div>
          <div className="fm-facility-chip">
            📍 <strong>{facilityName}</strong>
          </div>
        </div>

        {/* TAB 1: OVERVIEW & REPORTS */}
        {activeTab === 'overview' && (
          <div className="overview-page">
            <section className="customer-stats">
              <div className="customer-stat-card">
                <span className="stat-icon blue">▣</span>
                <small>Tổng số kho</small>
                <strong>{stats.totalUnits}</strong>
                <span className="stat-note">Tại {facilityName}</span>
              </div>

              <div className="customer-stat-card">
                <span className="stat-icon">📈</span>
                <small>Tỷ lệ lấp đầy</small>
                <strong>{stats.occupancyRate}%</strong>
                <span className="stat-note">{stats.rentedUnits} kho đang thuê</span>
              </div>

              <div className="customer-stat-card">
                <span className="stat-icon yellow">⏳</span>
                <small>Chờ duyệt & Phân kho</small>
                <strong>{stats.pendingApprovals}</strong>
                <span className="stat-note warning">Đơn đã đóng cọc</span>
              </div>

              <div className="customer-stat-card">
                <span className="stat-icon blue">₫</span>
                <small>Doanh thu ghi nhận</small>
                <strong>{fmtMoney(stats.totalRevenue)}</strong>
                <span className="stat-note">Tiền cọc + Tiền thuê</span>
              </div>
            </section>

            {/* BÁO CÁO NHANH TRẠNG THÁI KHO */}
            <section className="overview-panel">
              <div className="overview-panel-heading">
                <div>
                  <span className="customer-eyebrow">FACILITY OCCUPANCY</span>
                  <h2>Báo cáo trạng thái kho cơ sở</h2>
                </div>
              </div>

              <div className="fm-progress-bar-container">
                <div className="fm-progress-bar">
                  <div className="fm-bar-rented" style={{ width: `${(stats.rentedUnits / (stats.totalUnits || 1)) * 100}%` }} title="Đang thuê" />
                  <div className="fm-bar-reserved" style={{ width: `${(stats.reservedUnits / (stats.totalUnits || 1)) * 100}%` }} title="Đã giữ chỗ" />
                  <div className="fm-bar-available" style={{ width: `${(stats.availableUnits / (stats.totalUnits || 1)) * 100}%` }} title="Còn trống" />
                </div>
                <div className="fm-progress-legend">
                  <span><i className="dot rented" /> Đang thuê ({stats.rentedUnits})</span>
                  <span><i className="dot reserved" /> Đã giữ chỗ ({stats.reservedUnits})</span>
                  <span><i className="dot available" /> Còn trống ({stats.availableUnits})</span>
                </div>
              </div>
            </section>

            {/* CẦN XỬ LÝ NGAY */}
            {pendingList.length > 0 && (
              <section className="overview-panel">
                <div className="overview-panel-heading">
                  <div>
                    <span className="customer-eyebrow">ACTION REQUIRED</span>
                    <h2>Đơn đặt kho chờ bạn xét duyệt ({pendingList.length})</h2>
                  </div>
                  <button className="overview-text-button" onClick={() => setActiveTab('approvals')}>Xem tất cả →</button>
                </div>

                <div className="fm-pending-mini-list">
                  {pendingList.map(r => (
                    <div key={r.id} className="fm-pending-mini-item">
                      <div>
                        <strong>{r.customerName}</strong>
                        <small>{r.id} · {r.unitType} · Thuê {r.months} tháng</small>
                      </div>
                      <div className="fm-item-right">
                        <span className="fm-amount">{fmtMoney(r.deposit)} (Đã cọc)</span>
                        <button className="dashboard-primary-btn" onClick={() => setActiveTab('approvals')}>Duyệt ngay</button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* TAB 2: XÉT DUYỆT & PHÂN KHO */}
        {activeTab === 'approvals' && (
          <div className="fm-section-card">
            <div className="fm-card-header">
              <h2>Đơn đặt kho chờ duyệt & Phân kho cụ thể</h2>
              <p>Khách hàng đã thanh toán 20% tiền cọc. Hãy đối chiếu và chọn kho cụ thể còn trống để phân bổ.</p>
            </div>

            {pendingList.length === 0 ? (
              <div className="empty-state">Hiện không có đơn đặt kho nào đang chờ xét duyệt.</div>
            ) : (
              <div className="fm-approval-grid">
                {pendingList.map(res => {
                  const availableUnitsForType = facilityUnits.filter(u => u.status === 'AVAILABLE' && u.type.includes(res.unitType.split(' ')[0]))
                  const isSelected = selectedResId === res.id

                  return (
                    <div key={res.id} className="fm-approval-card">
                      <div className="fm-approval-head">
                        <div>
                          <span className="customer-eyebrow">MÃ ĐẶT CHỖ: {res.id}</span>
                          <h3>{res.customerName}</h3>
                          <p>✉ {res.customerEmail}</p>
                        </div>
                        <Badge map={RES_STATUS_MAP} value={res.status} />
                      </div>

                      <div className="rental-info-grid">
                        <div>
                          <small>Loại kho yêu cầu</small>
                          <strong>{res.unitType}</strong>
                        </div>
                        <div>
                          <small>Kho khách chọn</small>
                          <strong>{res.unitId || 'Tự động'}</strong>
                        </div>
                        <div>
                          <small>Ngày bắt đầu</small>
                          <strong>{fmtDate(res.startDate)}</strong>
                        </div>
                        <div>
                          <small>Thời gian thuê</small>
                          <strong>{res.months} tháng</strong>
                        </div>
                        <div>
                          <small>Tiền cọc 20%</small>
                          <strong className="available-text">{fmtMoney(res.deposit)}</strong>
                        </div>
                        <div>
                          <small>Tổng giá trị</small>
                          <strong>{fmtMoney(res.rentalFee)}</strong>
                        </div>
                      </div>

                      <div className="fm-assign-box">
                        <label><strong>Chọn kho cụ thể tại {facilityName} để gán:</strong></label>
                        <select
                          className="fm-input"
                          value={isSelected ? selectedUnitForAssign : (res.assignedUnitId || res.unitId || '')}
                          onChange={(e) => {
                            setSelectedResId(res.id)
                            setSelectedUnitForAssign(e.target.value)
                          }}
                        >
                          <option value="">-- Chọn kho phù hợp --</option>
                          {facilityUnits.filter(u => u.status === 'AVAILABLE' || u.id === (res.assignedUnitId || res.unitId)).map(u => (
                            <option key={u.id} value={u.id}>
                              {u.id} - {u.type} ({u.sizeM2}m²) - {fmtMoney(u.pricePerMonth)}/tháng {u.status === 'RESERVED' ? '(Đang giữ chỗ)' : ''}
                            </option>
                          ))}
                        </select>

                        <div className="fm-actions-row">
                          <button
                            className="dashboard-primary-btn"
                            onClick={() => handleApproveAndAssign(res.id, isSelected ? selectedUnitForAssign : (res.assignedUnitId || res.unitId))}
                          >
                            ✓ Duyệt đơn & Phân gán kho
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: QUẢN LÝ KHO CƠ SỞ */}
        {activeTab === 'units' && (
          <div className="fm-section-card">
            <div className="fm-card-header-flex">
              <div>
                <h2>Danh mục kho tại {facilityName}</h2>
                <p>Thêm mới, điều chỉnh giá và cập nhật trạng thái kho trực thuộc cơ sở.</p>
              </div>
              <button className="dashboard-primary-btn" onClick={() => { setEditingUnit(null); setShowUnitModal(true) }}>
                + Tạo kho mới
              </button>
            </div>

            <div className="fm-table-wrap">
              <table className="fm-table">
                <thead>
                  <tr>
                    <th>Mã kho</th>
                    <th>Loại kho</th>
                    <th>Diện tích</th>
                    <th>Giá thuê / tháng</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {facilityUnits.map(unit => (
                    <tr key={unit.id}>
                      <td><strong>{unit.id}</strong></td>
                      <td>{unit.type}</td>
                      <td>{unit.sizeM2} m²</td>
                      <td><strong>{fmtMoney(unit.pricePerMonth)}</strong></td>
                      <td><Badge map={UNIT_STATUS_MAP} value={unit.status} /></td>
                      <td>
                        <button
                          className="dashboard-secondary-btn sm"
                          onClick={() => { setEditingUnit(unit); setShowUnitModal(true) }}
                        >
                          Sửa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: HỢP ĐỒNG & KHÁCH HÀNG */}
        {activeTab === 'contracts' && (
          <div className="fm-section-card">
            <div className="fm-card-header">
              <h2>Hợp đồng thuê đang hoạt động tại {facilityName}</h2>
              <p>Giám sát thời hạn hợp đồng, mã truy cập và nghĩa vụ thanh toán của khách hàng.</p>
            </div>

            <div className="fm-table-wrap">
              <table className="fm-table">
                <thead>
                  <tr>
                    <th>Mã HĐ</th>
                    <th>Khách hàng</th>
                    <th>Kho</th>
                    <th>Ngày bắt đầu</th>
                    <th>Ngày kết thúc</th>
                    <th>Thông tin ra vào</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {facilityContracts.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center">Chưa có hợp đồng nào được khởi tạo tại cơ sở này.</td>
                    </tr>
                  ) : (
                    facilityContracts.map(c => (
                      <tr key={c.id}>
                        <td><strong>{c.id}</strong></td>
                        <td>{c.customerName}</td>
                        <td><span className="fm-tag-blue">{c.unitId}</span></td>
                        <td>{fmtDate(c.startDate)}</td>
                        <td>{fmtDate(c.endDate)}</td>
                        <td><code>{c.accessType}: {c.accessValue}</code></td>
                        <td><span className="fm-badge fm-ok">Đang hiệu lực</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: PHÂN CÔNG NHÂN VIÊN */}
        {activeTab === 'staff' && (
          <div className="fm-section-card">
            <div className="fm-card-header">
              <h2>Đội ngũ Facility Staff tại {facilityName}</h2>
              <p>Danh sách nhân viên vận hành phụ trách kiểm tra kho và hỗ trợ check-in bàn giao cho khách.</p>
            </div>

            <div className="fm-staff-grid">
              {staffList.map(st => (
                <div key={st.id} className="fm-staff-card">
                  <div className="fm-staff-avatar">{st.name.charAt(0)}</div>
                  <div className="fm-staff-info">
                    <h3>{st.name}</h3>
                    <p>✉ {st.email}</p>
                    <p>📞 {st.phone}</p>
                    <div className="fm-shift-tag">🕒 {st.shift}</div>
                  </div>
                  <div className="fm-staff-status">
                    <span className="fm-badge fm-ok">Đang làm việc</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* MODAL TẠO/SỬA KHO */}
      {showUnitModal && (
        <UnitFormModal
          facilityId={facilityName}
          editingUnit={editingUnit}
          onClose={() => setShowUnitModal(false)}
          onSave={handleSaveUnit}
        />
      )}
    </div>
  )
}
