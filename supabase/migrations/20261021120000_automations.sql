-- Automações do catálogo (M5 parte 3), agendadas com pg_cron:
--   1. expiração: evento cuja última sessão terminou há 30 dias vai para arquivado;
--   2. verificador de links de ingresso com pg_net (sem bloquear o banco);
--   3. fila de revalidação: o que a curadoria precisa reconferir, por proximidade e risco.

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- Fim efetivo de uma sessão, com as mesmas regras da view discoverable_sessions:
-- sem término, 6 horas após o início; horário a confirmar, fim do dia em Brasília.
create function public.session_ends_at(starts_at timestamptz, ends_at timestamptz, time_confirmed boolean)
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select coalesce(
    ends_at,
    case
      when time_confirmed then starts_at + interval '6 hours'
      else (date_trunc('day', starts_at at time zone 'America/Sao_Paulo') + interval '1 day')
           at time zone 'America/Sao_Paulo'
    end
  );
$$;

-- 1. Expiração --------------------------------------------------------------

-- Publicados e cancelados ficam 30 dias depois da última sessão: quem salvou o rolê
-- ainda abre a ficha em "Já foram". A descoberta já os esconde desde o fim da sessão.
-- Adiados não expiram sozinhos: dependem da nova data e vão para a revalidação.
create function private.expire_events()
returns integer
language plpgsql
set search_path = ''
as $$
declare
  expired integer;
begin
  update public.events e
  set status = 'archived'
  where e.status in ('published', 'cancelled')
    and exists (select 1 from public.sessions s where s.event_id = e.id)
    and not exists (
      select 1 from public.sessions s
      where s.event_id = e.id
        and public.session_ends_at(s.starts_at, s.ends_at, s.time_confirmed) > now() - interval '30 days'
    );
  get diagnostics expired = row_count;
  return expired;
end;
$$;

-- 2. Verificador de links ---------------------------------------------------

alter table public.sessions
  add column ticket_url_failures smallint not null default 0;

comment on column public.sessions.ticket_url_failures is
  'Falhas seguidas na checagem automática do link. Duas seguidas marcam o link como quebrado.';

-- Link novo começa do zero, a não ser que a equipe tenha mudado a situação na mesma edição.
create function public.reset_ticket_url_check()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.ticket_url is distinct from old.ticket_url
     and new.ticket_url_status is not distinct from old.ticket_url_status then
    new.ticket_url_status := 'unchecked';
    new.ticket_url_checked_at := null;
    new.ticket_url_failures := 0;
  end if;
  return new;
end;
$$;

create trigger sessions_reset_ticket_check before update on public.sessions
  for each row execute function public.reset_ticket_url_check();

-- A checagem roda todo dia em cada sessão; só ela mudar não vai para a auditoria.
drop trigger sessions_audit on public.sessions;
create trigger sessions_audit after insert or delete on public.sessions
  for each row execute function public.write_audit_log();
create trigger sessions_audit_update after update on public.sessions
  for each row
  when (
    (to_jsonb(old) - array['ticket_url_status', 'ticket_url_checked_at', 'ticket_url_failures', 'updated_at'])
    is distinct from
    (to_jsonb(new) - array['ticket_url_status', 'ticket_url_checked_at', 'ticket_url_failures', 'updated_at'])
    or (new.ticket_url_status = 'broken') is distinct from (old.ticket_url_status = 'broken')
  )
  execute function public.write_audit_log();

-- Pedidos em andamento: o pg_net responde depois, em net._http_response.
create table private.link_checks (
  request_id bigint primary key,
  session_id uuid not null references public.sessions (id) on delete cascade,
  url text not null,
  requested_at timestamptz not null default now()
);

-- Sessões que precisam de checagem: evento visível, sessão por vir, link não marcado
-- como suspeito pela equipe. Link bom é reconferido a cada 24 h; depois de uma falha,
-- em 2 h, para confirmar logo se quebrou de vez.
create function private.sessions_due_for_link_check(batch_size integer default 20)
returns table (session_id uuid, url text)
language sql
stable
set search_path = ''
as $$
  select s.id, s.ticket_url
  from public.sessions s
  join public.events e on e.id = s.event_id
  where s.ticket_url is not null
    and s.ticket_url_status <> 'suspicious'
    and e.status in ('published', 'postponed')
    and s.status in ('scheduled', 'sold_out', 'postponed')
    and public.session_ends_at(s.starts_at, s.ends_at, s.time_confirmed) > now()
    and not exists (select 1 from private.link_checks c where c.session_id = s.id)
    and (
      s.ticket_url_checked_at is null
      or (s.ticket_url_failures = 0 and s.ticket_url_checked_at < now() - interval '24 hours')
      or (s.ticket_url_failures > 0 and s.ticket_url_checked_at < now() - interval '2 hours')
    )
  order by s.ticket_url_checked_at nulls first, s.starts_at
  limit batch_size;
$$;

-- Resultado de uma resposta: 'ok', 'fail' (o link não existe) ou 'unknown' (o site
-- recusou o robô, demorou ou deu erro próprio; não dá para concluir nada).
create function private.link_check_outcome(status_code integer, timed_out boolean, error_msg text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when status_code between 200 and 399 then 'ok'
    when status_code in (404, 410) then 'fail'
    when status_code is null and not coalesce(timed_out, false) and error_msg is not null then 'fail'
    else 'unknown'
  end;
$$;

create function private.apply_link_check(p_session_id uuid, p_outcome text)
returns void
language sql
set search_path = ''
as $$
  update public.sessions
  set ticket_url_checked_at = now(),
      ticket_url_failures = case p_outcome
        when 'ok' then 0
        when 'fail' then least(ticket_url_failures + 1, 100)
        else ticket_url_failures
      end,
      ticket_url_status = case
        when p_outcome = 'ok' then 'ok'
        when p_outcome = 'fail' and ticket_url_failures + 1 >= 2 then 'broken'
        else ticket_url_status
      end
  where id = p_session_id
    and ticket_url_status <> 'suspicious';
$$;

-- Lê as respostas que chegaram, aplica e pede as próximas checagens.
create function private.run_link_checks(batch_size integer default 20)
returns integer
language plpgsql
set search_path = ''
as $$
declare
  pending record;
  requested integer := 0;
begin
  for pending in
    select c.request_id, c.session_id, c.url, s.ticket_url as current_url,
           r.id as response_id, r.status_code, r.timed_out, r.error_msg
    from private.link_checks c
    join public.sessions s on s.id = c.session_id
    left join net._http_response r on r.id = c.request_id
    where r.id is not null or c.requested_at < now() - interval '1 hour'
  loop
    -- Link trocado no meio da checagem: o resultado não vale para o novo.
    if pending.current_url is not distinct from pending.url then
      perform private.apply_link_check(
        pending.session_id,
        case when pending.response_id is null then 'unknown'
             else private.link_check_outcome(pending.status_code, pending.timed_out, pending.error_msg) end
      );
    end if;
    delete from private.link_checks where request_id = pending.request_id;
  end loop;

  insert into private.link_checks (request_id, session_id, url)
  select net.http_get(
           url := d.url,
           headers := jsonb_build_object('User-Agent', 'RowleLinkCheck/1.0 (+https://github.com/MarceloSilva2005/rowle)'),
           timeout_milliseconds := 10000
         ),
         d.session_id,
         d.url
  from private.sessions_due_for_link_check(batch_size) d;
  get diagnostics requested = row_count;
  return requested;
end;
$$;

-- 3. Fila de revalidação ----------------------------------------------------

-- Prazo de reconferência pela proximidade da próxima sessão: até 7 dias, a cada 2 dias;
-- até 30 dias, semanal; mais longe, a cada 21 dias. Adiado, a cada 2 dias, até sair a
-- nova data. Nunca conferido e link quebrado de sessão por vir entram na hora. Roda com
-- os direitos de quem consulta: só a equipe lê as fontes, então o público não vê nada.
create view public.revalidation_queue
with (security_invoker = on)
as
with next_session as (
  select s.event_id,
         min(s.starts_at) filter (
           where public.session_ends_at(s.starts_at, s.ends_at, s.time_confirmed) > now()
         ) as next_starts_at,
         count(*) filter (
           where s.ticket_url_status in ('broken', 'suspicious')
             and public.session_ends_at(s.starts_at, s.ends_at, s.time_confirmed) > now()
         ) as bad_links
  from public.sessions s
  where s.status <> 'cancelled'
  group by s.event_id
),
verified as (
  select event_id, max(last_verified_at) as last_verified_at
  from public.sources
  group by event_id
),
candidates as (
  select e.id as event_id,
         e.title,
         e.status,
         n.next_starts_at,
         v.last_verified_at,
         coalesce(n.bad_links, 0)::integer as bad_links,
         v.last_verified_at + case
           when e.status = 'postponed' then interval '2 days'
           when n.next_starts_at <= now() + interval '7 days' then interval '2 days'
           when n.next_starts_at <= now() + interval '30 days' then interval '7 days'
           else interval '21 days'
         end as due_at
  from public.events e
  join next_session n on n.event_id = e.id
  left join verified v on v.event_id = e.id
  where e.status = 'postponed'
     or (e.status = 'published' and n.next_starts_at is not null)
)
select event_id,
       title,
       status,
       next_starts_at,
       last_verified_at,
       bad_links,
       case
         when bad_links > 0 then 'broken_link'
         when last_verified_at is null then 'never_verified'
         when status = 'postponed' then 'postponed'
         else 'due'
       end as reason
from candidates
where bad_links > 0
   or last_verified_at is null
   or due_at <= now();

comment on view public.revalidation_queue is
  'Eventos que a curadoria precisa reconferir agora (link quebrado, adiado, nunca conferido ou prazo vencido).';

revoke all on public.revalidation_queue from anon, public;
grant select on public.revalidation_queue to authenticated;

-- Marca as fontes do evento como conferidas agora (botão "Conferido" no painel).
create function public.mark_event_verified(p_event_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if not public.is_staff() then
    raise exception 'Só a equipe confere eventos.' using errcode = '42501';
  end if;
  update public.sources set last_verified_at = now() where event_id = p_event_id;
  if not found then
    raise exception 'O evento não tem fonte para conferir.' using errcode = 'P0002';
  end if;
end;
$$;

revoke execute on function public.mark_event_verified(uuid) from public, anon;
grant execute on function public.mark_event_verified(uuid) to authenticated;

-- Agenda --------------------------------------------------------------------

-- Horários em UTC: 07:15 UTC = 04:15 em Brasília, longe do pico de uso.
select cron.schedule('rowle-expire-events', '15 7 * * *', $$select private.expire_events()$$);
select cron.schedule('rowle-link-checks', '*/10 * * * *', $$select private.run_link_checks()$$);
