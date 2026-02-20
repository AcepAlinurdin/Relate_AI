-- Add subscription status to tenants table
alter table tenants 
add column subscription_status text check (subscription_status in ('active', 'pending_payment', 'expired', 'cancelled')) default 'pending_payment',
add column subscription_end_date timestamp with time zone;

-- Update existing tenants to active (optional, for existing dev data)
update tenants set subscription_status = 'active' where subscription_status is null;
