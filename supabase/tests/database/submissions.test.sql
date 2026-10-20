begin;
create extension if not exists pgtap with schema extensions;
select plan(13);

truncate public.submissions cascade;
truncate private.submission_attempts;
create temp table sent (protocol text, tracking_code text) on commit drop;
grant all on sent to anon;

set local role anon;
select set_config('request.headers', '{"x-forwarded-for": "203.0.113.9"}', true);

select throws_ok(
  $$ insert into public.submissions (protocol, tracking_token_hash, payload) values ('X', 'y', '{}') $$,
  '42501', null, 'o visitante não escreve direto na tabela'
);

insert into sent
select * from public.submit_event_suggestion(
  '{"title": "  Samba no Setor  ", "startsAtLocal": "2026-11-20T19:00", "venueName": "Praça",
    "categoryId": 1, "ticketUrl": "https://ingressos.exemplo.test/samba", "extra": "ignorado", "priceText": 30}',
  ' Produtora@Exemplo.test '
);
select ok((select protocol ~ '^RW-\d{6}-[A-HJKMNP-Z2-9]{4}$' from sent), 'o protocolo segue o formato RW-AAMMDD-XXXX');
select ok((select tracking_code ~ '^[A-HJKMNP-Z2-9]{10}$' from sent), 'o código tem 10 caracteres sem ambíguos');

select results_eq(
  $$ select status::text, title from public.track_submission((select protocol from sent), (select lower(tracking_code) from sent)) $$,
  $$ values ('received', 'Samba no Setor') $$,
  'protocolo + código mostram a situação (código sem diferença de maiúsculas)'
);
select is_empty(
  $$ select * from public.track_submission((select protocol from sent), 'AAAAAAAAAA') $$,
  'código errado não mostra nada'
);
select throws_ok(
  $$ select * from public.submit_event_suggestion('{"title": "Sem data", "venueName": "Praça"}') $$,
  '23502', null, 'título, data e local são obrigatórios'
);
select throws_ok(
  $$ select * from public.submit_event_suggestion('{"title": "A", "startsAtLocal": "amanhã", "venueName": "B"}') $$,
  '22007', null, 'data fora do formato é recusada'
);
select throws_ok(
  $$ select * from public.submit_event_suggestion('{"title": "A", "startsAtLocal": "2026-11-20T19:00", "venueName": "B", "sourceUrl": "javascript:alert(1)"}') $$,
  '22023', null, 'link que não é http(s) é recusado'
);
select throws_ok(
  $$ select * from public.submit_event_suggestion(jsonb_build_object('title', repeat('a', 141), 'startsAtLocal', '2026-11-20T19:00', 'venueName', 'B')) $$,
  '22001', null, 'título acima de 140 caracteres é recusado'
);

reset role;
select results_eq(
  $$ select payload, contact_email, status::text from public.submissions $$,
  $$ values ('{"title": "Samba no Setor", "startsAtLocal": "2026-11-20T19:00", "venueName": "Praça", "categoryId": 1, "ticketUrl": "https://ingressos.exemplo.test/samba"}'::jsonb,
             'produtora@exemplo.test', 'received') $$,
  'grava só os campos conhecidos, limpos, e o e-mail em minúsculas'
);
select is((select count(*)::int from public.submissions where tracking_token_hash = (select tracking_code from sent)), 0, 'o código não é guardado em claro');

set local role anon;
select public.submit_event_suggestion(jsonb_build_object('title', 'Extra ' || i, 'startsAtLocal', '2026-11-20T19:00', 'venueName', 'B'))
from generate_series(1, 4) i;
select throws_ok(
  $$ select * from public.submit_event_suggestion('{"title": "Sexta", "startsAtLocal": "2026-11-20T19:00", "venueName": "B"}') $$,
  'P0429', null, 'a sexta sugestão na mesma hora da mesma origem é barrada'
);
select throws_ok($$ select private.client_hash() $$, '42501', null, 'o visitante não chama funções privadas');

select * from finish();
rollback;
