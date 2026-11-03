-- Invites: staff add an email + office + role. When that person signs in, claim_invites() turns it into a membership.
create table if not exists invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  org_id uuid not null references orgs(id) on delete cascade,
  role text not null check (role in ('owner','bookkeeper','approver')),
  name text not null,
  created_at timestamptz not null default now(),
  claimed_at timestamptz,
  unique (email, org_id)
);
alter table invites enable row level security;
create policy invites_staff on invites for all using (is_staff()) with check (is_staff());

create or replace function claim_invites() returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  with mine as (
    select i.id, i.org_id, i.role, i.name from invites i
    where lower(i.email) = lower(coalesce(auth.jwt() ->> 'email', '')) and i.claimed_at is null
  ), ins as (
    insert into memberships (user_id, org_id, role, name)
    select auth.uid(), org_id, role, name from mine
    on conflict (user_id, org_id) do update set role = excluded.role, name = excluded.name
    returning org_id
  )
  update invites set claimed_at = now() where id in (select id from mine);
  get diagnostics n = row_count;
  return n;
end $$;
grant execute on function claim_invites() to authenticated;
