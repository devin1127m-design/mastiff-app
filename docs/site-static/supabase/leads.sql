-- Run this in the Supabase SQL editor.
-- Emailing Devin on each new lead is configured in Supabase (Database Webhook to Resend); see ../TODO.md.

create table if not exists leads (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  name text,
  firm text,
  email text,
  phone text,
  payments_per_month text,
  note text,
  source text
);

alter table leads enable row level security;

-- The public site (anon role) may insert only. No select, update or delete policy exists for anon.
create policy "anon can insert leads" on leads
  for insert to anon
  with check (true);

revoke all on leads from anon;
grant insert on leads to anon;
