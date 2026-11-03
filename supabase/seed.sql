-- Run AFTER schema.sql and AFTER you have signed in once (so your auth user exists).
-- 1. Make yourself staff. Replace the email.
insert into staff (user_id, name)
select id, 'Devin Martin' from auth.users where email = 'YOUR-EMAIL@example.com'
on conflict (user_id) do nothing;

-- 2. A test office to practice on.
insert into orgs (name, slug) values ('Test Office', 'testoffice') on conflict (slug) do nothing;

-- 3. Make yourself the test office's bookkeeper AND approver so you can walk the whole flow alone.
insert into memberships (user_id, org_id, role, name)
select u.id, o.id, 'owner', 'Devin (test)' from auth.users u, orgs o
where u.email = 'YOUR-EMAIL@example.com' and o.slug = 'testoffice'
on conflict do nothing;

-- 4. Three vendors.
insert into vendors (org_id, name, name_key, callback_phone, phone_on_file_since, account_last4, usual_min, usual_max)
select o.id, v.name, v.name_key, v.phone, v.since::date, v.last4, v.mn, v.mx from orgs o, (values
  ('Ray''s Drywall', 'rays drywall', '248-555-0101', '2024-03-01', '2208', 2500, 5000),
  ('Metro Fasteners', 'metro fasteners', '248-555-0102', '2023-11-15', '9931', 300, 1200),
  ('Oakland Concrete', 'oakland concrete', '248-555-0103', '2025-01-10', '4471', 4000, 9000)
) as v(name, name_key, phone, since, last4, mn, mx)
where o.slug = 'testoffice'
on conflict (org_id, name_key) do nothing;
