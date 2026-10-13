'use client';
import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './sidebar';
const names: { [key: string]: string } = {
  '/': 'Tổng quan',
  '/orders': 'Đơn hàng',
  '/expenses': 'Thu chi',
  '/staff': 'Nhân sự',
};
export function AppLayout({ children }: { children: ReactNode }) {
  const path = usePathname();
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-area">
        <header className="topbar">
          <div className="crumb-wrap">
            <div className="crumb">
              C’Floral <span style={{ color: '#c4cec8', padding: '0 8px' }}> / </span>
              <strong>{names[path] || 'Quản lý'}</strong>
            </div>
          </div>
          <div className="top-actions">
            <div className="today-chip">✿ &nbsp;Flower with love</div>
            <div className="avatar">CF</div>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
