
# C'Floral — Quản lý thu chi cửa hàng hoa

Ứng dụng hỗ trợ quản lý hoạt động tài chính
và vận hành hằng ngày của cửa hàng hoa C'Floral.

Hệ thống tập trung vào:
- Quản lý đơn hàng
- Theo dõi tiền khách thanh toán
- Quản lý tiền mua hoa
- Theo dõi chi phí khác
- Quản lý nhân sự và ca làm
- Tổng hợp tình hình thu chi

## 1. Mục tiêu

Cửa hàng hoa có nhiều giao dịch phát sinh mỗi ngày.

Ví dụ:
- Mua hoa tươi từ nhà cung cấp
- Nhận đơn đặt hoa
- Nhận tiền cọc
- Thu tiền còn lại
- Thanh toán vận chuyển
- Mua dụng cụ và vật tư
- Theo dõi nhân sự

C'Floral giúp tập trung dữ liệu,
giảm thao tác tính toán thủ công
và hỗ trợ kiểm soát dòng tiền.

## 2. Đối tượng sử dụng

Phiên bản hiện tại phục vụ một người quản lý.

Chưa hỗ trợ:
- Đăng nhập
- Phân quyền
- Nhiều cửa hàng
- Nhiều tài khoản độc lập

Hệ thống có thể được mở rộng trong tương lai.

## 3. Quy trình nghiệp vụ

### 3.1. Quản lý đơn hàng

Mỗi đơn hàng có thể ghi nhận:
- Khách hàng
- Ngày đặt hàng
- Giá trị đơn hàng
- Phí giao hàng thu khách
- Tiền cọc
- Các lần thanh toán
- Trạng thái thanh toán

Tổng phải thu:

Tổng phải thu =
Giá trị đơn hàng + Phí ship thu khách

Ví dụ:

Giá trị đơn hàng: 500.000 VND
Ship thu khách: 30.000 VND

Tổng phải thu: 530.000 VND

Khách cọc 200.000 VND.

Số tiền còn phải thu: 330.000 VND.

Khi khách thanh toán thêm,
hệ thống cập nhật số đã thu và công nợ.

### 3.2. Quản lý các lần thanh toán

Một đơn hàng có thể có nhiều lần thu tiền.

Ví dụ:
- Lần 1: Cọc 200.000 VND
- Lần 2: Thu 200.000 VND
- Lần 3: Thu 130.000 VND

Tổng đã thu: 530.000 VND.

Dữ liệu chi tiết được lưu tại order_payments.

Database trigger cập nhật:
- orders.amount_paid
- Trạng thái thanh toán

Không nên chỉnh sửa trực tiếp các trường
tổng hợp nếu chúng được database quản lý.

### 3.3. Quản lý tiền mua hoa

Đây là nhóm chi phí quan trọng nhất.

Ví dụ:
- Hoa hồng
- Hoa tulip
- Hoa cẩm tú cầu
- Hoa baby
- Các loại hoa khác

Mục tiêu:
- Theo dõi số tiền mua hoa mỗi ngày
- Kiểm soát chi phí nguyên liệu
- Phân biệt chi phí hoa và chi phí khác

### 3.4. Quản lý chi phí khác

Ví dụ:
- Giấy gói hoa
- Ruy băng
- Xốp cắm hoa
- Dụng cụ
- Vận chuyển
- Các chi phí vận hành khác

Chi phí khác được quản lý riêng
với tiền mua hoa.

### 3.5. Quản lý chi phí vận chuyển

Phân biệt:

1. Phí ship thu khách
2. Chi phí thực trả shipper

Hai khoản này không giống nhau.

Phí ship thu khách được cộng vào
tổng tiền đơn hàng.

courier_cost là trường thông tin
về chi phí vận chuyển.

courier_cost không tự động được cộng
vào tổng chi phí dashboard.

Nếu chi phí shipper đã được ghi nhận
trong danh sách chi phí khác,
không được tính thêm lần nữa.

### 3.6. Quản lý nhân sự

Theo dõi:
- Danh sách nhân viên
- Ca làm việc
- Giờ bắt đầu
- Giờ kết thúc
- Thời lượng làm việc

Dữ liệu phục vụ quản lý vận hành
và có thể mở rộng sang tính lương.

## 4. Dashboard tài chính

Dashboard cung cấp:
- Tổng thực thu
- Chi phí mua hoa
- Chi phí khác
- Công nợ khách hàng
- Chênh lệch thu chi
- Biểu đồ 7 ngày
- Đơn hàng gần đây
- Khoản chi gần đây

### Công thức

Chênh lệch thu chi =
Tổng thực thu
- Tiền mua hoa
- Chi phí khác

Ví dụ:

Tổng thực thu: 5.000.000 VND
Tiền mua hoa: 2.000.000 VND
Chi phí khác: 500.000 VND

Chênh lệch: 2.500.000 VND

Lưu ý:

Đây là chênh lệch thu chi theo các
khoản được hệ thống ghi nhận.

Không mặc định coi đây là lợi nhuận
kế toán đầy đủ.

## 5. Các chức năng chính

### Tổng quan
- Thống kê tài chính
- Biểu đồ 7 ngày
- Công nợ
- Giao dịch gần đây

### Đơn hàng
- Tạo và quản lý đơn
- Theo dõi thanh toán
- Tìm kiếm và lọc
- Xuất CSV

### Thu chi
- Tiền mua hoa
- Chi phí khác
- Nhà cung cấp
- Phương thức thanh toán
- Xuất CSV

### Nhân sự
- Danh sách nhân viên
- Ca làm
- Giờ làm

## 6. Công nghệ

- Next.js App Router
- React
- TypeScript
- Material UI
- Tailwind CSS v4
- Supabase

CSS và biến màu dùng chung
được quản lý tại app/global.css.

## 7. Cấu trúc project

app/
  Next.js routes và global.css

components/
  Components và giao diện nghiệp vụ

lib/data.ts
  Data access và dữ liệu demo

lib/supabase.ts
  Supabase client

supabase/schema.sql
  Database schema, triggers và RLS

.env.example
  Mẫu cấu hình môi trường

AGENTS.md
  Hướng dẫn Codex

.agents/
  Hướng dẫn các vai trò AI agent

## 8. Chạy local

Yêu cầu:
Node.js 20.9+

Cài dependencies:

    npm install

Chạy development server:

    npm run dev

Truy cập:

http://localhost:3000

## 9. Kết nối Supabase

### Bước 1
Tạo project tại:

https://supabase.com/dashboard

### Bước 2
Mở SQL Editor.

Chạy nội dung file:

supabase/schema.sql

Chỉ chạy trên database phù hợp và
kiểm tra script trước khi thực thi.

### Bước 3
Lấy Project URL và publishable/anon key
trong cấu hình Supabase.

### Bước 4
Tạo file .env.local từ .env.example.

Cấu hình:

NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY

Không sử dụng service_role hoặc secret key
trong frontend.

### Bước 5
Khởi động lại development server.

## 10. Chế độ dữ liệu demo

Khi chưa kết nối Supabase,
website hiển thị dữ liệu minh họa.

Chế độ này phục vụ xem giao diện.

Các thao tác ghi dữ liệu thực tế
yêu cầu kết nối database.

## 11. Bảo mật

Phiên bản hiện tại không có đăng nhập.

Theo thiết kế hiện tại,
RLS policy cho phép CRUD qua anon key.

Điều này có nghĩa dữ liệu không riêng tư.

Nếu website được public trên Internet,
người khác có thể truy cập hoặc thay đổi dữ liệu.

Không nên sử dụng dữ liệu kinh doanh thật
trên deployment public với chính sách này.

Trước khi triển khai công khai cần xem xét:
- Authentication
- Restrictive RLS policies
- Backup và recovery
- Audit logging

Không lưu secret key trong frontend.

## 12. Hướng phát triển

Các cải tiến có thể xem xét:
- Multi-user
- Role-based access control
- Multi-store
- Inventory management
- Payroll
- Advanced reporting
- Backup và restore

Đây là định hướng tương lai,
không phải chức năng đã triển khai.

## 13. Quy trình phát triển với Codex

Các hướng dẫn AI nằm trong:

AGENTS.md

Vai trò:
- Architecture
- Coder
- Reviewer
- Tester

Workflow khuyến nghị:

Analyze -> Plan -> Implement -> Test -> Review

Ưu tiên:
- Thay đổi nhỏ
- Đúng nghiệp vụ
- Không mất dữ liệu
- Có kiểm thử
- Có báo cáo kết quả
