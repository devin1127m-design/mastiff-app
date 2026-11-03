-- Mastiff v1 schema. Run once in the Supabase SQL editor.
-- Last-four digits only. No full account numbers, ever (enforced by check constraints).

create extension if not exists "pgcrypto";

-- Staff flag: Mastiff's own people (Devin, callers). Everyone else is an office member.
create table if not exists staff (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  inbound_email text generated always as (slug || '@requests.mastiff.app') stored,
  single_cap numeric(12,2) not null default 5000,
  range_multiple numeric(4,2) not null default 2.0,
  hours_start int not null default 7,   -- 7 am
  hours_end int not null default 19,    -- 7 pm
  created_at timestamptz not null default now()
);

create table if not exists memberships (
  user_id uuid not null references auth.users(id) on delete cascade,
  org_id uuid not null references orgs(id) on delete cascade,
  role text not null check (role in ('owner','bookkeeper','approver')),
  name text not null,
  primary key (user_id, org_id)
);

create table if not exists vendors (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  name text not null,
  name_key text not null,
  callback_phone text,
  phone_on_file_since date,
  account_last4 text check (account_last4 is null or account_last4 ~ '^[0-9]{4}$'),
  usual_min numeric(12,2),
  usual_max numeric(12,2),
  verified_at timestamptz,
  verified_by text,
  notes text,
  created_at timestamptz not null default now(),
  unique (org_id, name_key)
);

create table if not exists requests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  payee text not null,
  amount numeric(12,2) not null check (amount > 0),
  account_last4 text check (account_last4 is null or account_last4 ~ '^[0-9]{4}$'),
  invoice_no text,
  note text,
  source text not null default 'form' check (source in ('form','email')),
  submitted_by text not null,
  verdict text not null check (verdict in ('pass','hold')),
  reasons text[] not null default '{}',
  cautions text[] not null default '{}',
  vendor_id uuid references vendors(id),
  status text not null default 'open'
    check (status in ('passed','open','confirmed','not_confirmed','released','rejected')),
  created_at timestamptz not null default now()
);

create table if not exists callbacks (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references requests(id) on delete cascade,
  called_at timestamptz not null default now(),
  number_called text not null,
  who_answered text,
  what_said text,
  outcome text not null check (outcome in ('confirmed','not_confirmed','no_answer')),
  by_name text not null
);

create table if not exists decisions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references requests(id) on delete cascade,
  decided_by text not null,
  decision text not null check (decision in ('pay','change','reject')),
  note text,
  decided_at timestamptz not null default now()
);

create index if not exists requests_org_created on requests(org_id, created_at desc);
create index if not exists requests_open on requests(status) where status = 'open';

-- Row level security
alter table staff enable row level security;
alter table orgs enable row level security;
alter table memberships enable row level security;
alter table vendors enable row level security;
alter table requests enable row level security;
alter table callbacks enable row level security;
alter table decisions enable row level security;

create or replace function is_staff() returns boolean language sql stable as $$
  select exists (select 1 from staff where user_id = auth.uid());
$$;

create or replace function my_org_ids() returns setof uuid language sql stable as $$
  select org_id from memberships where user_id = auth.uid();
$$;

create policy staff_self on staff for select using (user_id = auth.uid());

create policy orgs_read on orgs for select using (is_staff() or id in (select my_org_ids()));
create policy orgs_write on orgs for all using (is_staff()) with check (is_staff());

create policy memberships_read on memberships for select using (is_staff() or user_id = auth.uid() or org_id in (select my_org_ids()));
create policy memberships_write on memberships for all using (is_staff()) with check (is_staff());

create policy vendors_read on vendors for select using (is_staff() or org_id in (select my_org_ids()));
create policy vendors_write on vendors for all using (is_staff() or org_id in (select my_org_ids())) with check (is_staff() or org_id in (select my_org_ids()));

create policy requests_read on requests for select using (is_staff() or org_id in (select my_org_ids()));
create policy requests_insert on requests for insert with check (is_staff() or org_id in (select my_org_ids()));
create policy requests_update on requests for update using (is_staff() or org_id in (select my_org_ids()));

create policy callbacks_read on callbacks for select using (
  is_staff() or request_id in (select id from requests where org_id in (select my_org_ids())));
create policy callbacks_write on callbacks for insert with check (is_staff());

create policy decisions_read on decisions for select using (
  is_staff() or request_id in (select id from requests where org_id in (select my_org_ids())));
create policy decisions_write on decisions for insert with check (
  request_id in (select id from requests where org_id in (select my_org_ids())));
