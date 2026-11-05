-- One thread per office: questions and instructions in the same place (steps 4 and 8 together).
-- The model answers from the office's own records; an instruction becomes a proposal the owner confirms in the thread.
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  role text not null check (role in ('user','mastiff')),
  by_name text,                                  -- who typed it (user rows)
  text text not null,
  instruction_id uuid references instructions(id) on delete set null,  -- when the reply carries a proposal
  created_at timestamptz not null default now()
);
create index if not exists messages_org on messages(org_id, created_at);
alter table messages enable row level security;
create policy messages_read on messages for select using (is_staff() or org_id in (select my_org_ids()));
create policy messages_insert on messages for insert with check (is_staff() or org_id in (select my_org_ids()));
