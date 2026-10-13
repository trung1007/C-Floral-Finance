'use client';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Add, Search, FileDownload, Payments } from '@mui/icons-material';
import { Heading, Modal, MoneyField, Page, Status } from './ui';
import { useApp } from './providers';
import { addOrder, addPayment, getOrders, getPayments } from '@/lib/data';
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
  const [modal, setModal] = useState(false);
  const [paymentFor, setPaymentFor] = useState<Order | null>(null);
  const [busy, setBusy] = useState(false);
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
          (filter === 'Tất cả trạng thái' || o.status === filter),
      ),
    [items, query, filter],
  );
  const exportCsv = () => {
    const rows = [
      [
        'Ngày đặt',
        'Khách hàng',
        'SĐT',
        'Sản phẩm',
        'Giá hoa',
        'Ship thu khách',
        'Tổng phải thu',
        'Đã thu',
        'Còn nợ',
        'Trạng thái',
      ],
      ...visible.map((o) => [
        o.order_date,
        o.customer_name,
        o.phone || '',
        o.product_type || '',
        o.flower_price,
        o.shipping_fee,
        o.total_due,
        o.amount_paid,
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
      await addOrder({
        order_date: String(f.get('order_date')),
        customer_name: String(f.get('customer_name')).trim(),
        phone: String(f.get('phone') || '') || null,
        product_type: String(f.get('product_type')) || null,
        flower_price: parseMoneyInput(f.get('flower_price')),
        shipping_fee: parseMoneyInput(f.get('shipping_fee')),
        courier_cost: parseMoneyInput(f.get('courier_cost')),
        payment_method: String(f.get('payment_method')) || null,
        delivery_date: String(f.get('delivery_date') || '') || null,
        notes: String(f.get('notes') || '') || null,
        deposit: parseMoneyInput(f.get('deposit')),
      });
      setModal(false);
      refresh();
      toast('Đã tạo đơn hàng');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Không thể lưu đơn hàng');
    } finally {
      setBusy(false);
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
          <button className="primary-button" onClick={() => setModal(true)}>
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
        <Mini label="Tổng đơn đang theo dõi" val={String(items.length)} />
        <Mini label="Tổng phải thu" val={money(items.reduce((a, o) => a + o.total_due, 0))} />
        <Mini label="Đã thực thu" val={money(items.reduce((a, o) => a + o.amount_paid, 0))} />
        <Mini
          label="Còn phải thu"
          val={money(items.reduce((a, o) => a + Math.max(0, o.total_due - o.amount_paid), 0))}
        />
      </div>
      <section className="panel">
        <div className="toolbar">
          <div style={{ display: 'flex', gap: 8, flex: 1, flexWrap: 'wrap' }}>
            <label className="search-box">
              <Search fontSize="small" color="disabled" />
              <input
                placeholder="Tìm theo tên khách hoặc số điện thoại"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <select
              className="filter-select"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option>Tất cả trạng thái</option>
              <option>Đã thanh toán đủ</option>
              <option>Đã cọc (chờ thu còn lại)</option>
              <option>Chưa thanh toán</option>
            </select>
          </div>
          <button className="secondary-button" onClick={exportCsv}>
            <FileDownload fontSize="small" /> Xuất CSV
          </button>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Khách hàng</th>
                <th>Ngày đặt</th>
                <th>Sản phẩm</th>
                <th>Giá hoa</th>
                <th>Ship thu</th>
                <th>Tổng phải thu</th>
                <th>Thực thu</th>
                <th>Còn nợ</th>
                <th>Thanh toán</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((o) => (
                <tr key={o.id}>
                  <td>
                    <div className="customer-cell">
                      <span className="customer-avatar">{o.customer_name.slice(0, 1)}</span>
                      <span>
                        <b>{o.customer_name}</b>
                        <span
                          style={{ display: 'block', color: '#92a098', fontSize: 10, marginTop: 4 }}
                        >
                          {o.phone || 'Chưa có SĐT'}
                        </span>
                      </span>
                    </div>
                  </td>
                  <td>{shortDate(o.order_date)}</td>
                  <td>{o.product_type || '—'}</td>
                  <td>{money(o.flower_price)}</td>
                  <td>{money(o.shipping_fee)}</td>
                  <td>
                    <b>{money(o.total_due)}</b>
                  </td>
                  <td>{money(o.amount_paid)}</td>
                  <td style={{ color: o.total_due > o.amount_paid ? '#bd6657' : '#71817a' }}>
                    {money(Math.max(0, o.total_due - o.amount_paid))}
                  </td>
                  <td>
                    <Status status={o.status} />
                  </td>
                  <td>
                    {o.amount_paid < o.total_due && (
                      <button className="secondary-button" onClick={() => setPaymentFor(o)}>
                        <Payments fontSize="small" /> Thu tiền
                      </button>
                    )}
                    {paidParts(o.id).length > 0 && (
                      <span
                        title={`${paidParts(o.id).length} lần thu`}
                        style={{
                          display: 'block',
                          color: '#a0aaa4',
                          fontSize: 9,
                          textAlign: 'center',
                          marginTop: 4,
                        }}
                      >
                        {paidParts(o.id).length} lần thu
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visible.length === 0 && (
            <div className="empty-state">Không tìm thấy đơn hàng phù hợp.</div>
          )}
        </div>
      </section>
      {modal && (
        <Modal
          title="Tạo đơn hàng mới"
          onClose={() => setModal(false)}
          footer={
            <>
              <button className="secondary-button" onClick={() => setModal(false)}>
                Hủy
              </button>
              <button className="primary-button" type="submit" form="order-form" disabled={busy}>
                {busy ? 'Đang lưu…' : 'Lưu đơn hàng'}
              </button>
            </>
          }
        >
          <form id="order-form" onSubmit={submit}>
            <div className="form-grid">
              <Field
                label="Ngày đặt hàng"
                name="order_date"
                type="date"
                defaultValue={today()}
                required
              />
              <Field
                label="Tên khách hàng"
                name="customer_name"
                placeholder="VD: Nguyễn Minh Anh"
                required
              />
              <Field label="Số điện thoại" name="phone" placeholder="09xx xxx xxx" />
              <div className="field">
                <label>Loại sản phẩm</label>
                <select name="product_type">
                  {productTypes.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </div>
              <MoneyField label="Giá hoa (VNĐ)" name="flower_price" required />
              <MoneyField label="Ship thu khách (VNĐ)" name="shipping_fee" defaultValue="0" />
              <MoneyField label="Tiền đã cọc ban đầu (VNĐ)" name="deposit" defaultValue="0" />
              <MoneyField label="Tiền trả shipper (VNĐ)" name="courier_cost" defaultValue="0" />
              <div className="field">
                <label>Hình thức thanh toán</label>
                <select name="payment_method">
                  <option value="">Chưa thu tiền</option>
                  {paymentMethods.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </div>
              <Field label="Ngày giao hoa" name="delivery_date" type="date" />
              <Field
                label="Ghi chú đơn hàng"
                name="notes"
                placeholder="Mẫu hoa, giờ giao, lời chúc…"
                full
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
                {busy ? 'Đang lưu…' : 'Lưu khoản thu'}
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
    </Page>
  );
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
      <div className="metric-value" style={{ fontSize: 18, marginTop: 13 }}>
        {val}
      </div>
    </div>
  );
}
