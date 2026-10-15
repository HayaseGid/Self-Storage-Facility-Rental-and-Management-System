import { apiFetch } from './client.js'

export const fetchOperationsState = (email) =>
  apiFetch(`/operations/state${email ? `?email=${encodeURIComponent(email)}` : ''}`)

export const fetchOperationsReport = () => apiFetch('/operations/reports')

export const fetchCustomerReservations = (email) =>
  apiFetch(`/reservation/customer/${encodeURIComponent(email)}`)

export const updateRentalPolicy = (facilityId, depositPercent) =>
  apiFetch(`/operations/facilities/${facilityId}/policy`, {
    method: 'PUT',
    body: JSON.stringify({ depositPercent }),
  })

export const updateRentalRate = (facilityId, rate) =>
  apiFetch(`/operations/facilities/${facilityId}/rates`, {
    method: 'PUT',
    body: JSON.stringify(rate),
  })

export const deleteRentalRate = (facilityId, unitTypeId, unitSizeId) =>
  apiFetch(`/operations/facilities/${facilityId}/rates/${unitTypeId}/${unitSizeId}`, {
    method: 'DELETE',
  })

export const assignReservation = (reservationId, unitNumber) =>
  apiFetch(`/operations/reservations/${reservationId}/assign`, {
    method: 'POST',
    body: JSON.stringify({ unitNumber }),
  })

export const createStorageUnit = (unit) =>
  apiFetch('/operations/units', {
    method: 'POST',
    body: JSON.stringify(unit),
  })

export const updateStorageUnit = (unit) =>
  apiFetch(`/operations/units/${encodeURIComponent(unit.UnitNumber)}`, {
    method: 'PUT',
    body: JSON.stringify(unit),
  })

export const createFacility = (facility) =>
  apiFetch('/operations/facilities', {
    method: 'POST',
    body: JSON.stringify(facility),
  })

export const assignFacilityStaff = (facilityId, staffEmail) =>
  apiFetch(`/operations/facilities/${facilityId}/staff`, {
    method: 'POST',
    body: JSON.stringify({ staffEmail }),
  })
