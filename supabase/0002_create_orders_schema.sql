-- Create orders table
create table orders (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references tenants(id) on delete cascade not null,
  lead_id uuid references leads(id) on delete set null,
  total_amount numeric not null default 0,
  status text check (status in ('pending', 'paid', 'processing', 'completed', 'cancelled')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create order_items table
create table order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references orders(id) on delete cascade not null,
  product_id uuid references products(id) on delete set null,
  quantity integer not null default 1,
  price numeric not null default 0, -- Price at the time of order
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for orders
alter table orders enable row level security;

create policy "Users can view their own tenant orders."
  on orders for select
  using (
    exists (
      select 1 from tenants
      where tenants.id = orders.tenant_id
      and tenants.user_id = auth.uid()
    )
  );

create policy "Users can update their own tenant orders."
  on orders for update
  using (
    exists (
      select 1 from tenants
      where tenants.id = orders.tenant_id
      and tenants.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from tenants
      where tenants.id = orders.tenant_id
      and tenants.user_id = auth.uid()
    )
  );

-- RLS for order_items
alter table order_items enable row level security;

create policy "Users can view their own tenant order items."
  on order_items for select
  using (
    exists (
      select 1 from orders
      join tenants on tenants.id = orders.tenant_id
      where orders.id = order_items.order_id
      and tenants.user_id = auth.uid()
    )
  );
