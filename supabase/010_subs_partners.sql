-- Step 9: construction add-ons. Certificate dates and the last lien waiver live on
-- the vendor row. Cautions only; nothing here holds a payment.
alter table vendors add column if not exists is_sub boolean not null default false;
alter table vendors add column if not exists gl_expires date;
alter table vendors add column if not exists wc_expires date;
alter table vendors add column if not exists wc_exempt boolean not null default false;
alter table vendors add column if not exists auto_expires date;
alter table vendors add column if not exists additional_insured boolean;
alter table vendors add column if not exists waiver_through date;

-- Step 10: partner portal. A bookkeeping firm sees all its client offices in one view.
-- Partner members get the same access to a client office as that office's own
-- bookkeeper, through my_org_ids(); the office still owns its file and log.
create table if not exists partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);
create table if not exists partner_members (
  user_id uuid not null references auth.users(id) on delete cascade,
  partner_id uuid not null references partners(id) on delete cascade,
  name text not null,
  primary key (user_id, partner_id)
);
alter table orgs add column if not exists partner_id uuid references partners(id) on delete set null;

alter table partners enable row level security;
alter table partner_members enable row level security;
create policy partners_read on partners for select using (is_staff() or id in (select partner_id from partner_members where user_id = auth.uid()));
create policy partners_write on partners for all using (is_staff()) with check (is_staff());
create policy partner_members_read on partner_members for select using (is_staff() or user_id = auth.uid() or partner_id in (select partner_id from partner_members where user_id = auth.uid()));
create policy partner_members_write on partner_members for all using (is_staff()) with check (is_staff());

create or replace function my_partner_ids() returns setof uuid language sql stable as $$
  select partner_id from partner_members where user_id = auth.uid();
$$;
create or replace function my_org_ids() returns setof uuid language sql stable as $$
  select org_id from memberships where user_id = auth.uid()
  union
  select id from orgs where partner_id in (select partner_id from partner_members where user_id = auth.uid());
$$;

-- Invites can also make someone a partner member.
alter table invites add column if not exists partner_id uuid references partners(id) on delete cascade;
alter table invites alter column org_id drop not null;
alter table invites drop constraint if exists invites_role_check;
alter table invites add constraint invites_role_check check (role in ('owner','bookkeeper','approver','partner'));

create or replace function claim_invites() returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  with mine as (
    select i.id, i.org_id, i.partner_id, i.role, i.name from invites i
    where lower(i.email) = lower(coalesce(auth.jwt() ->> 'email', '')) and i.claimed_at is null
  ), ins as (
    insert into memberships (user_id, org_id, role, name)
    select auth.uid(), org_id, role, name from mine where org_id is not null and role <> 'partner'
    on conflict (user_id, org_id) do update set role = excluded.role, name = excluded.name
    returning org_id
  ), pins as (
    insert into partner_members (user_id, partner_id, name)
    select auth.uid(), partner_id, name from mine where partner_id is not null
    on conflict (user_id, partner_id) do update set name = excluded.name
    returning partner_id
  )
  update invites set claimed_at = now() where id in (select id from mine);
  get diagnostics n = row_count;
  return n;
end $$;
