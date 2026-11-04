-- Applied to production 2026-11-04. Look-back scans and the marks a person puts on flagged rows.
create table if not exists lookbacks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  filename text not null,
  uploaded_by text not null,
  payments int not null,
  months int not null,
  first_date date,
  last_date date,
  held int not null default 0,
  need_call int not null default 0,
  masked int not null default 0,
  skipped int not null default 0,
  mapping jsonb not null default '{}',
  flags jsonb not null default '[]',
  money jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists lookbacks_org on lookbacks(org_id, created_at desc);

create table if not exists lookback_marks (
  lookback_id uuid not null references lookbacks(id) on delete cascade,
  row int not null,
  mark text not null check (mark in ('to_verify','verified_fine','legitimate_repeat','wrong_vendor_match','confirmed_issue','recovered')),
  note text,
  amount_recovered numeric(12,2),
  marked_by text not null,
  marked_at timestamptz not null default now(),
  primary key (lookback_id, row)
);

alter table lookbacks enable row level security;
alter table lookback_marks enable row level security;
create policy lookbacks_read on lookbacks for select using (is_staff() or org_id in (select my_org_ids()));
create policy lookbacks_insert on lookbacks for insert with check (is_staff() or org_id in (select my_org_ids()));
create policy lookbacks_delete on lookbacks for delete using (is_staff());
create policy marks_read on lookback_marks for select using (
  is_staff() or lookback_id in (select id from lookbacks where org_id in (select my_org_ids())));
create policy marks_write on lookback_marks for all using (
  is_staff() or lookback_id in (select id from lookbacks where org_id in (select my_org_ids())))
  with check (is_staff() or lookback_id in (select id from lookbacks where org_id in (select my_org_ids())));
