'use client';

import type { CSSProperties, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
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
import { Heading, Page, Status } from './ui';
import { useApp } from './providers';
import { getExpenses, getOrders } from '@/lib/data';
import { Expense, Order, money, shortDate } from '@/lib/types';
import { isSupabaseConfigured } from '@/lib/supabase';
const today = new Date().toISOString().slice(0, 10);
const dayLabel = (d: string) =>
  new Date(`${d}T00:00:00`).toLocaleDateString('vi-VN', { weekday: 'short' });
export default function Dashboard() {
  const { version } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  useEffect(() => {
    Promise.all([getOrders(), getExpenses()])
      .then(([o, e]) => {
        setOrders(o);
        setExpenses(e);
      })
      .catch(console.error);
  }, [version]);
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
  const grouped = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const key = d.toISOString().slice(0, 10);
        return {
          key,
          label: dayLabel(key),
          income: orders.filter((o) => o.order_date === key).reduce((a, o) => a + o.amount_paid, 0),
          out: expenses.filter((e) => e.expense_date === key).reduce((a, e) => a + e.amount, 0),
        };
      }),
    [orders, expenses],
  );
  const max = Math.max(1, ...grouped.flatMap((x) => [x.income, x.out]));
  return (
    <Page>
      <Heading
        eyebrow="Thứ Hai, 12 tháng 10"
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
              <h2 className="panel-title">Dòng tiền 7 ngày gần đây</h2>
              <div className="panel-note">Theo ngày ghi nhận đơn và khoản chi</div>
            </div>
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
          <div className="chart">
            {grouped.map((d) => (
              <div className="chart-col" key={d.key}>
                <div className="bars">
                  <span
                    title={`Thu ${money(d.income)}`}
                    className="bar"
                    style={{ height: `${Math.max(4, (d.income / max) * 100)}%` }}
                  />
                  <span
                    title={`Chi ${money(d.out)}`}
                    className="bar second"
                    style={{ height: `${Math.max(4, (d.out / max) * 100)}%` }}
                  />
                </div>
                <span className="chart-label">{d.label}</span>
              </div>
            ))}
          </div>
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
                  {e.kind === 'flower' ? 'Tiền hoa tươi' : e.category} · {shortDate(e.expense_date)}
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
