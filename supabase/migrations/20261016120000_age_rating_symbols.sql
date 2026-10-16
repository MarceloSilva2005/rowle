-- Classificação indicativa como o Ministério da Justiça exige (Guia ClassInd 2025, anexo H):
-- faixa de 6 anos e a diferença entre classificação oficial e autoclassificação. Obras e
-- espetáculos autoclassificados mostram o símbolo provisório ("A18") até a oficial sair.

alter type public.age_rating add value if not exists '6' after 'L';

alter table public.events
  add column age_rating_official boolean not null default false;

comment on column public.events.age_rating_official is
  'true quando a classificação foi emitida pelo Ministério da Justiça; false = autoclassificação do produtor (símbolo provisório).';

-- A descoberta passa a trazer a classificação e o endereço do local (para o botão de
-- rota). Colunas novas só no fim, como exige create or replace view; permissões e
-- security_invoker são mantidos.
create or replace view public.discoverable_sessions
with (security_invoker = on)
as
select
  s.id as session_id,
  s.event_id,
  e.slug as event_slug,
  e.title,
  e.category_id,
  e.cover_path,
  e.is_sponsored,
  s.venue_id,
  v.name as venue_name,
  v.region_id,
  s.starts_at,
  s.ends_at,
  s.time_confirmed,
  s.status as session_status,
  s.price_kind,
  s.price_min_cents,
  s.price_max_cents,
  case when s.ticket_url_status in ('broken', 'suspicious') then null else s.ticket_url end as ticket_url,
  e.age_rating,
  e.age_rating_official,
  v.address as venue_address
from public.sessions s
join public.events e on e.id = s.event_id
join public.venues v on v.id = s.venue_id
where e.status = 'published'
  and s.status in ('scheduled', 'sold_out')
  and coalesce(
        s.ends_at,
        case
          when s.time_confirmed then s.starts_at + interval '6 hours'
          else (date_trunc('day', s.starts_at at time zone 'America/Sao_Paulo') + interval '1 day')
               at time zone 'America/Sao_Paulo'
        end
      ) > now();

-- Data da última conferência de cada evento visível ao público ("Conferido em 15 out"
-- na ficha). As fontes continuam só da equipe: esta view expõe apenas a data. Roda
-- com os direitos do dono (sem security_invoker) e filtra os eventos visíveis.
create view public.event_last_verified as
select s.event_id, max(s.last_verified_at) as last_verified_at
from public.sources s
join public.events e on e.id = s.event_id
where e.status in ('published', 'postponed', 'cancelled')
  and s.last_verified_at is not null
group by s.event_id;

comment on view public.event_last_verified is
  'Só a data da última conferência de fonte de eventos públicos; as fontes em si são restritas à equipe.';
