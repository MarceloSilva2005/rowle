-- Assistente de cadastro: sugestão de locais pelo nome, criação do rascunho com
-- sessão e fonte numa transação só, e registro do tempo gasto por cadastro.

-- Locais cadastrados com nome parecido com o que veio na divulgação.
create function public.suggest_venues(p_name text)
returns table (id uuid, name text, address text, region_name text, similarity real)
language sql
stable
set search_path = ''
as $$
  select v.id, v.name, v.address, r.name, extensions.similarity(public.comparable_title(v.name), public.comparable_title(p_name))
  from public.venues v
  join public.regions r on r.id = v.region_id
  where coalesce(trim(p_name), '') <> ''
    and extensions.similarity(public.comparable_title(v.name), public.comparable_title(p_name)) >= 0.3
  order by 5 desc, v.name
  limit 3;
$$;

-- Quanto tempo a curadoria leva para cadastrar um evento (meta do M3).
create table public.event_entry_timings (
  event_id uuid primary key references public.events (id) on delete cascade,
  method text not null check (method in ('assistant', 'manual')),
  started_at timestamptz not null,
  finished_at timestamptz not null default now(),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  constraint event_entry_timings_order check (started_at <= finished_at)
);

alter table public.event_entry_timings enable row level security;
revoke all on public.event_entry_timings from anon;
create policy "equipe lê e registra" on public.event_entry_timings for select to authenticated
  using ((select public.is_staff()));
create policy "equipe registra" on public.event_entry_timings for insert to authenticated
  with check ((select public.is_staff()));

-- Mediana dos últimos 30 dias por forma de cadastro. Cadastros de mais de 2 horas
-- (aba esquecida aberta) ficam de fora para não distorcer a conta.
create function public.entry_time_stats()
returns table (method text, entries integer, median_seconds integer)
language sql
stable
set search_path = ''
as $$
  select
    t.method,
    count(*)::int,
    round(percentile_cont(0.5) within group (order by extract(epoch from t.finished_at - t.started_at)))::int
  from public.event_entry_timings t
  where t.finished_at >= now() - interval '30 days'
    and t.finished_at - t.started_at <= interval '2 hours'
  group by t.method
  order by t.method;
$$;

-- Cria o rascunho completo: evento, local novo (se for o caso), sessão, fonte e
-- tempo de cadastro. Roda com as permissões de quem chama, então o RLS vale e
-- qualquer falha desfaz tudo.
create function public.create_event_from_assistant(
  p_title text,
  p_slug text,
  p_category_id smallint,
  p_organization_id uuid default null,
  p_description text default null,
  p_age_rating public.age_rating default null,
  p_accessibility_notes text default null,
  p_is_sponsored boolean default false,
  p_venue_id uuid default null,
  p_new_venue_name text default null,
  p_new_venue_address text default null,
  p_new_venue_region smallint default null,
  p_starts_at timestamptz default null,
  p_ends_at timestamptz default null,
  p_time_confirmed boolean default null,
  p_price_kind public.price_kind default null,
  p_price_min_cents integer default null,
  p_price_max_cents integer default null,
  p_ticket_url text default null,
  p_source_kind public.source_kind default null,
  p_source_url text default null,
  p_source_description text default null,
  p_started_at timestamptz default null
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  new_event uuid;
  venue uuid := p_venue_id;
  final_slug text := p_slug;
  venue_slug text;
  attempt int := 1;
begin
  if not public.is_staff() then
    raise exception 'Só a equipe cadastra eventos.' using errcode = 'insufficient_privilege';
  end if;

  -- Endereço já usado: acrescenta -2, -3… em vez de falhar.
  while exists (select 1 from public.events where slug = final_slug) loop
    attempt := attempt + 1;
    final_slug := left(p_slug, 76) || '-' || attempt;
  end loop;

  insert into public.events (
    title, slug, category_id, organization_id, description, age_rating, accessibility_notes, is_sponsored, status
  )
  values (
    p_title, final_slug, p_category_id, p_organization_id, p_description, p_age_rating, p_accessibility_notes,
    coalesce(p_is_sponsored, false), 'draft'
  )
  returning id into new_event;

  if p_starts_at is not null then
    if venue is null then
      if coalesce(trim(p_new_venue_name), '') = '' then
        raise exception 'Escolha um local cadastrado ou preencha os dados do novo local.' using errcode = 'check_violation';
      end if;
      venue_slug := public.comparable_title(p_new_venue_name);
      venue_slug := left(regexp_replace(venue_slug, ' ', '-', 'g'), 76);
      attempt := 1;
      while exists (select 1 from public.venues where slug = venue_slug || case when attempt = 1 then '' else '-' || attempt end) loop
        attempt := attempt + 1;
      end loop;
      insert into public.venues (name, slug, address, region_id)
      values (
        trim(p_new_venue_name),
        venue_slug || case when attempt = 1 then '' else '-' || attempt end,
        trim(p_new_venue_address),
        p_new_venue_region
      )
      returning id into venue;
    end if;

    insert into public.sessions (
      event_id, venue_id, starts_at, ends_at, time_confirmed, price_kind, price_min_cents, price_max_cents, ticket_url
    )
    values (
      new_event, venue, p_starts_at, p_ends_at, coalesce(p_time_confirmed, true),
      coalesce(p_price_kind, 'unknown'), p_price_min_cents, p_price_max_cents, p_ticket_url
    );
  end if;

  if p_source_url is not null or p_source_description is not null then
    insert into public.sources (event_id, kind, url, description, last_verified_at)
    values (new_event, p_source_kind, p_source_url, p_source_description, now());
  end if;

  if p_started_at is not null and p_started_at <= now() and p_started_at > now() - interval '12 hours' then
    insert into public.event_entry_timings (event_id, method, started_at)
    values (new_event, 'assistant', p_started_at);
  end if;

  return new_event;
end;
$$;

revoke execute on function public.suggest_venues(text) from anon, public;
revoke execute on function public.entry_time_stats() from anon, public;
revoke execute on function public.create_event_from_assistant(
  text, text, smallint, uuid, text, public.age_rating, text, boolean, uuid, text, text, smallint, timestamptz, timestamptz,
  boolean, public.price_kind, integer, integer, text, public.source_kind, text, text, timestamptz
) from anon, public;
grant execute on function public.suggest_venues(text) to authenticated;
grant execute on function public.entry_time_stats() to authenticated;
grant execute on function public.create_event_from_assistant(
  text, text, smallint, uuid, text, public.age_rating, text, boolean, uuid, text, text, smallint, timestamptz, timestamptz,
  boolean, public.price_kind, integer, integer, text, public.source_kind, text, text, timestamptz
) to authenticated;
