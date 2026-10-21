-- Prazos de guarda (M5 parte 4), os mesmos da política de privacidade
-- (packages/core/src/legal.ts; os dois precisam mudar juntos):
--   - e-mail de contato da sugestão: apagado 180 dias depois que ela é fechada;
--   - texto da denúncia: apagado 1 ano depois que ela é resolvida ou descartada;
--   - histórico de alterações: 2 anos;
--   - tentativas usadas no limite por origem: 24 horas.
-- O histórico guarda cópias das linhas, então os mesmos campos saem dele também.

create function private.apply_retention()
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  cleared_emails integer;
  cleared_details integer;
  deleted_history integer;
begin
  with cleared as (
    update public.submissions
    set contact_email = null
    where contact_email is not null
      and status in ('accepted', 'rejected')
      and updated_at < now() - interval '180 days'
    returning id
  )
  select count(*) into cleared_emails from cleared;

  with cleared as (
    update public.reports
    set details = null
    where details is not null
      and status in ('resolved', 'dismissed')
      and coalesce(resolved_at, created_at) < now() - interval '1 year'
    returning id
  )
  select count(*) into cleared_details from cleared;

  -- Cópias no histórico de sugestões e denúncias que já não têm o dado na linha
  -- (inclui as que acabaram de ser limpas e as apagadas).
  update public.audit_log a
  set old_data = a.old_data - 'contact_email',
      new_data = a.new_data - 'contact_email'
  where a.table_name = 'submissions'
    and (a.old_data ? 'contact_email' or a.new_data ? 'contact_email')
    and not exists (
      select 1 from public.submissions s where s.id::text = a.row_id and s.contact_email is not null
    );

  update public.audit_log a
  set old_data = a.old_data - 'details',
      new_data = a.new_data - 'details'
  where a.table_name = 'reports'
    and (a.old_data ? 'details' or a.new_data ? 'details')
    and not exists (
      select 1 from public.reports r where r.id::text = a.row_id and r.details is not null
    );

  delete from public.audit_log where changed_at < now() - interval '2 years';
  get diagnostics deleted_history = row_count;

  delete from private.report_attempts where created_at < now() - interval '24 hours';
  delete from private.submission_attempts where created_at < now() - interval '24 hours';

  return jsonb_build_object('emails', cleared_emails, 'details', cleared_details, 'history', deleted_history);
end;
$$;

-- 07:30 UTC = 04:30 em Brasília, depois da expiração dos eventos.
select cron.schedule('rowle-retention', '30 7 * * *', $$select private.apply_retention()$$);
