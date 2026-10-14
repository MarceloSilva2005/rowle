-- Estrutura base do catálogo: referência territorial, eventos, sessões, locais,
-- organizações, fontes, sugestões, denúncias e auditoria.

create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;

create type public.event_status as enum (
  'draft', 'in_review', 'changes_requested', 'published', 'rejected',
  'postponed', 'cancelled', 'suspended', 'archived'
);
create type public.session_status as enum ('scheduled', 'postponed', 'cancelled', 'sold_out');
create type public.price_kind as enum ('free', 'fixed', 'from', 'range', 'on_request', 'unknown');
create type public.link_status as enum ('unchecked', 'ok', 'broken', 'suspicious');
create type public.source_kind as enum ('official_site', 'ticketing', 'social', 'submission', 'press', 'other');
create type public.image_rights as enum ('own', 'licensed', 'authorized_by_organizer', 'public_domain');
create type public.age_rating as enum ('L', '10', '12', '14', '16', '18');
create type public.staff_role as enum ('curator', 'admin');
create type public.submission_status as enum ('received', 'in_review', 'needs_info', 'accepted', 'rejected');
create type public.report_reason as enum (
  'wrong_info', 'cancelled_or_changed', 'suspicious_link', 'fraud', 'offensive', 'image_rights', 'other'
);
create type public.report_status as enum ('open', 'investigating', 'resolved', 'dismissed');

-- Regiões administrativas do DF. O id é o número oficial da RA.
create table public.regions (
  id smallint primary key check (id between 1 and 99),
  slug text not null unique,
  name text not null unique
);

create table public.categories (
  id smallint generated always as identity primary key,
  slug text not null unique,
  name text not null unique,
  sort_order smallint not null default 0
);

create table public.staff (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role public.staff_role not null default 'curator',
  display_name text not null check (length(trim(display_name)) between 2 and 80),
  created_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (length(trim(name)) between 2 and 120),
  website_url text check (website_url ~ '^https://'),
  instagram_handle text check (instagram_handle ~ '^[A-Za-z0-9._]{1,30}$'),
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Contatos ficam numa tabela separada para nunca vazarem pela leitura pública.
create table public.organization_contacts (
  organization_id uuid primary key references public.organizations (id) on delete cascade,
  contact_name text,
  email text check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text,
  notes text,
  updated_at timestamptz not null default now()
);

create table public.venues (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (length(trim(name)) between 2 and 120),
  address text not null check (length(trim(address)) between 5 and 200),
  region_id smallint not null references public.regions (id),
  -- Limites aproximados do DF, para pegar coordenadas trocadas ou de outro lugar.
  latitude numeric(9, 6) check (latitude between -16.1 and -15.4),
  longitude numeric(9, 6) check (longitude between -48.4 and -47.2),
  accessibility_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint venues_coordinates_pair check ((latitude is null) = (longitude is null))
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (length(trim(title)) between 3 and 140),
  description text check (length(description) <= 5000),
  category_id smallint not null references public.categories (id),
  organization_id uuid references public.organizations (id) on delete set null,
  cover_path text,
  cover_rights public.image_rights,
  cover_credit text,
  age_rating public.age_rating,
  accessibility_notes text,
  status public.event_status not null default 'draft',
  -- Motivo exibido em rejeição, cancelamento, adiamento ou suspensão.
  status_note text check (length(status_note) <= 500),
  is_sponsored boolean not null default false,
  published_at timestamptz,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_cover_rights check ((cover_path is null) = (cover_rights is null))
);

create index events_status_idx on public.events (status);
create index events_category_idx on public.events (category_id);
create index events_organization_idx on public.events (organization_id);
create index events_title_trgm_idx on public.events using gin (title extensions.gin_trgm_ops);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  venue_id uuid not null references public.venues (id),
  starts_at timestamptz not null,
  ends_at timestamptz,
  -- Falso quando só a data foi confirmada; o app mostra "horário a confirmar".
  time_confirmed boolean not null default true,
  status public.session_status not null default 'scheduled',
  price_kind public.price_kind not null default 'unknown',
  price_min_cents integer,
  price_max_cents integer,
  ticket_url text check (ticket_url ~ '^https://'),
  ticket_url_status public.link_status not null default 'unchecked',
  ticket_url_checked_at timestamptz,
  notes text check (length(notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sessions_time_order check (ends_at is null or ends_at > starts_at),
  -- Espelha validatePrice em packages/core: preço desconhecido nunca vira gratuito.
  constraint sessions_price_shape check (
    (price_kind in ('free', 'on_request', 'unknown') and price_min_cents is null and price_max_cents is null)
    or (price_kind in ('fixed', 'from') and price_min_cents > 0 and price_max_cents is null)
    or (price_kind = 'range' and price_min_cents > 0 and price_max_cents > price_min_cents)
  )
);

create index sessions_event_idx on public.sessions (event_id);
create index sessions_venue_idx on public.sessions (venue_id);
create index sessions_starts_at_idx on public.sessions (starts_at);

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  kind public.source_kind not null,
  url text check (url ~ '^https?://'),
  description text check (length(description) <= 1000),
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  constraint sources_has_reference check (url is not null or description is not null)
);

create index sources_event_idx on public.sources (event_id);

-- Sugestões enviadas pelo formulário público "Divulgue seu rolê".
create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  protocol text not null unique,
  tracking_token_hash text not null,
  payload jsonb not null,
  contact_email text check (contact_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  status public.submission_status not null default 'received',
  public_note text check (length(public_note) <= 1000),
  event_id uuid references public.events (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Denúncias são anônimas: não guardam dados de quem denuncia.
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  session_id uuid references public.sessions (id) on delete set null,
  reason public.report_reason not null,
  details text check (length(details) <= 2000),
  status public.report_status not null default 'open',
  resolution_note text,
  resolved_by uuid references auth.users (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index reports_open_idx on public.reports (created_at) where status in ('open', 'investigating');

create table public.audit_log (
  id bigint generated always as identity primary key,
  table_name text not null,
  row_id text not null,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  actor uuid,
  changed_at timestamptz not null default now(),
  old_data jsonb,
  new_data jsonb
);

create index audit_log_row_idx on public.audit_log (table_name, row_id, changed_at desc);
