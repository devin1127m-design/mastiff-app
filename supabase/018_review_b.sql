-- Review 2026-11-08 (Jarvis): B, A, E.
-- B: a vendor's known sender domains live on the vendor row, visible and editable, not derived per email.
alter table vendors add column if not exists sender_domains text[] not null default '{}';

-- A: match the office on the whole address, and mask account-like digit runs in what we keep of the email.
create or replace function org_for_inbound(p_secret text, p_to text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare o record; v jsonb; mem jsonb;
begin
  if p_secret is distinct from (select value from webhook_secrets where name = 'inbound') then
    raise exception 'bad secret';
  end if;
  if split_part(lower(p_to), '@', 2) <> 'mastiffdesk.com' then return null; end if;
  select id, name, single_cap, range_multiple, hours_start, hours_end, timezone into o
    from orgs where slug = split_part(lower(p_to), '@', 1) limit 1;
  if o.id is null then return null; end if;
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'name', name, 'name_key', name_key, 'account_last4', account_last4, 'usual_min', usual_min, 'usual_max', usual_max, 'pass_under', pass_under, 'sender_domains', sender_domains)), '[]') into v
    from vendors where org_id = o.id;
  select coalesce(jsonb_agg(lower(u.email)), '[]') into mem
    from memberships m join auth.users u on u.id = m.user_id where m.org_id = o.id;
  return jsonb_build_object('id', o.id, 'name', o.name, 'single_cap', o.single_cap, 'range_multiple', o.range_multiple,
    'hours_start', o.hours_start, 'hours_end', o.hours_end, 'timezone', o.timezone, 'vendors', v, 'members', mem);
end $$;

create or replace function mask_last4(t text) returns text language sql immutable as $$
  select regexp_replace(coalesce(t, ''), '(\d(?:[ -]?\d){7,})', '****', 'g');
$$;

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
    values (p_org_id, p_provider_id, left(p_from, 200), left(p_to, 200), mask_last4(left(p_subject, 300)), mask_last4(left(p_body, 20000)), coalesce(p_attachments, '[]'), st)
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

-- E: one lead per email per day.
create unique index if not exists leads_one_per_day on leads (lower(email), ((created_at at time zone 'UTC')::date));
