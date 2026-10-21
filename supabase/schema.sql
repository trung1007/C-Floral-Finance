-- C'Floral flower shop manager: Supabase / PostgreSQL schema
-- Run this file once in Supabase > SQL Editor > New query.
create extension if not exists pgcrypto;

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  created_at timestamptz not null default now()
);
create index if not exists customers_phone_idx on public.customers(phone);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  order_date date not null default current_date,
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text not null,
  phone text,
  product_type text check (product_type is null or product_type in ('Bó','Giỏ','Lẵng','Kệ','Bình','Khác')),
  price numeric(14,0) not null default 0 check (price >= 0),
  shipping_fee numeric(14,0) not null default 0 check (shipping_fee >= 0),
  total_due numeric(14,0) generated always as (price + shipping_fee) stored,
  amount_paid numeric(14,0) not null default 0 check (amount_paid >= 0),
  courier_cost numeric(14,0) not null default 0 check (courier_cost >= 0),
  status text not null default 'Chưa thanh toán' check (status in ('Đã thanh toán đủ','Đã cọc (chờ thu còn lại)','Chưa thanh toán','Đã hủy')),
  payment_method text check (payment_method is null or payment_method in ('Tiền mặt','Chuyển khoản','Khác')),
  delivery_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.orders add column if not exists code text;
update public.orders
set code = to_char(order_date, 'DD_MM') || '_' || regexp_replace(trim(customer_name), '\\s+', '_', 'g') || '_' || substr(id::text, 1, 8)
where code is null;
alter table public.orders alter column code set not null;
create unique index if not exists orders_code_key on public.orders(code);
create index if not exists orders_order_date_idx on public.orders(order_date desc);
create index if not exists orders_customer_name_idx on public.orders using gin(to_tsvector('simple', customer_name));
create index if not exists orders_status_idx on public.orders(status);

-- Rename the order value column for databases created with the previous schema.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'flower_price'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'price'
  ) then
    alter table public.orders rename column flower_price to price;
  end if;
end $$;
notify pgrst, 'reload schema';

create table if not exists public.order_payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  amount numeric(14,0) not null check (amount > 0),
  paid_at timestamptz not null default now(),
  payment_method text check (payment_method is null or payment_method in ('Tiền mặt','Chuyển khoản','Khác')),
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists order_payments_order_idx on public.order_payments(order_id,paid_at);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  expense_date date not null default current_date,
  kind text not null check (kind in ('flower','other')),
  description text not null,
  category text not null,
  amount numeric(14,0) not null check (amount >= 0),
  payment_method text check (payment_method is null or payment_method in ('Tiền mặt','Chuyển khoản','Khác')),
  payee text,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists expenses_date_idx on public.expenses(expense_date desc);
create index if not exists expenses_kind_idx on public.expenses(kind);

create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.work_shifts (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete restrict,
  work_date date not null default current_date,
  hours numeric(5,2) not null check (hours >= 0),
  shift_name text,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists work_shifts_date_idx on public.work_shifts(work_date desc);

-- Repair values and checks created by earlier versions with incorrectly encoded labels.
alter table public.orders drop constraint if exists orders_product_type_check;
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders drop constraint if exists orders_payment_method_check;
alter table public.order_payments drop constraint if exists order_payments_payment_method_check;
alter table public.expenses drop constraint if exists expenses_payment_method_check;

update public.orders
set product_type = case product_type
  when 'BÃ³' then 'Bó'
  when 'Giá»' then 'Giỏ'
  when 'Láºµng' then 'Lẵng'
  when 'Ká»‡' then 'Kệ'
  when 'BÃ¬nh' then 'Bình'
  when 'KhÃ¡c' then 'Khác'
  else product_type
end,
status = case status
  when 'ÄÃ£ thanh toÃ¡n Ä‘á»§' then 'Đã thanh toán đủ'
  when 'ÄÃ£ cá»c (chá» thu cÃ²n láº¡i)' then 'Đã cọc (chờ thu còn lại)'
  when 'ChÆ°a thanh toÃ¡n' then 'Chưa thanh toán'
  when 'ÄÃ£ há»§y' then 'Đã hủy'
  else status
end,
payment_method = case payment_method
  when 'Tiá»n máº·t' then 'Tiền mặt'
  when 'Chuyá»ƒn khoáº£n' then 'Chuyển khoản'
  when 'KhÃ¡c' then 'Khác'
  else payment_method
end;

update public.order_payments
set payment_method = case payment_method
  when 'Tiá»n máº·t' then 'Tiền mặt'
  when 'Chuyá»ƒn khoáº£n' then 'Chuyển khoản'
  when 'KhÃ¡c' then 'Khác'
  else payment_method
end;

update public.expenses
set payment_method = case payment_method
  when 'Tiá»n máº·t' then 'Tiền mặt'
  when 'Chuyá»ƒn khoáº£n' then 'Chuyển khoản'
  when 'KhÃ¡c' then 'Khác'
  else payment_method
end;

alter table public.orders add constraint orders_product_type_check
  check (product_type is null or product_type in ('Bó', 'Giỏ', 'Lẵng', 'Kệ', 'Bình', 'Khác'));
alter table public.orders add constraint orders_status_check
  check (status in ('Đã thanh toán đủ', 'Đã cọc (chờ thu còn lại)', 'Chưa thanh toán', 'Đã hủy'));
alter table public.orders add constraint orders_payment_method_check
  check (payment_method is null or payment_method in ('Tiền mặt', 'Chuyển khoản', 'Khác'));
alter table public.order_payments add constraint order_payments_payment_method_check
  check (payment_method is null or payment_method in ('Tiền mặt', 'Chuyển khoản', 'Khác'));
alter table public.expenses add constraint expenses_payment_method_check
  check (payment_method is null or payment_method in ('Tiền mặt', 'Chuyển khoản', 'Khác'));

-- Keep orders.amount_paid and status in sync with the detailed payment ledger.
create or replace function public.refresh_order_payment_totals(target_order_id uuid)
returns void language plpgsql security invoker set search_path = public as $$
declare paid_total numeric(14,0); due_total numeric(14,0); next_status text;
begin
  select coalesce(sum(amount),0) into paid_total from public.order_payments where order_id=target_order_id;
  select total_due into due_total from public.orders where id=target_order_id;
  if due_total is null then return; end if;
  if paid_total <= 0 then next_status := 'Chưa thanh toán';
  elsif paid_total >= due_total then next_status := 'Đã thanh toán đủ';
  else next_status := 'Đã cọc (chờ thu còn lại)'; end if;
  update public.orders set amount_paid=paid_total,status=next_status,updated_at=now() where id=target_order_id;
end $$;

create or replace function public.sync_order_payment_row()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  perform public.refresh_order_payment_totals(coalesce(new.order_id,old.order_id));
  return coalesce(new,old);
end $$;
drop trigger if exists order_payments_sync_order on public.order_payments;
create trigger order_payments_sync_order after insert or update or delete on public.order_payments
for each row execute function public.sync_order_payment_row();

-- No login/role layer was requested. For a public anonymous-key app, allow CRUD here.
-- This makes all data public to anyone who obtains the app URL/key. Use only for a private
-- single-shop deployment and review security implications before publishing publicly.
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_payments enable row level security;
alter table public.expenses enable row level security;
alter table public.staff enable row level security;
alter table public.work_shifts enable row level security;
do $$ begin
  create policy "public app access customers" on public.customers for all to anon, authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public app access orders" on public.orders for all to anon, authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public app access payments" on public.order_payments for all to anon, authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public app access expenses" on public.expenses for all to anon, authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public app access staff" on public.staff for all to anon, authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public app access shifts" on public.work_shifts for all to anon, authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;
