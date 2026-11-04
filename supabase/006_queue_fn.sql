-- Lets the digest route (no user session) queue a notification. Same shared secret as 005.
create or replace function notifications_queue(p_secret text, p_org uuid, p_kind text, p_to text, p_subject text, p_body text)
returns uuid language plpgsql security definer set search_path = public as $$
declare n_id uuid;
begin
  if p_secret is distinct from (select value from webhook_secrets where name = 'inbound') then
    raise exception 'bad secret';
  end if;
  insert into notifications (org_id, kind, to_email, subject, body) values (p_org, p_kind, p_to, p_subject, p_body) returning id into n_id;
  return n_id;
end $$;
revoke all on function notifications_queue(text, uuid, text, text, text, text) from public;
grant execute on function notifications_queue(text, uuid, text, text, text, text) to anon;
