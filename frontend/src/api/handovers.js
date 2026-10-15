/**
 * api/handovers.js — Bàn giao kho
 *
 * Backend DTO CompleteHandoverDTO:
 *   { ReservationID: number, StaffEmail: string, Notes: string }
 * Backend tạo HandoverTask + Contract, đổi:
 *   Reservation.Status = "Handed Over"
 *   StorageUnit.Status = "In Use"
 */

import { apiFetch } from './client.js'

/**
 * Staff hoàn thành bàn giao kho.
 * Trả { ok: true, message } hoặc { ok: false, message }
 */
export async function completeHandover({ reservationId, staffEmail, accessType, accessValue, notes = '' }) {
  try {
    const result = await apiFetch('/handover/complete', {
      method: 'POST',
      body: JSON.stringify({
        ReservationID: reservationId,
        StaffEmail: staffEmail,
        AccessType: accessType,
        AccessValue: accessValue,
        Notes: notes,
      }),
    })
    return { ok: true, message: result.message }
  } catch (err) {
    return { ok: false, message: err.message || 'Bàn giao thất bại' }
  }
}
