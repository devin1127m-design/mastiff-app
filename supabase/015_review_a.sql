-- Review 2026-11-05, block A and B6/B7 data.
-- A1: the owner can change the office's own settings.
create policy orgs_owner_update on orgs for update
  using (id in (select org_id from memberships where user_id = auth.uid() and role = 'owner'))
  with check (id in (select org_id from memberships where user_id = auth.uid() and role = 'owner'));

-- A3: decisions are the owner's or approver's; the role is enforced here, not only in the page.
alter policy decisions_write on decisions with check (
  is_staff() or request_id in (
    select r.id from requests r join memberships m on m.org_id = r.org_id
    where m.user_id = auth.uid() and m.role in ('owner','approver')));

-- A4: nobody queues mail through the API. The triggers (security definer) and the
-- secret-checked notifications_queue() are the only writers.
alter policy notifications_insert on notifications with check (false);

-- A5: every office has a time zone; rules and every shown time use it.
alter table orgs add column if not exists timezone text not null default 'America/Detroit';

-- B6: the email route needs the office's members and each vendor's known sender domains
-- to decide whether an emailed invoice may go straight through.
create or replace function org_for_inbound(p_secret text, p_to text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare o record; v jsonb; mem jsonb; dom jsonb;
begin
  if p_secret is distinct from (select value from webhook_secrets where name = 'inbound') then
    raise exception 'bad secret';
  end if;
  select id, name, single_cap, range_multiple, hours_start, hours_end, timezone into o
    from orgs where slug = split_part(lower(p_to), '@', 1) limit 1;
  if o.id is null then return null; end if;
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'name', name, 'name_key', name_key, 'account_last4', account_last4, 'usual_min', usual_min, 'usual_max', usual_max, 'pass_under', pass_under)), '[]') into v
    from vendors where org_id = o.id;
  select coalesce(jsonb_agg(lower(u.email)), '[]') into mem
    from memberships m join auth.users u on u.id = m.user_id where m.org_id = o.id;
  select coalesce(jsonb_object_agg(vendor_id, domains), '{}') into dom from (
    select r.vendor_id, jsonb_agg(distinct lower(split_part(e.from_email, '@', 2))) as domains
    from inbound_emails e join requests r on r.id = e.request_id
    where e.org_id = o.id and r.vendor_id is not null and r.status in ('passed','confirmed','released')
    group by r.vendor_id) x;
  return jsonb_build_object('id', o.id, 'name', o.name, 'single_cap', o.single_cap, 'range_multiple', o.range_multiple,
    'hours_start', o.hours_start, 'hours_end', o.hours_end, 'timezone', o.timezone, 'vendors', v, 'members', mem, 'sender_domains', dom);
end $$;

-- C13: every outbound email ends with the sentence.
create or replace function queue_hold_notification() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.verdict = 'hold' then
    insert into notifications (org_id, request_id, kind, to_email, subject, body)
    select new.org_id, new.id, 'hold', u.email, 'Would have held: ' || new.payee || ' $' || to_char(new.amount, 'FM999,999,990.00'),
      'A payment request would have held.' || E'\n\n' || 'Payee: ' || new.payee || E'\n' || 'Amount: $' || to_char(new.amount, 'FM999,999,990.00') || E'\n' ||
      'Why: ' || coalesce(new.reasons[1], '') || E'\n\n' || 'Mastiff calls the number on file and logs what was said.' || E'\n' ||
      'Open it: https://mastiffdesk.com/app/requests/' || new.id || E'\n\n' || 'Mastiff flags. Your firm makes every payment decision.'
    from memberships m join auth.users u on u.id = m.user_id where m.org_id = new.org_id;
  end if;
  return new;
end $$;

create or replace function queue_callback_notification() returns trigger language plpgsql security definer set search_path = public as $$
declare r record;
begin
  select id, org_id, payee, amount into r from requests where id = new.request_id;
  insert into notifications (org_id, request_id, kind, to_email, subject, body)
  select r.org_id, r.id, 'callback', u.email, 'Callback: ' || r.payee || ' — ' || replace(new.outcome, '_', ' '),
    'Mastiff called ' || new.number_called || ' (the number on file) about ' || r.payee || ' $' || to_char(r.amount, 'FM999,999,990.00') || '.' || E'\n\n' ||
    'Who answered: ' || coalesce(new.who_answered, '—') || E'\n' || 'What was said: ' || coalesce(new.what_said, '—') || E'\n' || 'Outcome: ' || replace(new.outcome, '_', ' ') || E'\n\n' ||
    'Record your decision here: https://mastiffdesk.com/app/requests/' || r.id || E'\n\n' || 'Mastiff flags. Your firm makes every payment decision.'
  from memberships m join auth.users u on u.id = m.user_id where m.org_id = r.org_id;
  return new;
end $$;
