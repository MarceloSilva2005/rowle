begin;
create extension if not exists pgtap with schema extensions;
select plan(20);

-- Fixtures (como superusuário, sem RLS). O rollback do fim devolve tudo.
truncate public.events, public.venues, public.organizations, public.audit_log, public.staff cascade;
truncate private.link_checks;
insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000a1', 'curadoria@exemplo.test')
  on conflict (id) do nothing;
insert into public.staff (user_id, display_name) values ('00000000-0000-0000-0000-0000000000a1', 'Curadoria');
insert into public.venues (id, slug, name, address, region_id) values
  ('00000000-0000-0000-0000-00000000b001', 'galpao', 'Galpão', 'QNM 34, Área Especial', 9);

-- e1: acabou há 40 dias (expira) · e2: acabou há 10 dias (fica) · e3: cancelado há 40 dias (expira)
-- e4: daqui a 3 dias, conferido há 3 dias (vencido) · e5: daqui a 3 dias, conferido agora
-- e6: daqui a 60 dias, conferido há 10 dias (em dia) · e7: adiado · e8: rascunho com link
insert into public.events (id, slug, title, category_id, status) values
  ('00000000-0000-0000-0000-00000000e001', 'e1', 'Acabou faz tempo', 1, 'draft'),
  ('00000000-0000-0000-0000-00000000e002', 'e2', 'Acabou faz pouco', 1, 'draft'),
  ('00000000-0000-0000-0000-00000000e003', 'e3', 'Cancelado antigo', 1, 'draft'),
  ('00000000-0000-0000-0000-00000000e004', 'e4', 'Semana que vem vencido', 1, 'draft'),
  ('00000000-0000-0000-0000-00000000e005', 'e5', 'Semana que vem em dia', 1, 'draft'),
  ('00000000-0000-0000-0000-00000000e006', 'e6', 'Daqui a dois meses', 1, 'draft'),
  ('00000000-0000-0000-0000-00000000e007', 'e7', 'Adiado', 1, 'draft'),
  ('00000000-0000-0000-0000-00000000e008', 'e8', 'Rascunho', 1, 'draft');
insert into public.sessions (id, event_id, venue_id, starts_at, ticket_url) values
  ('00000000-0000-0000-0000-00000000c001', '00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-00000000b001', now() - interval '40 days', null),
  ('00000000-0000-0000-0000-00000000c002', '00000000-0000-0000-0000-00000000e002', '00000000-0000-0000-0000-00000000b001', now() - interval '10 days', null),
  ('00000000-0000-0000-0000-00000000c003', '00000000-0000-0000-0000-00000000e003', '00000000-0000-0000-0000-00000000b001', now() - interval '40 days', null),
  ('00000000-0000-0000-0000-00000000c004', '00000000-0000-0000-0000-00000000e004', '00000000-0000-0000-0000-00000000b001', now() + interval '3 days', 'https://ingressos.exemplo.test/4'),
  ('00000000-0000-0000-0000-00000000c005', '00000000-0000-0000-0000-00000000e005', '00000000-0000-0000-0000-00000000b001', now() + interval '3 days', 'https://ingressos.exemplo.test/5'),
  ('00000000-0000-0000-0000-00000000c006', '00000000-0000-0000-0000-00000000e006', '00000000-0000-0000-0000-00000000b001', now() + interval '60 days', null),
  ('00000000-0000-0000-0000-00000000c007', '00000000-0000-0000-0000-00000000e007', '00000000-0000-0000-0000-00000000b001', now() + interval '5 days', null),
  ('00000000-0000-0000-0000-00000000c008', '00000000-0000-0000-0000-00000000e008', '00000000-0000-0000-0000-00000000b001', now() + interval '3 days', 'https://ingressos.exemplo.test/8');
insert into public.sources (event_id, kind, url, last_verified_at)
select e.id, 'official_site', 'https://exemplo.test/' || e.slug, now() - v.ago
from public.events e
join (values ('e1', interval '50 days'), ('e2', interval '20 days'), ('e3', interval '50 days'),
             ('e4', interval '3 days'), ('e5', interval '0'), ('e6', interval '10 days'), ('e7', interval '3 days'))
  as v(slug, ago) on v.slug = e.slug;
update public.events set status = 'in_review' where slug <> 'e8';
update public.events set status = 'published' where slug <> 'e8';
update public.events set status = 'cancelled', status_note = 'Cancelado pela produção.' where slug = 'e3';
update public.events set status = 'postponed', status_note = 'Nova data a definir.' where slug = 'e7';

-- Expiração
select is(private.expire_events(), 2, 'arquiva os dois eventos cuja última sessão foi há mais de 30 dias');
select results_eq(
  $$ select slug, status::text from public.events where slug in ('e1', 'e2', 'e3') order by slug $$,
  $$ values ('e1', 'archived'), ('e2', 'published'), ('e3', 'archived') $$,
  'publicado e cancelado antigos arquivados; o recente continua visível para quem salvou'
);
select is((select status_note from public.events where slug = 'e3'), 'Cancelado pela produção.', 'o motivo do cancelamento é mantido');
select is(
  (select actor from public.audit_log where table_name = 'events' and row_id = '00000000-0000-0000-0000-00000000e001'
     and new_data ->> 'status' = 'archived'),
  null, 'o histórico registra a mudança sem autor (automática)'
);
select is(private.expire_events(), 0, 'rodar de novo não muda nada');

-- Classificação das respostas
select is(private.link_check_outcome(200, false, null), 'ok', '200 é link bom');
select is(private.link_check_outcome(302, false, null), 'ok', 'redirecionamento é link bom');
select is(private.link_check_outcome(404, false, null), 'fail', '404 é falha');
select is(private.link_check_outcome(null, false, 'Could not resolve host'), 'fail', 'domínio inexistente é falha');
select is(private.link_check_outcome(403, false, null), 'unknown', 'site que recusa robô não conta como quebrado');
select is(private.link_check_outcome(null, true, 'Timeout'), 'unknown', 'demora não conta como quebrado');

-- Fila do verificador: só sessões futuras de eventos visíveis, com link
select results_eq(
  $$ select session_id from private.sessions_due_for_link_check(20) order by session_id $$,
  $$ values ('00000000-0000-0000-0000-00000000c004'::uuid), ('00000000-0000-0000-0000-00000000c005'::uuid) $$,
  'rascunho e sessões sem link ficam de fora'
);

-- Duas falhas seguidas quebram; uma resposta boa recupera
select private.apply_link_check('00000000-0000-0000-0000-00000000c004', 'fail');
select is((select ticket_url_status::text from public.sessions where id = '00000000-0000-0000-0000-00000000c004'), 'unchecked', 'uma falha ainda não marca como quebrado');
select private.apply_link_check('00000000-0000-0000-0000-00000000c004', 'unknown');
select private.apply_link_check('00000000-0000-0000-0000-00000000c004', 'fail');
select is((select ticket_url_status::text from public.sessions where id = '00000000-0000-0000-0000-00000000c004'), 'broken', 'a segunda falha marca como quebrado');
select is(
  (select count(*)::int from public.audit_log where table_name = 'sessions' and action = 'UPDATE'
     and row_id = '00000000-0000-0000-0000-00000000c004'),
  1, 'na auditoria entra só a quebra, não cada checagem'
);
select is(
  (select count(*)::int from public.discoverable_sessions where session_id = '00000000-0000-0000-0000-00000000c004' and ticket_url is null),
  1, 'o app deixa de mostrar o botão de ingresso'
);
update public.sessions set ticket_url = 'https://ingressos.exemplo.test/novo' where id = '00000000-0000-0000-0000-00000000c004';
select is(
  (select ticket_url_status::text || '/' || ticket_url_failures from public.sessions where id = '00000000-0000-0000-0000-00000000c004'),
  'unchecked/0', 'trocar o link zera a checagem'
);
select private.apply_link_check('00000000-0000-0000-0000-00000000c004', 'fail');
select private.apply_link_check('00000000-0000-0000-0000-00000000c004', 'fail');

-- Fila de revalidação, vista pela curadoria
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000a1", "role": "authenticated"}', true);
select results_eq(
  $$ select title, reason from public.revalidation_queue order by title $$,
  $$ values ('Adiado', 'postponed'), ('Semana que vem vencido', 'broken_link') $$,
  'entram o adiado e o link quebrado; em dia, passados e rascunhos ficam de fora'
);
select public.mark_event_verified('00000000-0000-0000-0000-00000000e007');
select results_eq(
  $$ select title from public.revalidation_queue $$,
  $$ values ('Semana que vem vencido') $$,
  'conferir tira o adiado da fila por 2 dias; link quebrado só sai quando o link for resolvido'
);

set local role anon;
select throws_ok(
  $$ select * from public.revalidation_queue $$,
  '42501', null, 'o público não lê a fila de revalidação'
);

select * from finish();
rollback;
