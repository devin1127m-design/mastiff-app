-- my_org_ids() now reads orgs, whose policy calls my_org_ids(): security definer so the policy check never recurses.
create or replace function my_org_ids() returns setof uuid language sql stable security definer set search_path = public as $$
  select org_id from memberships where user_id = auth.uid()
  union
  select id from orgs where partner_id in (select partner_id from partner_members where user_id = auth.uid());
$$;
create or replace function my_partner_ids() returns setof uuid language sql stable security definer set search_path = public as $$
  select partner_id from partner_members where user_id = auth.uid();
$$;
