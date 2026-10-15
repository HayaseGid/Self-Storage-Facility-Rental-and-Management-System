// ============================================================
// CUSTOMER ACCOUNT / CUSTOMER DASHBOARD
// ============================================================
// NOTE:
// - Class names are intentionally kept 100% the same as the original file.
// - Only the customer-related components were moved here.
// - Shared data/functions are received from App.jsx via props.

import React, { useEffect, useState } from 'react'
import { fetchCustomerReservations } from './api/operations.js'

const toDateLabel = value => value
  ? new Date(`${String(value).slice(0, 10)}T00:00:00Z`).toLocaleDateString('vi-VN', { timeZone: 'UTC' })
  : '—'

function mapCustomerReservation(reservation) {
  const startDate = String(reservation.startDate || '').slice(0, 10)
  const endDate = String(reservation.endDate || '').slice(0, 10)
  const start = Date.parse(`${startDate}T00:00:00Z`)
  const end = Date.parse(`${endDate}T00:00:00Z`)
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const totalDays = Math.max(1, Math.ceil((end - start) / 86400000) + 1)
  const remainingDays = Math.max(0, Math.ceil((end - today.getTime()) / 86400000) + 1)
  const status = reservation.status === 'Handed Over'
    ? 'Đang thuê'
    : reservation.status === 'Confirmed'
      ? 'Đã phân kho · chờ bàn giao'
      : reservation.status === 'Paid'
        ? 'Đã thanh toán · chờ phân kho'
        : 'Chờ thanh toán'

  return {
    reservationId: reservation.reservationId,
    facility: reservation.facility,
    unitId: reservation.unitNumber || 'Chưa phân kho',
    type: reservation.unitType,
    size: reservation.size || '',
    price: `${new Intl.NumberFormat('vi-VN').format((reservation.rentalAmount || 0) / Math.max(1, reservation.months))}đ/tháng`,
    startDate: toDateLabel(startDate),
    endDate: toDateLabel(endDate),
    totalDays,
    remainingDays,
    progress: Math.min(100, Math.max(0, Math.round(((totalDays - remainingDays) / totalDays) * 100))),
    contractId: reservation.contractId,
    contractStatus: reservation.contractStatus,
    accessType: reservation.accessType,
    accessValue: reservation.accessValue,
    status,
    paymentStatus: reservation.paymentStatus,
  }
}

function MyStoragePage({ customerRental, customerRentals, facilities }) {
  const rentals = customerRentals || (customerRental ? [customerRental] : [])

  return (
    <div className="customer-content-page">

      <div className="customer-page-heading">
        <div>
          <span className="customer-eyebrow">
            MY STORAGE
          </span>

          <h1>Kho của tôi</h1>

          <p>
            Quản lý các kho bạn đang thuê tại StoreSpace.
          </p>
        </div>

        <span className="page-count">
          {rentals.filter(item => item.status === 'Đang thuê').length} kho đang thuê
        </span>
      </div>

      {rentals.length === 0 && <div className="empty-state">Bạn chưa có kho hoặc hợp đồng thuê nào.</div>}
      {rentals.map(rental => (
      <div key={rental.contractId || rental.unitId} style={{ marginBottom: 28 }}>
      <div className="my-storage-card">

        <div className="storage-card-image">
          <img
            src={
              facilities.find(
                (item) => item.name === rental.facility
              )?.image
            }
            alt={rental.facility}
          />
        </div>

        <div className="storage-card-content">

          <div className="storage-card-heading">
            <div>
              <span className="storage-facility-name">
                {rental.facility}
              </span>

              <h2>{rental.unitId}</h2>

              <p>
                {rental.type} · {rental.size}
              </p>
            </div>

            <span className="storage-status">● {rental.status || 'Đang thuê'}</span>
          </div>

          <div className="storage-info-grid">

            <div>
              <small>Ngày bắt đầu</small>
              <strong>{rental.startDate}</strong>
            </div>

            <div>
              <small>Ngày kết thúc</small>
              <strong>{rental.endDate}</strong>
            </div>

            <div>
              <small>Giá thuê</small>
              <strong>{rental.price}</strong>
            </div>

            <div>
              <small>Còn lại</small>
              <strong>
                {rental.remainingDays} ngày
              </strong>
            </div>

          </div>

          <div className="storage-progress">

            <div className="storage-progress-header">
              <span>Thời hạn thuê</span>
              <strong>{rental.progress}%</strong>
            </div>

            <div className="rental-progress">
              <div
                style={{
                  width: `${rental.progress}%`
                }}
              />
            </div>

          </div>

          <div className="storage-actions">

            <button className="dashboard-primary-btn">
              Xem chi tiết
            </button>

            <button className="dashboard-secondary-btn">
              Gia hạn kho
            </button>

          </div>

        </div>

      </div>

      <div className="storage-summary-grid">

        <div className="customer-info-card">
          <span className="customer-eyebrow">
            ACCESS
          </span>

          <h2>Quyền truy cập</h2>

          <div className="access-code">
            <span>{rental.accessType ? rental.accessType + ' (nhân viên bàn giao)' : 'Access Code'}</span>
            <strong>{rental.accessValue || 'SS-4812'}</strong>
          </div>

          <p>
            Mã truy cập được dùng để vào khu vực kho
            của bạn.
          </p>
        </div>

        <div className="customer-info-card">
          <span className="customer-eyebrow">
            LOCATION
          </span>

          <h2>Vị trí kho</h2>

          <div className="location-detail">
            <strong>{rental.facility}</strong>
            <span>{(facilities.find(item => item.name === rental.facility) || {}).location || 'TP. Hồ Chí Minh'}</span>
            <span>Tầng 1 · Khu A</span>
          </div>
        </div>

      </div>

      </div>
      ))}
    </div>
  )
}

// function BookingPage({ facilities, storageUnits }) {
//   const [step, setStep] = useState(1)
//   const [selectedFacility, setSelectedFacility] =
//     useState('')
//   const [selectedType, setSelectedType] =
//     useState('')
//   const [selectedUnit, setSelectedUnit] =
//     useState('')
//   const [startDate, setStartDate] =
//     useState('')

//   const availableFacilities = facilities

//   const units = selectedFacility
//     ? storageUnits[selectedFacility] || []
//     : []

//   const availableUnits = units.filter(
//     (unit) => unit.available
//   )

//   const selectedUnitData = units.find(
//     (unit) => unit.id === selectedUnit
//   )

//   return (
//     <div className="customer-content-page">

//       <div className="customer-page-heading">
//         <div>
//           <span className="customer-eyebrow">
//             BOOK STORAGE
//           </span>

//           <h1>Đặt kho</h1>

//           <p>
//             Chọn cơ sở, loại kho và thời gian thuê.
//           </p>
//         </div>

//         <div className="booking-step-indicator">
//           <span className={step >= 1 ? 'active' : ''}>
//             1
//           </span>

//           <i />

//           <span className={step >= 2 ? 'active' : ''}>
//             2
//           </span>

//           <i />

//           <span className={step >= 3 ? 'active' : ''}>
//             3
//           </span>
//         </div>
//       </div>

//       <div className="booking-card">

//         {/* STEP 1 */}

//         {step === 1 && (
//           <div>

//             <div className="booking-card-title">
//               <h2>Chọn cơ sở</h2>
//               <p>
//                 Chọn nơi bạn muốn thuê kho.
//               </p>
//             </div>

//             <div className="booking-facility-grid">

//               {availableFacilities.map((facility) => (
//                 <button
//                   key={facility.name}
//                   type="button"
//                   className={
//                     selectedFacility === facility.name
//                       ? 'booking-facility selected'
//                       : 'booking-facility'
//                   }
//                   onClick={() => {
//                     setSelectedFacility(
//                       facility.name
//                     )
//                     setSelectedType('')
//                     setSelectedUnit('')
//                   }}
//                 >
//                   <img
//                     src={facility.image}
//                     alt={facility.name}
//                   />

//                   <div>
//                     <strong>
//                       {facility.name}
//                     </strong>

//                     <span>
//                       {facility.available} kho trống
//                     </span>
//                   </div>

//                 </button>
//               ))}

//             </div>

//             <button
//               className="dashboard-primary-btn booking-next"
//               disabled={!selectedFacility}
//               onClick={() => setStep(2)}
//             >
//               Tiếp tục
//             </button>

//           </div>
//         )}

//         {/* STEP 2 */}

//         {step === 2 && (
//           <div>

//             <div className="booking-card-title">
//               <h2>Chọn kho</h2>
//               <p>
//                 {selectedFacility}
//               </p>
//             </div>

//             <div className="booking-unit-list">

//               {availableUnits.map((unit) => (
//                 <button
//                   key={unit.id}
//                   type="button"
//                   className={
//                     selectedUnit === unit.id
//                       ? 'booking-unit selected'
//                       : 'booking-unit'
//                   }
//                   onClick={() =>
//                     setSelectedUnit(unit.id)
//                   }
//                 >
//                   <div>
//                     <strong>{unit.id}</strong>
//                     <span>{unit.type}</span>
//                   </div>

//                   <div>
//                     <strong>{unit.size}</strong>
//                     <span>{unit.price}</span>
//                   </div>
//                 </button>
//               ))}

//             </div>

//             <div className="booking-actions">
//               <button
//                 className="dashboard-secondary-btn"
//                 onClick={() => setStep(1)}
//               >
//                 Quay lại
//               </button>

//               <button
//                 className="dashboard-primary-btn"
//                 disabled={!selectedUnit}
//                 onClick={() => setStep(3)}
//               >
//                 Tiếp tục
//               </button>
//             </div>

//           </div>
//         )}

//         {/* STEP 3 */}

//         {step === 3 && selectedUnitData && (
//           <div>

//             <div className="booking-card-title">
//               <h2>Thông tin thuê</h2>
//               <p>
//                 Kiểm tra thông tin trước khi xác nhận.
//               </p>
//             </div>

//             <div className="booking-summary">

//               <div>
//                 <span>Cơ sở</span>
//                 <strong>
//                   {selectedFacility}
//                 </strong>
//               </div>

//               <div>
//                 <span>Mã kho</span>
//                 <strong>
//                   {selectedUnitData.id}
//                 </strong>
//               </div>

//               <div>
//                 <span>Loại kho</span>
//                 <strong>
//                   {selectedUnitData.type}
//                 </strong>
//               </div>

//               <div>
//                 <span>Diện tích</span>
//                 <strong>
//                   {selectedUnitData.size}
//                 </strong>
//               </div>

//               <div>
//                 <span>Ngày bắt đầu</span>

//                 <input
//                   type="date"
//                   value={startDate}
//                   onChange={(e) =>
//                     setStartDate(e.target.value)
//                   }
//                 />
//               </div>

//               <div>
//                 <span>Giá thuê</span>
//                 <strong>
//                   {selectedUnitData.price}
//                 </strong>
//               </div>

//             </div>

//             <div className="booking-actions">

//               <button
//                 className="dashboard-secondary-btn"
//                 onClick={() => setStep(2)}
//               >
//                 Quay lại
//               </button>

//               <button
//                 className="dashboard-primary-btn"
//                 disabled={!startDate}
//                 onClick={() =>
//                   alert(
//                     'Đặt kho thành công!'
//                   )
//                 }
//               >
//                 Xác nhận đặt kho
//               </button>

//             </div>

//           </div>
//         )}

//       </div>

//     </div>
//   )
// }

// function BookingPage({ facilities, storageUnits, getCurrentUser }) {
//   const [step, setStep] = useState(1)
//   const [selectedFacility, setSelectedFacility] = useState('')
//   const [selectedUnit, setSelectedUnit] = useState('')
//   const [startDate, setStartDate] = useState('')
//   const [duration, setDuration] = useState('1')
//   const [error, setError] = useState('')
//   const [success, setSuccess] = useState('')

//   const units = selectedFacility
//     ? storageUnits[selectedFacility] || []
//     : []

//   const availableUnits = units.filter(unit => unit.available)

//   const selectedUnitData = units.find(
//     unit => unit.id === selectedUnit
//   )

//   const monthlyPrice = selectedUnitData
//     ? Number(
//       selectedUnitData.price.replace(/\D/g, '')
//     )
//     : 0

//   const totalMonths = Number(duration)
//   const totalPrice = monthlyPrice * totalMonths

//   const formatPrice = value =>
//     new Intl.NumberFormat('vi-VN').format(value) + 'đ'

//   const calculateEndDate = () => {
//     if (!startDate) return ''

//     const date = new Date(`${startDate}T00:00:00`)
//     date.setMonth(date.getMonth() + totalMonths)

//     return date.toLocaleDateString('vi-VN')
//   }

//   const handleSelectFacility = facilityName => {
//     setSelectedFacility(facilityName)
//     setSelectedUnit('')
//     setStartDate('')
//     setDuration('1')
//     setError('')
//     setSuccess('')
//   }

//   const handleConfirmBooking = () => {
//     setError('')
//     setSuccess('')

//     if (!selectedUnitData) {
//       setError('Vui lòng chọn một kho.')
//       return
//     }

//     if (!startDate) {
//       setError('Vui lòng chọn ngày bắt đầu thuê.')
//       return
//     }

//     const currentUser = getCurrentUser()

//     if (!currentUser) {
//       setError('Vui lòng đăng nhập trước khi đặt kho.')
//       return
//     }

//     const booking = {
//       id: `BK-${Date.now()}`,
//       customerName: currentUser.name,
//       customerEmail: currentUser.email,
//       facility: selectedFacility,
//       unitId: selectedUnitData.id,
//       type: selectedUnitData.type,
//       size: selectedUnitData.size,
//       monthlyPrice,
//       duration: totalMonths,
//       totalPrice,
//       startDate,
//       endDate: calculateEndDate(),
//       status: 'PENDING_PAYMENT',
//       createdAt: new Date().toISOString()
//     }

//     localStorage.setItem(
//       'storespace_pending_booking',
//       JSON.stringify(booking)
//     )

//     setSuccess(
//       `Đặt chỗ ${booking.id} đã được tạo và đang chờ thanh toán.`
//     )
//   }

//   return (
//     <div className="customer-content-page">
//       <div className="customer-page-heading">
//         <div>
//           <span className="customer-eyebrow">BOOK STORAGE</span>
//           <h1>Đặt kho</h1>
//           <p>
//             Chọn cơ sở, kho, ngày bắt đầu và thời gian thuê.
//           </p>
//         </div>

//         <div className="booking-step-indicator">
//           <span className={step >= 1 ? 'active' : ''}>1</span>
//           <i />
//           <span className={step >= 2 ? 'active' : ''}>2</span>
//           <i />
//           <span className={step >= 3 ? 'active' : ''}>3</span>
//         </div>
//       </div>

//       <div className="booking-card">
//         {error && (
//           <div className="auth-message error">
//             {error}
//           </div>
//         )}

//         {success && (
//           <div className="auth-message success">
//             {success}
//           </div>
//         )}

//         {/* STEP 1: CHỌN CƠ SỞ */}
//         {step === 1 && (
//           <div>
//             <div className="booking-card-title">
//               <h2>Chọn cơ sở</h2>
//               <p>
//                 Chọn cơ sở mà bạn muốn thuê kho.
//               </p>
//             </div>

//             <div className="booking-facility-grid">
//               {facilities.map(facility => (
//                 <button
//                   key={facility.name}
//                   type="button"
//                   className={
//                     selectedFacility === facility.name
//                       ? 'booking-facility selected'
//                       : 'booking-facility'
//                   }
//                   onClick={() =>
//                     handleSelectFacility(facility.name)
//                   }
//                 >
//                   <img
//                     src={facility.image}
//                     alt={facility.name}
//                   />

//                   <div>
//                     <strong>{facility.name}</strong>
//                     <span>
//                       {facility.available} kho trống
//                     </span>
//                   </div>
//                 </button>
//               ))}
//             </div>

//             <div className="booking-actions">
//               <button
//                 className="dashboard-primary-btn"
//                 type="button"
//                 disabled={!selectedFacility}
//                 onClick={() => {
//                   setError('')
//                   setStep(2)
//                 }}
//               >
//                 Tiếp tục
//               </button>
//             </div>
//           </div>
//         )}

//         {/* STEP 2: CHỌN KHO */}
//         {step === 2 && (
//           <div>
//             <div className="booking-card-title">
//               <h2>Chọn kho</h2>
//               <p>
//                 {selectedFacility} — chỉ hiển thị kho còn trống.
//               </p>
//             </div>

//             {availableUnits.length === 0 ? (
//               <div className="empty-state">
//                 Cơ sở này hiện không còn kho trống.
//               </div>
//             ) : (
//               <div className="booking-unit-list">
//                 {availableUnits.map(unit => (
//                   <button
//                     key={unit.id}
//                     type="button"
//                     className={
//                       selectedUnit === unit.id
//                         ? 'booking-unit selected'
//                         : 'booking-unit'
//                     }
//                     onClick={() => {
//                       setSelectedUnit(unit.id)
//                       setError('')
//                     }}
//                   >
//                     <div>
//                       <strong>{unit.id}</strong>
//                       <span>{unit.type}</span>
//                     </div>

//                     <div>
//                       <strong>{unit.size}</strong>
//                       <span>{unit.price}</span>
//                     </div>
//                   </button>
//                 ))}
//               </div>
//             )}

//             <div className="booking-actions">
//               <button
//                 className="dashboard-secondary-btn"
//                 type="button"
//                 onClick={() => {
//                   setError('')
//                   setStep(1)
//                 }}
//               >
//                 Quay lại
//               </button>

//               <button
//                 className="dashboard-primary-btn"
//                 type="button"
//                 disabled={!selectedUnit}
//                 onClick={() => {
//                   setError('')
//                   setStep(3)
//                 }}
//               >
//                 Tiếp tục
//               </button>
//             </div>
//           </div>
//         )}

//         {/* STEP 3: NGÀY + THỜI GIAN THUÊ */}
//         {step === 3 && selectedUnitData && (
//           <div>
//             <div className="booking-card-title">
//               <h2>Thông tin thuê</h2>
//               <p>
//                 Kiểm tra thông tin và chọn thời gian thuê.
//               </p>
//             </div>

//             <div className="booking-summary">
//               <div>
//                 <span>Cơ sở</span>
//                 <strong>{selectedFacility}</strong>
//               </div>

//               <div>
//                 <span>Mã kho</span>
//                 <strong>{selectedUnitData.id}</strong>
//               </div>

//               <div>
//                 <span>Loại kho</span>
//                 <strong>{selectedUnitData.type}</strong>
//               </div>

//               <div>
//                 <span>Diện tích</span>
//                 <strong>{selectedUnitData.size}</strong>
//               </div>

//               <div>
//                 <span>Giá thuê / tháng</span>
//                 <strong>
//                   {selectedUnitData.price}
//                 </strong>
//               </div>

//               <div>
//                 <span>Ngày bắt đầu</span>
//                 <input
//                   type="date"
//                   value={startDate}
//                   min={
//                     new Date()
//                       .toISOString()
//                       .split('T')[0]
//                   }
//                   onChange={e => {
//                     setStartDate(e.target.value)
//                     setError('')
//                   }}
//                 />
//               </div>

//               <div>
//                 <span>Thời gian thuê</span>
//                 <select
//                   value={duration}
//                   onChange={e =>
//                     setDuration(e.target.value)
//                   }
//                 >
//                   <option value="1">1 tháng</option>
//                   <option value="3">3 tháng</option>
//                   <option value="6">6 tháng</option>
//                   <option value="12">12 tháng</option>
//                 </select>
//               </div>

//               <div>
//                 <span>Ngày kết thúc dự kiến</span>
//                 <strong>
//                   {calculateEndDate() || '—'}
//                 </strong>
//               </div>
//             </div>

//             <div className="booking-total-box">
//               <div>
//                 <span>Tổng tiền thuê dự kiến</span>
//                 <strong>
//                   {formatPrice(totalPrice)}
//                 </strong>
//               </div>

//               <small>
//                 Chưa bao gồm tiền cọc hoặc các khoản phí phát sinh
//                 theo chính sách.
//               </small>
//             </div>

//             <div className="booking-note">
//               <strong>Bước tiếp theo:</strong>
//               <span>
//                 Sau khi xác nhận, hệ thống sẽ tạo đặt chỗ
//                 ở trạng thái chờ thanh toán.
//               </span>
//             </div>

//             <div className="booking-actions">
//               <button
//                 className="dashboard-secondary-btn"
//                 type="button"
//                 onClick={() => {
//                   setError('')
//                   setSuccess('')
//                   setStep(2)
//                 }}
//               >
//                 Quay lại
//               </button>

//               <button
//                 className="dashboard-primary-btn"
//                 type="button"
//                 disabled={!startDate}
//                 onClick={handleConfirmBooking}
//               >
//                 Xác nhận đặt kho
//               </button>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }

function DatePicker({ value, onChange }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Ngày nhận kho không được cách ngày đặt kho quá 30 ngày.
  const maxBookingDate = new Date(today)
  maxBookingDate.setDate(maxBookingDate.getDate() + 30)

  const [open, setOpen] = useState(false)

  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  )

  const parseDate = value => {
    if (!value) return null

    const [year, month, day] = value
      .split('-')
      .map(Number)

    return new Date(year, month - 1, day)
  }

  const selectedDate = parseDate(value)

  const formatDisplayDate = date => {
    if (!date) return 'Chọn ngày bắt đầu'

    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()

    return `${day}/${month}/${year}`
  }

  const formatInputDate = date => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  }

  const monthName = date =>
    date.toLocaleDateString('vi-VN', {
      month: 'long',
      year: 'numeric'
    })

  const getCalendarDays = monthDate => {
    const year = monthDate.getFullYear()
    const month = monthDate.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    let startDay = firstDay.getDay()

    // Monday = 0
    startDay = startDay === 0 ? 6 : startDay - 1

    const days = []

    for (let i = 0; i < startDay; i++) {
      days.push(null)
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(
        new Date(year, month, day)
      )
    }

    while (days.length < 42) {
      days.push(null)
    }

    return days
  }

  const isSameDay = (a, b) => {
    if (!a || !b) return false

    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    )
  }

  const selectDate = date => {
    if (!date || date < today || date > maxBookingDate) return

    onChange(formatInputDate(date))
    setOpen(false)
  }

  const previousMonth = () => {
    setCurrentMonth(
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() - 1,
        1
      )
    )
  }

  const nextMonth = () => {
    setCurrentMonth(
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        1
      )
    )
  }

  const renderCalendar = monthDate => {
    const days = getCalendarDays(monthDate)

    return (
      <div className="calendar-month">
        <div className="calendar-month-title">
          {monthName(monthDate)}
        </div>

        <div className="calendar-weekdays">
          {[
            'T2',
            'T3',
            'T4',
            'T5',
            'T6',
            'T7',
            'CN'
          ].map(day => (
            <span key={day}>{day}</span>
          ))}
        </div>

        <div className="calendar-grid">
          {days.map((date, index) => {
            if (!date) {
              return (
                <span
                  className="calendar-empty"
                  key={index}
                />
              )
            }

            const disabled =
              date < today || date > maxBookingDate
            const selected = isSameDay(
              date,
              selectedDate
            )

            return (
              <button
                key={index}
                type="button"
                className={[
                  'calendar-day',
                  disabled ? 'disabled' : '',
                  selected ? 'selected' : ''
                ].join(' ')}
                disabled={disabled}
                onClick={() => selectDate(date)}
              >
                {date.getDate()}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="date-picker">

      <button
        type="button"
        className={`date-picker-input ${open ? 'open' : ''}`}
        onClick={() => setOpen(value => !value)}
      >
        <span className="date-picker-left">
          <span className="calendar-icon">▣</span>

          <span
            className={
              value
                ? 'date-picker-value'
                : 'date-picker-placeholder'
            }
          >
            {formatDisplayDate(selectedDate)}
          </span>
        </span>

        <span className="date-picker-chevron">
          {open ? '⌃' : '⌄'}
        </span>
      </button>

      {open && (
        <>
          <div
            className="date-picker-backdrop"
            onClick={() => setOpen(false)}
          />

          <div className="date-picker-popup">

            <div className="calendar-header">

              <button
                type="button"
                onClick={previousMonth}
              >
                ‹
              </button>

              <div className="calendar-header-title">
                Chọn ngày bắt đầu
              </div>

              <button
                type="button"
                onClick={nextMonth}
              >
                ›
              </button>

            </div>

            <div className="calendar-months">
              {renderCalendar(currentMonth)}

              {renderCalendar(
                new Date(
                  currentMonth.getFullYear(),
                  currentMonth.getMonth() + 1,
                  1
                )
              )}
            </div>

            <div className="calendar-footer">
              <span>
                ● Chọn ngày bắt đầu thuê
              </span>

              {selectedDate && (
                <strong>
                  {formatDisplayDate(selectedDate)}
                </strong>
              )}
            </div>

          </div>
        </>
      )}
    </div>
  )
}

function BookingPage({ facilities, storageUnits, getCurrentUser }) {
  const [step, setStep] = useState(1)

  const [selectedFacility, setSelectedFacility] = useState('')
  const [selectedUnit, setSelectedUnit] = useState('')

  const [startDate, setStartDate] = useState('')

  const [duration, setDuration] = useState(1)

  const [paymentMode, setPaymentMode] = useState('cycle')
  const [paymentCycle, setPaymentCycle] = useState(1)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [booking, setBooking] = useState(null)

  const units = selectedFacility
    ? storageUnits[selectedFacility] || []
    : []

  const availableUnits = units.filter(
    unit => unit.available
  )

  const selectedUnitData = units.find(
    unit => unit.id === selectedUnit
  )

  const monthlyPrice = selectedUnitData
    ? Number(
        selectedUnitData.price.replace(/\D/g, '')
      )
    : 0

  const totalMonths = Number(duration)
  const totalRent = monthlyPrice * totalMonths
  const deposit = Math.round(totalRent * 0.2)

  const formatPrice = value =>
    new Intl.NumberFormat('vi-VN').format(value) + 'đ'

  const getStartDate = () => {
    if (!startDate) {
      return null
    }

    const [year, month, day] = startDate
      .split('-')
      .map(Number)

    const date = new Date(
      year,
      month - 1,
      day
    )

    if (Number.isNaN(date.getTime())) {
      return null
    }

    return date
  }

  const formatDate = date => {
    if (!date || Number.isNaN(date.getTime())) {
      return '—'
    }

    const day = String(date.getDate()).padStart(2, '0')
    const month = String(
      date.getMonth() + 1
    ).padStart(2, '0')
    const year = date.getFullYear()

    return `${day}/${month}/${year}`
  }

  const calculateEndDate = () => {
    const startDate = getStartDate()

    if (!startDate) {
      return null
    }

    const endDate = new Date(startDate)

    endDate.setMonth(
      endDate.getMonth() + totalMonths
    )

    return endDate
  }

  const endDate = calculateEndDate()

  const canContinueStep1 = selectedFacility
  const canContinueStep2 = selectedUnit
  const bookingDate = new Date()
  bookingDate.setHours(0, 0, 0, 0)

  const selectedStartDate = getStartDate()

  const daysUntilStart = selectedStartDate
    ? Math.floor(
        (selectedStartDate.getTime() - bookingDate.getTime()) /
        (1000 * 60 * 60 * 24)
      )
    : null

  const canConfirm =
    selectedUnitData &&
    selectedStartDate &&
    daysUntilStart >= 0 &&
    daysUntilStart <= 30 &&
    duration >= 1 &&
    duration <= 12

  const handleSelectFacility = name => {
    setSelectedFacility(name)
    setSelectedUnit('')
    setError('')
  }

  const handleConfirmBooking = () => {
    setError('')
    setSuccess('')

    if (!selectedUnitData) {
      setError('Vui lòng chọn một kho.')
      return
    }

    if (!selectedStartDate) {
      setError('Vui lòng chọn ngày nhận kho.')
      return
    }

    if (daysUntilStart < 0 || daysUntilStart > 30) {
      setError(
        'Ngày nhận kho phải nằm trong vòng 30 ngày kể từ ngày đặt kho.'
      )
      return
    }

    if (duration < 1 || duration > 12) {
      setError('Thời gian thuê phải từ 1 đến 12 tháng.')
      return
    }

    const currentUser = getCurrentUser()

    if (!currentUser) {
      setError(
        'Vui lòng đăng nhập trước khi đặt kho.'
      )
      return
    }

    const bookingData = {
      id: `BK-${Date.now()}`,
      customerName: currentUser.name,
      customerEmail: currentUser.email,

      facility: selectedFacility,
      unitId: selectedUnitData.id,
      unitType: selectedUnitData.type,
      size: selectedUnitData.size,

      startDate: formatDate(getStartDate()),
      endDate: formatDate(endDate),

      durationMonths: totalMonths,

      monthlyPrice,
      totalRent,

      paymentMode,
      paymentCycle:
        paymentMode === 'cycle'
          ? Number(paymentCycle)
          : totalMonths,

      deposit,

      status: 'PENDING_DEPOSIT_PAYMENT',

      createdAt: new Date().toISOString()
    }

    localStorage.setItem(
      'storespace_pending_booking',
      JSON.stringify(bookingData)
    )

    setBooking(bookingData)
    setSuccess(
      'Đặt chỗ đã được tạo. Vui lòng thanh toán tiền cọc 20%.'
    )
    setStep(4)
  }

  return (
    <div className="customer-content-page">

      <div className="customer-page-heading">
        <div>
          <span className="customer-eyebrow">
            BOOK STORAGE
          </span>

          <h1>Đặt kho</h1>

          <p>
            Hoàn tất thông tin thuê trước khi xác nhận
            đặt chỗ.
          </p>
        </div>

        <div className="booking-step-indicator">
          <span className={step >= 1 ? 'active' : ''}>
            1
          </span>

          <i />

          <span className={step >= 2 ? 'active' : ''}>
            2
          </span>

          <i />

          <span className={step >= 3 ? 'active' : ''}>
            3
          </span>

          <i />

          <span className={step >= 4 ? 'active' : ''}>
            4
          </span>
        </div>
      </div>

      <div className="booking-card">

        {error && (
          <div className="auth-message error">
            {error}
          </div>
        )}

        {success && (
          <div className="auth-message success">
            {success}
          </div>
        )}

        {/* ================================================= */}
        {/* STEP 1 - CHỌN CƠ SỞ */}
        {/* ================================================= */}

        {step === 1 && (
          <div>
            <div className="booking-card-title">
              <h2>Chọn cơ sở</h2>

              <p>
                Chọn nơi bạn muốn thuê kho.
              </p>
            </div>

            <div className="booking-facility-grid">
              {facilities.map(facility => (
                <button
                  key={facility.name}
                  type="button"
                  className={
                    selectedFacility === facility.name
                      ? 'booking-facility selected'
                      : 'booking-facility'
                  }
                  onClick={() =>
                    handleSelectFacility(
                      facility.name
                    )
                  }
                >
                  <img
                    src={facility.image}
                    alt={facility.name}
                  />

                  <div>
                    <strong>
                      {facility.name}
                    </strong>

                    <span>
                      {facility.available} kho trống
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="booking-actions">
              <button
                className="dashboard-primary-btn"
                type="button"
                disabled={!canContinueStep1}
                onClick={() => setStep(2)}
              >
                Tiếp tục
              </button>
            </div>
          </div>
        )}

        {/* ================================================= */}
        {/* STEP 2 - CHỌN KHO */}
        {/* ================================================= */}

        {step === 2 && (
          <div>
            <div className="booking-card-title">
              <h2>Chọn kho</h2>

              <p>
                {selectedFacility}
              </p>
            </div>

            {availableUnits.length === 0 ? (
              <div className="empty-state">
                Cơ sở này hiện không còn kho trống.
              </div>
            ) : (
              <div className="booking-unit-list">
                {availableUnits.map(unit => (
                  <button
                    key={unit.id}
                    type="button"
                    className={
                      selectedUnit === unit.id
                        ? 'booking-unit selected'
                        : 'booking-unit'
                    }
                    onClick={() => {
                      setSelectedUnit(unit.id)
                      setError('')
                    }}
                  >
                    <div>
                      <strong>{unit.id}</strong>
                      <span>{unit.type}</span>
                    </div>

                    <div>
                      <strong>{unit.size}</strong>
                      <span>{unit.price}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="booking-actions">

              <button
                className="dashboard-secondary-btn"
                type="button"
                onClick={() => setStep(1)}
              >
                Quay lại
              </button>

              <button
                className="dashboard-primary-btn"
                type="button"
                disabled={!canContinueStep2}
                onClick={() => setStep(3)}
              >
                Tiếp tục
              </button>

            </div>
          </div>
        )}

        {/* ================================================= */}
        {/* STEP 3 - THỜI GIAN + THANH TOÁN */}
        {/* ================================================= */}

        {step === 3 && selectedUnitData && (
          <div>

            <div className="booking-card-title">
              <h2>Thông tin thuê</h2>

              <p>
                Chọn ngày bắt đầu và thời gian thuê từ
                1 đến 12 tháng.
              </p>
            </div>

            {/* NGÀY BẮT ĐẦU */}

            <div className="booking-large-field">

              <label>
                Ngày nhận kho
              </label>

              <DatePicker
                value={startDate}
                onChange={value => {
                  setStartDate(value)
                  setError('')
                }}
              />

              <p className="booking-date-limit-note">
                Bạn chỉ có thể chọn ngày nhận kho trong vòng
                <strong> 30 ngày </strong>
                kể từ ngày đặt kho.
              </p>

            </div>

            {/* THỜI GIAN THUÊ */}

            <div className="booking-large-field">

              <label>
                Thời gian thuê
              </label>

              <div className="duration-picker">

                <button
                  type="button"
                  onClick={() =>
                    setDuration(
                      Math.max(
                        1,
                        duration - 1
                      )
                    )
                  }
                >
                  −
                </button>

                <div className="duration-value">
                  <strong>{duration}</strong>

                  <span>
                    {duration === 1
                      ? 'tháng'
                      : 'tháng'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setDuration(
                      Math.min(
                        12,
                        duration + 1
                      )
                    )
                  }
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
                  onChange={e =>
                    setDuration(
                      Number(e.target.value)
                    )
                  }
                />

                <div className="duration-slider-label">
                  <span>1 tháng</span>
                  <span>12 tháng</span>
                </div>

              </div>

            </div>

            {/* TÓM TẮT THỜI GIAN */}

            <div className="booking-period-summary">

              <div>
                <small>
                  Ngày bắt đầu
                </small>

                <strong>
                  {formatDate(getStartDate())}
                </strong>
              </div>

              <div>
                <small>
                  Ngày kết thúc dự kiến
                </small>

                <strong>
                  {formatDate(endDate)}
                </strong>
              </div>

              <div>
                <small>
                  Thời gian thuê
                </small>

                <strong>
                  {duration} tháng
                </strong>
              </div>

            </div>

            {/* THANH TOÁN */}

            <div className="booking-large-field">

              <label>
                Phương thức thanh toán
              </label>

              <div className="payment-mode-grid">

                <button
                  type="button"
                  className={
                    paymentMode === 'cycle'
                      ? 'payment-mode-card active'
                      : 'payment-mode-card'
                  }
                  onClick={() =>
                    setPaymentMode('cycle')
                  }
                >
                  <span className="payment-mode-icon">
                    ↻
                  </span>

                  <strong>
                    Thanh toán theo chu kỳ
                  </strong>

                  <small>
                    Thanh toán từng kỳ trong thời gian thuê.
                  </small>
                </button>

                <button
                  type="button"
                  className={
                    paymentMode === 'full'
                      ? 'payment-mode-card active'
                      : 'payment-mode-card'
                  }
                  onClick={() =>
                    setPaymentMode('full')
                  }
                >
                  <span className="payment-mode-icon">
                    ✓
                  </span>

                  <strong>
                    Thanh toán toàn bộ
                  </strong>

                  <small>
                    Thanh toán toàn bộ tiền thuê một lần.
                  </small>
                </button>

              </div>

            </div>

            {paymentMode === 'cycle' && (
              <div className="cycle-select-box">

                <label>
                  Chu kỳ thanh toán
                </label>

                <select
                  value={paymentCycle}
                  onChange={e =>
                    setPaymentCycle(
                      Number(e.target.value)
                    )
                  }
                >
                  <option value="1">
                    Mỗi 1 tháng
                  </option>

                  {duration >= 3 && (
                    <option value="3">
                      Mỗi 3 tháng
                    </option>
                  )}

                  {duration >= 6 && (
                    <option value="6">
                      Mỗi 6 tháng
                    </option>
                  )}
                </select>

              </div>
            )}

            {/* CHI TIẾT TIỀN */}

            <div className="booking-price-breakdown">

              <div>
                <span>
                  Giá thuê / tháng
                </span>

                <strong>
                  {formatPrice(monthlyPrice)}
                </strong>
              </div>

              <div>
                <span>
                  Thời gian thuê
                </span>

                <strong>
                  {duration} tháng
                </strong>
              </div>

              <div className="price-divider" />

              <div>
                <span>
                  Tổng tiền thuê
                </span>

                <strong className="main-price">
                  {formatPrice(totalRent)}
                </strong>
              </div>

              <div className="deposit-row">
                <div>
                  <span>
                    Tiền cọc
                  </span>

                  <small>
                    20% tổng giá thuê
                  </small>
                </div>

                <strong className="deposit-price">
                  {formatPrice(deposit)}
                </strong>
              </div>

            </div>

            <div className="deposit-notice">

              <div className="deposit-notice-icon">
                $
              </div>

              <div>
                <strong>
                  Thanh toán tiền cọc trước
                </strong>

                <p>
                  Bạn chỉ cần thanh toán
                  <strong>
                    {' '}
                    {formatPrice(deposit)}
                  </strong>
                  {' '}
                  tiền cọc trước.
                  Sau khi thanh toán cọc, đơn đặt kho
                  sẽ được chuyển cho Facility Manager
                  để xét duyệt.
                </p>

                <p>
                  Tiền thuê kho sẽ chỉ được thanh toán
                  sau khi Manager phê duyệt.
                </p>
              </div>

            </div>

            <div className="booking-actions">

              <button
                className="dashboard-secondary-btn"
                type="button"
                onClick={() => setStep(2)}
              >
                Quay lại
              </button>

              <button
                className="dashboard-primary-btn"
                type="button"
                disabled={!canConfirm}
                onClick={handleConfirmBooking}
              >
                Xác nhận đặt kho
              </button>

            </div>

          </div>
        )}

        {/* ================================================= */}
        {/* STEP 4 - THANH TOÁN CỌC */}
        {/* ================================================= */}

        {step === 4 && booking && (
          <div className="deposit-payment-page">

            <div className="deposit-payment-header">
              <span className="customer-eyebrow">
                DEPOSIT PAYMENT
              </span>

              <h2>
                Thanh toán tiền cọc
              </h2>

              <p>
                Đặt chỗ của bạn đã được tạo.
                Vui lòng thanh toán tiền cọc 20%
                để gửi yêu cầu đến Facility Manager.
              </p>
            </div>

            <div className="deposit-payment-layout">

              <div className="deposit-qr-card">

                <div className="deposit-qr-title">
                  <strong>
                    Quét mã QR để thanh toán
                  </strong>

                  <span>
                    Số tiền cọc
                  </span>
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
                  <strong>
                    {' '}
                    {booking.id}
                  </strong>
                </p>

              </div>

              <div className="deposit-payment-info">

                <div className="payment-info-block">

                  <span>
                    THÔNG TIN THANH TOÁN
                  </span>

                  <div>
                    <small>
                      Người nhận
                    </small>

                    <strong>
                      StoreSpace
                    </strong>
                  </div>

                  <div>
                    <small>
                      Ngân hàng
                    </small>

                    <strong>
                      NGÂN HÀNG DEMO
                    </strong>
                  </div>

                  <div>
                    <small>
                      Số tài khoản
                    </small>

                    <strong>
                      0000 0000 0000
                    </strong>
                  </div>

                  <div>
                    <small>
                      Số tiền
                    </small>

                    <strong className="payment-highlight">
                      {formatPrice(booking.deposit)}
                    </strong>
                  </div>

                  <div>
                    <small>
                      Nội dung
                    </small>

                    <strong>
                      {booking.id}
                    </strong>
                  </div>

                </div>

                <div className="payment-booking-summary">

                  <span>
                    ĐẶT KHO
                  </span>

                  <strong>
                    {booking.facility}
                  </strong>

                  <p>
                    {booking.unitId}
                    {' · '}
                    {booking.unitType}
                  </p>

                  <div>
                    <span>
                      Thời gian
                    </span>

                    <strong>
                      {booking.durationMonths}
                      {' tháng'}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Tổng tiền thuê
                    </span>

                    <strong>
                      {formatPrice(
                        booking.totalRent
                      )}
                    </strong>
                  </div>

                </div>

              </div>

            </div>

            <div className="payment-warning">

              <strong>
                Chưa thanh toán?
              </strong>

              <span>
                Bạn chưa cần thanh toán tiền thuê toàn bộ
                ở bước này. Chỉ thanh toán tiền cọc.
                Sau khi Manager duyệt, hệ thống mới chuyển
                sang bước thanh toán tiền thuê.
              </span>

            </div>

            <div className="deposit-status">

              <div className="deposit-status-dot" />

              <div>
                <strong>
                  Đang chờ thanh toán cọc
                </strong>

                <small>
                  Mã đặt chỗ: {booking.id}
                </small>
              </div>

              <span>
                PENDING
              </span>

            </div>

          </div>
        )}

      </div>
    </div>
  )
}

function ContractPage({ customerRental, customerRentals, getCurrentUser }) {
  const rentals = customerRentals || (customerRental ? [customerRental] : [])

  return (
    <div className="customer-content-page">

      <div className="customer-page-heading">
        <div>
          <span className="customer-eyebrow">
            MY CONTRACT
          </span>

          <h1>Hợp đồng</h1>

          <p>
            Quản lý hợp đồng thuê kho của bạn.
          </p>
        </div>
      </div>

      {rentals.length === 0 && <div className="empty-state">Bạn chưa có hợp đồng thuê.</div>}
      {rentals.map(rental => (
      <div key={rental.contractId || rental.unitId} style={{ marginBottom: 28 }}>
      <div className="contract-card">

        <div className="contract-header">

          <div>
            <span>HỢP ĐỒNG THUÊ KHO</span>

            <h2>
              Hợp đồng #{rental.contractId || rental.unitId}
            </h2>

            <p>
              StoreSpace · {rental.facility}
            </p>
          </div>

          <span className="contract-status">
            {rental.contractStatus || rental.status || 'Đang hiệu lực'}
          </span>

        </div>

        <div className="contract-details">

          <div>
            <small>Khách hàng</small>
            <strong>
              {getCurrentUser()?.name}
            </strong>
          </div>

          <div>
            <small>Mã kho</small>
            <strong>{rental.unitId}</strong>
          </div>

          <div>
            <small>Loại kho</small>
            <strong>{rental.type}</strong>
          </div>

          <div>
            <small>Diện tích</small>
            <strong>{rental.size}</strong>
          </div>

          <div>
            <small>Ngày bắt đầu</small>
            <strong>{rental.startDate}</strong>
          </div>

          <div>
            <small>Ngày kết thúc</small>
            <strong>{rental.endDate}</strong>
          </div>

          <div>
            <small>Tiền thuê</small>
            <strong>{rental.price}</strong>
          </div>

          <div>
            <small>Trạng thái</small>
            <strong className="status-text">
              Đang hiệu lực
            </strong>
          </div>

        </div>

        <div className="contract-progress">

          <div>
            <span>Tiến độ thời hạn hợp đồng</span>
            <strong>
              {rental.progress}%
            </strong>
          </div>

          <div className="rental-progress">
            <div
              style={{
                width: `${rental.progress}%`
              }}
            />
          </div>

          <small>
            Còn {rental.remainingDays} ngày
            trước khi hợp đồng kết thúc.
          </small>

        </div>

        <div className="contract-actions">

          <button
            className="dashboard-primary-btn"
            onClick={() =>
              alert('Đang mở hợp đồng...')
            }
          >
            Xem hợp đồng
          </button>

          <button
            className="dashboard-secondary-btn"
            onClick={() =>
              alert('Tải bản PDF hợp đồng...')
            }
          >
            Tải hợp đồng PDF
          </button>

          <button
            className="dashboard-secondary-btn"
            onClick={() =>
              alert('Chức năng gia hạn...')
            }
          >
            Gia hạn hợp đồng
          </button>

        </div>

      </div>

      </div>
      ))}
    </div>
  )
}

function CustomerDashboard({ facilities, storageUnits, customerRental, customerRentals, getCurrentUser, navigate, currentUserKey }) {
  const user = getCurrentUser()
  const [serverRentals, setServerRentals] = useState(null)
  const [rentalError, setRentalError] = useState('')
  useEffect(() => {
    if (!user?.email) {
      setServerRentals(null)
      return
    }
    let cancelled = false
    fetchCustomerReservations(user.email)
      .then(records => {
        if (!cancelled) {
          setServerRentals(records.map(mapCustomerReservation))
          setRentalError('')
        }
      })
      .catch(error => {
        console.error('[API] Customer reservations could not be loaded:', error)
        if (!cancelled) {
          setServerRentals([])
          setRentalError(error.message || 'Không thể tải hợp đồng từ máy chủ.')
        }
      })
    return () => { cancelled = true }
  }, [user?.email])
  const fallbackRentals = customerRentals?.length ? customerRentals : customerRental ? [customerRental] : []
  const rentals = serverRentals ?? fallbackRentals
  const rental = rentals[0]
  const [activeSection, setActiveSection] = useState('overview')

  const logout = () => {
    localStorage.removeItem(currentUserKey)
    navigate('/')
  }

  return (
    // <div className="customer-page">
    //   <SiteHeader />

    <div className="customer-layout">

      <aside className="customer-sidebar">

        <div className="customer-brand" type="button" onClick={() => navigate('/')}>
          <span className="brand-mark">S</span>

          <div>
            <strong>StoreSpace</strong>
            <small>Customer Portal</small>
          </div>
        </div>

        <div className="customer-profile-mini">
          <div className="customer-avatar">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>

          <div>
            <strong>{user?.name || 'Customer'}</strong>
            <small>Customer</small>
          </div>
        </div>

        <nav className="customer-nav">

          <button
            className={activeSection === 'overview' ? 'active' : ''}
            onClick={() => setActiveSection('overview')}
          >
            <span>⌂</span>
            Tổng quan
          </button>

          <button
            className={activeSection === 'storage' ? 'active' : ''}
            onClick={() => setActiveSection('storage')}
          >
            <span>▣</span>
            Kho của tôi
          </button>

          <button
            className={activeSection === 'booking' ? 'active' : ''}
            onClick={() => {
              navigate('/search')
            }}
          >
            <span>◷</span>
            Đặt kho
          </button>

          <button
            className={activeSection === 'contract' ? 'active' : ''}
            onClick={() => setActiveSection('contract')}
          >
            <span>▤</span>
            Hợp đồng
          </button>

          <button>
            <span>◫</span>
            Thanh toán
          </button>

          <button>
            <span>♙</span>
            Hồ sơ
          </button>

        </nav>

        <div className="customer-sidebar-bottom">
          <button onClick={logout}>
            <span>↪</span>
            Đăng xuất
          </button>
        </div>

      </aside>

      <main className="customer-main">
        {rentalError && <div className="auth-message error" role="alert">{rentalError}</div>}

        <div className="customer-topbar">
          <div>
            <span className="customer-eyebrow">
              CUSTOMER DASHBOARD
            </span>

            <h1>
              Xin chào, {user?.name || 'Customer'}!
            </h1>

            <p>
              Quản lý kho thuê và thông tin tài khoản của bạn.
            </p>
          </div>

          <button className="customer-profile-button">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </button>
        </div>

        {activeSection === 'overview' && (
          <div className="overview-page">

            {/* ===== STATS ===== */}

            <section className="customer-stats">

              <div className="customer-stat-card">
                <span className="stat-icon">▣</span>
                <small>Kho đang thuê</small>
                <strong>{rentals.length}</strong>
                <span className="stat-note">Đang hoạt động</span>
              </div>

              <div className="customer-stat-card">
                <span className="stat-icon yellow">◷</span>
                <small>Kho sắp hết hạn</small>
                <strong>1</strong>
                <span className="stat-note warning">
                  Cần chú ý
                </span>
              </div>

              <div className="customer-stat-card">
                <span className="stat-icon blue">₫</span>
                <small>Thanh toán sắp tới</small>
                <strong>650K</strong>
                <span className="stat-note">
                  Hạn 01/11/2026
                </span>
              </div>

              <div className="customer-stat-card">
                <span className="stat-icon">◴</span>
                <small>Ngày còn lại</small>
                <strong>{rental.remainingDays}</strong>
                <span className="stat-note">
                  Ngày thuê hiện tại
                </span>
              </div>

            </section>


            {/* ===== CURRENT RENTAL ===== */}

            <section className="customer-section">

              <div className="customer-section-heading">
                <div>
                  <span className="customer-eyebrow">
                    CURRENT RENTAL
                  </span>

                  <h2>Kho đang thuê</h2>
                </div>

                <button
                  type="button"
                  className="overview-text-button"
                  onClick={() => setActiveSection('storage')}
                >
                  Xem tất cả →
                </button>
              </div>


              <div className="overview-rental-card">

                <div className="overview-rental-left">

                  <div className="overview-rental-top">
                    <div>

                      <span className="rental-facility">
                        {rental.facility}
                      </span>

                      <h3>{rental.unitId}</h3>

                      <p>
                        {rental.type} · {rental.size}
                      </p>

                    </div>

                    <span className="rental-status">
                      ● Đang thuê
                    </span>
                  </div>


                  <div className="overview-rental-info">

                    <div>
                      <small>Ngày bắt đầu</small>
                      <strong>{rental.startDate}</strong>
                    </div>

                    <div>
                      <small>Ngày kết thúc</small>
                      <strong>{rental.endDate}</strong>
                    </div>

                    <div>
                      <small>Giá thuê</small>
                      <strong>{rental.price}</strong>
                    </div>

                  </div>

                </div>


                <div className="overview-rental-progress">

                  <div className="overview-progress-heading">
                    <span>Tiến độ thời hạn</span>
                    <strong>{rental.progress}%</strong>
                  </div>

                  <div className="rental-progress">
                    <div
                      style={{
                        width: `${rental.progress}%`
                      }}
                    />
                  </div>

                  <div className="overview-progress-bottom">
                    <span>
                      Đã sử dụng {rental.progress}%
                    </span>

                    <strong>
                      Còn {rental.remainingDays} ngày
                    </strong>
                  </div>

                </div>

              </div>

            </section>


            {/* ===== TWO COLUMNS ===== */}

            <div className="overview-two-columns">


              {/* PAYMENT */}

              <section className="overview-panel">

                <div className="overview-panel-heading">

                  <div>
                    <span className="customer-eyebrow">
                      NEXT PAYMENT
                    </span>

                    <h2>Thanh toán</h2>
                  </div>

                  <span className="overview-panel-icon yellow">
                    ₫
                  </span>

                </div>


                <div className="payment-main">

                  <small>Khoản thanh toán tiếp theo</small>

                  <strong>650.000đ</strong>

                  <span>
                    Hạn thanh toán: 01/11/2026
                  </span>

                </div>


                <div className="payment-status">
                  <span>Trạng thái</span>

                  <strong>
                    ● Chưa thanh toán
                  </strong>
                </div>


                <button
                  className="dashboard-primary-btn full"
                  onClick={() => alert('Mở trang thanh toán')}
                >
                  Thanh toán ngay
                </button>

              </section>


              {/* CONTRACT */}

              <section className="overview-panel">

                <div className="overview-panel-heading">

                  <div>
                    <span className="customer-eyebrow">
                      CONTRACT
                    </span>

                    <h2>Hợp đồng</h2>
                  </div>

                  <span className="overview-panel-icon">
                    ▤
                  </span>

                </div>


                <div className="contract-summary">

                  <div>
                    <span>Mã hợp đồng</span>
                    <strong>
                      #SS-{rental.unitId}
                    </strong>
                  </div>

                  <div>
                    <span>Trạng thái</span>
                    <strong className="contract-active">
                      Đang hiệu lực
                    </strong>
                  </div>

                  <div>
                    <span>Ngày hết hạn</span>
                    <strong>{rental.endDate}</strong>
                  </div>

                </div>


                <button
                  className="dashboard-secondary-btn full"
                  onClick={() =>
                    setActiveSection('contract')
                  }
                >
                  Xem hợp đồng
                </button>

              </section>

            </div>


            {/* ===== QUICK ACTIONS ===== */}

            <section className="overview-panel quick-actions-panel">

              <div className="overview-panel-heading">

                <div>
                  <span className="customer-eyebrow">
                    QUICK ACTIONS
                  </span>

                  <h2>Thao tác nhanh</h2>
                </div>

              </div>


              <div className="quick-actions-grid">

                <button
                  className="quick-action"
                  onClick={() =>
                    setActiveSection('booking')
                  }
                >
                  <span className="quick-action-icon blue">
                    +
                  </span>

                  <div>
                    <strong>Đặt kho mới</strong>
                    <small>
                      Tìm và thuê thêm một kho
                    </small>
                  </div>

                  <span>→</span>
                </button>


                <button
                  className="quick-action"
                  onClick={() =>
                    setActiveSection('storage')
                  }
                >
                  <span className="quick-action-icon">
                    ▣
                  </span>

                  <div>
                    <strong>Kho của tôi</strong>
                    <small>
                      Xem các kho đang thuê
                    </small>
                  </div>

                  <span>→</span>
                </button>


                <button
                  className="quick-action"
                  onClick={() =>
                    setActiveSection('contract')
                  }
                >
                  <span className="quick-action-icon yellow">
                    ▤
                  </span>

                  <div>
                    <strong>Hợp đồng</strong>
                    <small>
                      Xem thông tin hợp đồng
                    </small>
                  </div>

                  <span>→</span>
                </button>

              </div>

            </section>


            {/* ===== RECENT NOTIFICATIONS ===== */}

            <section className="overview-panel">

              <div className="overview-panel-heading">

                <div>
                  <span className="customer-eyebrow">
                    RECENT ACTIVITY
                  </span>

                  <h2>Hoạt động gần đây</h2>
                </div>

              </div>


              <div className="activity-list">

                <div className="activity-item">

                  <span className="activity-dot blue" />

                  <div>
                    <strong>
                      Hợp đồng đã được kích hoạt
                    </strong>

                    <small>
                      Kho CD-101 · 01/10/2026
                    </small>
                  </div>

                  <span className="activity-time">
                    Hôm nay
                  </span>

                </div>


                <div className="activity-item">

                  <span className="activity-dot yellow" />

                  <div>
                    <strong>
                      Khoản thanh toán sắp đến hạn
                    </strong>

                    <small>
                      650.000đ · hạn 01/11/2026
                    </small>
                  </div>

                  <span className="activity-time">
                    2 ngày trước
                  </span>

                </div>


                <div className="activity-item">

                  <span className="activity-dot green" />

                  <div>
                    <strong>
                      Kho CD-101 đang hoạt động
                    </strong>

                    <small>
                      Quyền truy cập vẫn đang hợp lệ
                    </small>
                  </div>

                  <span className="activity-time">
                    5 ngày trước
                  </span>

                </div>

              </div>

            </section>

          </div>
        )}

        {activeSection === 'storage' && (
          <MyStoragePage customerRental={customerRental} customerRentals={rentals} facilities={facilities} />
        )}

        {activeSection === 'booking' && (
          <BookingPage facilities={facilities} storageUnits={storageUnits} getCurrentUser={getCurrentUser} />
        )}

        {activeSection === 'contract' && (
          <ContractPage customerRental={customerRental} customerRentals={rentals} getCurrentUser={getCurrentUser} />
        )}

      </main>

    </div>
    // {/* </div> */}
  )
}



// Export only the main customer dashboard to App.jsx.
export default CustomerDashboard
