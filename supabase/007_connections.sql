-- Step 7: QuickBooks Online, read only. The owner connects with their own login;
-- Mastiff pulls vendors and unpaid bills. Nothing is ever written back.
-- Tokens are the owner's: only owner-role members of the office (and the server
-- actions they run) can read or refresh them. Staff never see them.

create table if not exists connections (
  org_id uuid not null references orgs(id) on delete cascade,
  provider text not null check (provider in ('qbo')),
  realm_id text not null,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  refresh_expires_at timestamptz,
  connected_by text not null,
  connected_at timestamptz not null default now(),
  last_pulled_at timestamptz,
  last_result text,
  primary key (org_id, provider)
);
alter table connections enable row level security;
create policy connections_owner on connections for all
  using (org_id in (select org_id from memberships where user_id = auth.uid() and role = 'owner'))
  with check (org_id in (select org_id from memberships where user_id = auth.uid() and role = 'owner'));

-- A pulled bill is a request like any other; external_id stops it being pulled twice.
alter table requests drop constraint if exists requests_source_check;
alter table requests add constraint requests_source_check
  check (source in ('form','email','upload','photo','qbo'));
alter table requests add column if not exists external_id text;
create unique index if not exists requests_external on requests(org_id, external_id) where external_id is not null;
alter table requests add column if not exists due_date date;
