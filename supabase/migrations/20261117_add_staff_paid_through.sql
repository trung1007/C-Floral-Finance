alter table public.expenses
  add column if not exists staff_paid_through date;
