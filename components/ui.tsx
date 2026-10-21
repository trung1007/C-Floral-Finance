'use client';
import { ReactNode, useState } from 'react';
import { AppLayout } from './app-layout';
import { CircularProgress, TextField } from '@mui/material';
import { LocalizationProvider, DatePicker as MuiDatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
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
    <TextField
        id={name}
        name={name}
        label={label}
        variant="outlined"
        size="small"
        fullWidth
        value={value}
        onChange={(event) => setValue(formatMoneyInput(event.target.value))}
        required={required}
        placeholder="0"
        slotProps={{ htmlInput: { inputMode: 'numeric', autoComplete: 'off' } }}
        className="form-mui-input"
      />
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
  const [internalValue, setInternalValue] = useState(() => defaultValue ? dayjs(defaultValue) : null);
  const pickerValue = value === undefined ? internalValue : value ? dayjs(value) : null;
  const handleChange = (next: dayjs.Dayjs | null) => {
    if (value === undefined) setInternalValue(next);
    if (onChange) onChange(next?.isValid() ? next.format('YYYY-MM-DD') : '');
  };
  return (
    <div className={className || 'field'}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <MuiDatePicker
          label={label}
          format="DD/MM/YYYY"
          value={pickerValue}
          onChange={handleChange}
          slotProps={{
            textField: { id: name, name: name ? `${name}_display` : undefined, size: 'small', required, fullWidth: true, className: 'form-mui-input' },
            field: { clearable: !required },
          }}
        />
      </LocalizationProvider>
      {name && <input type="hidden" name={name} value={pickerValue?.isValid() ? pickerValue.format('YYYY-MM-DD') : ''} />}
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
