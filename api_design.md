# API Design — Inventory Management System (IMS)

> Tài liệu thiết kế API đầy đủ, dùng làm base để viết Swagger/OpenAPI khi code. Version: v1.0

## 1. Tổng quan (Overview)

- **Kiểu kiến trúc**: RESTful API
- **Base URL**: `/api/v1`
- **Định dạng dữ liệu**: JSON (trừ endpoint upload file dùng `multipart/form-data`, export dùng `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`)
- **Xác thực (Authentication)**: JWT lưu trong HTTP-only Cookie (access token + refresh token riêng)
- **Phân quyền (Authorization)**: RBAC — middleware `authorize()` check theo role hoặc permission code
- **Đối tượng dùng**: Nội bộ công ty, **không có tính năng tự đăng ký** — tài khoản do Admin tạo

## 2. Quy ước chung (Conventions)

### Response format
```json
// Thành công
{ "success": true, "data": { ... }, "meta": { "page": 1, "limit": 20, "total": 87 } }

// Lỗi
{ "success": false, "error": { "code": "OUT_OF_STOCK", "message": "Không đủ hàng tồn kho" } }
```
`meta` chỉ xuất hiện ở API dạng danh sách (list) có phân trang.

### Phân trang & filter (áp dụng cho mọi GET danh sách)
```
GET /products?page=1&limit=20&sort=created_at:desc&search=lavie&category_id=uuid
```
| Query param | Mô tả |
|---|---|
| `page`, `limit` | Phân trang, mặc định `page=1&limit=20` |
| `sort` | `field:asc` hoặc `field:desc` |
| `search` | Tìm theo tên/sku/barcode tuỳ resource |
| Các field riêng | Filter cụ thể theo resource (VD: `category_id`, `warehouse_id`) |

### HTTP Status Code dùng chuẩn
| Code | Ý nghĩa |
|---|---|
| 200 | GET/PATCH/PUT thành công |
| 201 | POST tạo mới thành công |
| 204 | DELETE thành công (không trả body) |
| 400 | Validation lỗi / business rule lỗi (OUT_OF_STOCK...) |
| 401 | Chưa đăng nhập / token hết hạn |
| 403 | Không đủ quyền |
| 404 | Không tìm thấy resource |
| 409 | Conflict (trùng SKU, role đang được dùng...) |
| 500 | Lỗi server |

### Role viết tắt dùng trong bảng bên dưới
`A` = admin · `M` = manager · `S` = staff · `Public` = không cần đăng nhập

---

## 3. Auth

Không có self-register, cũng không dùng email (không cần Nodemailer). Admin tạo tài khoản qua `POST /users` → **API trả về mật khẩu tạm trong response** (chỉ 1 lần lúc tạo), Admin gửi tay cho nhân viên qua kênh nội bộ (Zalo/Slack...). Nhân viên quên mật khẩu → báo Admin → Admin reset qua `PATCH /users/:id/reset-password`.

| Method | Path | Role | Mô tả |
|---|---|---|---|
| POST | `/auth/login` | Public | Đăng nhập, set cookie JWT |
| POST | `/auth/refresh` | Public (cần refresh token) | Cấp lại access token |
| POST | `/auth/logout` | A, M, S | Xóa cookie |
| GET | `/auth/me` | A, M, S | Lấy thông tin user hiện tại |
| PATCH | `/auth/change-password` | A, M, S | Tự đổi mật khẩu khi đã đăng nhập (bắt buộc ở lần đăng nhập đầu nếu đang dùng mật khẩu tạm) |

**Request/Response mẫu:**
```json
// POST /auth/login
// Request
{ "username": "staff01", "password": "..." }
// Response 200
{ "success": true, "data": { "id": "uuid", "username": "staff01", "role": "staff", "must_change_password": true } }
```

---

## 4. Users

| Method | Path | Role | Mô tả |
|---|---|---|---|
| GET | `/users` | A | Danh sách user (phân trang, filter theo role, is_active) |
| GET | `/users/:id` | A | Chi tiết user |
| POST | `/users` | A | Tạo user mới — generate mật khẩu tạm, **trả về trong response 1 lần duy nhất** |
| PATCH | `/users/:id` | A | Sửa thông tin / đổi role / active-deactive |
| PATCH | `/users/:id/reset-password` | A | Admin reset mật khẩu cho user quên mật khẩu — trả mật khẩu tạm mới trong response |
| DELETE | `/users/:id` | A | Soft delete user (set `deleted_at`) |

**Response mẫu — tạo user mới:**
```json
// POST /users → Response 201
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "staff02",
    "email": "staff02@company.com",
    "role": "staff",
    "temp_password": "Xk9#mQ2p"
  }
}
```
> `temp_password` chỉ trả về đúng 1 lần lúc tạo/reset — không có API nào khác trả lại mật khẩu (kể cả plain hay hash), vì hash 1 chiều với bcrypt là không đảo ngược được.

---

## 5. Roles

Dùng **role cứng** (3 loại: `admin`, `manager`, `staff`) — không cần quản lý role động, đơn giản và đủ dùng cho ứng dụng nội bộ.

| Method | Path | Role | Mô tả |
|---|---|---|---|
| GET | `/roles` | A | Danh sách role cố định (chỉ để hiển thị dropdown khi tạo/sửa user) |

---

## 6. Categories

| Method | Path | Role | Mô tả |
|---|---|---|---|
| GET | `/categories` | A, M, S | Danh sách (hỗ trợ trả dạng cây theo `parent_id`) |
| GET | `/categories/:id` | A, M, S | Chi tiết |
| POST | `/categories` | A | Tạo mới |
| PATCH | `/categories/:id` | A | Cập nhật |
| DELETE | `/categories/:id` | A | Xóa |

## 7. Units

| Method | Path | Role | Mô tả |
|---|---|---|---|
| GET | `/units` | A, M, S | Danh sách đơn vị tính |
| POST | `/units` | A | Tạo mới |
| PATCH | `/units/:id` | A | Cập nhật |
| DELETE | `/units/:id` | A | Xóa |

## 8. Suppliers

| Method | Path | Role | Mô tả |
|---|---|---|---|
| GET | `/suppliers` | A, M | Danh sách (search, phân trang) |
| GET | `/suppliers/:id` | A, M | Chi tiết |
| POST | `/suppliers` | A | Tạo mới |
| PATCH | `/suppliers/:id` | A | Cập nhật |
| DELETE | `/suppliers/:id` | A | Xóa (soft) |

## 9. Products

| Method | Path | Role | Mô tả |
|---|---|---|---|
| GET | `/products` | A, M, S | Danh sách (filter category/supplier, search tên/sku/barcode) |
| GET | `/products/:id` | A, M, S | Chi tiết (kèm images) |
| POST | `/products` | A, M | Tạo mới |
| PATCH | `/products/:id` | A, M | Cập nhật |
| DELETE | `/products/:id` | A | Soft delete |
| POST | `/products/:id/images` | A, M | Upload ảnh (Multer → S3) |
| PATCH | `/products/:id/images/:imageId/primary` | A, M | Đặt làm ảnh chính |
| DELETE | `/products/:id/images/:imageId` | A, M | Xóa ảnh |

## 10. Warehouses & Locations

| Method | Path | Role | Mô tả |
|---|---|---|---|
| GET | `/warehouses` | A, M, S | Danh sách kho |
| GET | `/warehouses/:id` | A, M, S | Chi tiết |
| POST | `/warehouses` | A | Tạo mới |
| PATCH | `/warehouses/:id` | A | Cập nhật (kể cả đổi manager) |
| DELETE | `/warehouses/:id` | A | Xóa |
| GET | `/warehouses/:id/locations` | A, M, S | Danh sách vị trí trong kho |
| POST | `/warehouses/:id/locations` | A, M | Tạo vị trí mới |
| PATCH | `/locations/:id` | A, M | Cập nhật vị trí |
| DELETE | `/locations/:id` | A, M | Xóa vị trí |

## 11. Inventory (tồn kho — chỉ đọc, ghi qua Stock Transactions)

| Method | Path | Role | Mô tả |
|---|---|---|---|
| GET | `/inventory` | A, M, S | Tồn kho hiện tại (filter warehouse/product/location) |
| GET | `/inventory/low-stock` | A, M | Sản phẩm dưới `low_stock_threshold` |
| GET | `/inventory/product/:productId` | A, M, S | Tồn kho 1 sản phẩm ở tất cả kho |

## 12. Stock Transactions (nghiệp vụ kho — core)

| Method | Path | Role | Mô tả |
|---|---|---|---|
| GET | `/stock-transactions` | A, M | Lịch sử giao dịch (filter type/warehouse/ngày) |
| GET | `/stock-transactions/:id` | A, M | Chi tiết (kèm items) |
| POST | `/stock-transactions/import` | A, M, S | Nhập kho |
| POST | `/stock-transactions/export` | A, M, S | Xuất kho |
| POST | `/stock-transactions/transfer` | A, M, S | Chuyển kho |
| POST | `/stock-transactions/adjustment` | A, M | Điều chỉnh tồn kho (kiểm kê) |

**Request mẫu — Nhập kho:**
```json
{
  "warehouse_id": "uuid",
  "supplier_id": "uuid",
  "reference_no": "PO-2026-001",
  "note": "Nhập hàng đợt tháng 9",
  "items": [
    { "product_id": "uuid", "location_id": "uuid", "quantity": 100 }
  ]
}
```

**Request mẫu — Chuyển kho:**
```json
{
  "warehouse_id": "uuid",
  "target_warehouse_id": "uuid",
  "reference_no": "TF-2026-005",
  "items": [
    { "product_id": "uuid", "quantity": 20 }
  ]
}
```

**Request mẫu — Điều chỉnh (kiểm kê):**
```json
{
  "warehouse_id": "uuid",
  "note": "Kiểm kê định kỳ tháng 9",
  "items": [
    { "product_id": "uuid", "location_id": "uuid", "counted_quantity": 48 }
  ]
}
```

## 13. Audit Logs

| Method | Path | Role | Mô tả |
|---|---|---|---|
| GET | `/audit-logs` | A, M | Lịch sử thao tác (filter entity_type/user/ngày) |
| GET | `/audit-logs/:id` | A, M | Chi tiết 1 log |

## 14. Import / Export Excel (ExcelJS)

| Method | Path | Role | Mô tả |
|---|---|---|---|
| GET | `/export/inventory` | A, M | Export tồn kho hiện tại ra Excel |
| GET | `/export/stock-transactions` | A, M | Export lịch sử giao dịch ra Excel |
| POST | `/import/products` | A, M | Import sản phẩm hàng loạt từ Excel |
| POST | `/import/stock-transactions/import` | A, M | Import phiếu nhập kho hàng loạt từ Excel |

## 15. Dashboard

| Method | Path | Role | Mô tả |
|---|---|---|---|
| GET | `/dashboard/stats` | A, M | Card số liệu tổng quan (xem response mẫu bên dưới) |
| GET | `/dashboard/stock-movement` | A, M | Dữ liệu biểu đồ nhập/xuất theo thời gian |
| GET | `/dashboard/inventory-by-warehouse` | A, M | Tổng tồn kho so sánh giữa các kho (bar chart) |
| GET | `/dashboard/inventory-by-category` | A, M | Tỷ trọng tồn kho theo danh mục (pie chart) |
| GET | `/dashboard/top-products` | A, M | Top sản phẩm xuất/nhập nhiều nhất trong kỳ |
| GET | `/dashboard/low-stock-alerts` | A, M | Danh sách sản phẩm sắp hết hàng (rút gọn cho widget, đầy đủ dùng `/inventory/low-stock`) |
| GET | `/dashboard/recent-transactions` | A, M | 5-10 giao dịch gần nhất |
| GET | `/dashboard/recent-activity` | A, M | 5-10 hoạt động gần nhất từ audit log (ai vừa làm gì) |

**Query params dùng chung cho các API biểu đồ:**
```
?warehouse_id=uuid (optional, mặc định tất cả kho)
?period=7d | 30d | 90d | month | year (mặc định 30d)
```

**Response mẫu — `/dashboard/stats`:**
```json
{
  "success": true,
  "data": {
    "total_products": 342,
    "total_active_warehouses": 4,
    "total_inventory_quantity": 18540,
    "total_inventory_cost_value": 452800000,
    "low_stock_count": 12,
    "transactions_today": 27,
    "transactions_this_month": 613
  }
}
```

**Response mẫu — `/dashboard/stock-movement?period=7d`:**
```json
{
  "success": true,
  "data": [
    { "date": "2026-09-03", "import_qty": 320, "export_qty": 280 },
    { "date": "2026-09-04", "import_qty": 150, "export_qty": 410 }
  ]
}
```

**Response mẫu — `/dashboard/top-products?period=30d&limit=5`:**
```json
{
  "success": true,
  "data": [
    { "product_id": "uuid", "name": "Coca-Cola 330ml", "sku": "CC-330", "total_exported": 1240 }
  ]
}
```

## 15b. AI Assistant (Chatbot hỏi đáp tồn kho)

| Method | Path | Role | Mô tả |
|---|---|---|---|
| POST | `/assistant/chat` | A, M, S | Gửi câu hỏi, nhận câu trả lời (body: `message`, `conversation_id?`) |
| GET | `/assistant/conversations` | A, M, S | Lịch sử hội thoại của chính user đang đăng nhập |
| GET | `/assistant/conversations/:id/messages` | A, M, S | Chi tiết tin nhắn trong 1 hội thoại |

**Kiến trúc:** dùng **LLM + Function Calling / Tool Use** (OpenAI hoặc Anthropic API), KHÔNG để LLM tự bịa số liệu tồn kho. Flow:

```
User hỏi "còn bao nhiêu Coca 330ml ở kho Q1?"
  → BE gửi message + danh sách "tools" (function) cho LLM
  → LLM chọn gọi tool getInventoryByProduct({ product_name: "Coca 330ml", warehouse: "Q1" })
  → BE thực thi tool đó = gọi lại chính service nội bộ (findProduct + InventoryService.getByWarehouse)
  → BE trả kết quả tool cho LLM
  → LLM tổng hợp thành câu trả lời tự nhiên → trả về FE
```

**Danh sách tool (function) gợi ý cho LLM** — map thẳng vào Service đã có sẵn, không viết logic mới:

| Tool name | Map tới |
|---|---|
| `search_product` | `ProductService.search(keyword)` |
| `get_inventory_by_product` | `InventoryService.getByProduct(productId)` |
| `get_low_stock_products` | `InventoryService.getLowStock()` |
| `get_warehouse_inventory` | `InventoryService.getByWarehouse(warehouseId)` |
| `get_recent_transactions` | `StockTransactionService.getRecent(filters)` |

> Tất cả tool đều **chỉ đọc (read-only)** — chatbot không được phép gọi tool nhập/xuất/chuyển kho, tránh AI tự ý sửa dữ liệu do hiểu sai ý người dùng.

**Về bảng DB:**
- Nếu **không cần lưu lịch sử chat** → không cần thêm bảng nào, FE tự giữ conversation trong session/state, mỗi request gửi kèm vài tin nhắn gần nhất làm context.
- Nếu **cần lưu lịch sử** (để xem lại, hoặc để AI nhớ ngữ cảnh giữa các lần đăng nhập) → cần thêm 2 bảng:
  - `chat_conversations` (id, user_id, title, created_at)
  - `chat_messages` (id, conversation_id, role ENUM('user','assistant'), content, created_at)

**Request/Response mẫu:**
```json
// POST /assistant/chat
// Request
{ "message": "Kho Quận 1 còn sản phẩm nào sắp hết hàng không?" }
// Response 200
{
  "success": true,
  "data": {
    "reply": "Kho Quận 1 hiện có 3 sản phẩm dưới ngưỡng cảnh báo: Coca 330ml (còn 8, ngưỡng 20), ...",
    "conversation_id": "uuid"
  }
}
```

## 16. System

| Method | Path | Role | Mô tả |
|---|---|---|---|
| GET | `/health` | Public | Health check cho Docker/CI, trả `{ status: "ok" }` |

---

## 17. Mã lỗi chuẩn (Error Codes)

| Code | HTTP Status | Ý nghĩa |
|---|---|---|
| `UNAUTHORIZED` | 401 | Chưa đăng nhập / token hết hạn |
| `FORBIDDEN` | 403 | Không đủ quyền |
| `NOT_FOUND` | 404 | Không tìm thấy resource |
| `VALIDATION_ERROR` | 400 | Dữ liệu gửi lên sai format (Zod) |
| `DUPLICATE_SKU` | 409 | SKU/barcode/email/username đã tồn tại |
| `OUT_OF_STOCK` | 400 | Không đủ tồn kho để xuất/chuyển |
| `INVALID_TRANSFER` | 400 | Chuyển kho mà `warehouse_id = target_warehouse_id` |
| `INTERNAL_ERROR` | 500 | Lỗi server không xác định |

---

## 18. Việc cần bổ sung vào Schema (DBML/SQL) trước khi code phần này

- Cột `users.must_change_password` (boolean, default `true`) — bắt user đổi mật khẩu ở lần đăng nhập đầu hoặc sau khi Admin reset
- (Tuỳ chọn) Bảng `chat_conversations` + `chat_messages` — chỉ cần nếu muốn lưu lịch sử chat AI Assistant, bỏ qua nếu làm stateless

~~Bảng `permissions`, `role_permissions`~~ — không cần, dùng role cứng.
~~Bảng `auth_tokens`, Nodemailer~~ — không cần, Admin reset mật khẩu trực tiếp thay vì gửi email.
