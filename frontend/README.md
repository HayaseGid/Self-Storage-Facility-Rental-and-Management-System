# StoreSpace – Web app hoàn chỉnh

## Chạy
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # xuất bản production (thư mục dist)
```
Khi deploy, cấu hình rewrite mọi đường dẫn về `index.html` (app dùng History API).

## Tài khoản demo
| Vai trò | Email | Mật khẩu | Trang |
|---|---|---|---|
| System Admin | admin@storespace.vn | Admin@123 | /admin |
| Business Operations | business@storespace.vn | Business@123 | /business |
| Facility Manager | manager1@storespace.vn (…2, …3) | Manager@123 | /manager |
| Facility Staff | staff1@storespace.vn (…2, …3) | Staff@123 | /staff |
| Khách hàng | tự đăng ký tại /register | | /customer |

## Cấu trúc
- `src/App.jsx` – entry, router, trang công khai, đăng nhập/đăng ký, phân quyền theo role
- `src/CustomerAccount.jsx`, `FacilityManagerAccount.jsx`, `FacilityStaffAccount.jsx`, `AdminAccount.jsx`, `BusinessOperations.jsx` – các dashboard theo role
- CSS: `styles.css` (chung), `fmanagerstyles.css`, `staffstyles.css`, `AdminAccount.css`, `BusinessOperations.css`

## Font
- Tiêu đề: **Be Vietnam Pro** (thay Manrope – font này bị dính chữ khi gõ tiếng Việt kèm letter-spacing âm). Nội dung: DM Sans (fallback Be Vietnam Pro cho dấu tiếng Việt).
- Muốn đổi font, sửa dòng `@import` đầu `src/styles.css` và thay `'Be Vietnam Pro'` trong các file CSS.
