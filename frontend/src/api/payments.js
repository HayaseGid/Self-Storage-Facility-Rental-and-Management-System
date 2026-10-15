/**
 * api/payments.js — Xác nhận thanh toán cọc
 *
 * Backend DTO CreatePaymentDTO:
 *   { ReservationID: number, Amount: decimal, PaymentType: string }
 * Backend trả: { message: string, paymentId: number }
 * Backend đổi Reservation.Status = "Paid" sau khi thành công.
 */

import { apiFetch } from './client.js'

/**
 * Xác nhận khách đã đặt cọc.
 * Ghi Payment vào DB, đổi Reservation.Status = "Paid".
 * Trả { ok: true, paymentId } hoặc { ok: false, message }
 */
export async function confirmPayment({ reservationId, amount, paymentType = 'Deposit' }) {
  try {
    const result = await apiFetch('/payment/confirm', {
      method: 'POST',
      body: JSON.stringify({
        ReservationID: reservationId,
        Amount:        amount,
        PaymentType:   paymentType,
      }),
    })
    return {
      ok: true,
      paymentId: result.paymentId,
      transactionReference: result.transactionReference,
      amount: result.amount,
      message: result.message,
    }
  } catch (err) {
    return { ok: false, message: err.message || 'Xác nhận thanh toán thất bại' }
  }
}
