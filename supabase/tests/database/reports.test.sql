begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

-- Fixtures (como superusuário, sem RLS). O rollback do fim devolve tudo.
truncate public.events, public.venues, public.organizations, public.audit_log cascade;
truncate private.report_attempts;
insert into public.venues (id, slug, name, address, region_id) values
  ('00000000-0000-0000-0000-00000000b001', 'galpao', 'Galpão', 'QNM 34, Área Especial', 9);
insert into public.events (id, slug, title, category_id, status) values
  ('00000000-0000-0000-0000-00000000e001', 'publicado', 'Evento publicado', 1, 'draft'),
  ('00000000-0000-0000-0000-00000000e002', 'rascunho', 'Evento em rascunho', 1, 'draft');
insert into public.sessions (id, event_id, venue_id, starts_at) values
  ('00000000-0000-0000-0000-00000000c001', '00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-00000000b001', now() + interval '1 day'),
  ('00000000-0000-0000-0000-00000000c002', '00000000-0000-0000-0000-00000000e002', '00000000-0000-0000-0000-00000000b001', now() + interval '1 day');
insert into public.sources (event_id, kind, url) values
  ('00000000-0000-0000-0000-00000000e001', 'official_site', 'https://exemplo.test/a');
update public.events set status = 'in_review' where id = '00000000-0000-0000-0000-00000000e001';
update public.events set status = 'published' where id = '00000000-0000-0000-0000-00000000e001';

set local role anon;
select set_config('request.headers', '{"x-forwarded-for": "203.0.113.7, 10.0.0.1"}', true);

select throws_ok(
  $$ insert into public.reports (event_id, reason) values ('00000000-0000-0000-0000-00000000e001', 'fraud') $$,
  '42501', null, 'o visitante não escreve direto na tabela'
);
select lives_ok(
  $$ select public.submit_report('00000000-0000-0000-0000-00000000e001', 'wrong_info', E'  O horário mudou.\n ', '00000000-0000-0000-0000-00000000c001') $$,
  'o visitante denuncia um evento publicado'
);
select throws_ok(
  $$ select public.submit_report('00000000-0000-0000-0000-00000000e002', 'fraud') $$,
  'P0002', null, 'rascunho não recebe denúncia'
);
select throws_ok(
  $$ select public.submit_report('00000000-0000-0000-0000-00000000e001', 'other', repeat('a', 2001)) $$,
  '22001', null, 'texto acima de 2000 caracteres é recusado'
);
-- Repetir o mesmo motivo não cria outra denúncia; sessão de outro evento é ignorada.
select public.submit_report('00000000-0000-0000-0000-00000000e001', 'wrong_info');
select public.submit_report('00000000-0000-0000-0000-00000000e001', 'fraud', null, '00000000-0000-0000-0000-00000000c002');

reset role;
select results_eq(
  $$ select reason::text, details, session_id from public.reports order by reason::text desc $$,
  $$ values ('wrong_info', 'O horário mudou.', '00000000-0000-0000-0000-00000000c001'::uuid), ('fraud', null, null) $$,
  'grava motivo, texto limpo e só a sessão do próprio evento'
);
select is((select count(*)::int from private.report_attempts where client_hash like '%203.0.113.7%'), 0, 'o IP não é guardado em claro');
select is((select status::text from public.reports where reason = 'fraud'), 'open', 'a denúncia entra na fila como aberta');

set local role anon;
select public.submit_report('00000000-0000-0000-0000-00000000e001', r)
from unnest(array['suspicious_link', 'offensive', 'image_rights']::public.report_reason[]) r;
select throws_ok(
  $$ select public.submit_report('00000000-0000-0000-0000-00000000e001', 'other') $$,
  'P0429', null, 'a sexta denúncia em 10 minutos da mesma origem é barrada'
);
select set_config('request.headers', '{"x-forwarded-for": "198.51.100.2"}', true);
select lives_ok(
  $$ select public.submit_report('00000000-0000-0000-0000-00000000e001', 'other') $$,
  'outra origem continua podendo denunciar'
);
select throws_ok(
  $$ select * from private.report_attempts $$,
  '42501', null, 'o visitante não lê as tentativas'
);

select * from finish();
rollback;
