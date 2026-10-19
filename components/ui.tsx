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

export function DateField({
  label,
  name,
  value,
  onChange,
  defaultValue,
  required = false,
  className,
}: {
  label?: string;
  name?: string;
  value?: string;
  onChange?: (isoDate: string) => void;
  defaultValue?: string;
  required?: boolean;
  className?: string;
}) {
  const [internalValue, setInternalValue] = useState(() => toDisplayDate(defaultValue || ''));
  const displayValue = value === undefined ? internalValue : toDisplayDate(value);
  const handleChange = (next: string) => {
    if (value === undefined) setInternalValue(next);
    const isoDate = parseDisplayDate(next);
    if (onChange && (isoDate || !next)) onChange(isoDate);
  };
  return (
    <div className={className || 'field'}>
      {label && <label htmlFor={name}>{label}</label>}
      <input
        id={name}
        name={name ? `${name}_display` : undefined}
        type="text"
        inputMode="numeric"
        placeholder="dd/mm/yyyy"
        value={displayValue}
        onChange={(event) => handleChange(event.target.value)}
        required={required}
      />
      {name && <input type="hidden" name={name} value={parseDisplayDate(displayValue)} />}
    </div>
  );
}

function toDisplayDate(isoDate: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : isoDate;
}

function parseDisplayDate(displayDate: string) {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(displayDate.trim());
  if (!match) return '';
  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (date.getFullYear() !== Number(year) || date.getMonth() !== Number(month) - 1 || date.getDate() !== Number(day)) return '';
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
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
