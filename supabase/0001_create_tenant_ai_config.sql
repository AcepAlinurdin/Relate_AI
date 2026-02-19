-- Create tenant_ai_config table
create table tenant_ai_config (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references tenants(id) on delete cascade not null unique,
  question_1 text,
  question_2 text,
  question_3 text,
  question_4 text,
  question_5 text,
  additional_details text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for tenant_ai_config
alter table tenant_ai_config enable row level security;

create policy "Users can view their own tenant AI config."
  on tenant_ai_config for select
  using (
    exists (
      select 1 from tenants
      where tenants.id = tenant_ai_config.tenant_id
      and tenants.user_id = auth.uid()
    )
  );

create policy "Users can insert/update their own tenant AI config."
  on tenant_ai_config for all
  using (
    exists (
      select 1 from tenants
      where tenants.id = tenant_ai_config.tenant_id
      and tenants.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from tenants
      where tenants.id = tenant_ai_config.tenant_id
      and tenants.user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

create trigger update_tenant_ai_config_updated_at
before update on tenant_ai_config
for each row
execute procedure update_updated_at_column();
