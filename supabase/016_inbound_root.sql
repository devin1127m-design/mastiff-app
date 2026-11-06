-- Resend receives on the root domain, so an office's address is <slug>@mastiffdesk.com.
-- 'desk' is reserved for Mastiff's own sending address.
alter table orgs drop column if exists inbound_email;
alter table orgs add column inbound_email text generated always as (slug || '@mastiffdesk.com') stored;
alter table orgs add constraint orgs_slug_not_reserved check (slug not in ('desk','admin','postmaster','abuse','noreply','no-reply','support','hello','info'));
