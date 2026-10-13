'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
const items = [
  { href: '/', label: 'Tổng quan', icon: '⌂' },
  { href: '/orders', label: 'Đơn hàng', icon: '▧' },
  { href: '/expenses', label: 'Thu chi', icon: '↗' },
  { href: '/staff', label: 'Nhân sự', icon: '♧' },
];
export function Sidebar() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className={`mobile-overlay ${open ? 'show' : ''}`} onClick={() => setOpen(false)} />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <Link href="/" className="brand" onClick={() => setOpen(false)}>
          <span className="brand-mark">✿</span>
          <span>
            <div className="brand-name">C’Floral</div>
            <div className="brand-sub">FLOWER STUDIO</div>
          </span>
        </Link>
        <div className="nav-caption">Không gian làm việc</div>
        <nav className="nav-list">
          {items.map((x) => (
            <Link
              key={x.href}
              href={x.href}
              onClick={() => setOpen(false)}
              className={`nav-link ${path === x.href ? 'active' : ''}`}
            >
              <span style={{ fontSize: 19, width: 21, textAlign: 'center' }}>{x.icon}</span>
              {x.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="nav-caption">Cửa hàng</div>
          <div className="shop-card">
            <div className="shop-avatar">✿</div>
            <div>
              <div className="shop-caption">C’Floral Flower Shop</div>
              <div className="shop-status">Quản lý cửa hàng</div>
            </div>
          </div>
        </div>
      </aside>
      <button className="hamburger" aria-label="Mở menu" onClick={() => setOpen(true)}>
        ☰
      </button>
    </>
  );
}
