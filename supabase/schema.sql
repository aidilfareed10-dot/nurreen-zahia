-- Nurreen Zahia & Associates — Supabase schema (draft, not yet applied).
-- Mirrors the demo data model in assets/js/store.js. Row-level security ensures
-- clients only ever see their own records, and never internal notes.

create type user_role as enum ('client', 'admin');

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  role user_role not null default 'client',
  name text not null,
  email text not null unique,
  company text,
  phone text,
  country text,
  tz text not null default 'Asia/Kuala_Lumpur',
  currency text not null default 'MYR',
  lang text not null default 'en',
  title text,
  created_at timestamptz not null default now()
);

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create table matters (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique,
  client_id uuid not null references profiles on delete restrict,
  title text not null,
  area text not null,
  stage smallint not null default 0 check (stage between 0 and 5),
  lawyer text,
  court text,
  next_event_label text,
  next_event_at timestamptz,
  opened_at timestamptz not null default now()
);

create table matter_updates (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null references matters on delete cascade,
  text text not null,
  internal boolean not null default false,
  author text,
  created_at timestamptz not null default now()
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references profiles on delete cascade,
  matter_id uuid references matters on delete set null,
  name text not null,
  size bigint,
  category text,
  uploaded_by user_role not null,
  storage_path text not null, -- object in the private 'documents' bucket
  created_at timestamptz not null default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references profiles on delete cascade,
  matter_id uuid references matters on delete set null,
  sender user_role not null,
  author text,
  text text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table invoices (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  client_id uuid not null references profiles on delete restrict,
  matter_id uuid references matters on delete set null,
  amount_myr numeric(12, 2) not null check (amount_myr >= 0),
  items text,
  status text not null default 'unpaid' check (status in ('unpaid', 'paid', 'void')),
  issued_at timestamptz not null default now(),
  due_at timestamptz not null
);

create table appointments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references profiles on delete cascade,
  starts_at timestamptz not null,
  mode text not null,
  topic text not null,
  lawyer text,
  status text not null default 'requested' check (status in ('requested', 'confirmed', 'cancelled', 'completed'))
);

create table enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  country text,
  area text,
  mode text,
  tz text,
  slot timestamptz,
  message text not null,
  urgent boolean not null default false,
  lang text,
  status text not null default 'new' check (status in ('new', 'contacted', 'converted', 'declined')),
  client_id uuid references profiles,
  created_at timestamptz not null default now()
);

create table settings (
  key text primary key,
  value jsonb not null
);

-- ---------- row-level security ----------
alter table profiles enable row level security;
alter table matters enable row level security;
alter table matter_updates enable row level security;
alter table documents enable row level security;
alter table messages enable row level security;
alter table invoices enable row level security;
alter table appointments enable row level security;
alter table enquiries enable row level security;
alter table settings enable row level security;

-- admins: full access everywhere
create policy admin_all on profiles for all using (is_admin()) with check (is_admin());
create policy admin_all on matters for all using (is_admin()) with check (is_admin());
create policy admin_all on matter_updates for all using (is_admin()) with check (is_admin());
create policy admin_all on documents for all using (is_admin()) with check (is_admin());
create policy admin_all on messages for all using (is_admin()) with check (is_admin());
create policy admin_all on invoices for all using (is_admin()) with check (is_admin());
create policy admin_all on appointments for all using (is_admin()) with check (is_admin());
create policy admin_all on enquiries for all using (is_admin()) with check (is_admin());
create policy admin_all on settings for all using (is_admin()) with check (is_admin());

-- clients: own records only
create policy own_profile_read on profiles for select using (id = auth.uid());
create policy own_profile_update on profiles for update using (id = auth.uid()) with check (id = auth.uid() and role = 'client');
create policy own_matters on matters for select using (client_id = auth.uid());
create policy own_updates on matter_updates for select
  using (not internal and exists (select 1 from matters m where m.id = matter_id and m.client_id = auth.uid()));
create policy own_docs_read on documents for select using (client_id = auth.uid());
create policy own_docs_insert on documents for insert with check (client_id = auth.uid() and uploaded_by = 'client');
create policy own_msgs_read on messages for select using (client_id = auth.uid());
create policy own_msgs_insert on messages for insert with check (client_id = auth.uid() and sender = 'client');
create policy own_invoices on invoices for select using (client_id = auth.uid());
create policy own_appts_read on appointments for select using (client_id = auth.uid());
create policy own_appts_request on appointments for insert with check (client_id = auth.uid() and status = 'requested');
create policy settings_read on settings for select using (true);

-- the public website can submit enquiries but never read them back
create policy public_enquiry on enquiries for insert to anon, authenticated with check (status = 'new');
