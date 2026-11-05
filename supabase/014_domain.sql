-- The domain is mastiffdesk.com. The forwarding address is <slug>@requests.mastiffdesk.com
-- and the links in hold and callback emails point at the app there.
alter table orgs drop column if exists inbound_email;
alter table orgs add column inbound_email text generated always as (slug || '@requests.mastiffdesk.com') stored;

create or replace function queue_hold_notification() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.verdict = 'hold' then
    insert into notifications (org_id, request_id, kind, to_email, subject, body)
    select new.org_id, new.id, 'hold', u.email, 'Hold: ' || new.payee || ' $' || to_char(new.amount, 'FM999,999,990.00'),
      'A payment request would have held.' || E'\n\n' || 'Payee: ' || new.payee || E'\n' || 'Amount: $' || to_char(new.amount, 'FM999,999,990.00') || E'\n' ||
      'Why: ' || coalesce(new.reasons[1], '') || E'\n\n' || 'Mastiff calls the number on file and logs what was said. Your firm makes every payment decision.' || E'\n' ||
      'Open it: https://mastiffdesk.com/app/requests/' || new.id
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
    'Your firm makes the decision. Record it here: https://mastiffdesk.com/app/requests/' || r.id
  from memberships m join auth.users u on u.id = m.user_id where m.org_id = r.org_id;
  return new;
end $$;
