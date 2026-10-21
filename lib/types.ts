export type Order = {
  id: string;
  code: string;
  order_date: string;
  customer_name: string;
  phone: string | null;
  product_type: string | null;
  price: number;
  shipping_fee: number;
  total_due: number;
  amount_paid: number;
  courier_cost: number;
  payment_method: string | null;
  delivery_date: string | null;
  notes: string | null;
  status: string;
  created_at?: string;
};
export type Expense = {
  id: string;
  expense_date: string;
  kind: 'flower' | 'other';
  description: string;
  category: string | null;
  amount: number;
  payment_method: string | null;
  payee: string | null;
  notes: string | null;
  created_at?: string;
};
export type Staff = { id: string; name: string; phone: string | null; active: boolean };
export type Shift = {
  id: string;
  work_date: string;
  staff_id: string;
  hours: number;
  shift_name: string | null;
  notes: string | null;
};
export type Payment = {
  id: string;
  order_id: string;
  amount: number;
  paid_at: string;
  payment_method: string | null;
  notes: string | null;
};
export const paymentMethods = ['Tiền mặt', 'Chuyển khoản', 'Khác'];
export const expenseCategories = [
  'Tiền giấy gói/ruy băng',
  'Tiền xốp cắm hoa',
  'Tiền giỏ/hộp hoa',
  'Tiền lẵng/kệ hoa',
  'Phụ kiện/thiệp/keo',
  'Chi phí vận chuyển (Ship)',
  'Mặt bằng/Điện nước',
  'Chi phí khác',
];
export const productTypes = ['Bó', 'Giỏ', 'Lẵng', 'Kệ', 'Bình', 'Khác'];
export function paymentStatus(due: number, paid: number) {
  if (paid <= 0) return 'Chưa thanh toán';
  return paid >= due ? 'Đã thanh toán đủ' : 'Đã cọc (chờ thu còn lại)';
}
export function money(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function parseMoneyInput(value: FormDataEntryValue | null) {
  const digits = String(value ?? '').replace(/\D/g, '');
  return digits ? Number(digits) : 0;
}

export function formatMoneyInput(value: string) {
  const digits = value.replace(/\D/g, '');
  return digits ? Number(digits).toLocaleString('vi-VN') : '';
}
export function shortDate(date: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`));
}
