-- Steps 1 and 2: mail in, mail out.
--
-- In: Resend delivers each email to <slug>@requests.<domain> as a webhook. The
-- app route (src/app/api/inbound/route.ts) verifies the signature, pulls the
-- attachment, reads it with the model, runs the rules in TypeScript, then files
-- the result through receive_email(). The route has no user session and never
-- uses the service key: these two functions are security definer and require a
-- shared secret held in webhook_secrets, a table nobody can read through the API.
--
-- Out: notifications is a queue. Actions insert rows; a cron route sends what
-- is pending through Resend. Silence means Pass.

create table if not exists webhook_secrets (
  name text primary key,
  value text not null
);
alter table webhook_secrets enable row level security;  -- no policies: unreadable through the API

create table if not exists inbound_emails (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references orgs(id) on delete set null,     -- null when no office matched
  provider_id text unique,                                 -- Resend email id, stops double delivery
  from_email text not null,
  to_email text not null,
  subject text,
  body_text text,
  attachments jsonb not null default '[]',                 -- [{name, mime, path}] paths in the invoices bucket
  status text not null default 'new' check (status in ('new','filed','no_attachment','no_office')),
  intake_id uuid references intakes(id) on delete set null,
  request_id uuid references requests(id) on delete set null,
  received_at timestamptz not null default now()
);
create index if not exists inbound_emails_org on inbound_emails(org_id, received_at desc);
alter table inbound_emails enable row level security;
create policy inbound_read on inbound_emails for select using (is_staff() or org_id in (select my_org_ids()));

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  request_id uuid references requests(id) on delete cascade,
  kind text not null check (kind in ('hold','callback','digest')),
  to_email text not null,
  subject text not null,
  body text not null,
  status text not null default 'pending' check (status in ('pending','sent','failed','skipped')),
  error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index if not exists notifications_pending on notifications(created_at) where status = 'pending';
alter table notifications enable row level security;
create policy notifications_read on notifications for select using (is_staff() or org_id in (select my_org_ids()));
create policy notifications_insert on notifications for insert with check (is_staff() or org_id in (select my_org_ids()));

-- Email arriving with a file: the route uploads it under inbound/ before any row exists.
-- Anyone with the anon key can put a file there; nobody can read it until a row in
-- intakes or requests points at it, and then only that office and staff.
create policy invoices_inbound_insert on storage.objects for insert to anon
  with check (bucket_id = 'invoices' and (storage.foldername(name))[1] = 'inbound');
alter policy invoices_read on storage.objects using (
  bucket_id = 'invoices' and (
    is_staff()
    or ((storage.foldername(name))[1] <> 'inbound' and (storage.foldername(name))[1]::uuid in (select my_org_ids()))
    or exists (select 1 from intakes i where i.image_path = name and i.org_id in (select my_org_ids()))
    or exists (select 1 from requests r where r.image_path = name and r.org_id in (select my_org_ids()))
  )
);

-- What the route needs to run the rules for the office an address belongs to.
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
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'name', name, 'name_key', name_key, 'account_last4', account_last4, 'usual_min', usual_min, 'usual_max', usual_max)), '[]') into v
    from vendors where org_id = o.id;
  return jsonb_build_object('id', o.id, 'name', o.name, 'single_cap', o.single_cap, 'range_multiple', o.range_multiple,
    'hours_start', o.hours_start, 'hours_end', o.hours_end, 'vendors', v);
end $$;

-- File what the route worked out. Either a straight-through request, or an intake waiting for a tap.
create or replace function receive_email(
  p_secret text, p_provider_id text, p_from text, p_to text, p_subject text, p_body text,
  p_attachments jsonb, p_org_id uuid, p_image_path text,
  p_extracted jsonb, p_confidence numeric, p_tap_reason text, p_read_error text,
  p_verdict text, p_reasons text[], p_cautions text[], p_vendor_id uuid, p_straight_through boolean
) returns jsonb language plpgsql security definer set search_path = public as $$
declare e_id uuid; i_id uuid; r_id uuid; st text;
begin
  if p_secret is distinct from (select value from webhook_secrets where name = 'inbound') then
    raise exception 'bad secret';
  end if;
  if exists (select 1 from inbound_emails where provider_id = p_provider_id) then
    return jsonb_build_object('duplicate', true);
  end if;
  st := case when p_org_id is null then 'no_office' when p_image_path is null then 'no_attachment' else 'filed' end;
  insert into inbound_emails (org_id, provider_id, from_email, to_email, subject, body_text, attachments, status)
    values (p_org_id, p_provider_id, p_from, p_to, p_subject, left(p_body, 20000), coalesce(p_attachments, '[]'), st)
    returning id into e_id;
  if st <> 'filed' then return jsonb_build_object('email_id', e_id, 'status', st); end if;

  if p_straight_through then
    insert into requests (org_id, payee, amount, account_last4, invoice_no, note, source, submitted_by, verdict, reasons, cautions, vendor_id, status, image_path, extracted, read_confidence, straight_through)
      values (p_org_id, p_extracted->>'payee', (p_extracted->>'amount')::numeric, p_extracted->>'account_last4', p_extracted->>'invoice_no', p_extracted->>'notes',
              'email', 'Mastiff (forwarded by ' || p_from || ')', p_verdict, coalesce(p_reasons, '{}'), coalesce(p_cautions, '{}'), p_vendor_id, 'passed',
              p_image_path, p_extracted, p_confidence, true)
      returning id into r_id;
    update inbound_emails set request_id = r_id where id = e_id;
    return jsonb_build_object('email_id', e_id, 'request_id', r_id, 'status', 'filed');
  end if;

  insert into intakes (org_id, image_path, source, extracted, read_confidence, needs_tap_because, read_error, created_by)
    values (p_org_id, p_image_path, 'email', p_extracted, p_confidence, p_tap_reason, p_read_error, p_from)
    returning id into i_id;
  update inbound_emails set intake_id = i_id where id = e_id;
  return jsonb_build_object('email_id', e_id, 'intake_id', i_id, 'status', 'filed');
end $$;

-- The sender route (no session) takes pending rows and marks them.
create or replace function notifications_take(p_secret text, p_limit int default 50)
returns setof notifications language plpgsql security definer set search_path = public as $$
begin
  if p_secret is distinct from (select value from webhook_secrets where name = 'inbound') then
    raise exception 'bad secret';
  end if;
  return query select * from notifications where status = 'pending' order by created_at limit p_limit;
end $$;

create or replace function notifications_mark(p_secret text, p_id uuid, p_status text, p_error text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_secret is distinct from (select value from webhook_secrets where name = 'inbound') then
    raise exception 'bad secret';
  end if;
  update notifications set status = p_status, error = p_error, sent_at = case when p_status = 'sent' then now() end where id = p_id;
end $$;

-- Who to tell, per office, for the Monday digest and holds. Staff-only read of emails across offices.
create or replace function digest_recipients(p_secret text)
returns table (org_id uuid, org_name text, email text, name text) language plpgsql security definer set search_path = public as $$
begin
  if p_secret is distinct from (select value from webhook_secrets where name = 'inbound') then
    raise exception 'bad secret';
  end if;
  return query select m.org_id, o.name, u.email::text, m.name from memberships m join orgs o on o.id = m.org_id join auth.users u on u.id = m.user_id;
end $$;

create or replace function digest_counts(p_secret text, p_org uuid, p_since timestamptz)
returns jsonb language plpgsql security definer set search_path = public as $$
declare j jsonb;
begin
  if p_secret is distinct from (select value from webhook_secrets where name = 'inbound') then
    raise exception 'bad secret';
  end if;
  select jsonb_build_object(
    'checked', (select count(*) from requests where org_id = p_org and created_at >= p_since),
    'passed', (select count(*) from requests where org_id = p_org and created_at >= p_since and verdict = 'pass'),
    'held', (select count(*) from requests where org_id = p_org and created_at >= p_since and verdict = 'hold'),
    'open', (select count(*) from requests where org_id = p_org and status in ('open','confirmed','not_confirmed')),
    'waiting', (select count(*) from intakes where org_id = p_org and request_id is null),
    'holds', (select coalesce(jsonb_agg(jsonb_build_object('payee', payee, 'amount', amount, 'reason', reasons[1], 'status', status) order by created_at desc), '[]')
                from requests where org_id = p_org and created_at >= p_since and verdict = 'hold')
  ) into j;
  return j;
end $$;

revoke all on function org_for_inbound(text, text) from public;
revoke all on function receive_email(text, text, text, text, text, text, jsonb, uuid, text, jsonb, numeric, text, text, text, text[], text[], uuid, boolean) from public;
revoke all on function notifications_take(text, int) from public;
revoke all on function notifications_mark(text, uuid, text, text) from public;
revoke all on function digest_recipients(text) from public;
revoke all on function digest_counts(text, uuid, timestamptz) from public;
grant execute on function org_for_inbound(text, text) to anon;
grant execute on function receive_email(text, text, text, text, text, text, jsonb, uuid, text, jsonb, numeric, text, text, text, text[], text[], uuid, boolean) to anon;
grant execute on function notifications_take(text, int) to anon;
grant execute on function notifications_mark(text, uuid, text, text) to anon;
grant execute on function digest_recipients(text) to anon;
grant execute on function digest_counts(text, uuid, timestamptz) to anon;

-- Hold and callback notifications are queued by a trigger, so every path that
-- creates a hold or logs a callback (form, photo, email) tells the office the same way.
create or replace function queue_hold_notification() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.verdict = 'hold' then
    insert into notifications (org_id, request_id, kind, to_email, subject, body)
    select new.org_id, new.id, 'hold', u.email, 'Hold: ' || new.payee || ' $' || to_char(new.amount, 'FM999,999,990.00'),
      'A payment request would have held.' || E'\n\n' || 'Payee: ' || new.payee || E'\n' || 'Amount: $' || to_char(new.amount, 'FM999,999,990.00') || E'\n' ||
      'Why: ' || coalesce(new.reasons[1], '') || E'\n\n' || 'Mastiff calls the number on file and logs what was said. Your firm makes every payment decision.' || E'\n' ||
      'Open it: https://mastiff-app.vercel.app/app/requests/' || new.id
    from memberships m join auth.users u on u.id = m.user_id where m.org_id = new.org_id;
  end if;
  return new;
end $$;
create or replace trigger requests_hold_notify after insert on requests for each row execute function queue_hold_notification();

create or replace function queue_callback_notification() returns trigger language plpgsql security definer set search_path = public as $$
declare r record;
begin
  select id, org_id, payee, amount into r from requests where id = new.request_id;
  insert into notifications (org_id, request_id, kind, to_email, subject, body)
  select r.org_id, r.id, 'callback', u.email, 'Callback: ' || r.payee || ' — ' || replace(new.outcome, '_', ' '),
    'Mastiff called ' || new.number_called || ' (the number on file) about ' || r.payee || ' $' || to_char(r.amount, 'FM999,999,990.00') || '.' || E'\n\n' ||
    'Who answered: ' || coalesce(new.who_answered, '—') || E'\n' || 'What was said: ' || coalesce(new.what_said, '—') || E'\n' || 'Outcome: ' || replace(new.outcome, '_', ' ') || E'\n\n' ||
    'Your firm makes the decision. Record it here: https://mastiff-app.vercel.app/app/requests/' || r.id
  from memberships m join auth.users u on u.id = m.user_id where m.org_id = r.org_id;
  return new;
end $$;
create or replace trigger callbacks_notify after insert on callbacks for each row execute function queue_callback_notification();
