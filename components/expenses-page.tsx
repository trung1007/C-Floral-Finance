'use client';

import type { CSSProperties } from 'react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Add, Search, FileDownload } from '@mui/icons-material';
import { Heading, Modal, MoneyField, Page } from './ui';
import { useApp } from './providers';
import { addExpense, getExpenses } from '@/lib/data';
import {
  Expense,
  expenseCategories,
  money,
  parseMoneyInput,
  paymentMethods,
  shortDate,
} from '@/lib/types';
import { isSupabaseConfigured } from '@/lib/supabase';
const today = () => new Date().toISOString().slice(0, 10);
export default function ExpensesPage() {
  const { version, refresh, toast } = useApp();
  const [items, setItems] = useState<Expense[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('Tất cả khoản chi');
  const [modal, setModal] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    getExpenses()
      .then(setItems)
      .catch((e) => toast(e.message));
  }, [version]);
  const visible = useMemo(
    () =>
      items.filter(
        (x) =>
          (filter === 'Tất cả khoản chi' ||
            (filter === 'Tiền mua hoa' ? x.kind === 'flower' : x.kind === 'other')) &&
          `${x.description} ${x.category || ''} ${x.payee || ''}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [items, query, filter],
  );
  const flower = items.filter((x) => x.kind === 'flower').reduce((a, x) => a + x.amount, 0),
    other = items.filter((x) => x.kind === 'other').reduce((a, x) => a + x.amount, 0);
  const exportCsv = () => {
    const rows = [
      [
        'Ngày',
        'Nhóm',
        'Nội dung',
        'Phân loại',
        'Số tiền',
        'Hình thức TT',
        'Người nhận/NCC',
        'Ghi chú',
      ],
      ...visible.map((x) => [
        x.expense_date,
        x.kind === 'flower' ? 'Mua hoa' : 'Chi phí khác',
        x.description,
        x.category || '',
        x.amount,
        x.payment_method || '',
        x.payee || '',
        x.notes || '',
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
    a.download = 'cfloral-thu-chi.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const kind = String(f.get('kind')) as 'flower' | 'other';
    try {
      await addExpense({
        expense_date: String(f.get('expense_date')),
        kind,
        description: String(f.get('description')),
        category: kind === 'flower' ? 'Tiền hoa tươi' : String(f.get('category')),
        amount: parseMoneyInput(f.get('amount')),
        payment_method: String(f.get('payment_method')) || null,
        payee: String(f.get('payee') || '') || null,
        notes: String(f.get('notes') || '') || null,
      });
      setModal(false);
      refresh();
      toast('Đã lưu khoản chi');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Không thể lưu khoản chi');
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page>
      <Heading
        eyebrow="Sổ thu chi"
        title="Quản lý chi phí"
        subtitle="Theo dõi riêng tiền mua hoa mỗi ngày và các khoản chi khác."
        action={
          <button className="primary-button" onClick={() => setModal(true)}>
            <Add fontSize="small" /> Thêm khoản chi
          </button>
        }
      />
      {!isSupabaseConfigured && (
        <div className="notice">
          Đang dùng dữ liệu xem thử. Kết nối Supabase để lưu các khoản thu chi thật.
        </div>
      )}
      <div className="metric-grid" style={{ marginBottom: 18 }}>
        <Mini label="Tổng tiền mua hoa" val={money(flower)} note="Hoa tươi nhập mới" tone="green" />
        <Mini
          label="Chi phí khác"
          val={money(other)}
          note="Vật tư, vận chuyển, mặt bằng…"
          tone="coral"
        />
        <Mini
          label="Tổng chi đã ghi"
          val={money(flower + other)}
          note="Tiền hoa + chi phí khác"
          tone="blue"
        />
        <Mini
          label="Số khoản chi"
          val={String(items.length)}
          note="Từng khoản có thể tra cứu riêng"
          tone="gold"
        />
      </div>
      <section className="panel">
        <div className="toolbar">
          <div style={{ display: 'flex', gap: 8, flex: 1, flexWrap: 'wrap' }}>
            <label className="search-box">
              <Search fontSize="small" color="disabled" />
              <input
                placeholder="Tìm nội dung, nhà cung cấp…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <select
              className="filter-select"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option>Tất cả khoản chi</option>
              <option>Tiền mua hoa</option>
              <option>Chi phí khác</option>
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
                <th>Ngày</th>
                <th>Nhóm</th>
                <th>Nội dung</th>
                <th>Phân loại</th>
                <th>Số tiền</th>
                <th>Hình thức TT</th>
                <th>Người nhận / NCC</th>
                <th>Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((x) => (
                <tr key={x.id}>
                  <td>{shortDate(x.expense_date)}</td>
                  <td>
                    <span className={`status ${x.kind === 'flower' ? 'paid' : 'deposit'}`}>
                      {x.kind === 'flower' ? 'Mua hoa' : 'Chi khác'}
                    </span>
                  </td>
                  <td>
                    <b>{x.description}</b>
                  </td>
                  <td>{x.category || '—'}</td>
                  <td>
                    <b>{money(x.amount)}</b>
                  </td>
                  <td>{x.payment_method || '—'}</td>
                  <td>{x.payee || '—'}</td>
                  <td>{x.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {visible.length === 0 && <div className="empty-state">Chưa có khoản chi phù hợp.</div>}
        </div>
      </section>
      {modal && (
        <Modal
          title="Thêm khoản chi"
          onClose={() => setModal(false)}
          footer={
            <>
              <button className="secondary-button" onClick={() => setModal(false)}>
                Hủy
              </button>
              <button className="primary-button" type="submit" form="expense-form" disabled={busy}>
                {busy ? 'Đang lưu…' : 'Lưu khoản chi'}
              </button>
            </>
          }
        >
          <form id="expense-form" onSubmit={submit}>
            <div className="form-grid">
              <Field
                label="Ngày chi"
                name="expense_date"
                type="date"
                defaultValue={today()}
                required
              />
              <div className="field">
                <label>Nhóm khoản chi</label>
                <select name="kind">
                  <option value="flower">Tiền mua hoa</option>
                  <option value="other">Chi phí khác</option>
                </select>
              </div>
              <Field
                label="Nội dung"
                name="description"
                placeholder="VD: Hoa hồng Đà Lạt"
                required
              />
              <div className="field">
                <label>Phân loại chi phí</label>
                <select name="category">
                  {expenseCategories.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </div>
              <MoneyField label="Số tiền (VNĐ)" name="amount" required />
              <div className="field">
                <label>Hình thức thanh toán</label>
                <select name="payment_method">
                  {paymentMethods.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </div>
              <Field
                label="Người nhận / nhà cung cấp"
                name="payee"
                placeholder="Tên vườn hoa, cửa hàng…"
              />
              <Field label="Ghi chú" name="notes" placeholder="Thông tin thêm" />
              <div className="field full">
                <span style={{ fontSize: 10, color: '#8d9992' }}>
                  Khi chọn “Tiền mua hoa”, khoản chi sẽ được thống kê riêng ở trang Tổng quan.
                </span>
              </div>
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
  required?: boolean;
}) {
  return (
    <div className="field">
      <label>{p.label}</label>
      <input
        name={p.name}
        type={p.type || 'text'}
        placeholder={p.placeholder}
        defaultValue={p.defaultValue}
        min={p.min}
        required={p.required}
      />
    </div>
  );
}
function Mini({
  label,
  val,
  note,
  tone,
}: {
  label: string;
  val: string;
  note: string;
  tone: string;
}) {
  const colors: Record<string, [string, string]> = {
    green: ['#27866c', '#e7f6ef'],
    coral: ['#d07866', '#fff0ec'],
    blue: ['#6583bf', '#eef3ff'],
    gold: ['#bc8e2b', '#fff7df'],
  };
  const [c, bg] = colors[tone];
  return (
    <div
      className="metric-card"
      style={{ '--metric-color': c, '--metric-soft': bg } as CSSProperties}
    >
      <div className="metric-label">{label}</div>
      <div className="metric-value" style={{ fontSize: 19, marginTop: 12 }}>
        {val}
      </div>
      <div className="metric-foot">{note}</div>
    </div>
  );
}
