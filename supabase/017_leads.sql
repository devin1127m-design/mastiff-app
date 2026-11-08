-- The pilot form on the public site. Anyone may submit one; only staff read them.
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  firm text not null,
  email text not null,
  phone text not null,
  payments_per_month int,
  note text,
  source text not null default 'site',
  status text not null default 'new' check (status in ('new','called','pilot','declined')),
  created_at timestamptz not null default now()
);
alter table leads enable row level security;
create policy leads_insert_anyone on leads for insert to anon, authenticated with check (true);
create policy leads_staff on leads for all using (is_staff()) with check (is_staff());
