-- Enable Extensions
create extension if not exists vector;

-- 1. TENANTS (TABLE)
-- Dasar isolasi data untuk multi-tenancy
create table tenants (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  company_name text not null,
  subscription_tier integer not null check (subscription_tier in (1, 2)), -- 1: Basic, 2: Pro
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table tenants enable row level security;

create policy "Users can operate on their own tenant."
  on tenants for all
  using (auth.uid() = user_id);


-- 2. CHANNELS (TABLE - NEW)
-- Menyimpan konfigurasi koneksi ke WA, IG, Web, dll.
create table channels (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references tenants(id) on delete cascade not null,
  type text check (type in ('wa_official', 'wa_waha', 'instagram', 'web', 'telegram')),  
  name text not null, -- e.g. "WA Admin 1"
  config jsonb default '{}'::jsonb, -- token, webhook_url, session_id
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table channels enable row level security;

create policy "Users can manage their tenant channels."
  on channels for all
  using (
    exists (
      select 1 from tenants
      where tenants.id = channels.tenant_id
      and tenants.user_id = auth.uid()
    )
  );


-- 3. LEADS (TABLE - UPDATED)
-- Data calon pelanggan dengan scoring dan profil
create table leads (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references tenants(id) on delete cascade not null,
  name text,
  phone text,
  email text,
  status text default 'new', -- new, warm, hot, closed, lost
  score integer default 0, -- AI Lead Scoring (0-100)
  channel_source text, -- wa, ig, web (channel pertama kali masuk)
  social_id text, -- ID unik misal: 62812345678 (WA) atau username IG
  tags text[], -- ['vip', 'promo_hunter']
  notes text,
  last_interaction_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table leads enable row level security;

create policy "Users can view leads belonging to their tenant."
  on leads for select
  using (
    exists (
      select 1 from tenants
      where tenants.id = leads.tenant_id
      and tenants.user_id = auth.uid()
    )
  );

create policy "Users can modify leads belonging to their tenant."
  on leads for all
  using (
    exists (
      select 1 from tenants
      where tenants.id = leads.tenant_id
      and tenants.user_id = auth.uid()
    )
  );


-- 4. CONVERSATIONS (TABLE - NEW/OPTIONAL)
-- Mengelompokkan sesi chat (Tiket) atau Thread
create table conversations (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references tenants(id) on delete cascade not null,
  lead_id uuid references leads(id) on delete cascade not null,
  channel_id uuid references channels(id) on delete set null,
  status text default 'open', -- open, closed, archived
  last_message_preview text,
  unread_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table conversations enable row level security;

create policy "Users can access conversations for their tenant."
  on conversations for all
  using (
    exists (
      select 1 from tenants
      where tenants.id = conversations.tenant_id
      and tenants.user_id = auth.uid()
    )
  );


-- 5. MESSAGES (TABLE - UPDATED)
-- Log chat detail
create table messages (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references tenants(id) on delete cascade not null,
  conversation_id uuid references conversations(id) on delete cascade not null,
  content text not null,
  sender_type text check (sender_type in ('user', 'ai', 'lead', 'system')),
  metadata jsonb, -- e.g. message_id from WA, status (sent/read)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table messages enable row level security;

create policy "Users can access messages for their tenant."
  on messages for all
  using (
    exists (
      select 1 from tenants
      where tenants.id = messages.tenant_id
      and tenants.user_id = auth.uid()
    )
  );


-- 6. PRODUCTS (TABLE - WITH AI)
-- Produk untuk dijual dan embedding untuk AI search
create table products (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references tenants(id) on delete cascade not null,
  name text not null,
  description text,
  price numeric default 0,
  stock integer default 0,
  image_url text,
  embedding vector(1536), -- Vector untuk semantic search AI
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table products enable row level security;

create policy "Users can access products for their tenant."
  on products for all
  using (
    exists (
      select 1 from tenants
      where tenants.id = products.tenant_id
      and tenants.user_id = auth.uid()
    )
  );

create index on products using ivfflat (embedding vector_cosine_ops)
with (lists = 100);


-- 7. ORDERS (TABLE)
-- Transaksi penjualan
create table orders (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references tenants(id) on delete cascade not null,
  lead_id uuid references leads(id) on delete set null,
  total_amount numeric not null default 0,
  status text check (status in ('pending', 'paid', 'processing', 'completed', 'cancelled')) default 'pending',
  payment_status text default 'unpaid',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table orders enable row level security;

create policy "Users can access their tenant orders."
  on orders for all
  using (
    exists (
      select 1 from tenants
      where tenants.id = orders.tenant_id
      and tenants.user_id = auth.uid()
    )
  );


-- 8. ORDER ITEMS (TABLE)
create table order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references orders(id) on delete cascade not null,
  product_id uuid references products(id) on delete set null,
  quantity integer not null default 1,
  price numeric not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table order_items enable row level security;

create policy "Users can access their tenant order items."
  on order_items for all
  using (
    exists (
      select 1 from orders
      join tenants on tenants.id = orders.tenant_id
      where orders.id = order_items.order_id
      and tenants.user_id = auth.uid()
    )
  );


-- 9. PAYMENTS (TABLE - NEW)
-- Integrasi Payment Gateway
create table payments (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references tenants(id) on delete cascade not null,
  order_id uuid references orders(id) on delete cascade not null,
  amount numeric not null,
  provider text, -- 'moota', 'midtrans', 'tripay'
  external_id text, -- ID transaksi dari provider
  payment_link text,
  status text default 'pending', -- pending, paid, failed, expired
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table payments enable row level security;

create policy "Users can access their tenant payments."
  on payments for all
  using (
    exists (
      select 1 from tenants
      where tenants.id = payments.tenant_id
      and tenants.user_id = auth.uid()
    )
  );


-- 10. TENANT AI CONFIG (TABLE)
-- Konfigurasi kepribadian AI
create table tenant_ai_config (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references tenants(id) on delete cascade not null unique,
  persona_name text default 'Sales Assistant',
  tone text default 'friendly', -- friendly, professional, enthusiastic
  language text default 'id', -- id, en
  knowledge_base jsonb default '{}'::jsonb, -- FAQ, Do's & Don'ts
  closing_template text,
  is_active boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table tenant_ai_config enable row level security;

create policy "Users can manage their tenant AI config."
  on tenant_ai_config for all
  using (
    exists (
      select 1 from tenants
      where tenants.id = tenant_ai_config.tenant_id
      and tenants.user_id = auth.uid()
    )
  );


-- TRIGGERS (Auto Update Timestamp)
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

create trigger update_orders_updated_at before update on orders for each row execute procedure update_updated_at_column();
create trigger update_conversations_updated_at before update on conversations for each row execute procedure update_updated_at_column();
create trigger update_tenant_ai_config_updated_at before update on tenant_ai_config for each row execute procedure update_updated_at_column();
create trigger update_payments_updated_at before update on payments for each row execute procedure update_updated_at_column();
