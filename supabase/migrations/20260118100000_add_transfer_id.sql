alter table transactions
add column if not exists transfer_id uuid;

create index if not exists transactions_transfer_id_idx
  on transactions (transfer_id);
