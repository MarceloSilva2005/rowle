begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

-- Fixtures (como superusuário, sem RLS). O rollback do fim devolve tudo.
truncate public.events, public.venues, public.organizations, public.audit_log cascade;
truncate private.report_attempts, private.submission_attempts;
insert into public.events (id, slug, title, category_id) values
  ('00000000-0000-0000-0000-00000000e001', 'evento', 'Evento', 1);

-- s1: recusada há 200 dias (limpa) · s2: aceita há 10 dias (fica) · s3: aberta há 300 dias (fica)
insert into public.submissions (id, protocol, tracking_token_hash, payload, contact_email, status) values
  ('00000000-0000-0000-0000-00000000a001', 'RW-1', 'x', '{}', 'antiga@exemplo.test', 'received'),
  ('00000000-0000-0000-0000-00000000a002', 'RW-2', 'x', '{}', 'recente@exemplo.test', 'received'),
  ('00000000-0000-0000-0000-00000000a003', 'RW-3', 'x', '{}', 'aberta@exemplo.test', 'received');
update public.submissions set status = 'rejected' where id = '00000000-0000-0000-0000-00000000a001';
update public.submissions set status = 'accepted' where id = '00000000-0000-0000-0000-00000000a002';
alter table public.submissions disable trigger submissions_touch;
update public.submissions set updated_at = now() - interval '200 days' where id = '00000000-0000-0000-0000-00000000a001';
update public.submissions set updated_at = now() - interval '300 days' where id = '00000000-0000-0000-0000-00000000a003';
alter table public.submissions enable trigger submissions_touch;

-- r1: resolvida há 400 dias (limpa) · r2: resolvida há 30 dias (fica) · r3: aberta há 400 dias (fica)
insert into public.reports (id, event_id, reason, details, status, resolved_at, created_at) values
  ('00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-00000000e001', 'other', 'texto antigo', 'resolved', now() - interval '400 days', now() - interval '401 days'),
  ('00000000-0000-0000-0000-00000000d002', '00000000-0000-0000-0000-00000000e001', 'other', 'texto recente', 'dismissed', now() - interval '30 days', now() - interval '31 days'),
  ('00000000-0000-0000-0000-00000000d003', '00000000-0000-0000-0000-00000000e001', 'other', 'texto aberto', 'open', null, now() - interval '400 days');
update public.reports set resolution_note = 'ok' where id = '00000000-0000-0000-0000-00000000d001';

insert into public.audit_log (table_name, row_id, action, changed_at) values
  ('events', 'velho', 'UPDATE', now() - interval '25 months'),
  ('events', 'novo', 'UPDATE', now() - interval '23 months');
insert into private.report_attempts (client_hash, event_id, reason, created_at) values ('h', '00000000-0000-0000-0000-00000000e001', 'other', now() - interval '2 days');

select is(
  private.apply_retention(),
  '{"emails": 1, "details": 1, "history": 1}'::jsonb,
  'limpa um e-mail, um texto de denúncia e um registro antigo do histórico'
);
select results_eq(
  $$ select protocol, contact_email from public.submissions order by protocol $$,
  $$ values ('RW-1', null), ('RW-2', 'recente@exemplo.test'), ('RW-3', 'aberta@exemplo.test') $$,
  'só a sugestão fechada há mais de 180 dias perde o e-mail'
);
select results_eq(
  $$ select details from public.reports order by created_at, details $$,
  $$ values (null::text), ('texto aberto'), ('texto recente') $$,
  'só a denúncia resolvida há mais de 1 ano perde o texto'
);
select is(
  (select count(*)::int from public.audit_log
   where row_id = '00000000-0000-0000-0000-00000000a001'
     and (old_data::text like '%antiga@%' or new_data::text like '%antiga@%')),
  0, 'o e-mail apagado some também do histórico'
);
select ok(
  (select count(*) > 0 from public.audit_log
   where row_id = '00000000-0000-0000-0000-00000000a002' and new_data::text like '%recente@%'),
  'o histórico da sugestão recente continua completo'
);
select is(
  (select count(*)::int from public.audit_log where row_id = '00000000-0000-0000-0000-00000000d001' and old_data::text like '%texto antigo%'),
  0, 'o texto apagado da denúncia some também do histórico'
);
select results_eq(
  $$ select row_id from public.audit_log where row_id in ('velho', 'novo') $$,
  $$ values ('novo') $$,
  'histórico com mais de 2 anos é apagado'
);
select is((select count(*)::int from private.report_attempts), 0, 'tentativas com mais de 24 horas são apagadas');

select * from finish();
rollback;
