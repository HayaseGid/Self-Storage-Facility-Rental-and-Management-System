/**
 * constants/roles.js
 * Khớp 100% với backend/Constants/RoleNames.cs và bảng Role trong DB.
 *
 * ROLE_ROUTE: ánh xạ RoleName (backend) → path URL (frontend).
 * Chỉ sửa ở đây nếu muốn đổi route.
 */

export const RoleNames = {
  StorageCustomer:     'Storage Customer',
  FacilityStaff:       'Facility Staff',
  FacilityManager:     'Facility Manager',
  SystemAdmin:         'System Admin',
  BusinessOperations:  'Business Operations',
}

export const ROLE_ROUTE = {
  [RoleNames.StorageCustomer]:    '/customer',
  [RoleNames.FacilityStaff]:      '/staff',
  [RoleNames.FacilityManager]:    '/manager',
  [RoleNames.SystemAdmin]:        '/admin',
  [RoleNames.BusinessOperations]: '/business',
}

/** Trả về path trang chủ cho role, mặc định /customer */
export function roleHome(roleName) {
  return ROLE_ROUTE[roleName] ?? '/customer'
}
