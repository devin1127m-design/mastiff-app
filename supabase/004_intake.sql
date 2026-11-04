-- Step 3: intake. A photo or PDF of the invoice is attached to the request,
-- read by the model, and the request pre-filled. Rule 5: a confident read of a
-- vendor on file that passes goes straight through; anything else waits for a tap.

-- Where requests come from now: typed, forwarded email, uploaded file, phone photo.
alter table requests drop constraint if exists requests_source_check;
alter table requests add constraint requests_source_check
  check (source in ('form','email','upload','photo'));

-- The invoice image and what was read from it. `extracted` holds only the fields
-- Mastiff keeps (payee, amount, invoice number, dates, last four). Never a full account number.
alter table requests add column if not exists image_path text;
alter table requests add column if not exists extracted jsonb;
alter table requests add column if not exists read_confidence numeric(3,2);
alter table requests add column if not exists straight_through boolean not null default false;

-- A read that needs a person before it becomes a request (Rule 5 exceptions).
create table if not exists intakes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  image_path text not null,
  source text not null check (source in ('upload','photo','email')),
  extracted jsonb,
  read_confidence numeric(3,2),
  needs_tap_because text,            -- plain words: why a person is asked
  read_error text,                   -- set when the model could not read it
  created_by text not null,
  request_id uuid references requests(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists intakes_org_open on intakes(org_id, created_at desc) where request_id is null;

alter table intakes enable row level security;
create policy intakes_read on intakes for select using (is_staff() or org_id in (select my_org_ids()));
create policy intakes_write on intakes for all using (is_staff() or org_id in (select my_org_ids())) with check (is_staff() or org_id in (select my_org_ids()));

-- Private bucket for invoice images. Path is <org_id>/<file>. 15 MB cap, images and PDFs only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('invoices', 'invoices', false, 15728640, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do nothing;

create policy invoices_read on storage.objects for select
  using (bucket_id = 'invoices' and (is_staff() or (storage.foldername(name))[1]::uuid in (select my_org_ids())));
create policy invoices_insert on storage.objects for insert
  with check (bucket_id = 'invoices' and (is_staff() or (storage.foldername(name))[1]::uuid in (select my_org_ids())));
