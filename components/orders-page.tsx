'use client';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Add, Search, FileDownload, Payments, Edit, Delete } from '@mui/icons-material';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { LocalizationProvider, DatePicker as MuiDatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { DateField, Heading, Modal, MoneyField, Page, Status } from './ui';
import { useApp } from './providers';
import { addOrder, addPayment, deleteOrder, getOrders, getOrdersByDateAndCustomer, getPayments, updateOrder } from '@/lib/data';
import {
  Order,
  Payment,
  money,
  parseMoneyInput,
  paymentMethods,
  productTypes,
  shortDate,
} from '@/lib/types';
import { isSupabaseConfigured } from '@/lib/supabase';
const today = () => new Date().toISOString().slice(0, 10);
export default function OrdersPage() {
  const { version, refresh, toast } = useApp();
  const [items, setItems] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('Tất cả trạng thái');
  const [day, setDay] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(false);
  const [paymentFor, setPaymentFor] = useState<Order | null>(null);
  const [editing, setEditing] = useState<Order | null>(null);
  const [paidOnCreate, setPaidOnCreate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [duplicateOrders, setDuplicateOrders] = useState<Order[] | null>(null);
  const [pendingOrder, setPendingOrder] = useState<(Omit<Order, 'id' | 'code' | 'total_due' | 'amount_paid' | 'status'> & { deposit: number }) | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    Promise.all([getOrders(), getPayments()])
      .then(([o, p]) => {
        setItems(o);
        setPayments(p);
      })
      .catch((e) => toast(e.message));
  }, [version]);
  const visible = useMemo(
    () =>
      items.filter(
        (o) =>
          (o.customer_name.toLowerCase().includes(query.toLowerCase()) ||
            (o.phone || '').includes(query)) &&
          (!day || o.order_date === day) &&
          (filter === 'Tất cả trạng thái' || o.status === filter),
      ),
    [items, query, filter, day],
  );
  const pageCount = Math.ceil(visible.length / 20);
  const paged = visible.slice((page - 1) * 20, page * 20);
  const exportCsv = () => {
    const rows = [
      [
        'Mã đơn hàng',
        'Ngày đặt',
        'Khách hàng',
        'SĐT',
        'Sản phẩm',
        'Giá trị đơn hàng',
        'Tổng phải thu',
        'Còn nợ',
        'Trạng thái',
      ],
      ...visible.map((o) => [
        o.code,
        o.order_date,
        o.customer_name,
        o.phone || '',
        o.product_type || '',
        o.price,
        o.total_due,
        o.total_due - o.amount_paid,
        o.status,
      ]),
    ];
    const blob = new Blob(
      [
        '\ufeff' +
          rows
            .map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(','))
            .join('\n'),
      ],
      { type: 'text/csv;charset=utf-8' },
    );
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'cfloral-don-hang.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const f = new FormData(e.currentTarget);
    try {
      const price = parseMoneyInput(f.get('price'));
      const shippingFee = parseMoneyInput(f.get('shipping_fee'));
      const paymentMethod = String(f.get('payment_method') || '') || null;
      const isPaidOnCreate = !editing && f.get('initial_payment_status') === 'paid';
      const totalDue = price + shippingFee;
      if (isPaidOnCreate && totalDue <= 0) {
        throw new Error('Giá trị đơn hàng phải lớn hơn 0 để ghi nhận đã thanh toán.');
      }
      if (isPaidOnCreate && !paymentMethod) {
        throw new Error('Vui lòng chọn hình thức thanh toán.');
      }
      const values = {
        order_date: String(f.get('order_date')),
        customer_name: String(f.get('customer_name')).trim(),
        phone: String(f.get('phone') || '') || null,
        product_type: String(f.get('product_type')) || null,
        price,
        shipping_fee: shippingFee,
        courier_cost: parseMoneyInput(f.get('courier_cost')),
        payment_method: paymentMethod,
        delivery_date: String(f.get('delivery_date') || '') || null,
        notes: String(f.get('notes') || '') || null,
        deposit: isPaidOnCreate ? totalDue : parseMoneyInput(f.get('deposit')),
      };
      if (editing) {
        const { deposit: _deposit, ...order } = values;
        await updateOrder(editing.id, { ...order, code: editing.code });
      } else {
        const duplicates = items.filter((order) =>
          order.order_date === values.order_date &&
          order.customer_name.trim().toLocaleLowerCase('vi') === values.customer_name.toLocaleLowerCase('vi'),
        );
        const existing = await getOrdersByDateAndCustomer(values.order_date, values.customer_name);
        const matched = [...new Map([...duplicates, ...existing].map((order) => [order.id, order])).values()];
        if (matched.length > 0) {
          setPendingOrder(values);
          setDuplicateOrders(matched);
          return;
        }
        await addOrder({ ...values, code: makeOrderCode(values.order_date, values.customer_name, []) });
      }
      setEditing(null);
      setModal(false);
      setPaidOnCreate(false);
      refresh();
      toast(editing ? 'Đã cập nhật đơn hàng' : 'Đã tạo đơn hàng');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Không thể lưu đơn hàng');
    } finally {
      setBusy(false);
    }
  }
  async function confirmDuplicateOrder() {
    if (!pendingOrder || !duplicateOrders) return;
    setBusy(true);
    try {
      const existing = await getOrdersByDateAndCustomer(pendingOrder.order_date, pendingOrder.customer_name);
      const all = [...new Map([...items, ...duplicateOrders, ...existing].map((order) => [order.id, order])).values()];
      await addOrder({ ...pendingOrder, code: makeOrderCode(pendingOrder.order_date, pendingOrder.customer_name, all) });
      setDuplicateOrders(null);
      setPendingOrder(null);
      setEditing(null);
      setModal(false);
      setPaidOnCreate(false);
      refresh();
      toast('Đã tạo đơn hàng');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Không thể lưu đơn hàng');
    } finally {
      setBusy(false);
    }
  }
  function cancelDuplicateOrder() {
    setDuplicateOrders(null);
    setPendingOrder(null);
    setEditing(null);
    setModal(false);
    setPaidOnCreate(false);
  }
  async function removeOrder(order: Order) {
    setDeleting(true);
    try {
      await deleteOrder(order.id);
      setDeleteTarget(null);
      refresh();
      toast('Đã xóa đơn hàng');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Không thể xóa đơn hàng');
    } finally {
      setDeleting(false);
    }
  }
  async function collect(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!paymentFor) return;
    setBusy(true);
    const f = new FormData(e.currentTarget);
    try {
      await addPayment({
        order_id: paymentFor.id,
        amount: parseMoneyInput(f.get('amount')),
        payment_method: String(f.get('payment_method')),
        paid_at: new Date().toISOString(),
        notes: String(f.get('notes') || ''),
      });
      setPaymentFor(null);
      refresh();
      toast('Đã ghi nhận khoản thu');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Không thể lưu khoản thu');
    } finally {
      setBusy(false);
    }
  }
  const paidParts = (orderId: string) => payments.filter((p) => p.order_id === orderId);
  return (
    <Page>
      <Heading
        eyebrow="Sổ doanh thu"
        title="Đơn hàng"
        subtitle="Theo dõi khách hàng, tiền cọc và các khoản thu của từng đơn."
        action={
          <button className="primary-button" onClick={() => { setEditing(null); setPaidOnCreate(false); setModal(true); }}>
            <Add fontSize="small" /> Tạo đơn hàng
          </button>
        }
      />
      {!isSupabaseConfigured && (
        <div className="notice">
          Đang dùng dữ liệu xem thử. Kết nối Supabase để tạo và lưu đơn hàng thật.
        </div>
      )}
      <div className="metric-grid" style={{ marginBottom: 18 }}>
        {day ? (
          <Mini label="Số đơn trong ngày" val={String(items.filter((o) => o.order_date === day).length)} />
        ) : (
          <Mini label="Tổng đơn đang theo dõi" val={String(items.length)} />
        )}
        <Mini label="Tổng phải thu" val={money(visible.reduce((a, o) => a + o.total_due, 0))} />
        <Mini label="Đã thực thu" val={money(visible.reduce((a, o) => a + o.amount_paid, 0))} />
        <Mini
          label="Còn phải thu"
          val={money(visible.reduce((a, o) => a + Math.max(0, o.total_due - o.amount_paid), 0))}
        />
      </div>
      <section className="panel">
        <div className="toolbar">
          <div style={{ display: 'flex', gap: 8, flex: 1, flexWrap: 'wrap' }}>
            <TextField
              label="Khách hàng/số điện thoại"
              variant="outlined"
              size="small"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              sx={{ minWidth: 260, '& .MuiInputBase-root': { height: 40 } }}
            />
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <MuiDatePicker
                label="Lọc theo ngày đặt"
                format="DD/MM/YYYY"
                value={day ? dayjs(day) : null}
                onChange={(date) => setDay(date?.isValid() ? date.format('YYYY-MM-DD') : '')}
                slotProps={{
                  field: { clearable: true },
                  textField: { size: 'small', sx: { width: 190, '& .MuiInputBase-root': { height: 40 } } },
                }}
              />
            </LocalizationProvider>
            <FormControl size="small" sx={{ minWidth: 210 }}>
              <InputLabel id="order-status-filter-label">Trạng thái</InputLabel>
              <Select
                labelId="order-status-filter-label"
                value={filter}
                label="Trạng thái"
                onChange={(event) => setFilter(event.target.value)}
              >
                <MenuItem value="Tất cả trạng thái">Tất cả trạng thái</MenuItem>
                <MenuItem value="Đã thanh toán đủ">Đã thanh toán đủ</MenuItem>
                <MenuItem value="Đã cọc (chờ thu còn lại)">Đã cọc (chờ thu còn lại)</MenuItem>
                <MenuItem value="Chưa thanh toán">Chưa thanh toán</MenuItem>
              </Select>
            </FormControl>
          </div>
          <button className="secondary-button" onClick={exportCsv}>
            <FileDownload fontSize="small" /> Xuất CSV
          </button>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 130 }}>Mã đơn hàng</th>
                <th>Khách hàng</th>
                <th>Ngày đặt</th>
                <th>Sản phẩm</th>
                <th>Giá trị đơn hàng</th>
                <th>Tổng phải thu</th>
                <th>Còn nợ</th>
                <th>Thanh toán</th>
                <th>Ghi chú</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((o) => (
                <tr key={o.id}>
                  <td style={{ maxWidth: 130 }}>
                    <code title={o.code} style={{ display: 'block', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {o.code}
                    </code>
                  </td>
                  <td>
                    <div className="customer-cell">
                      <span className="customer-avatar">{o.customer_name.slice(0, 1)}</span>
                      <span>
                        <b className="customer-name" title={o.customer_name}>{o.customer_name}</b>
                        <span
                          className="order-phone"
                          style={{ display: 'block', marginTop: 4 }}
                        >
                          {o.phone || 'Chưa có SĐT'}
                        </span>
                      </span>
                    </div>
                  </td>
                  <td>{shortDate(o.order_date)}</td>
                  <td>{o.product_type || '—'}</td>
                  <td>{money(o.price)}</td>
                  <td>
                    <b>{money(o.total_due)}</b>
                  </td>
                  <td style={{ color: o.total_due > o.amount_paid ? '#bd6657' : '#71817a' }}>
                    {money(Math.max(0, o.total_due - o.amount_paid))}
                  </td>
                  <td>
                    <Status status={o.status} />
                  </td>
                  <td><span className="order-note" title={o.notes || ''}>{o.notes || '—'}</span></td>
                  <td>
                    <div className="icon-actions">
                      {o.amount_paid < o.total_due && <button className="icon-action icon-action-pay" aria-label="Thu tiền" title="Thu tiền" onClick={() => setPaymentFor(o)}><Payments fontSize="small" /></button>}
                      <button className="icon-action icon-action-edit" aria-label="Sửa đơn hàng" title="Sửa đơn hàng" onClick={() => setEditing(o)}><Edit fontSize="small" /></button>
                      <button className="icon-action icon-action-delete" aria-label="Xóa đơn hàng" title="Xóa đơn hàng" onClick={() => setDeleteTarget(o)}><Delete fontSize="small" /></button>
                    </div>
                    {paidParts(o.id).length > 0 && (
                      <span
                        title={`${paidParts(o.id).length} lần thu`}
                        className="payment-parts-note"
                      >
                        {paidParts(o.id).length} lần thu
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pageCount > 1 && <div className="pagination">
            <button className="secondary-button" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Trước</button>
            <span>Trang {page} / {pageCount}</span>
            <button className="secondary-button" disabled={page === pageCount} onClick={() => setPage((p) => p + 1)}>Sau</button>
          </div>}
          {visible.length === 0 && (
            <div className="empty-state">Không tìm thấy đơn hàng phù hợp.</div>
          )}
        </div>
      </section>
      {(modal || editing) && (
        <Modal
          title={editing ? `Sửa đơn hàng · ${editing.customer_name}` : 'Tạo đơn hàng mới'}
          onClose={() => { setModal(false); setEditing(null); setPaidOnCreate(false); }}
          footer={
            <>
              <button className="secondary-button" onClick={() => { setModal(false); setEditing(null); setPaidOnCreate(false); }}>
                Hủy
              </button>
              <button className="primary-button" type="submit" form="order-form" disabled={busy}>
                {busy ? <><CircularProgress size={17} color="inherit" /> Đang lưu…</> : editing ? 'Cập nhật đơn hàng' : 'Lưu đơn hàng'}
              </button>
            </>
          }
        >
          <form id="order-form" onSubmit={submit}>
            <div className="form-grid">
              <DateField label="Ngày đặt hàng" name="order_date" defaultValue={editing?.order_date || today()} required key={`order-date-${editing?.id || 'new'}`} />
              <Field
                label="Tên khách hàng"
                name="customer_name"
                placeholder="VD: Nguyễn Văn A"
                required
                defaultValue={editing?.customer_name || 'Khách'}
                key={`order-customer-${editing?.id || 'new'}`}
              />
              <Field label="Số điện thoại" name="phone" placeholder="09xx xxx xxx" defaultValue={editing?.phone || ''} key={`order-phone-${editing?.id || 'new'}`} />
              <div className="field">
                <label>Loại sản phẩm</label>
                <select name="product_type" defaultValue={editing?.product_type || productTypes[0]} key={`order-type-${editing?.id || 'new'}`}>
                  {productTypes.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </div>
              <MoneyField label="Giá trị đơn hàng" name="price" required defaultValue={editing ? String(editing.price) : ''} key={`order-price-${editing?.id || 'new'}`} />
              <MoneyField label="Ship thu khách" name="shipping_fee" defaultValue={editing ? String(editing.shipping_fee) : '0'} key={`order-ship-${editing?.id || 'new'}`} />
              {!editing && (
                <div className="field">
                  <label htmlFor="initial-payment-status">Trạng thái thanh toán</label>
                  <select
                    id="initial-payment-status"
                    name="initial_payment_status"
                    value={paidOnCreate ? 'paid' : 'unpaid'}
                    onChange={(event) => setPaidOnCreate(event.target.value === 'paid')}
                  >
                    <option value="unpaid">Chưa thanh toán / có thể nhập tiền cọc</option>
                    <option value="paid">Đã thanh toán</option>
                  </select>
                </div>
              )}
              {!editing && !paidOnCreate && (
                <MoneyField label="Tiền đã cọc ban đầu" name="deposit" defaultValue="0" />
              )}
              <MoneyField label="Tiền trả shipper" name="courier_cost" defaultValue={editing ? String(editing.courier_cost) : '0'} key={`order-courier-${editing?.id || 'new'}`} />
              <div className="field">
                <label>Hình thức thanh toán</label>
                <select name="payment_method" required={!editing && paidOnCreate} defaultValue={editing?.payment_method || paymentMethods[1]} key={`order-method-${editing?.id || 'new'}`}>
                  {paymentMethods.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </div>
              <DateField label="Ngày giao hoa" name="delivery_date" defaultValue={editing?.delivery_date || ''} key={`order-delivery-${editing?.id || 'new'}`} />
              <Field
                label="Ghi chú đơn hàng"
                name="notes"
                placeholder="Mẫu hoa, giờ giao, lời chúc…"
                full
                defaultValue={editing?.notes || ''}
                key={`order-notes-${editing?.id || 'new'}`}
              />
            </div>
          </form>
        </Modal>
      )}
      {paymentFor && (
        <Modal
          title={`Ghi nhận thu tiền · ${paymentFor.customer_name}`}
          onClose={() => setPaymentFor(null)}
          footer={
            <>
              <button className="secondary-button" onClick={() => setPaymentFor(null)}>
                Đóng
              </button>
              <button className="primary-button" type="submit" form="payment-form" disabled={busy}>
                {busy ? <><CircularProgress size={17} color="inherit" /> Đang lưu…</> : 'Lưu khoản thu'}
              </button>
            </>
          }
        >
          <div className="notice">
            Còn phải thu: <b>{money(paymentFor.total_due - paymentFor.amount_paid)}</b>
          </div>
          <form id="payment-form" onSubmit={collect}>
            <div className="form-grid">
              <MoneyField label="Số tiền khách thanh toán" name="amount" required />
              <div className="field">
                <label>Hình thức thanh toán</label>
                <select name="payment_method">
                  {paymentMethods.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </div>
              <Field label="Ghi chú" name="notes" placeholder="Lần thu thêm…" full />
            </div>
          </form>
        </Modal>
      )}
      <Dialog open={duplicateOrders !== null} onClose={cancelDuplicateOrder} fullWidth maxWidth="sm">
        <DialogTitle>Đã có đơn hàng cùng khách trong ngày</DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ mb: 2 }}>
            Khách hàng này đã có đơn hàng. Bạn vẫn muốn tạo thêm đơn mới?
          </Typography>
          <Stack spacing={1.5}>
            {duplicateOrders?.map((order) => (
              <div key={order.id} className="panel" style={{ padding: 16 }}>
                <Typography><b>Khách hàng:</b> {order.customer_name}</Typography>
                <Typography><b>Ngày đặt:</b> {shortDate(order.order_date)}</Typography>
                <Typography><b>Giá tiền:</b> {money(order.total_due)}</Typography>
                <Typography><b>Ghi chú:</b> {order.notes?.trim() || 'Không có ghi chú'}</Typography>
              </div>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={cancelDuplicateOrder}
            sx={{ color: 'var(--green-dark)', borderRadius: '12px', fontWeight: 700, px: 2 }}
          >
            Hủy
          </Button>
          <Button
            onClick={confirmDuplicateOrder}
            variant="contained"
            disabled={busy}
            sx={{
              backgroundColor: 'var(--green)',
              borderRadius: '13px',
              boxShadow: '0 7px 16px rgba(39, 134, 108, 0.17)',
              fontWeight: 700,
              px: 2,
              '&:hover': { backgroundColor: 'var(--green-dark)' },
            }}
          >
            {busy ? <><CircularProgress size={17} color="inherit" /> Đang lưu…</> : 'Xác nhận tạo đơn'}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={deleteTarget !== null} onClose={() => !deleting && setDeleteTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle>Xác nhận xóa đơn hàng</DialogTitle>
        <DialogContent dividers>
          <Typography>
            Bạn có chắc chắn muốn xóa đơn hàng của <b>{deleteTarget?.customer_name}</b>? Lịch sử thu tiền của đơn này cũng sẽ bị xóa.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting} sx={{ color: 'var(--green-dark)', fontWeight: 700 }}>Hủy</Button>
          <Button onClick={() => deleteTarget && removeOrder(deleteTarget)} disabled={deleting} variant="contained" sx={{ backgroundColor: '#bd6657', '&:hover': { backgroundColor: '#a95245' }, borderRadius: '12px', fontWeight: 700 }}>
            {deleting ? <CircularProgress size={18} color="inherit" /> : 'Xóa đơn hàng'}
          </Button>
        </DialogActions>
      </Dialog>
    </Page>
  );
}
function makeOrderCode(orderDate: string, customerName: string, existing: Order[]) {
  const [year, month, day] = orderDate.split('-');
  const normalizedName = customerName.trim().replace(/\s+/g, '_');
  const base = `${day}_${month}_${normalizedName}`;
  const codes = new Set(existing.map((order) => order.code));
  if (!codes.has(base)) return base;
  let suffix = 1;
  while (codes.has(`${base}_${suffix}`)) suffix += 1;
  return `${base}_${suffix}`;
}
function Field(p: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string;
  min?: string | number;
  max?: number;
  required?: boolean;
  full?: boolean;
}) {
  return (
    <div className={`field ${p.full ? 'full' : ''}`}>
      <label>{p.label}</label>
      <input
        name={p.name}
        type={p.type || 'text'}
        placeholder={p.placeholder}
        defaultValue={p.defaultValue}
        min={p.min}
        max={p.max}
        required={p.required}
      />
    </div>
  );
}
function Mini({ label, val }: { label: string; val: string }) {
  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div className="metric-value" style={{ marginTop: 13 }}>
        {val}
      </div>
    </div>
  );
}
