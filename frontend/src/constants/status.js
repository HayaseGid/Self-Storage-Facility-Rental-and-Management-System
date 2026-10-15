/**
 * constants/status.js
 * Khớp 100% với backend/Constants/ReservationStatus.cs và UnitStatus.cs.
 * Không tự đặt tên khác (ví dụ PENDING_DEPOSIT_PAYMENT).
 * Mọi so sánh trạng thái trong component đều dùng các hằng số này.
 */

export const ReservationStatus = {
  PendingDeposit: 'Pending Deposit',
  Paid:           'Paid',
  HandedOver:     'Handed Over',
  Cancelled:      'Cancelled',
}

export const UnitStatus = {
  Available: 'Available',
  Reserved:  'Reserved',
  InUse:     'In Use',
  Inactive:  'Inactive',
}
