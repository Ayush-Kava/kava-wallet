-- Recurring rules for scheduled transactions
create table if not exists public.recurring_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  type text not null check (type in ('income', 'expense', 'transfer')),
  frequency text not null check (frequency in ('weekly', 'monthly', 'yearly')),
  amount decimal(15, 2) not null,
  account_id uuid references public.accounts(id) on delete cascade,
  from_account_id uuid references public.accounts(id) on delete cascade,
  to_account_id uuid references public.accounts(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  next_run_date date not null,
  end_date date,
  paused boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recurring_rules_account_scope check (
    (type = 'transfer' and from_account_id is not null and to_account_id is not null and account_id is null)
    or (type <> 'transfer' and account_id is not null and from_account_id is null and to_account_id is null)
  )
);

create index if not exists idx_recurring_rules_user on public.recurring_rules(user_id);
create index if not exists idx_recurring_rules_next_run on public.recurring_rules(user_id, next_run_date) where paused = false;

alter table public.recurring_rules enable row level security;

create policy "Users can view their own recurring rules" on public.recurring_rules
  for select using (auth.uid() = user_id);

create policy "Users can insert recurring rules" on public.recurring_rules
  for insert with check (auth.uid() = user_id);

create policy "Users can update recurring rules" on public.recurring_rules
  for update using (auth.uid() = user_id);

create policy "Users can delete recurring rules" on public.recurring_rules
  for delete using (auth.uid() = user_id);
