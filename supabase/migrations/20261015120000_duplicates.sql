-- Detecção de possíveis duplicatas: o mesmo rolê cadastrado duas vezes, vindo de
-- fontes diferentes ou de uma sugestão do produtor. Só aponta candidatos; quem
-- decide é a curadoria, que pode marcar o par como "não é duplicata".

-- Título comparável: minúsculas, sem acento, só letras e números.
create function public.comparable_title(t text)
returns text
language sql
stable
set search_path = ''
as $$
  select trim(regexp_replace(
    lower(extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(t, ''))),
    '[^a-z0-9]+', ' ', 'g'
  ));
$$;

-- Pares que a curadoria já conferiu e decidiu que são eventos diferentes.
-- O par é guardado em ordem (menor id primeiro) para não existir em dobro.
create table public.duplicate_dismissals (
  event_id uuid not null references public.events (id) on delete cascade,
  other_event_id uuid not null references public.events (id) on delete cascade,
  dismissed_by uuid default auth.uid() references auth.users (id) on delete set null,
  dismissed_at timestamptz not null default now(),
  primary key (event_id, other_event_id),
  constraint duplicate_dismissals_ordered check (event_id < other_event_id)
);

create index duplicate_dismissals_other_idx on public.duplicate_dismissals (other_event_id);

alter table public.duplicate_dismissals enable row level security;
revoke all on public.duplicate_dismissals from anon;
create policy "equipe lê e registra" on public.duplicate_dismissals for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

-- Candidatos a duplicata de um rolê descrito por título, dias (no horário de
-- Brasília) e locais. Regras, da mais forte para a mais fraca:
--   * mesmo dia e mesmo local, com algum parentesco no título;
--   * título muito parecido;
--   * mesmo dia, com título razoavelmente parecido.
-- Eventos rejeitados ou arquivados ficam de fora. Só pelo título, também ficam de
-- fora os que já terminaram há mais de 30 dias (edições antigas de um festival).
create function public.find_possible_duplicates(
  p_title text,
  p_days date[] default '{}',
  p_venue_ids uuid[] default '{}',
  p_exclude_event uuid default null
)
returns table (
  event_id uuid,
  title text,
  status public.event_status,
  title_similarity real,
  same_day boolean,
  same_venue boolean,
  next_starts_at timestamptz,
  strong boolean
)
language sql
stable
set search_path = ''
as $$
  with target as (
    select public.comparable_title(p_title) as title
  ),
  candidates as (
    select
      e.id,
      e.title,
      e.status,
      extensions.similarity(public.comparable_title(e.title), target.title) as sim,
      exists (
        select 1 from public.sessions s
        where s.event_id = e.id
          and (s.starts_at at time zone 'America/Sao_Paulo')::date = any (coalesce(p_days, '{}'))
      ) as same_day,
      exists (
        select 1 from public.sessions s
        where s.event_id = e.id
          and s.venue_id = any (coalesce(p_venue_ids, '{}'))
          and (s.starts_at at time zone 'America/Sao_Paulo')::date = any (coalesce(p_days, '{}'))
      ) as same_day_and_venue,
      exists (
        select 1 from public.sessions s
        where s.event_id = e.id and s.venue_id = any (coalesce(p_venue_ids, '{}'))
      ) as same_venue,
      (select min(s.starts_at) from public.sessions s where s.event_id = e.id and s.starts_at >= now()) as next_starts_at,
      (select max(s.starts_at) from public.sessions s where s.event_id = e.id) as last_starts_at
    from public.events e, target
    where e.status not in ('rejected', 'archived')
      and (p_exclude_event is null or e.id <> p_exclude_event)
      and not exists (
        select 1 from public.duplicate_dismissals d
        where p_exclude_event is not null
          and d.event_id = least(e.id, p_exclude_event)
          and d.other_event_id = greatest(e.id, p_exclude_event)
      )
  )
  select
    c.id,
    c.title,
    c.status,
    c.sim,
    c.same_day,
    c.same_venue,
    c.next_starts_at,
    (c.same_day_and_venue and c.sim >= 0.2) or c.sim >= 0.6 or (c.same_day and c.sim >= 0.4) as strong
  from candidates c
  where (c.same_day_and_venue and c.sim >= 0.2)
     or (c.same_day and c.sim >= 0.3)
     or (c.sim >= 0.45 and (c.last_starts_at is null or c.last_starts_at >= now() - interval '30 days'))
  order by strong desc, c.sim desc
  limit 5;
$$;

-- Candidatos a duplicata de um evento já cadastrado, usando suas próprias sessões.
create function public.possible_duplicates_of_event(p_event_id uuid)
returns table (
  event_id uuid,
  title text,
  status public.event_status,
  title_similarity real,
  same_day boolean,
  same_venue boolean,
  next_starts_at timestamptz,
  strong boolean
)
language sql
stable
set search_path = ''
as $$
  select d.*
  from public.events e
  cross join lateral public.find_possible_duplicates(
    e.title,
    coalesce(
      (select array_agg(distinct (s.starts_at at time zone 'America/Sao_Paulo')::date)
       from public.sessions s where s.event_id = e.id),
      '{}'
    ),
    coalesce((select array_agg(distinct s.venue_id) from public.sessions s where s.event_id = e.id), '{}'),
    e.id
  ) d
  where e.id = p_event_id;
$$;

-- As funções rodam com as permissões de quem chama (RLS vale), mas só fazem
-- sentido para a equipe: o visitante não chama nenhuma delas.
revoke execute on function public.find_possible_duplicates(text, date[], uuid[], uuid) from anon, public;
revoke execute on function public.possible_duplicates_of_event(uuid) from anon, public;
grant execute on function public.find_possible_duplicates(text, date[], uuid[], uuid) to authenticated;
grant execute on function public.possible_duplicates_of_event(uuid) to authenticated;
