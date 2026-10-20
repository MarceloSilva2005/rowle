-- Denúncia pelo app, sem conta. O visitante (anon) não escreve na tabela reports:
-- passa por submit_report, que confere o evento, limpa o texto e limita abuso.
--
-- Limite por aparelho/rede: o IP nunca é guardado. Fica só um hash com sal secreto,
-- apagado depois de 24 h, o bastante para contar as denúncias recentes.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.report_salt (
  id boolean primary key default true check (id),
  salt bytea not null default extensions.gen_random_bytes(32)
);
insert into private.report_salt default values;

create table private.report_attempts (
  client_hash text not null,
  event_id uuid not null,
  reason public.report_reason not null,
  created_at timestamptz not null default now()
);
create index report_attempts_client_idx on private.report_attempts (client_hash, created_at);

-- Limites: 5 denúncias a cada 10 min e 20 por dia por origem; a mesma origem não
-- repete o mesmo motivo para o mesmo evento em 24 h (a repetição é aceita em silêncio).
create function public.submit_report(
  p_event_id uuid,
  p_reason public.report_reason,
  p_details text default null,
  p_session_id uuid default null
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  headers json := nullif(current_setting('request.headers', true), '')::json;
  ip text := coalesce(trim(split_part(headers ->> 'x-forwarded-for', ',', 1)), headers ->> 'x-real-ip', 'sem-ip');
  client text;
  details text := nullif(btrim(coalesce(p_details, ''), E' \t\r\n'), '');
begin
  if not exists (
    select 1 from public.events e
    where e.id = p_event_id and e.status in ('published', 'postponed', 'cancelled')
  ) then
    raise exception 'evento indisponível' using errcode = 'P0002';
  end if;
  if p_session_id is not null and not exists (
    select 1 from public.sessions s where s.id = p_session_id and s.event_id = p_event_id
  ) then
    p_session_id := null;
  end if;
  if length(details) > 2000 then
    raise exception 'detalhes longos demais' using errcode = '22001';
  end if;

  select encode(extensions.digest(ip::bytea || s.salt, 'sha256'), 'hex') into client from private.report_salt s;
  delete from private.report_attempts where created_at < now() - interval '24 hours';

  if (select count(*) from private.report_attempts a where a.client_hash = client and a.created_at > now() - interval '10 minutes') >= 5
    or (select count(*) from private.report_attempts a where a.client_hash = client) >= 20 then
    raise exception 'muitas denúncias seguidas' using errcode = 'P0429';
  end if;

  if exists (
    select 1 from private.report_attempts a
    where a.client_hash = client and a.event_id = p_event_id and a.reason = p_reason
  ) then
    return;
  end if;

  insert into private.report_attempts (client_hash, event_id, reason) values (client, p_event_id, p_reason);
  insert into public.reports (event_id, session_id, reason, details) values (p_event_id, p_session_id, p_reason, details);
end;
$$;

revoke execute on function public.submit_report(uuid, public.report_reason, text, uuid) from public;
grant execute on function public.submit_report(uuid, public.report_reason, text, uuid) to anon, authenticated;

comment on function public.submit_report is
  'Denúncia anônima de um evento visível. Erros: P0002 evento indisponível, P0429 limite de denúncias, 22001 texto longo.';
