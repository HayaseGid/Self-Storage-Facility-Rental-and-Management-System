import { useEffect, useMemo, useState } from "react";
import "./styles.css";
import "./staffstyles.css";

/* =========================================================
   StoreSpace — Facility Staff Portal (demo, frontend only)
   - Gắn trong App.jsx tại route /staff (đăng nhập chung ở /login bằng tài khoản staff). Giao diện dùng lại class của styles.css (customer-layout, customer-sidebar...).
   - Đọc đặt kho THẬT của khách từ localStorage key
     "storespace_pending_booking" (do App.jsx ghi khi khách đặt kho).
   - Happy case : kiểm tra đặt chỗ -> bàn giao kho -> kho "Đang thuê"
   - Edge case  : chờ xác nhận thanh toán, thông báo thanh toán lặp,
                  trùng kỳ thuê (kho cuối), bàn giao lặp, sai cơ sở
   ========================================================= */

const DB_KEY = "storespace_staff_db_v2";
const SESSION_KEY = "storespace_staff_session_v2";
const PENDING_BOOKING_KEY = "storespace_pending_booking"; // App.jsx ghi key này

/* Tài khoản Facility Staff – khớp Users DB (RoleID=2, FacilityStaff bảng) */
export const SEED_USERS = [
  { id: "u-staff-01", fullName: "Lê Nhân Viên Một",   email: "staff1@test.com", password: "123456", role: "FACILITY_STAFF", facilityId: "Cơ sở Lưu trữ Quận 1" },
  { id: "u-staff-02", fullName: "Phạm Nhân Viên Hai", email: "staff2@test.com", password: "123456", role: "FACILITY_STAFF", facilityId: "Cơ sở Lưu trữ Quận 1" },
  { id: "u-staff-03", fullName: "Hoàng Nhân Viên Ba", email: "staff3@test.com", password: "123456", role: "FACILITY_STAFF", facilityId: "Cơ sở Lưu trữ Tân Bình" },
];

/* ---------- helpers ---------- */
const pad = (n) => String(n).padStart(2, "0");
const fmtISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayStr = () => fmtISO(new Date());
const addDays = (s, n) => { const d = new Date(s + "T00:00:00"); d.setDate(d.getDate() + n); return fmtISO(d); };
const addMonths = (s, n) => {
  const [y, m, d] = s.split("-").map(Number);
  const last = new Date(y, m - 1 + n + 1, 0).getDate();           // kẹp về cuối tháng (31/01 + 1 tháng = 28/02)
  return fmtISO(new Date(y, m - 1 + n, Math.min(d, last)));
};
const parseVN = (s) => { const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s || ""); return m ? `${m[3]}-${pad(m[2])}-${pad(m[1])}` : todayStr(); };
const fmtDate = (s) => (s ? s.split("-").reverse().join("/") : "—");
const fmtMoney = (n) => new Intl.NumberFormat("vi-VN").format(n) + "đ";
const endOf = (r) => addMonths(r.startDate, r.months);
const overlaps = (a, b) => a.startDate < endOf(b) && b.startDate < endOf(a);

const RES_STATUS = {
  PENDING_PAYMENT: { label: "Chờ khách trả cọc", tone: "warn" },
  PENDING_CONFIRMATION: { label: "Chờ xác nhận thanh toán", tone: "warn" },
  PENDING_APPROVAL: { label: "Chờ Manager duyệt", tone: "info" },
  CONFIRMED: { label: "Đã xác nhận", tone: "info" },
  HANDED_OVER: { label: "Đã bàn giao", tone: "ok" },
};
const PAY_STATUS = {
  PENDING: { label: "Chưa thanh toán", tone: "warn" },
  PENDING_CONFIRMATION: { label: "Chờ xác nhận", tone: "warn" },
  PAID: { label: "Đã xác nhận cọc", tone: "ok" },
  FAILED: { label: "Thất bại", tone: "bad" },
};
const UNIT_STATUS = {
  AVAILABLE: { label: "Trống", tone: "ok" },
  RESERVED: { label: "Đã giữ chỗ", tone: "info" },
  RENTED: { label: "Đang thuê", tone: "ok" },
  NEEDS_INSPECTION: { label: "Cần kiểm tra", tone: "warn" },
};

/* ---------- seed data (khớp cơ sở và mã kho trong App.jsx) ---------- */
function buildSeed() {
  const t = todayStr();
  const U = (id, facilityId, type, dimensions, pricePerMonth, status) => ({ id, facilityId, type, sizeM2: dimensions, pricePerMonth, status });
  const R = (o) => ({ customerPhone: "—", appointmentDate: o.startDate, appointmentTime: "Cả ngày", assignedUnitId: null, contractId: null, paymentTxn: null, source: "demo", ...o });
  // Reservations khớp DB: Reservation #1 (customer1/Q1-U04) và #2 (customer2/TB-U03)
  const reservations = [
    R({ id: "R-1001", customerName: "Đinh Khách Hàng",  customerEmail: "cust1@test.com",   facilityId: "Cơ sở Lưu trữ Quận 1",  unitId: "Q1-U03", unitType: "Indoor Unit – M1: 2x6m",          startDate: t, months: 3,  appointmentTime: "09:00", deposit: 240000,  rentalFee: 2400000,  paymentStatus: "PAID", paymentTxn: "TXN-84F2A1", status: "CONFIRMED", assignedUnitId: "Q1-U03" }),
    R({ id: "R-1002", customerName: "Vũ Khách Hàng",    customerEmail: "cust2@test.com",   facilityId: "Cơ sở Lưu trữ Tân Bình", unitId: "TB-U03", unitType: "Basic Unit – M1: 2x6m",          startDate: t, months: 12, appointmentTime: "10:30", deposit: 225000,  rentalFee: 9000000,  paymentStatus: "PENDING_CONFIRMATION", status: "PENDING_CONFIRMATION" }),
    R({ id: "R-1003", customerName: "Bùi Khách Hàng",   customerEmail: "cust3@test.com",   facilityId: "Cơ sở Lưu trữ Quận 1",  unitId: "Q1-U04", unitType: "Indoor Unit – M2: 4x4m",          startDate: t, months: 3,  appointmentTime: "08:00", deposit: 300000,  rentalFee: 3000000,  paymentStatus: "PAID", paymentTxn: "TXN-19C7DE", status: "HANDED_OVER", assignedUnitId: "Q1-U04", contractId: "C-5001", handedOverBy: "u-staff-01", handedOverAt: new Date().toISOString() }),
    R({ id: "R-1004", customerName: "Đỗ Khách Hàng",    customerEmail: "cust4@test.com",   facilityId: "Cơ sở Lưu trữ Quận 1",  unitId: "Q1-U01", unitType: "Climate-Control Unit – S1: Locker (<2.5m)", startDate: t, months: 2,  appointmentTime: "14:00", deposit: 90000,   rentalFee:  600000,  paymentStatus: "PAID", paymentTxn: "TXN-5B03C9", status: "PENDING_APPROVAL" }),
    R({ id: "R-1005", customerName: "Khách Demo 5",     customerEmail: "demo5@test.com",   facilityId: "Cơ sở Lưu trữ Tân Bình", unitId: "TB-U07", unitType: "Drive-up Unit – L3: 4x10m",        startDate: t, months: 4,  appointmentTime: "11:00", deposit: 540000,  rentalFee: 7200000,  paymentStatus: "PAID", paymentTxn: "TXN-7A81F0", status: "CONFIRMED", assignedUnitId: "TB-U07" }),
    R({ id: "R-1006", customerName: "Khách Demo 6",     customerEmail: "demo6@test.com",   facilityId: "Cơ sở Lưu trữ Quận 1",  unitId: "Q1-U06", unitType: "Basic Unit – S3: 2x4m",           startDate: addDays(t, 30), months: 2, appointmentTime: "15:00", deposit: 180000, rentalFee: 1200000,  paymentStatus: "PAID", paymentTxn: "TXN-C2D6E4", status: "PENDING_APPROVAL" }),
  ];
  return {
    // Facilities – khớp SelfStorageDB.sql (FacilityID 1-5)
    facilities: [
      { id: "Cơ sở Lưu trữ Quận 1",   name: "Cơ sở Lưu trữ Quận 1",   address: "123 Lê Lợi, Quận 1, TP.HCM" },
      { id: "Cơ sở Lưu trữ Tân Bình",  name: "Cơ sở Lưu trữ Tân Bình",  address: "456 Cộng Hòa, Tân Bình, TP.HCM" },
      { id: "Cơ sở Lưu trữ Thủ Đức",  name: "Cơ sở Lưu trữ Thủ Đức",  address: "123 Võ Văn Ngân, Thủ Đức, TP.HCM" },
      { id: "Cơ sở Lưu trữ Quận 2",   name: "Cơ sở Lưu trữ Quận 2",   address: "456 Trần Não, Quận 2, TP.HCM" },
      { id: "Cơ sở Lưu trữ Quận 3",   name: "Cơ sở Lưu trữ Quận 3",   address: "789 Cách Mạng Tháng 8, Quận 3, TP.HCM" },
    ],
    // Units – 50 kho, khớp 100% với StorageUnit INSERT trong SelfStorageDB.sql
    // Dimensions là chuỗi mô tả (UnitSize.Dimensions), sizeM2 = diện tích quy đổi để tương thích UI cũ
    units: [
      // Quận 1 (FacilityID=1)
      U("Q1-U01", "Cơ sở Lưu trữ Quận 1",  "Climate-Control Unit", "S1: Locker (<2.5m)", 300000,  "AVAILABLE"),
      U("Q1-U02", "Cơ sở Lưu trữ Quận 1",  "Climate-Control Unit", "S2: 2x2m",          500000,  "AVAILABLE"),
      U("Q1-U03", "Cơ sở Lưu trữ Quận 1",  "Indoor Unit",          "M1: 2x6m",          800000,  "AVAILABLE"),
      U("Q1-U04", "Cơ sở Lưu trữ Quận 1",  "Indoor Unit",          "M2: 4x4m",          1000000, "RENTED"),
      U("Q1-U05", "Cơ sở Lưu trữ Quận 1",  "Basic Unit",           "S2: 2x2m",          400000,  "AVAILABLE"),
      U("Q1-U06", "Cơ sở Lưu trữ Quận 1",  "Basic Unit",           "S3: 2x4m",          600000,  "AVAILABLE"),
      U("Q1-U07", "Cơ sở Lưu trữ Quận 1",  "Drive-up Unit",        "L3: 4x10m",         2000000, "AVAILABLE"),
      U("Q1-U08", "Cơ sở Lưu trữ Quận 1",  "Drive-up Unit",        "V1: 8x4m",          2500000, "AVAILABLE"),
      U("Q1-U09", "Cơ sở Lưu trữ Quận 1",  "Climate-Control Unit", "S3: 2x4m",          700000,  "NEEDS_INSPECTION"),
      U("Q1-U10", "Cơ sở Lưu trữ Quận 1",  "Indoor Unit",          "L1: 4x6m",          1200000, "AVAILABLE"),
      // Tân Bình (FacilityID=2)
      U("TB-U01", "Cơ sở Lưu trữ Tân Bình", "Climate-Control Unit", "S1: Locker (<2.5m)", 280000,  "AVAILABLE"),
      U("TB-U02", "Cơ sở Lưu trữ Tân Bình", "Climate-Control Unit", "S2: 2x2m",          450000,  "AVAILABLE"),
      U("TB-U03", "Cơ sở Lưu trữ Tân Bình", "Basic Unit",           "M1: 2x6m",          750000,  "RENTED"),
      U("TB-U04", "Cơ sở Lưu trữ Tân Bình", "Indoor Unit",          "M2: 4x4m",          900000,  "AVAILABLE"),
      U("TB-U05", "Cơ sở Lưu trữ Tân Bình", "Basic Unit",           "S2: 2x2m",          380000,  "AVAILABLE"),
      U("TB-U06", "Cơ sở Lưu trữ Tân Bình", "Basic Unit",           "S3: 2x4m",          550000,  "AVAILABLE"),
      U("TB-U07", "Cơ sở Lưu trữ Tân Bình", "Drive-up Unit",        "L3: 4x10m",         1800000, "AVAILABLE"),
      U("TB-U08", "Cơ sở Lưu trữ Tân Bình", "Drive-up Unit",        "V1: 8x4m",          2200000, "AVAILABLE"),
      U("TB-U09", "Cơ sở Lưu trữ Tân Bình", "Indoor Unit",          "L1: 4x6m",          1100000, "AVAILABLE"),
      U("TB-U10", "Cơ sở Lưu trữ Tân Bình", "Climate-Control Unit", "S3: 2x4m",          650000,  "AVAILABLE"),
      // Thủ Đức (FacilityID=3)
      U("TD-U01", "Cơ sở Lưu trữ Thủ Đức",  "Climate-Control Unit", "S1: Locker (<2.5m)", 300000,  "AVAILABLE"),
      U("TD-U02", "Cơ sở Lưu trữ Thủ Đức",  "Climate-Control Unit", "S2: 2x2m",          500000,  "AVAILABLE"),
      U("TD-U03", "Cơ sở Lưu trữ Thủ Đức",  "Indoor Unit",          "M1: 2x6m",          800000,  "AVAILABLE"),
      U("TD-U04", "Cơ sở Lưu trữ Thủ Đức",  "Indoor Unit",          "M2: 4x4m",          1000000, "AVAILABLE"),
      U("TD-U05", "Cơ sở Lưu trữ Thủ Đức",  "Basic Unit",           "S2: 2x2m",          400000,  "AVAILABLE"),
      U("TD-U06", "Cơ sở Lưu trữ Thủ Đức",  "Basic Unit",           "S3: 2x4m",          600000,  "AVAILABLE"),
      U("TD-U07", "Cơ sở Lưu trữ Thủ Đức",  "Drive-up Unit",        "L3: 4x10m",         2000000, "AVAILABLE"),
      U("TD-U08", "Cơ sở Lưu trữ Thủ Đức",  "Drive-up Unit",        "V1: 8x4m",          2500000, "AVAILABLE"),
      U("TD-U09", "Cơ sở Lưu trữ Thủ Đức",  "Climate-Control Unit", "S3: 2x4m",          700000,  "AVAILABLE"),
      U("TD-U10", "Cơ sở Lưu trữ Thủ Đức",  "Indoor Unit",          "L1: 4x6m",          1200000, "AVAILABLE"),
      // Quận 2 (FacilityID=4)
      U("Q2-U01", "Cơ sở Lưu trữ Quận 2",   "Climate-Control Unit", "S1: Locker (<2.5m)", 350000,  "AVAILABLE"),
      U("Q2-U02", "Cơ sở Lưu trữ Quận 2",   "Climate-Control Unit", "S2: 2x2m",          550000,  "AVAILABLE"),
      U("Q2-U03", "Cơ sở Lưu trữ Quận 2",   "Indoor Unit",          "M1: 2x6m",          850000,  "AVAILABLE"),
      U("Q2-U04", "Cơ sở Lưu trữ Quận 2",   "Indoor Unit",          "M2: 4x4m",          1050000, "AVAILABLE"),
      U("Q2-U05", "Cơ sở Lưu trữ Quận 2",   "Basic Unit",           "S2: 2x2m",          450000,  "AVAILABLE"),
      U("Q2-U06", "Cơ sở Lưu trữ Quận 2",   "Basic Unit",           "S3: 2x4m",          650000,  "AVAILABLE"),
      U("Q2-U07", "Cơ sở Lưu trữ Quận 2",   "Drive-up Unit",        "L3: 4x10m",         2100000, "AVAILABLE"),
      U("Q2-U08", "Cơ sở Lưu trữ Quận 2",   "Drive-up Unit",        "V1: 8x4m",          2600000, "AVAILABLE"),
      U("Q2-U09", "Cơ sở Lưu trữ Quận 2",   "Climate-Control Unit", "S3: 2x4m",          750000,  "AVAILABLE"),
      U("Q2-U10", "Cơ sở Lưu trữ Quận 2",   "Indoor Unit",          "L1: 4x6m",          1250000, "AVAILABLE"),
      // Quận 3 (FacilityID=5)
      U("Q3-U01", "Cơ sở Lưu trữ Quận 3",   "Climate-Control Unit", "S1: Locker (<2.5m)", 400000,  "AVAILABLE"),
      U("Q3-U02", "Cơ sở Lưu trữ Quận 3",   "Climate-Control Unit", "S2: 2x2m",          600000,  "AVAILABLE"),
      U("Q3-U03", "Cơ sở Lưu trữ Quận 3",   "Indoor Unit",          "M1: 2x6m",          900000,  "AVAILABLE"),
      U("Q3-U04", "Cơ sở Lưu trữ Quận 3",   "Indoor Unit",          "M2: 4x4m",          1100000, "AVAILABLE"),
      U("Q3-U05", "Cơ sở Lưu trữ Quận 3",   "Basic Unit",           "S2: 2x2m",          500000,  "AVAILABLE"),
      U("Q3-U06", "Cơ sở Lưu trữ Quận 3",   "Basic Unit",           "S3: 2x4m",          700000,  "AVAILABLE"),
      U("Q3-U07", "Cơ sở Lưu trữ Quận 3",   "Drive-up Unit",        "L3: 4x10m",         2200000, "AVAILABLE"),
      U("Q3-U08", "Cơ sở Lưu trữ Quận 3",   "Drive-up Unit",        "V1: 8x4m",          2700000, "AVAILABLE"),
      U("Q3-U09", "Cơ sở Lưu trữ Quận 3",   "Climate-Control Unit", "S3: 2x4m",          800000,  "AVAILABLE"),
      U("Q3-U10", "Cơ sở Lưu trữ Quận 3",   "Indoor Unit",          "L1: 4x6m",          1300000, "AVAILABLE"),
    ],
    reservations,
    payments: reservations.filter((r) => r.paymentTxn).map((r) => ({ txn: r.paymentTxn, resId: r.id })),
    contracts: [
      { id: "C-5001", reservationId: "R-1003", unitId: "Q1-U04", customerName: "Bùi Khách Hàng", startDate: t, endDate: addMonths(t, 3), accessType: "Smart Lock", accessValue: "KEY-0245", handedOverBy: "u-staff-01", handedOverAt: new Date().toISOString() },
    ],
    activity: [
      { id: "A-0", at: new Date().toISOString(), facilityId: "Cơ sở Lưu trữ Quận 1", staffName: "Lê Nhân Viên Một", text: "Bàn giao Q1-U04 cho Bùi Khách Hàng (R-1003, hợp đồng C-5001)." },
    ],
  };
}

/* Lấy đặt kho THẬT của khách (App.jsx ghi) và đưa vào danh sách của Staff */
function syncLive(db) {
  let b = null;
  try { b = JSON.parse(localStorage.getItem(PENDING_BOOKING_KEY) || "null"); } catch { /* ignore */ }
  if (!b || !b.id) return db;

  const existing = db.reservations.find((r) => r.id === b.id);
  if (existing) {
    // Khách vừa bấm "Tôi đã thanh toán cọc" -> chuyển sang chờ hệ thống xác nhận
    if (b.depositPaid && existing.paymentStatus === "PENDING") {
      return { ...db, reservations: db.reservations.map((r) => (r.id === b.id ? { ...r, paymentStatus: "PENDING_CONFIRMATION", status: "PENDING_CONFIRMATION" } : r)) };
    }
    return db;
  }
  const start = parseVN(b.startDate);
  const res = {
    id: b.id, customerName: b.customerName, customerEmail: b.customerEmail, customerPhone: "—",
    facilityId: b.facility, unitId: b.unitId, unitType: `${b.unitType} ${b.size}`,
    startDate: start, months: b.durationMonths, appointmentDate: start, appointmentTime: "Cả ngày",
    deposit: b.deposit, rentalFee: b.totalRent,
    paymentStatus: b.depositPaid ? "PENDING_CONFIRMATION" : "PENDING", paymentTxn: null,
    status: b.depositPaid ? "PENDING_CONFIRMATION" : "PENDING_PAYMENT",
    assignedUnitId: null, contractId: null, source: "live",
  };
  // Cùng khách đặt lại cùng kho với kỳ thuê chồng lấn, bản cũ chưa được xác nhận cọc -> bản mới thay bản cũ
  const stale = db.reservations.filter((r) =>
    r.source === "live" && r.id !== res.id && r.customerEmail === res.customerEmail && r.unitId === res.unitId &&
    ["PENDING_PAYMENT", "PENDING_CONFIRMATION"].includes(r.status) && overlaps(r, res));
  return {
    ...db,
    reservations: [res, ...db.reservations.filter((r) => !stale.includes(r))],
    units: db.units.map((u) => (u.id === b.unitId && u.status === "AVAILABLE" ? { ...u, status: "RESERVED" } : u)),
  };
}

function loadDb() {
  let db = null;
  try { db = JSON.parse(localStorage.getItem(DB_KEY) || "null"); } catch { /* ignore */ }
  if (!db) db = buildSeed();
  db = syncLive(db);
  try { localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch { /* ignore */ }
  return db;
}
const saveDb = (db) => { try { localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch { /* ignore */ } };
const syncState = (prev) => { const next = syncLive(prev); if (next !== prev) saveDb(next); return next; };

/* ---------- business rules ---------- */
const HOLDING = ["CONFIRMED", "HANDED_OVER"];
const findClash = (db, res, unitId) =>
  unitId ? db.reservations.find((r) => r.id !== res.id && r.assignedUnitId === unitId && HOLDING.includes(r.status) && overlaps(r, res)) : null;

function checkHandover(res, staff, db) {
  const checks = [
    { key: "facility", label: "Đặt chỗ thuộc đúng cơ sở của bạn", ok: res.facilityId === staff.facilityId },
    { key: "payment", label: "Hệ thống đã xác nhận tiền cọc (không dựa vào thông báo từ trình duyệt)", ok: res.paymentStatus === "PAID" },
    { key: "unit", label: "Facility Manager đã duyệt và phân kho", ok: !!res.assignedUnitId },
    { key: "clash", label: "Kho không trùng kỳ thuê với đặt chỗ khác", ok: !findClash(db, res, res.assignedUnitId) },
    { key: "status", label: "Đặt chỗ chưa được bàn giao", ok: res.status === "CONFIRMED" },
  ];
  return { checks, canHandover: checks.every((c) => c.ok) };
}

/* Giả lập: cổng thanh toán gửi kết quả (có thể gửi lặp, chỉ ghi nhận 1 lần theo mã giao dịch) */
function confirmPayment(db, resId) {
  const res = db.reservations.find((r) => r.id === resId);
  if (!res) return { ok: false, message: "Không tìm thấy đặt chỗ." };
  const txn = res.paymentTxn || `TXN-${res.id}`;
  if (db.payments.some((p) => p.txn === txn)) {
    return { ok: false, duplicate: true, message: `Mã giao dịch ${txn} đã được ghi nhận trước đó. Thông báo lặp bị bỏ qua, doanh thu chỉ ghi nhận một lần.` };
  }
  if (res.paymentStatus !== "PENDING_CONFIRMATION") return { ok: false, message: "Đặt chỗ này không ở trạng thái chờ xác nhận thanh toán." };
  return {
    ok: true,
    message: `Đã xác nhận tiền cọc, mã giao dịch ${txn}. Đặt chỗ chuyển sang chờ Manager duyệt.`,
    db: {
      ...db,
      payments: [...db.payments, { txn, resId: res.id }],
      reservations: db.reservations.map((r) => (r.id === res.id ? { ...r, paymentStatus: "PAID", paymentTxn: txn, status: "PENDING_APPROVAL" } : r)),
    },
  };
}

/* Giả lập: Facility Manager duyệt và phân kho (chưa có giao diện Manager) */
function approveAndAssign(db, resId) {
  const res = db.reservations.find((r) => r.id === resId);
  if (!res) return { ok: false, message: "Không tìm thấy đặt chỗ." };
  if (res.paymentStatus !== "PAID" || res.status !== "PENDING_APPROVAL") return { ok: false, message: "Chỉ duyệt đặt chỗ đã xác nhận tiền cọc và đang chờ duyệt." };
  const clash = findClash(db, res, res.unitId);
  if (clash) return { ok: false, message: `Kho ${res.unitId} đã hết cho kỳ thuê này (trùng với đặt chỗ ${clash.id}). Yêu cầu này nhận thông báo hết kho.` };
  return {
    ok: true,
    message: `Manager đã duyệt và phân kho ${res.unitId}.`,
    db: {
      ...db,
      reservations: db.reservations.map((r) => (r.id === res.id ? { ...r, status: "CONFIRMED", assignedUnitId: res.unitId } : r)),
      units: db.units.map((u) => (u.id === res.unitId && u.status === "AVAILABLE" ? { ...u, status: "RESERVED" } : u)),
    },
  };
}

function doHandover(db, resId, staff, access) {
  const res = db.reservations.find((r) => r.id === resId);
  if (!res) return { ok: false, message: "Không tìm thấy đặt chỗ." };

  // Chống bàn giao lặp: không tạo thêm hợp đồng, không cấp thêm kho
  if (res.status === "HANDED_OVER") {
    return { ok: false, duplicate: true, message: `Đặt chỗ ${res.id} đã được bàn giao (hợp đồng ${res.contractId}). Hệ thống không tạo thêm hợp đồng hay cấp thêm kho.` };
  }
  if (!checkHandover(res, staff, db).canHandover) return { ok: false, message: "Chưa đủ điều kiện bàn giao. Kiểm tra lại các mục trong danh sách." };

  const unit = db.units.find((u) => u.id === res.assignedUnitId);
  if (!unit) return { ok: false, message: "Không tìm thấy kho được phân." };
  if (unit.status === "RENTED") return { ok: false, message: `Kho ${unit.id} đang có người thuê.` };

  const now = new Date().toISOString();
  const contractId = `C-${5001 + db.contracts.length}`;
  const contract = {
    id: contractId, reservationId: res.id, unitId: unit.id, customerName: res.customerName,
    startDate: res.startDate, endDate: endOf(res),
    accessType: access.type, accessValue: access.value.trim(), handedOverBy: staff.id, handedOverAt: now,
  };
  return {
    ok: true,
    message: `Bàn giao thành công kho ${unit.id}. Hợp đồng ${contractId} đã được tạo.`,
    db: {
      ...db,
      reservations: db.reservations.map((r) => (r.id === res.id ? { ...r, status: "HANDED_OVER", contractId, handedOverBy: staff.id, handedOverAt: now } : r)),
      units: db.units.map((u) => (u.id === unit.id ? { ...u, status: "RENTED" } : u)),
      contracts: [...db.contracts, contract],
      activity: [{ id: `A-${Date.now()}`, at: now, facilityId: res.facilityId, staffName: staff.fullName, text: `Bàn giao ${unit.id} cho ${res.customerName} (${res.id}, hợp đồng ${contractId}).` }, ...db.activity],
    },
  };
}

/* ---------- small UI parts ---------- */
const Badge = ({ map, value }) => {
  const s = map[value] || { label: value, tone: "info" };
  return <span className={`st-badge st-${s.tone}`}>{s.label}</span>;
};
const Info = ({ k, children }) => (
  <div><small>{k}</small><strong>{children}</strong></div>
);

/* Khung đăng nhập dùng lại class auth-* của trang khách */
function AuthFrame({ title, subtitle, onBrand, children }) {
  return (
    <div className="auth-page">
      <div className="auth-background auth-bg-one" />
      <div className="auth-background auth-bg-two" />
      <div className="auth-card">
        <button className="auth-brand" type="button" onClick={onBrand}>
          <span className="brand-mark">S</span>
          <span><strong>StoreSpace</strong><small>Facility Staff Portal</small></span>
        </button>
        <div className="auth-heading">
          <div className="eyebrow"><span /> FACILITY STAFF</div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------- Login (chỉ dùng khi chạy trang riêng staff/index.html) ---------- */
function LoginView({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    const user = SEED_USERS.find((u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password);
    if (!user) return setError("Email hoặc mật khẩu không đúng, hoặc tài khoản này không phải Facility Staff.");
    onLogin(user);
  };

  return (
    <AuthFrame title="Đăng nhập nhân viên" subtitle="Tài khoản do quản trị viên cấp. Khách hàng đăng nhập ở trang chủ." onBrand={() => {}}>
      <form className="auth-form" onSubmit={submit}>
        {error && <div className="auth-message error">{error}</div>}
        <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="staff1@storespace.vn" autoComplete="username" required /></label>
        <label>Mật khẩu<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Nhập mật khẩu" autoComplete="current-password" required /></label>
        <button className="auth-submit" type="submit">Đăng nhập</button>
        <div className="auth-message success">Demo: staff1@test.com (Quận 1) hoặc staff3@test.com (Tân Bình), mật khẩu 123456</div>
      </form>
    </AuthFrame>
  );
}

function NoAccess({ navigate }) {
  return (
    <AuthFrame title="Cần tài khoản nhân viên" subtitle="Trang này chỉ dành cho Facility Staff. Hãy đăng nhập bằng tài khoản nhân viên do quản trị viên cấp." onBrand={() => navigate("/")}>
      <div className="auth-form">
        <button className="auth-submit" type="button" onClick={() => navigate("/login")}>Đến trang đăng nhập</button>
        <button className="back-home" type="button" onClick={() => navigate("/")}>← Quay lại trang chủ</button>
      </div>
    </AuthFrame>
  );
}

/* ---------- Reservation detail + handover ---------- */
function ReservationDetail({ res, unit, staff, db, actions }) {
  const [accessType, setAccessType] = useState("Khóa");
  const [accessValue, setAccessValue] = useState("");
  const [idChecked, setIdChecked] = useState(false);
  const [result, setResult] = useState(null);

  const { checks, canHandover } = checkHandover(res, staff, db);
  const handedOver = res.status === "HANDED_OVER";
  const notToday = res.appointmentDate !== todayStr();
  const ready = canHandover && idChecked && accessValue.trim().length > 0;
  const doHandoverClick = () => setResult(actions.handover(res.id, { type: accessType, value: accessValue }));

  return (
    <div className="st-card st-detail">
      <div className="st-head">
        <div>
          <span className="customer-eyebrow">ĐẶT CHỖ {res.id}</span>
          <h2>{res.customerName}</h2>
          <p>{res.unitType} · khách chọn {res.unitId}</p>
        </div>
        <Badge map={RES_STATUS} value={res.status} />
      </div>

      {res.paymentStatus === "PENDING" && !handedOver && (
        <div className="st-alert st-warn">Khách chưa thanh toán tiền cọc. Chưa thể bàn giao.</div>
      )}
      {res.paymentStatus === "PENDING_CONFIRMATION" && (
        <div className="st-alert st-warn">Khách báo đã thanh toán nhưng hệ thống chưa nhận kết quả từ cổng thanh toán. Không bàn giao dựa trên ảnh chụp hoặc thông báo từ trình duyệt của khách.</div>
      )}
      {notToday && !handedOver && res.source !== "live" && <div className="st-alert st-warn">Lịch hẹn là ngày {fmtDate(res.appointmentDate)}, không phải hôm nay.</div>}

      <div className="st-grid">
        <Info k="Liên hệ">{res.customerPhone} · {res.customerEmail}</Info>
        <Info k="Kho được phân">{res.assignedUnitId ? `${res.assignedUnitId}${unit ? ` (${unit.sizeM2}m²)` : ""}` : "Chưa phân"}</Info>
        <Info k="Kỳ thuê">{fmtDate(res.startDate)} → {fmtDate(endOf(res))} ({res.months} tháng)</Info>
        <Info k="Lịch hẹn">{fmtDate(res.appointmentDate)} · {res.appointmentTime}</Info>
        <Info k="Tiền cọc">{fmtMoney(res.deposit)} <Badge map={PAY_STATUS} value={res.paymentStatus} /></Info>
        <Info k="Tổng tiền thuê">{fmtMoney(res.rentalFee)}</Info>
        {res.paymentTxn && <Info k="Mã giao dịch">{res.paymentTxn}</Info>}
      </div>

      {handedOver ? (
        <>
          <div className="st-alert st-ok">Đã bàn giao{res.contractId ? ` — hợp đồng ${res.contractId}` : ""}.</div>
          <button className="dashboard-secondary-btn" type="button" onClick={doHandoverClick}>Thử bàn giao lại</button>
        </>
      ) : (
        <>
          <div className="st-demo">
            <strong>Giả lập bước của hệ thống / Manager (demo)</strong>
            <p>Chưa có cổng thanh toán thật và giao diện Manager, dùng 2 nút này để đi hết happy case. Bấm nút thứ nhất nhiều lần để thử thông báo thanh toán lặp.</p>
            <div className="st-actions">
              <button className="dashboard-secondary-btn" type="button" disabled={!["PENDING_CONFIRMATION", "PAID"].includes(res.paymentStatus)} onClick={() => setResult(actions.confirmPayment(res.id))}>Cổng thanh toán báo thành công</button>
              <button className="dashboard-secondary-btn" type="button" disabled={!(res.paymentStatus === "PAID" && res.status === "PENDING_APPROVAL")} onClick={() => setResult(actions.approve(res.id))}>Manager duyệt và phân kho</button>
            </div>
          </div>

          <h3>Kiểm tra trước khi bàn giao</h3>
          <ul className="st-checks">
            {checks.map((c) => (
              <li key={c.key} className={c.ok ? "st-yes" : "st-no"}>
                <span aria-hidden="true">{c.ok ? "✓" : "✕"}</span> {c.label}
              </li>
            ))}
          </ul>
          <label className="st-check">
            <input type="checkbox" checked={idChecked} onChange={(e) => setIdChecked(e.target.checked)} />
            Đã đối chiếu giấy tờ, đúng khách hàng đặt chỗ
          </label>

          <h3>Thông tin truy cập</h3>
          <div className="st-form-row">
            <label>Hình thức
              <select className="st-input" value={accessType} onChange={(e) => setAccessType(e.target.value)}>
                <option>Khóa</option><option>Thẻ truy cập</option><option>Mã truy cập</option>
              </select>
            </label>
            <label>{accessType === "Khóa" ? "Số hiệu khóa" : accessType === "Thẻ truy cập" ? "Mã thẻ" : "Mã truy cập"}
              <input className="st-input" value={accessValue} onChange={(e) => setAccessValue(e.target.value)} placeholder="VD: KEY-0301" />
            </label>
          </div>
          <button className="dashboard-primary-btn" type="button" disabled={!ready} onClick={doHandoverClick}>Xác nhận bàn giao</button>
          {!ready && <p className="st-hint">Cần đủ điều kiện, tick đối chiếu giấy tờ và nhập thông tin truy cập.</p>}
        </>
      )}

      {result && <div className={`st-alert ${result.ok ? "st-ok" : "st-warn"}`} role="status">{result.message}</div>}
    </div>
  );
}

/* Danh sách đặt chỗ + chi tiết (dùng cho "Nhận kho hôm nay" và "Tất cả đặt chỗ") */
function Workspace({ list, query, setQuery, selected, setSelectedId, selectedId, staff, db, actions }) {
  return (
    <div className="st-split">
      <div>
        <input className="st-search" placeholder="Tìm theo mã đặt chỗ, tên, email, mã kho" value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="st-list">
          {list.length === 0 && <div className="st-card st-empty">Không có đặt chỗ nào phù hợp.</div>}
          {list.map((r) => (
            <button type="button" key={r.id} className={`st-item ${r.id === selectedId ? "active" : ""}`} onClick={() => setSelectedId(r.id)}>
              <div className="st-item-top">
                <strong className="st-time">{r.appointmentTime}</strong>
                <span className="st-name">{r.customerName}</span>
                {r.source === "live" && <span className="st-badge st-new">Mới từ khách</span>}
              </div>
              <div className="st-item-sub">{r.id} · {r.unitId} · {r.unitType}</div>
              <div className="st-item-foot"><Badge map={RES_STATUS} value={r.status} /><span>{fmtDate(r.startDate)}</span></div>
            </button>
          ))}
        </div>
      </div>
      <div>
        {selected ? (
          <ReservationDetail key={selected.id} res={selected} unit={db.units.find((u) => u.id === selected.assignedUnitId)} staff={staff} db={db} actions={actions} />
        ) : (
          <div className="st-card st-empty">Chọn một đặt chỗ ở danh sách bên trái để kiểm tra và bàn giao kho.</div>
        )}
      </div>
    </div>
  );
}

/* ---------- Portal (khung giống Customer Portal) ---------- */
const NAV = [
  ["overview", "⌂", "Tổng quan"],
  ["today", "◷", "Nhận kho hôm nay"],
  ["all", "▤", "Tất cả đặt chỗ"],
  ["units", "▣", "Kho tại cơ sở"],
  ["log", "◫", "Nhật ký bàn giao"],
];

function Portal({ staff, db, setDb, onLogout, onReset, onRefresh }) {
  const [section, setSection] = useState("overview");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const facility = db.facilities.find((f) => f.id === staff.facilityId);
  const mine = useMemo(() => db.reservations.filter((r) => r.facilityId === staff.facilityId), [db, staff]);
  const today = todayStr();
  const sortKey = (r) => (r.source === "live" ? "0" : "1") + r.appointmentDate + r.appointmentTime;
  const bySort = (a, b) => sortKey(a).localeCompare(sortKey(b));
  const matches = (r) => {
    const q = query.trim().toLowerCase();
    return !q || [r.id, r.customerName, r.customerEmail, r.unitId].some((v) => String(v).toLowerCase().includes(q));
  };

  const todayList = useMemo(() => mine.filter((r) => r.appointmentDate === today || r.source === "live").sort(bySort), [mine, today]);
  const todayVisible = todayList.filter((r) => r.appointmentDate === today || r.status !== "HANDED_OVER").filter(matches);
  const allVisible = [...mine].sort(bySort).filter(matches);

  const counts = {
    waiting: todayList.filter((r) => checkHandover(r, staff, db).canHandover).length,
    blocked: todayList.filter((r) => r.status !== "HANDED_OVER" && !checkHandover(r, staff, db).canHandover).length,
    done: todayList.filter((r) => r.status === "HANDED_OVER").length,
  };
  const units = db.units.filter((u) => u.facilityId === staff.facilityId);
  const freeUnits = units.filter((u) => u.status === "AVAILABLE").length;
  const selected = mine.find((r) => r.id === selectedId) || null;

  const run = (fn, ...args) => {
    const result = fn(db, ...args);
    if (result.ok) setDb(result.db);
    return result;
  };
  const actions = {
    handover: (id, access) => run(doHandover, id, staff, access),
    confirmPayment: (id) => run(confirmPayment, id),
    approve: (id) => run(approveAndAssign, id),
  };
  const open = (id) => { setSelectedId(id); setSection("today"); };

  const HEAD = {
    overview: ["STAFF DASHBOARD", `Xin chào, ${staff.fullName}!`, `Nhận kho và bàn giao cho khách tại ${facility?.name}.`],
    today: ["CHECK-IN & HANDOVER", "Nhận kho hôm nay", "Kiểm tra đặt chỗ, thanh toán và bàn giao kho cho khách."],
    all: ["RESERVATIONS", "Tất cả đặt chỗ", "Toàn bộ đặt chỗ thuộc cơ sở của bạn."],
    units: ["FACILITY UNITS", "Kho tại cơ sở", "Trạng thái các kho đang quản lý tại cơ sở."],
    log: ["ACTIVITY LOG", "Nhật ký bàn giao", "Lịch sử bàn giao kho tại cơ sở của bạn."],
  }[section];
  const initial = staff.fullName.trim().split(" ").pop().charAt(0).toUpperCase();

  return (
    <div className="customer-layout">
      <aside className="customer-sidebar">
        <div className="customer-brand">
          <span className="brand-mark">S</span>
          <div><strong>StoreSpace</strong><small>Staff Portal</small></div>
        </div>

        <div className="customer-profile-mini">
          <div className="customer-avatar">{initial}</div>
          <div><strong>{staff.fullName}</strong><small>Facility Staff · {facility?.name}</small></div>
        </div>

        <nav className="customer-nav">
          {NAV.map(([key, icon, label]) => (
            <button key={key} type="button" className={section === key ? "active" : ""} onClick={() => setSection(key)}>
              <span>{icon}</span>{label}
            </button>
          ))}
        </nav>

        <div className="customer-sidebar-bottom">
          <button type="button" onClick={onRefresh}><span>↻</span>Làm mới đặt chỗ</button>
          <button type="button" onClick={onReset}><span>⟲</span>Đặt lại dữ liệu demo</button>
          <button type="button" onClick={onLogout}><span>↪</span>Đăng xuất</button>
        </div>
      </aside>

      <main className="customer-main">
        <div className="customer-topbar">
          <div>
            <span className="customer-eyebrow">{HEAD[0]}</span>
            <h1>{HEAD[1]}</h1>
            <p>{HEAD[2]}</p>
          </div>
          <button type="button" className="customer-profile-button" onClick={() => setSection("overview")}>{initial}</button>
        </div>

        {section === "overview" && (
          <div>
            <section className="customer-stats">
              <div className="customer-stat-card"><span className="stat-icon">▣</span><small>Sẵn sàng bàn giao</small><strong>{counts.waiting}</strong><span className="stat-note">Đủ điều kiện</span></div>
              <div className="customer-stat-card"><span className="stat-icon yellow">◷</span><small>Chưa đủ điều kiện</small><strong>{counts.blocked}</strong><span className="stat-note warning">Cần xử lý</span></div>
              <div className="customer-stat-card"><span className="stat-icon blue">✓</span><small>Đã bàn giao</small><strong>{counts.done}</strong><span className="stat-note">Hôm nay</span></div>
              <div className="customer-stat-card"><span className="stat-icon">◴</span><small>Kho còn trống</small><strong>{freeUnits}</strong><span className="stat-note">Tại {facility?.name}</span></div>
            </section>

            <section className="customer-section">
              <div className="customer-section-heading">
                <div><span className="customer-eyebrow">TODAY</span><h2>Việc cần làm hôm nay</h2></div>
                <button type="button" className="overview-text-button" onClick={() => setSection("today")}>Mở màn hình bàn giao →</button>
              </div>
              <div className="st-card st-todo-card">
                {todayList.length === 0 && <div className="st-empty">Hôm nay chưa có khách cần nhận kho.</div>}
                {todayList.map((r) => (
                  <button type="button" key={r.id} className="st-todo" onClick={() => open(r.id)}>
                    <span className="st-time">{r.appointmentTime}</span>
                    <span className="st-todo-main"><strong>{r.customerName}</strong><small>{r.id} · {r.unitId} · {r.unitType}</small></span>
                    {r.source === "live" && <span className="st-badge st-new">Mới từ khách</span>}
                    <Badge map={RES_STATUS} value={r.status} />
                    <span className="st-go">→</span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}

        {section === "today" && (
          <Workspace list={todayVisible} query={query} setQuery={setQuery} selected={selected} selectedId={selectedId} setSelectedId={setSelectedId} staff={staff} db={db} actions={actions} />
        )}
        {section === "all" && (
          <Workspace list={allVisible} query={query} setQuery={setQuery} selected={selected} selectedId={selectedId} setSelectedId={setSelectedId} staff={staff} db={db} actions={actions} />
        )}

        {section === "units" && (
          <div className="st-card">
            <table className="st-table">
              <thead><tr><th>Mã kho</th><th>Loại kho</th><th>Diện tích</th><th>Giá thuê / tháng</th><th>Trạng thái</th></tr></thead>
              <tbody>
                {units.map((u) => (
                  <tr key={u.id}><td><strong>{u.id}</strong></td><td>{u.type}</td><td>{u.sizeM2}m²</td><td>{fmtMoney(u.pricePerMonth)}</td><td><Badge map={UNIT_STATUS} value={u.status} /></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {section === "log" && (
          <div className="st-card">
            {db.activity.filter((a) => a.facilityId === staff.facilityId).length === 0 && <div className="st-empty">Chưa có lần bàn giao nào.</div>}
            <ul className="st-log">
              {db.activity.filter((a) => a.facilityId === staff.facilityId).map((a) => (
                <li key={a.id}><small>{new Date(a.at).toLocaleString("vi-VN")} · {a.staffName}</small><div>{a.text}</div></li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}

/* ---------- Root ---------- */
/*
  Hai chế độ:
  - embedded (gắn trong App.jsx tại route /staff): dùng phiên đăng nhập chung của site
    (currentUser lấy từ storespace_current_user, đăng nhập ở /login).
  - standalone (trang riêng staff/index.html): tự có form đăng nhập riêng.
*/
export default function StaffPortal({ embedded = false, currentUser = null, navigate = null, currentUserKey = "storespace_current_user" } = {}) {
  const [db, setDbState] = useState(loadDb);
  const [ownStaff, setOwnStaff] = useState(() => {
    try {
      const id = localStorage.getItem(SESSION_KEY);
      return SEED_USERS.find((u) => u.id === id) || null;
    } catch { return null; }
  });

  const staff = embedded
    ? SEED_USERS.find((u) => currentUser && currentUser.role === "FACILITY_STAFF" && u.email.toLowerCase() === String(currentUser.email).toLowerCase()) || null
    : ownStaff;

  // Tự lấy đặt kho mới của khách khi quay lại tab này
  useEffect(() => {
    const refresh = () => setDbState(syncState);
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    return () => { window.removeEventListener("focus", refresh); window.removeEventListener("storage", refresh); };
  }, []);

  const setDb = (next) => { setDbState(next); saveDb(next); };
  const login = (u) => { try { localStorage.setItem(SESSION_KEY, u.id); } catch { /* ignore */ } setOwnStaff(u); };
  const logout = () => {
    if (embedded) {
      try { localStorage.removeItem(currentUserKey); } catch { /* ignore */ }
      navigate("/");
      return;
    }
    try { localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
    setOwnStaff(null);
  };
  const reset = () => setDb(syncLive(buildSeed()));
  const refresh = () => setDbState(syncState);

  return (
    <div className="st-root">
      {staff ? (
        <Portal staff={staff} db={db} setDb={setDb} onLogout={logout} onReset={reset} onRefresh={refresh} />
      ) : embedded ? (
        <NoAccess navigate={navigate} />
      ) : (
        <LoginView onLogin={login} />
      )}
    </div>
  );
}
