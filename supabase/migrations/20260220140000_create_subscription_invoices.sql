-- Create Subscription Invoices Table
-- Tracks upgrade history and unique payment codes for Moota verification

create table subscription_invoices (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references tenants(id) on delete cascade not null,
  target_tier integer not null, -- The tier they are upgrading to (e.g., 2 for Pro)
  amount numeric not null, -- Total amount including unique code
  unique_code integer not null, -- The last 3 digits for verification
  status text check (status in ('pending', 'paid', 'expired', 'failed')) default 'pending',
  payment_method text default 'bank_transfer',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Security Policies
alter table subscription_invoices enable row level security;

create policy "Users can view their own subscription invoices"
  on subscription_invoices for select
  using (
    exists (
      select 1 from tenants
      where tenants.id = subscription_invoices.tenant_id
      and tenants.user_id = auth.uid()
    )
  );

-- Auto Update Timestamp
create trigger update_subscription_invoices_updated_at
  before update on subscription_invoices
  for each row execute procedure update_updated_at_column();
