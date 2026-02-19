-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create tenants table
create table tenants (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  company_name text not null,
  subscription_tier integer not null check (subscription_tier in (1, 2)), -- 1: Basic, 2: Pro
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for tenants
alter table tenants enable row level security;

create policy "Users can operate on their own tenant."
  on tenants for all
  using (auth.uid() = user_id);


-- Create leads table
create table leads (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references tenants(id) on delete cascade not null,
  name text,
  phone text,
  email text,
  status text default 'new',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for leads
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

create policy "Users can insert leads into their tenant."
  on leads for insert
  with check (
    exists (
      select 1 from tenants
      where tenants.id = leads.tenant_id
      and tenants.user_id = auth.uid()
    )
  );


-- Create messages table (for chat history)
create table messages (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references tenants(id) on delete cascade not null,
  lead_id uuid references leads(id) on delete set null,
  content text not null,
  sender_type text check (sender_type in ('user', 'ai', 'lead')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for messages
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


-- Create products table with vector embedding
create table products (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references tenants(id) on delete cascade not null,
  name text not null,
  description text,
  price numeric,
  embedding vector(1536), -- Assuming OpenAI embedding size, adjust if using different model
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for products
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

-- Create index for vector similarity search
create index on products using ivfflat (embedding vector_cosine_ops)
with (lists = 100);
