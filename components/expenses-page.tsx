'use client';

import type { CSSProperties } from 'react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Add, Search, FileDownload, Edit, Delete, MoreVert } from '@mui/icons-material';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { LocalizationProvider, DatePicker as MuiDatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { DateField, Heading, Modal, MoneyField, Page } from './ui';
import { useApp } from './providers';
import { addExpense, deleteExpense, getExpenses, updateExpense } from '@/lib/data';
import {
  Expense,
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
  const [day, setDay] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
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
          (filter === 'Tất cả khoản chi' || expenseGroup(x) === filter) &&
          (!day || x.expense_date === day) &&
          `${x.description} ${expenseGroup(x)}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [items, query, filter, day],
  );
  const pageCount = Math.ceil(visible.length / 20);
  const paged = visible.slice((page - 1) * 20, page * 20);
  const flower = visible.filter((x) => x.kind === 'flower').reduce((a, x) => a + x.amount, 0),
    other = visible.filter((x) => x.kind !== 'flower').reduce((a, x) => a + x.amount, 0);
  const exportCsv = () => {
    const rows = [
      [
        'Ngày',
        'Nhóm',
        'Nội dung',
        'Số tiền',
        'Hình thức TT',
        'Ghi chú',
      ],
      ...visible.map((x) => [
        x.expense_date,
        expenseGroup(x),
        x.description,
        x.amount,
        x.payment_method || '',
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
    const group = String(f.get('kind'));
    const kind: Expense['kind'] = group === 'Tiền mua hoa' ? 'flower' : 'other';
    try {
      const expense = {
        expense_date: String(f.get('expense_date')),
        kind,
        description: String(f.get('description')),
        category: group,
        amount: parseMoneyInput(f.get('amount')),
        payment_method: String(f.get('payment_method')) || null,
        payee: null,
        notes: String(f.get('notes') || '') || null,
      };
      if (editing) await updateExpense(editing.id, expense);
      else await addExpense(expense);
      setEditing(null);
      setModal(false);
      refresh();
      toast(editing ? 'Đã cập nhật khoản chi' : 'Đã lưu khoản chi');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Không thể lưu khoản chi');
    } finally {
      setBusy(false);
    }
  }
  async function removeExpense(expense: Expense) {
    if (!window.confirm(`Xóa khoản chi “${expense.description}” trị giá ${money(expense.amount)}?`)) return;
    try {
      await deleteExpense(expense.id);
      refresh();
      toast('Đã xóa khoản chi');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Không thể xóa khoản chi');
    }
  }
  return (
    <Page>
      <Heading
        eyebrow="Sổ thu chi"
        title="Quản lý chi phí"
        subtitle="Theo dõi riêng tiền mua hoa mỗi ngày và các khoản chi khác."
        action={
          <button className="primary-button" onClick={() => { setEditing(null); setModal(true); }}>
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
        {day ? (
          <Mini label="Số khoản chi trong ngày" val={String(items.filter((x) => x.expense_date === day).length)} note="Tất cả nhóm chi" tone="gold" />
        ) : (
          <>
          <Mini label="Tổng tiền mua hoa" val={money(flower)} note="Hoa tươi nhập mới" tone="green" />
          <Mini
            label="Tiền mua vật dụng / thuê mặt bằng"
            val={money(other)}
            note="Các khoản ngoài tiền mua hoa"
            tone="coral"
          />
          <Mini
            label="Tổng chi đã ghi"
            val={money(flower + other)}
            note="Tiền hoa + các khoản khác"
            tone="blue"
          />
          <Mini
            label="Số khoản chi"
            val={String(visible.length)}
            note="Từng khoản có thể tra cứu riêng"
            tone="gold"
          />
          </>
        )}
      </div>
      <section className="panel">
        <div className="toolbar">
          <div style={{ display: 'flex', gap: 8, flex: 1, flexWrap: 'wrap' }}>
            <TextField
              label="Nội dung khoản chi"
              variant="outlined"
              size="small"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              sx={{ minWidth: 240, '& .MuiInputBase-root': { height: 40 } }}
            />
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <MuiDatePicker
                label="Lọc theo ngày chi"
                format="DD/MM/YYYY"
                value={day ? dayjs(day) : null}
                onChange={(date) => setDay(date?.isValid() ? date.format('YYYY-MM-DD') : '')}
                slotProps={{
                  field: { clearable: true },
                  textField: { size: 'small', sx: { width: 190, '& .MuiInputBase-root': { height: 40 } } },
                }}
              />
            </LocalizationProvider>
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel id="expense-kind-filter-label">Nhóm khoản chi</InputLabel>
              <Select
                labelId="expense-kind-filter-label"
                value={filter}
                label="Nhóm khoản chi"
                onChange={(e) => setFilter(e.target.value)}
              >
                <MenuItem value="Tất cả khoản chi">Tất cả khoản chi</MenuItem>
                <MenuItem value="Tiền mua hoa">Tiền mua hoa</MenuItem>
                <MenuItem value="Tiền mua vật dụng">Tiền mua vật dụng</MenuItem>
                <MenuItem value="Tiền thuê mặt bằng">Tiền thuê mặt bằng</MenuItem>
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
                <th>Ngày</th>
                <th>Nhóm</th>
                <th>Nội dung</th>
                <th>Số tiền</th>
                <th>Hình thức TT</th>
                <th>Ghi chú</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((x) => (
                <tr key={x.id}>
                  <td>{shortDate(x.expense_date)}</td>
                  <td>
                    <span className={`status ${x.kind === 'flower' ? 'paid' : 'deposit'}`}>
                      {expenseGroup(x)}
                    </span>
                  </td>
                  <td>
                    <b>{x.description}</b>
                  </td>
                  <td>
                    <b>{money(x.amount)}</b>
                  </td>
                  <td>{x.payment_method || '—'}</td>
                  <td>{x.notes || '—'}</td>
                  <td><div className="row-actions">
                    <button className="secondary-button row-actions-trigger" aria-label="Thao tác khoản chi" title="Thao tác khoản chi"><MoreVert fontSize="small" /></button>
                    <div className="row-actions-menu">
                      <button className="secondary-button" aria-label="Sửa khoản chi" onClick={() => setEditing(x)}><Edit fontSize="small" /> Sửa</button>
                      <button className="secondary-button danger-button" aria-label="Xóa khoản chi" onClick={() => removeExpense(x)}><Delete fontSize="small" /> Xóa</button>
                    </div>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
          {pageCount > 1 && <div className="pagination">
            <button className="secondary-button" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Trước</button>
            <span>Trang {page} / {pageCount}</span>
            <button className="secondary-button" disabled={page === pageCount} onClick={() => setPage((p) => p + 1)}>Sau</button>
          </div>}
          {visible.length === 0 && <div className="empty-state">Chưa có khoản chi phù hợp.</div>}
        </div>
      </section>
      {(modal || editing) && (
        <Modal
          title={editing ? 'Sửa khoản chi' : 'Thêm khoản chi'}
          onClose={() => { setModal(false); setEditing(null); }}
          footer={
            <>
              <button className="secondary-button" onClick={() => { setModal(false); setEditing(null); }}>
                Hủy
              </button>
              <button className="primary-button" type="submit" form="expense-form" disabled={busy}>
                {busy ? 'Đang lưu…' : editing ? 'Cập nhật khoản chi' : 'Lưu khoản chi'}
              </button>
            </>
          }
        >
          <form id="expense-form" onSubmit={submit}>
            <div className="form-grid">
              <DateField label="Ngày chi" name="expense_date" defaultValue={editing?.expense_date || today()} required key={`expense-date-${editing?.id || 'new'}`} />
              <div className="field">
                <label>Nhóm khoản chi</label>
                <select name="kind" defaultValue={editing ? expenseGroup(editing) : 'Tiền mua hoa'} key={`expense-kind-${editing?.id || 'new'}`}>
                  <option value="Tiền mua hoa">Tiền mua hoa</option>
                  <option value="Tiền mua vật dụng">Tiền mua vật dụng</option>
                  <option value="Tiền thuê mặt bằng">Tiền thuê mặt bằng</option>
                </select>
              </div>
              <Field
                label="Nội dung"
                name="description"
                placeholder="VD: Hoa hồng Đà Lạt"
                required
                defaultValue={editing?.description || ''}
                key={`expense-desc-${editing?.id || 'new'}`}
              />
              <MoneyField label="Số tiền (VNĐ)" name="amount" required defaultValue={editing ? String(editing.amount) : ''} key={`expense-amount-${editing?.id || 'new'}`} />
              <div className="field">
                <label>Hình thức thanh toán</label>
                <select name="payment_method" defaultValue={editing?.payment_method || paymentMethods[0]} key={`expense-method-${editing?.id || 'new'}`}>
                  {paymentMethods.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </div>
              <Field label="Ghi chú" name="notes" placeholder="Thông tin thêm" defaultValue={editing?.notes || ''} key={`expense-notes-${editing?.id || 'new'}`} />
              <div className="field full">
                <span className="form-helper-text">
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
      <div className="metric-value" style={{ marginTop: 12 }}>
        {val}
      </div>
      <div className="metric-foot">{note}</div>
    </div>
  );
}
function expenseGroup(expense: Expense) {
  if (expense.kind === 'flower') return 'Tiền mua hoa';
  if (expense.category === 'Tiền thuê mặt bằng' || expense.category === 'Mặt bằng/Điện nước')
    return 'Tiền thuê mặt bằng';
  if (expense.category === 'Tiền mua vật dụng') return 'Tiền mua vật dụng';
  return 'Tiền mua vật dụng';
}
