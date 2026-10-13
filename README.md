# C’Floral · Quản lý thu chi

Ứng dụng quản lý đơn hàng, khoản thu, tiền mua hoa, chi phí khác và chấm công. Dựng bằng Next.js App Router, TypeScript, Material UI và Tailwind CSS v4. Toàn bộ biến màu và CSS dùng chung nằm trong `app/global.css`.

## Chạy thử trên máy

Yêu cầu Node.js 20.9+.

```bash
npm install
npm run dev
```

Mở http://localhost:3000. Khi chưa kết nối Supabase, website hiển thị dữ liệu minh họa. Chế độ này để xem giao diện; biểu mẫu ghi dữ liệu sẽ báo cần kết nối.

## Kết nối Supabase

1. Tạo project tại https://supabase.com/dashboard.
2. Trong Supabase, mở **SQL Editor → New query**, mở file `supabase/schema.sql`, dán toàn bộ nội dung và bấm **Run**. Script tạo các bảng khách hàng, đơn hàng, các lần thu tiền, chi phí, nhân sự và ca làm.
3. Vào **Project Settings → API**. Sao chép **Project URL** và **anon/public key** (có thể hiển thị nhãn `Publishable key`). Không dùng `service_role` hoặc `secret key` trong trình duyệt.
4. Trong thư mục project, tạo file `.env.local` bằng cách copy `.env.example`.
5. Thay giá trị trong `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
```

6. Dừng và chạy lại `npm run dev`. Banner chế độ xem thử biến mất khi kết nối được nhận diện. Thử tạo một khoản chi và tải lại trang để kiểm tra ghi/đọc.

> App không có đăng nhập/phân quyền theo yêu cầu. SQL cho phép truy cập CRUD qua anon key, nên ai có URL website đều có thể xem và sửa dữ liệu. `anon/publishable key` vốn được thiết kế để dùng phía trình duyệt; RLS policy rộng trong schema khiến dữ liệu không riêng tư. Nếu website được public trên Internet, bất kỳ ai biết URL có thể thay đổi sổ. Hãy triển khai trong môi trường riêng hoặc thêm xác thực và policy chặt trước khi lưu dữ liệu kinh doanh thật. Không nhúng `service_role` key vào frontend.

## Chức năng

- Tổng quan: thực thu, chi hôm nay, tiền khách còn nợ, tổng chênh lệch thu–chi, biểu đồ 7 ngày và đơn/khoản chi mới nhất.
- Đơn hàng: giá hoa, ship thu khách, tiền cọc, giao hàng, trạng thái tự tính, ghi nhận các lần thu thêm, tìm kiếm, lọc và xuất CSV.
- Thu chi: tách tiền mua hoa khỏi chi phí khác, nhà cung cấp, phương thức thanh toán, lọc và xuất CSV.
- Nhân sự: quản lý danh sách, ca và giờ làm.
- Responsive cho điện thoại; sidebar desktop/mobile.

## Quy tắc dữ liệu

`Tổng phải thu = Giá hoa + Ship thu khách`. Các khoản thanh toán chi tiết nằm trong `order_payments`; trigger database cộng các lần thu và cập nhật `orders.amount_paid` cùng trạng thái. Chênh lệch trên dashboard là `Tổng thực thu − tiền mua hoa − chi phí khác`. `courier_cost` được lưu như trường thông tin riêng của đơn, không tự cộng thêm vào tổng chi, tránh tính shipper hai lần nếu khoản đó cũng được nhập trong chi phí.

## Cấu trúc quan trọng

- `app/`: trang App Router và `global.css`
- `components/`: dashboard và giao diện nghiệp vụ
- `lib/data.ts`: truy vấn Supabase và dữ liệu xem thử
- `lib/supabase.ts`: client Supabase
- `supabase/schema.sql`: schema, trigger và chính sách RLS
- `.env.example`: mẫu vị trí điền project URL và key
