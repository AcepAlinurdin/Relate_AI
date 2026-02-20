-- Add configuration columns to tenants table
alter table tenants 
add column bank_name text,
add column bank_account_number text,
add column bank_account_holder text,
add column waha_url text,
add column waha_token text,
add column telegram_bot_token text;
