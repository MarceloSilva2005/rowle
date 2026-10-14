-- Regras de negócio aplicadas no banco: papéis da equipe, ciclo de vida do
-- evento, auditoria e a visão de sessões que podem aparecer na descoberta.

create function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.staff where user_id = auth.uid());
$$;

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.staff where user_id = auth.uid() and role = 'admin');
$$;

create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger organizations_touch before update on public.organizations
  for each row execute function public.touch_updated_at();
create trigger organization_contacts_touch before update on public.organization_contacts
  for each row execute function public.touch_updated_at();
create trigger venues_touch before update on public.venues
  for each row execute function public.touch_updated_at();
create trigger events_touch before update on public.events
  for each row execute function public.touch_updated_at();
create trigger sessions_touch before update on public.sessions
  for each row execute function public.touch_updated_at();
create trigger submissions_touch before update on public.submissions
  for each row execute function public.touch_updated_at();

-- Transições permitidas do ciclo de vida do evento.
-- Espelhada em packages/core/src/event-status.ts; os dois precisam mudar juntos.
create function public.event_transition_allowed(from_status public.event_status, to_status public.event_status)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select (from_status::text, to_status::text) in (
    ('draft', 'in_review'),
    ('draft', 'archived'),
    ('in_review', 'published'),
    ('in_review', 'changes_requested'),
    ('in_review', 'rejected'),
    ('changes_requested', 'in_review'),
    ('changes_requested', 'archived'),
    ('published', 'postponed'),
    ('published', 'cancelled'),
    ('published', 'suspended'),
    ('published', 'archived'),
    ('postponed', 'published'),
    ('postponed', 'cancelled'),
    ('postponed', 'archived'),
    ('suspended', 'published'),
    ('suspended', 'archived'),
    ('cancelled', 'archived'),
    ('rejected', 'archived')
  );
$$;

create function public.enforce_event_lifecycle()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.status not in ('draft', 'in_review') then
      raise exception 'Um evento novo começa como rascunho ou em revisão.'
        using errcode = 'check_violation';
    end if;
    return new;
  end if;

  if new.status is distinct from old.status then
    if not public.event_transition_allowed(old.status, new.status) then
      raise exception 'Mudança de status não permitida: % → %.', old.status, new.status
        using errcode = 'check_violation';
    end if;

    if new.status = 'published' then
      if not exists (select 1 from public.sessions where event_id = new.id) then
        raise exception 'Para publicar, o evento precisa de pelo menos uma sessão.'
          using errcode = 'check_violation';
      end if;
      if not exists (select 1 from public.sources where event_id = new.id) then
        raise exception 'Para publicar, o evento precisa de pelo menos uma fonte.'
          using errcode = 'check_violation';
      end if;
      new.published_at := coalesce(new.published_at, now());
    end if;

    if new.status in ('rejected', 'cancelled', 'postponed', 'suspended')
       and coalesce(trim(new.status_note), '') = '' then
      raise exception 'Informe o motivo ao marcar o evento como %.', new.status
        using errcode = 'check_violation';
    end if;
  end if;

  return new;
end;
$$;

create trigger events_lifecycle before insert or update on public.events
  for each row execute function public.enforce_event_lifecycle();

-- Auditoria: quem mudou o quê e quando. Grava com privilégio próprio para que
-- ninguém precise (nem consiga) escrever direto na tabela de auditoria.
create function public.write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  row_key text;
begin
  row_key := coalesce(
    (case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end) ->> 'id',
    (case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end) ->> 'organization_id',
    (case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end) ->> 'user_id'
  );
  insert into public.audit_log (table_name, row_id, action, actor, old_data, new_data)
  values (
    tg_table_name,
    row_key,
    tg_op,
    auth.uid(),
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );
  return null;
end;
$$;

create trigger events_audit after insert or update or delete on public.events
  for each row execute function public.write_audit_log();
create trigger sessions_audit after insert or update or delete on public.sessions
  for each row execute function public.write_audit_log();
create trigger venues_audit after insert or update or delete on public.venues
  for each row execute function public.write_audit_log();
create trigger organizations_audit after insert or update or delete on public.organizations
  for each row execute function public.write_audit_log();
create trigger organization_contacts_audit after insert or update or delete on public.organization_contacts
  for each row execute function public.write_audit_log();
create trigger sources_audit after insert or update or delete on public.sources
  for each row execute function public.write_audit_log();
create trigger submissions_audit after update or delete on public.submissions
  for each row execute function public.write_audit_log();
create trigger reports_audit after update or delete on public.reports
  for each row execute function public.write_audit_log();
create trigger staff_audit after insert or update or delete on public.staff
  for each row execute function public.write_audit_log();

-- Sessões que podem aparecer na descoberta: evento publicado, sessão ativa e
-- ainda não encerrada. Sem horário de término, considera 6 horas após o início;
-- com horário a confirmar, vale até o fim do dia (horário de Brasília).
create view public.discoverable_sessions
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
  case when s.ticket_url_status in ('broken', 'suspicious') then null else s.ticket_url end as ticket_url
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
