'use client';
import { ReactNode, useState } from 'react';
import { AppLayout } from './app-layout';
import { CircularProgress } from '@mui/material';
import { formatMoneyInput } from '@/lib/types';

export function MoneyField({
  label,
  name,
  required = false,
  defaultValue = '',
}: {
  label: string;
  name: string;
  required?: boolean;
  defaultValue?: string;
}) {
  const [value, setValue] = useState(() => formatMoneyInput(defaultValue));

  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={value}
        onChange={(event) => setValue(formatMoneyInput(event.target.value))}
        required={required}
        placeholder="0"
      />
    </div>
  );
}
export function Page({ children }: { children: ReactNode }) {
  return (
    <AppLayout>
      <div className="page-content">{children}</div>
    </AppLayout>
  );
}
export function Heading({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1 className="page-title">{title}</h1>
        <p className="page-subtitle">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}
export function Loading() {
  return (
    <div className="empty-state">
      <CircularProgress size={24} sx={{ color: '#27866c' }} />
    </div>
  );
}
export function Status({ status }: { status: string }) {
  const c =
    status === 'Đã thanh toán đủ' ? 'paid' : status.startsWith('Đã cọc') ? 'deposit' : 'unpaid';
  return <span className={`status ${c}`}>{status}</span>;
}
export function Modal({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section className="modal">
        <div className="modal-head">
          <div>
            <div className="eyebrow">C’Floral</div>
            <h2 className="modal-title">{title}</h2>
          </div>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        {children}
        <div className="modal-footer">{footer}</div>
      </section>
    </div>
  );
}
export function Button({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button className="primary-button" onClick={onClick}>
      {children}
    </button>
  );
}
