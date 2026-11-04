-- org_for_inbound() also hands the email route each vendor's pass_under (step 8).
create or replace function org_for_inbound(p_secret text, p_to text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare o record; v jsonb;
begin
  if p_secret is distinct from (select value from webhook_secrets where name = 'inbound') then
    raise exception 'bad secret';
  end if;
  select id, name, single_cap, range_multiple, hours_start, hours_end into o
    from orgs where slug = split_part(lower(p_to), '@', 1) limit 1;
  if o.id is null then return null; end if;
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'name', name, 'name_key', name_key, 'account_last4', account_last4, 'usual_min', usual_min, 'usual_max', usual_max, 'pass_under', pass_under)), '[]') into v
    from vendors where org_id = o.id;
  return jsonb_build_object('id', o.id, 'name', o.name, 'single_cap', o.single_cap, 'range_multiple', o.range_multiple,
    'hours_start', o.hours_start, 'hours_end', o.hours_end, 'vendors', v);
end $$;
