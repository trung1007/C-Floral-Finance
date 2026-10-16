import { supabase } from './supabase';
import type { Expense, Order, Payment, Shift, Staff } from './types';
import { paymentStatus } from './types';
const DEMO_ORDERS: Order[] = [
  {
    id: 'demo-1',
    order_date: '2026-10-12',
    customer_name: 'Minh Anh',
    phone: '0988 123 456',
    product_type: 'Bó',
    price: 1250000,
    shipping_fee: 30000,
    total_due: 1280000,
    amount_paid: 1280000,
    courier_cost: 25000,
    payment_method: 'Chuyển khoản',
    delivery_date: '2026-10-12',
    notes: 'Bó hồng pastel, giao 15h',
    status: 'Đã thanh toán đủ',
  },
  {
    id: 'demo-2',
    order_date: '2026-10-12',
    customer_name: 'Thu Hà',
    phone: '0912 456 789',
    product_type: 'Giỏ',
    price: 1850000,
    shipping_fee: 35000,
    total_due: 1885000,
    amount_paid: 1000000,
    courier_cost: 30000,
    payment_method: 'Tiền mặt',
    delivery_date: '2026-10-12',
    notes: 'Tặng sinh nhật',
    status: 'Đã cọc (chờ thu còn lại)',
  },
  {
    id: 'demo-3',
    order_date: '2026-10-11',
    customer_name: 'Quỳnh Chi',
    phone: '0904 555 222',
    product_type: 'Lẵng',
    price: 2300000,
    shipping_fee: 40000,
    total_due: 2340000,
    amount_paid: 2340000,
    courier_cost: 35000,
    payment_method: 'Chuyển khoản',
    delivery_date: '2026-10-11',
    notes: '',
    status: 'Đã thanh toán đủ',
  },
  {
    id: 'demo-4',
    order_date: '2026-10-11',
    customer_name: 'Hoàng Nam',
    phone: '0977 555 111',
    product_type: 'Bó',
    price: 780000,
    shipping_fee: 30000,
    total_due: 810000,
    amount_paid: 0,
    courier_cost: 25000,
    payment_method: null,
    delivery_date: '2026-10-13',
    notes: 'Gọi trước khi giao',
    status: 'Chưa thanh toán',
  },
  {
    id: 'demo-5',
    order_date: '2026-10-10',
    customer_name: 'Lan Phương',
    phone: '0968 110 220',
    product_type: 'Bình',
    price: 1560000,
    shipping_fee: 0,
    total_due: 1560000,
    amount_paid: 1560000,
    courier_cost: 0,
    payment_method: 'Chuyển khoản',
    delivery_date: '2026-10-10',
    notes: '',
    status: 'Đã thanh toán đủ',
  },
];
const DEMO_EXPENSES: Expense[] = [
  {
    id: 'ex1',
    expense_date: '2026-10-12',
    kind: 'flower',
    description: 'Hoa hồng Đà Lạt',
    category: 'Tiền hoa tươi',
    amount: 850000,
    payment_method: 'Chuyển khoản',
    payee: 'Vườn hoa Đà Lạt',
    notes: 'Hàng loại 1',
  },
  {
    id: 'ex2',
    expense_date: '2026-10-12',
    kind: 'flower',
    description: 'Baby trắng, cẩm chướng',
    category: 'Tiền hoa tươi',
    amount: 420000,
    payment_method: 'Tiền mặt',
    payee: 'Chợ hoa Quảng Bá',
    notes: '',
  },
  {
    id: 'ex3',
    expense_date: '2026-10-11',
    kind: 'other',
    description: 'Giấy gói Hàn Quốc',
    category: 'Tiền giấy gói/ruy băng',
    amount: 380000,
    payment_method: 'Chuyển khoản',
    payee: 'Đại lý bao bì Hà Nội',
    notes: '',
  },
  {
    id: 'ex4',
    expense_date: '2026-10-10',
    kind: 'other',
    description: 'Phí giao hàng',
    category: 'Chi phí vận chuyển (Ship)',
    amount: 125000,
    payment_method: 'Tiền mặt',
    payee: 'Shipper',
    notes: '',
  },
  {
    id: 'ex5',
    expense_date: '2026-10-09',
    kind: 'flower',
    description: 'Tulip và lá phụ',
    category: 'Tiền hoa tươi',
    amount: 970000,
    payment_method: 'Chuyển khoản',
    payee: 'Vườn hoa Đà Lạt',
    notes: '',
  },
];
const DEMO_STAFF: Staff[] = [
  { id: 's1', name: 'Ngọc Mai', phone: '0981 111 222', active: true },
  { id: 's2', name: 'Bảo Trân', phone: '0982 333 444', active: true },
  { id: 's3', name: 'Minh Thư', phone: null, active: true },
];
const DEMO_SHIFTS: Shift[] = [
  {
    id: 'sh1',
    work_date: '2026-10-12',
    staff_id: 's1',
    hours: 8,
    shift_name: 'Ca ngày',
    notes: null,
  },
  {
    id: 'sh2',
    work_date: '2026-10-12',
    staff_id: 's2',
    hours: 5,
    shift_name: 'Ca chiều',
    notes: null,
  },
  {
    id: 'sh3',
    work_date: '2026-10-11',
    staff_id: 's3',
    hours: 6,
    shift_name: 'Ca ngày',
    notes: null,
  },
];
export async function getOrders(): Promise<Order[]> {
  if (!supabase)
    throw Error(
      'Supabase chưa được cấu hình. Kiểm tra NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY trong .env.',
    );
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .neq('status', 'Đã hủy')
    .order('order_date', { ascending: false })
    .limit(300);
  if (error) throw error;
  return data || [];
}
export async function getExpenses(): Promise<Expense[]> {
  if (!supabase)
    throw Error(
      'Supabase chưa được cấu hình. Kiểm tra NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY trong .env.',
    );
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('expense_date', { ascending: false })
    .limit(300);
  if (error) throw error;
  return data || [];
}
export async function getStaff(): Promise<Staff[]> {
  if (!supabase)
    throw Error(
      'Supabase chưa được cấu hình. Kiểm tra NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY trong .env.',
    );
  const { data, error } = await supabase.from('staff').select('*').order('name');
  if (error) throw error;
  return data || [];
}
export async function getShifts(): Promise<Shift[]> {
  if (!supabase)
    throw Error(
      'Supabase chưa được cấu hình. Kiểm tra NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY trong .env.',
    );
  const { data, error } = await supabase
    .from('work_shifts')
    .select('*')
    .order('work_date', { ascending: false })
    .limit(300);
  if (error) throw error;
  return data || [];
}
export async function getPayments(): Promise<Payment[]> {
  if (!supabase)
    throw Error(
      'Supabase chưa được cấu hình. Kiểm tra NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY trong .env.',
    );
  const { data, error } = await supabase
    .from('order_payments')
    .select('*')
    .order('paid_at', { ascending: false });
  if (error) throw error;
  return data || [];
}
export async function addOrder(
  input: Omit<Order, 'id' | 'total_due' | 'amount_paid' | 'status'> & { deposit: number },
) {
  if (!supabase)
    throw Error('Đang ở chế độ xem thử. Hãy kết nối Supabase trong .env.local để lưu dữ liệu.');
  const total_due = input.price + input.shipping_fee;
  const { deposit, ...rest } = input;
  const { data, error } = await supabase
    .from('orders')
    .insert({
      ...rest,
      amount_paid: deposit,
      status:
        deposit === 0
          ? 'Chưa thanh toán'
          : deposit >= total_due
            ? 'Đã thanh toán đủ'
            : 'Đã cọc (chờ thu còn lại)',
    })
    .select()
    .single();
  if (error) throw error;
  if (deposit > 0) {
    const result = await supabase.from('order_payments').insert({
      order_id: data.id,
      amount: deposit,
      paid_at: new Date().toISOString(),
      payment_method: input.payment_method,
      notes: deposit >= total_due ? 'Thanh toán đủ khi tạo đơn' : 'Tiền cọc ban đầu',
    });
    if (result.error) throw result.error;
  }
  return data;
}
export async function addExpense(input: Omit<Expense, 'id'>) {
  if (!supabase)
    throw Error('Đang ở chế độ xem thử. Hãy kết nối Supabase trong .env.local để lưu dữ liệu.');
  const { data, error } = await supabase.from('expenses').insert(input).select().single();
  if (error) throw error;
  return data;
}
export async function updateExpense(id: string, input: Omit<Expense, 'id'>) {
  if (!supabase) throw Error('Đang ở chế độ xem thử. Hãy kết nối Supabase trong .env.local để lưu dữ liệu.');
  const { data, error } = await supabase.from('expenses').update(input).eq('id', id).select().single();
  if (error) throw error;
  return data;
}
export async function deleteExpense(id: string) {
  if (!supabase) throw Error('Đang ở chế độ xem thử. Hãy kết nối Supabase trong .env.local để lưu dữ liệu.');
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) throw error;
}
export async function updateOrder(id: string, input: Omit<Order, 'id' | 'total_due' | 'amount_paid' | 'status'>) {
  if (!supabase) throw Error('Đang ở chế độ xem thử. Hãy kết nối Supabase trong .env.local để lưu dữ liệu.');
  const { data: current, error: readError } = await supabase.from('orders').select('amount_paid').eq('id', id).single();
  if (readError) throw readError;
  const totalDue = input.price + input.shipping_fee;
  const { data, error } = await supabase.from('orders').update({
    ...input,
    // total_due is a generated database column and must never be included in writes.
    status: paymentStatus(totalDue, current.amount_paid),
  }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}
export async function deleteOrder(id: string) {
  if (!supabase) throw Error('Đang ở chế độ xem thử. Hãy kết nối Supabase trong .env.local để lưu dữ liệu.');
  // Remove child payments first so this works even when the database has no cascade rule.
  const { error: paymentError } = await supabase.from('order_payments').delete().eq('order_id', id);
  if (paymentError) throw paymentError;
  const { error } = await supabase.from('orders').delete().eq('id', id);
  if (error) throw error;
}
export async function addPayment(input: {
  order_id: string;
  amount: number;
  payment_method: string;
  paid_at: string;
  notes: string;
}) {
  if (!supabase)
    throw Error('Đang ở chế độ xem thử. Hãy kết nối Supabase trong .env.local để lưu dữ liệu.');
  const { data, error } = await supabase.from('order_payments').insert(input).select().single();
  if (error) throw error;
  const { error: updateError } = await supabase.rpc('refresh_order_payment_totals', {
    target_order_id: input.order_id,
  });
  if (updateError) throw updateError;
  return data;
}
export async function addStaff(input: { name: string; phone: string | null }) {
  if (!supabase)
    throw Error('Đang ở chế độ xem thử. Hãy kết nối Supabase trong .env.local để lưu dữ liệu.');
  const { data, error } = await supabase.from('staff').insert(input).select().single();
  if (error) throw error;
  return data;
}
export async function updateStaff(id: string, input: { name: string; phone: string | null }) {
  if (!supabase)
    throw Error('Đang ở chế độ xem thử. Hãy kết nối Supabase trong .env.local để lưu dữ liệu.');
  const { data, error } = await supabase.from('staff').update(input).eq('id', id).select().single();
  if (error) throw error;
  return data;
}
export async function deleteStaff(id: string) {
  if (!supabase)
    throw Error('Đang ở chế độ xem thử. Hãy kết nối Supabase trong .env.local để lưu dữ liệu.');
  const { error } = await supabase.from('staff').delete().eq('id', id);
  if (error?.code === '23503') {
    throw Error('Không thể xóa nhân sự đã có ca làm. Hãy giữ lại thông tin này để bảo toàn lịch sử chấm công.');
  }
  if (error) throw error;
}
export async function addShift(input: {
  work_date: string;
  staff_id: string;
  hours: number;
  shift_name: string | null;
  notes: string;
}) {
  if (!supabase)
    throw Error('Đang ở chế độ xem thử. Hãy kết nối Supabase trong .env.local để lưu dữ liệu.');
  const { data, error } = await supabase.from('work_shifts').insert(input).select().single();
  if (error) throw error;
  return data;
}
export async function updateShift(id: string, input: Omit<Shift, 'id'>) {
  if (!supabase)
    throw Error('Đang ở chế độ xem thử. Hãy kết nối Supabase trong .env.local để lưu dữ liệu.');
  const { data, error } = await supabase
    .from('work_shifts')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
export async function deleteShift(id: string) {
  if (!supabase)
    throw Error('Đang ở chế độ xem thử. Hãy kết nối Supabase trong .env.local để lưu dữ liệu.');
  const { error } = await supabase.from('work_shifts').delete().eq('id', id);
  if (error) throw error;
}
