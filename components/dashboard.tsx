'use client';

import type { CSSProperties, ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowDownward,
  ArrowUpward,
  AttachMoney,
  LocalFlorist,
  ShoppingBag,
  TrendingUp,
  Add,
} from '@mui/icons-material';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { BarChart } from '@mui/x-charts/BarChart';
import { Heading, Page, Status } from './ui';
import { useApp } from './providers';
import { getExpenses, getOrders } from '@/lib/data';
import { Expense, Order, money, shortDate } from '@/lib/types';
import { isSupabaseConfigured } from '@/lib/supabase';
const today = new Date().toISOString().slice(0, 10);
const todayLabel = new Intl.DateTimeFormat('vi-VN', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'Asia/Ho_Chi_Minh',
}).format(new Date());
type CashflowRange = '7d' | '30d' | 'all';
const dayLabel = (d: string) =>
  new Date(`${d}T00:00:00`).toLocaleDateString('vi-VN', { weekday: 'short' });
const dateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
export default function Dashboard() {
  const { version } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [cashflowRange, setCashflowRange] = useState<CashflowRange>('7d');
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(0);
  useEffect(() => {
    Promise.all([getOrders(), getExpenses()])
      .then(([o, e]) => {
        setOrders(o);
        setExpenses(e);
      })
      .catch(console.error);
  }, [version]);
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(([entry]) => {
      setChartWidth(Math.floor(entry.contentRect.width));
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);
  const todayOrders = orders.filter((o) => o.order_date === today);
  const todayExpenses = expenses.filter((e) => e.expense_date === today);
  const allDue = orders.reduce((a, o) => a + o.total_due, 0);
  const allPaid = orders.reduce((a, o) => a + o.amount_paid, 0);
  const allSpent = expenses.reduce((a, e) => a + e.amount, 0);
  const flowerSpend = expenses.filter((e) => e.kind === 'flower').reduce((a, e) => a + e.amount, 0);
  const todayRevenue = todayOrders.reduce((a, o) => a + o.amount_paid, 0);
  const todaySpend = todayExpenses.reduce((a, e) => a + e.amount, 0);
  const owed = orders.reduce((a, o) => a + Math.max(0, o.total_due - o.amount_paid), 0);
  const latest = [...orders].sort((a, b) => b.order_date.localeCompare(a.order_date)).slice(0, 5);
  const grouped = useMemo(() => {
    const orderIncome = new Map<string, number>();
    const expenseOut = new Map<string, number>();
    for (const order of orders) {
      const key = cashflowRange === 'all' ? order.order_date.slice(0, 7) : order.order_date;
      orderIncome.set(key, (orderIncome.get(key) || 0) + order.amount_paid);
    }
    for (const expense of expenses) {
      const key = cashflowRange === 'all' ? expense.expense_date.slice(0, 7) : expense.expense_date;
      expenseOut.set(key, (expenseOut.get(key) || 0) + expense.amount);
    }

    const now = new Date();
    const keys: string[] = [];
    if (cashflowRange === 'all') {
      const firstRecorded = [...orders.map((o) => o.order_date), ...expenses.map((e) => e.expense_date)]
        .sort()[0];
      const start = firstRecorded ? new Date(`${firstRecorded.slice(0, 7)}-01T00:00:00`) : now;
      const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 1);
      while (cursor <= end) {
        keys.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`);
        cursor.setMonth(cursor.getMonth() + 1);
      }
    } else {
      const dayCount = cashflowRange === '7d' ? 7 : 30;
      for (let ago = dayCount - 1; ago >= 0; ago -= 1) {
        const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ago);
        keys.push(dateKey(date));
      }
    }

    return keys.map((key) => ({
      key,
      label:
        cashflowRange === 'all'
          ? new Date(`${key}-01T00:00:00`).toLocaleDateString('vi-VN', { month: 'short', year: '2-digit' })
          : cashflowRange === '7d'
            ? dayLabel(key)
            : new Date(`${key}T00:00:00`).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
      detailLabel:
        cashflowRange === 'all'
          ? new Date(`${key}-01T00:00:00`).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })
          : new Date(`${key}T00:00:00`).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }),
      income: orderIncome.get(key) || 0,
      out: expenseOut.get(key) || 0,
    }));
  }, [orders, expenses, cashflowRange]);
  return (
    <Page>
      <Heading
        eyebrow={todayLabel}
        title="Chào buổi sáng, C’Floral ✿"
        subtitle="Một ngày mới xinh đẹp để tạo nên những bó hoa thật đặc biệt."
        action={
          <Link href="/orders" className="primary-button">
            <Add fontSize="small" /> Tạo đơn hàng
          </Link>
        }
      />
      {!isSupabaseConfigured && (
        <div className="notice">
          Bạn đang ở <b>chế độ xem thử</b> với dữ liệu minh họa. Để lưu dữ liệu thật, điền Supabase
          URL và key trong file <code>.env.local</code> rồi khởi động lại website.
        </div>
      )}
      <div className="metric-grid">
        <Metric
          label="Thực thu hôm nay"
          value={money(todayRevenue)}
          note={`${todayOrders.length} đơn hàng hôm nay`}
          icon={<ArrowDownward fontSize="small" />}
          color="#27866c"
          soft="#e7f6ef"
        />
        <Metric
          label="Chi phí hôm nay"
          value={money(todaySpend)}
          note={`${money(flowerSpend)} tiền hoa lũy kế`}
          icon={<ArrowUpward fontSize="small" />}
          color="#d07866"
          soft="#fff0ec"
        />
        <Metric
          label="Khách còn nợ"
          value={money(owed)}
          note={`Tổng phải thu ${money(allDue)}`}
          icon={<AttachMoney fontSize="small" />}
          color="#bc8e2b"
          soft="#fff7df"
        />
        <Metric
          label="Chênh lệch thu – chi"
          value={money(allPaid - allSpent)}
          note={`Tổng chi đã ghi ${money(allSpent)}`}
          icon={<TrendingUp fontSize="small" />}
          color="#6583bf"
          soft="#eef3ff"
        />
      </div>
      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">
                Dòng tiền {cashflowRange === '7d' ? '7 ngày' : cashflowRange === '30d' ? '30 ngày' : 'từ trước đến nay'}
              </h2>
              <div className="panel-note">
                {cashflowRange === 'all' ? 'Theo tháng ghi nhận đơn và khoản chi' : 'Theo ngày ghi nhận đơn và khoản chi'}
              </div>
            </div>
            <div className="cashflow-controls">
              <FormControl size="small" sx={{ minWidth: 190 }}>
                <InputLabel id="cashflow-range-label">Khoảng thời gian dòng tiền</InputLabel>
                <Select
                  labelId="cashflow-range-label"
                  label="Khoảng thời gian dòng tiền"
                  value={cashflowRange}
                  onChange={(event) => {
                  setCashflowRange(event.target.value as CashflowRange);
                  }}
                >
                  <MenuItem value="7d">7 ngày gần đây</MenuItem>
                  <MenuItem value="30d">30 ngày gần đây</MenuItem>
                  <MenuItem value="all">Từ trước đến nay</MenuItem>
                </Select>
              </FormControl>
              <div className="legend">
                <span>
                  <i className="legend-dot" />
                  Thực thu
                </span>
                <span>
                  <i className="legend-dot coral" />
                  Chi phí
                </span>
              </div>
            </div>
          </div>
          <div className="chart-scroll" ref={chartContainerRef}>
            <BarChart
              dataset={grouped}
              xAxis={[{ scaleType: 'band', dataKey: 'label' }]}
              series={[
                { dataKey: 'income', label: 'Thực thu', color: '#8ed5b2', valueFormatter: (value) => money(value ?? 0) },
                { dataKey: 'out', label: 'Chi phí', color: '#f0a895', valueFormatter: (value) => money(value ?? 0) },
              ]}
              width={Math.max(1, chartWidth, grouped.length * 48)}
              height={270}
              margin={{ top: 16, right: 16, bottom: 32, left: 16 }}
              slotProps={{ tooltip: { trigger: 'axis' } }}
            />
          </div>
          <div className="cashflow-detail">Di chuột lên biểu đồ để xem thực thu và chi phí theo ngày hoặc tháng.</div>
        </section>
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Khoản chi gần đây</h2>
              <div className="panel-note">Theo dõi tiền hoa tươi riêng</div>
            </div>
            <Link className="link-button" href="/expenses">
              Xem tất cả ↗
            </Link>
          </div>
          {expenses.slice(0, 4).map((e) => (
            <div className="expense-row" key={e.id}>
              <div className="expense-icon">{e.kind === 'flower' ? '🌷' : '🎀'}</div>
              <div className="expense-info">
                <div className="expense-name">{e.description}</div>
                <div className="expense-meta">
                  {e.kind === 'flower' ? 'Tiền mua hoa' : e.category === 'Tiền thuê mặt bằng' || e.category === 'Mặt bằng/Điện nước' ? 'Tiền thuê mặt bằng' : 'Tiền mua vật dụng'} · {shortDate(e.expense_date)}
                </div>
              </div>
              <div className="expense-amount">{money(e.amount)}</div>
            </div>
          ))}
        </section>
      </div>
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Đơn hàng gần đây</h2>
            <div className="panel-note">Cập nhật đơn hàng và tình trạng thanh toán</div>
          </div>
          <Link className="link-button" href="/orders">
            Tất cả đơn hàng ↗
          </Link>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Khách hàng</th>
                <th>Ngày đặt</th>
                <th>Sản phẩm</th>
                <th>Tổng phải thu</th>
                <th>Thực thu</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {latest.map((o) => (
                <tr key={o.id}>
                  <td>
                    <div className="customer-cell">
                      <span className="customer-avatar">{o.customer_name.slice(0, 1)}</span>
                      <b>{o.customer_name}</b>
                    </div>
                  </td>
                  <td>{shortDate(o.order_date)}</td>
                  <td>{o.product_type || '—'}</td>
                  <td>{money(o.total_due)}</td>
                  <td>{money(o.amount_paid)}</td>
                  <td>
                    <Status status={o.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </Page>
  );
}
function Metric({
  label,
  value,
  note,
  icon,
  color,
  soft,
}: {
  label: string;
  value: string;
  note: string;
  icon: ReactNode;
  color: string;
  soft: string;
}) {
  return (
    <div
      className="metric-card"
      style={{ '--metric-color': color, '--metric-soft': soft } as CSSProperties}
    >
      <div className="metric-top">
        <span className="metric-label">{label}</span>
        <span className="metric-icon">{icon}</span>
      </div>
      <div className="metric-value">{value}</div>
      <div className="metric-foot">{note}</div>
    </div>
  );
}
