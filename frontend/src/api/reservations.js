/**
 * api/reservations.js — Đặt kho
 *
 * Backend DTO CreateReservationDTO:
 *   { CustomerEmail, UnitNumber, StartDate (ISO), Months, TotalEstimatedCost }
 * Backend trả: { reservationId: number, message: string }
 *
 * Lưu ý: frontend chỉ gửi số và chuỗi thô (không format).
 * Backend tự tính EndDate = StartDate + Months.
 */

import { apiFetch } from './client.js'

/**
 * Tạo reservation mới.
 * Trả { ok: true, reservationId: number } hoặc { ok: false, message }
 */
export async function createReservation({ customerEmail, unitNumber, startDate, months, totalEstimatedCost }) {
  try {
    const result = await apiFetch('/reservation', {
      method: 'POST',
      body: JSON.stringify({
        CustomerEmail: customerEmail,
        UnitNumber: unitNumber,
        StartDate: startDate,      // ISO string
        Months: months,         // số nguyên
        TotalEstimatedCost: totalEstimatedCost, // decimal
      }),
    })
    return {
      ok: true,
      reservationId: result.reservationId,
      monthlyPrice: result.monthlyPrice,
      rentalAmount: result.rentalAmount,
      depositAmount: result.depositAmount,
      totalAmount: result.totalAmount,
      startDate: result.startDate,
      endDate: result.endDate,
      message: result.message,
    }
  } catch (err) {
    return { ok: false, message: err.message || 'Đặt kho thất bại' }
  }
}
