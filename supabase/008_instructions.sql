-- Step 8: instructions to Mastiff. The owner writes a sentence; the model turns it
-- into one of a fixed set of settings; plain code checks it; the owner confirms;
-- only then is anything applied. The model never changes a rule on its own.

create table if not exists instructions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  text text not null,                       -- the owner's words
  proposal jsonb,                           -- what the model understood, after checking
  summary text,                             -- plain words: what will change if confirmed
  status text not null default 'proposed' check (status in ('proposed','confirmed','declined','unclear')),
  asked_by text not null,
  decided_by text,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists instructions_org on instructions(org_id, created_at desc);
alter table instructions enable row level security;
create policy instructions_read on instructions for select using (is_staff() or org_id in (select my_org_ids()));
create policy instructions_write on instructions for all
  using (org_id in (select org_id from memberships where user_id = auth.uid() and role in ('owner','approver')))
  with check (org_id in (select org_id from memberships where user_id = auth.uid() and role in ('owner','approver')));

-- Two per-vendor settings an instruction can set. Neither changes a verdict:
-- pass_under lets a confident read of a small bill from this vendor skip the tap
-- even outside the usual range; note is shown beside the vendor on every request.
alter table vendors add column if not exists pass_under numeric(12,2);
alter table vendors add column if not exists instructions text;
