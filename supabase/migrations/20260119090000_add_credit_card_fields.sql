-- Add credit card specific fields to accounts
alter table public.accounts
  add column if not exists statement_start_date date,
  add column if not exists statement_end_date date,
  add column if not exists due_date date,
  add column if not exists credit_limit decimal(15, 2),
  add column if not exists min_due decimal(15, 2);
