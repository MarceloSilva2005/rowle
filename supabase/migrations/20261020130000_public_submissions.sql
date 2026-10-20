-- "Divulgue seu rolê": o visitante envia uma sugestão pelo site, sem conta, e recebe
-- um protocolo e um código de acompanhamento. O código aparece uma vez só; o banco
-- guarda apenas o hash dele. Com protocolo + código, qualquer um consulta a situação.

-- O sal criado para as denúncias passa a servir a todo limite por origem.
alter table private.report_salt rename to request_salt;

/** Hash da origem da requisição (IP do visitante, nunca guardado em claro). */
create function private.client_hash() returns text
language sql
stable
security definer
set search_path = ''
as $$
  select encode(extensions.digest(
    coalesce(
      nullif(trim(split_part((nullif(current_setting('request.headers', true), '')::json) ->> 'x-forwarded-for', ',', 1)), ''),
      (nullif(current_setting('request.headers', true), '')::json) ->> 'x-real-ip',
      'sem-ip'
    )::bytea || s.salt,
    'sha256'), 'hex')
  from private.request_salt s
$$;

create or replace function public.submit_report(
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
  client text := private.client_hash();
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

create table private.submission_attempts (
  client_hash text not null,
  created_at timestamptz not null default now()
);
create index submission_attempts_client_idx on private.submission_attempts (client_hash, created_at);

-- Campos aceitos e tamanho máximo (os mesmos de SubmissionPayload no pacote core).
create function private.clean_submission(p jsonb) returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
declare
  limits constant jsonb := '{"title": 140, "description": 4000, "organizerName": 140, "venueName": 140,
    "venueAddress": 300, "startsAtLocal": 16, "priceText": 140, "ticketUrl": 500, "sourceUrl": 500}';
  out jsonb := '{}';
  k text;
  v text;
begin
  if jsonb_typeof(p) is distinct from 'object' then
    raise exception 'sugestão inválida' using errcode = '22023';
  end if;
  for k in select jsonb_object_keys(limits) loop
    if jsonb_typeof(p -> k) = 'string' then
      v := nullif(btrim(p ->> k, E' \t\r\n'), '');
      if v is not null then
        if length(v) > (limits ->> k)::int then
          raise exception 'campo % longo demais', k using errcode = '22001';
        end if;
        if k in ('ticketUrl', 'sourceUrl') and v !~* '^https?://[^\s/]+\.[^\s]+$' then
          raise exception 'link inválido em %', k using errcode = '22023';
        end if;
        out := out || jsonb_build_object(k, v);
      end if;
    end if;
  end loop;
  if jsonb_typeof(p -> 'categoryId') = 'number' then
    out := out || jsonb_build_object('categoryId', (p ->> 'categoryId')::numeric::int);
  end if;
  if out ->> 'title' is null or out ->> 'startsAtLocal' is null or out ->> 'venueName' is null then
    raise exception 'faltam título, data ou local' using errcode = '23502';
  end if;
  if out ->> 'startsAtLocal' !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$' then
    raise exception 'data inválida' using errcode = '22007';
  end if;
  return out;
end;
$$;

-- Limites: 5 sugestões por hora e 20 por dia por origem.
create function public.submit_event_suggestion(p_payload jsonb, p_contact_email text default null)
returns table (protocol text, tracking_code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  client text := private.client_hash();
  payload jsonb := private.clean_submission(p_payload);
  email text := nullif(lower(btrim(coalesce(p_contact_email, ''))), '');
  -- Sem 0/O, 1/I/L: o código é digitado à mão.
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  code text;
  proto text;
begin
  if (payload ->> 'categoryId') is not null and not exists (select 1 from public.categories c where c.id = (payload ->> 'categoryId')::int) then
    payload := payload - 'categoryId';
  end if;
  if email is not null and (length(email) > 254 or email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') then
    raise exception 'e-mail inválido' using errcode = '22023';
  end if;

  delete from private.submission_attempts where created_at < now() - interval '24 hours';
  if (select count(*) from private.submission_attempts a where a.client_hash = client and a.created_at > now() - interval '1 hour') >= 5
    or (select count(*) from private.submission_attempts a where a.client_hash = client) >= 20 then
    raise exception 'muitas sugestões seguidas' using errcode = 'P0429';
  end if;
  insert into private.submission_attempts (client_hash) values (client);

  select string_agg(substr(alphabet, 1 + (get_byte(b, i) % length(alphabet)), 1), '')
    into code
    from (select extensions.gen_random_bytes(10) b) r, generate_series(0, 9) i;
  loop
    select 'RW-' || to_char(now() at time zone 'America/Sao_Paulo', 'YYMMDD') || '-' ||
           string_agg(substr(alphabet, 1 + (get_byte(b, i) % length(alphabet)), 1), '')
      into proto
      from (select extensions.gen_random_bytes(4) b) r, generate_series(0, 3) i;
    exit when not exists (select 1 from public.submissions s where s.protocol = proto);
  end loop;

  insert into public.submissions (protocol, tracking_token_hash, payload, contact_email)
  values (proto, encode(extensions.digest(code, 'sha256'), 'hex'), payload, email);
  return query select proto, code;
end;
$$;

/** Situação de uma sugestão; vazio quando protocolo e código não batem. */
create function public.track_submission(p_protocol text, p_code text)
returns table (status public.submission_status, public_note text, title text, created_at timestamptz, updated_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select s.status, s.public_note, s.payload ->> 'title', s.created_at, s.updated_at
  from public.submissions s
  where s.protocol = upper(btrim(p_protocol))
    and s.tracking_token_hash = encode(extensions.digest(upper(regexp_replace(coalesce(p_code, ''), '[\s-]', '', 'g')), 'sha256'), 'hex')
$$;

revoke execute on function private.client_hash() from public;
revoke execute on function private.clean_submission(jsonb) from public;
revoke execute on function public.submit_event_suggestion(jsonb, text) from public;
revoke execute on function public.track_submission(text, text) from public;
grant execute on function public.submit_event_suggestion(jsonb, text) to anon, authenticated;
grant execute on function public.track_submission(text, text) to anon, authenticated;

comment on function public.submit_event_suggestion is
  'Sugestão pública. Exige title, startsAtLocal e venueName. Erros: P0429 limite, 22001 campo longo, 22023 link ou e-mail inválido, 23502 faltam campos, 22007 data inválida.';
