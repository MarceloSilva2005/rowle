begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

-- Fixtures (como superusuário, sem RLS). O rollback do fim devolve tudo.
truncate public.events, public.venues, public.organizations, public.audit_log cascade;
insert into auth.users (id, email)
values ('00000000-0000-0000-0000-0000000000a1', 'curadoria@exemplo.test');
insert into public.staff (user_id, role, display_name)
values ('00000000-0000-0000-0000-0000000000a1', 'curator', 'Curadoria de teste');

insert into public.venues (id, slug, name, address, region_id) values
  ('00000000-0000-0000-0000-0000000000f1', 'galpao', 'Galpão de teste', 'Endereço do galpão, Brasília', 1),
  ('00000000-0000-0000-0000-0000000000f2', 'praca', 'Praça de teste', 'Endereço da praça, Brasília', 1);

insert into public.events (id, slug, title, category_id, status) values
  ('00000000-0000-0000-0000-0000000000e1', 'forro-na-praca', 'Forró na Praça', 1, 'draft'),
  ('00000000-0000-0000-0000-0000000000e2', 'noite-de-forro', 'Noite de forró com Zé', 1, 'draft'),
  ('00000000-0000-0000-0000-0000000000e3', 'festival-de-jazz-2025', 'Festival de Jazz', 1, 'draft'),
  ('00000000-0000-0000-0000-0000000000e4', 'teatro-hamlet', 'Teatro: Hamlet', 1, 'draft'),
  ('00000000-0000-0000-0000-0000000000e5', 'forro-arquivado', 'Forró na Praça', 1, 'draft');
update public.events set status = 'archived' where id = '00000000-0000-0000-0000-0000000000e5';

-- 20/11/2030, 23h30 em Brasília = 21/11 02h30 UTC: o "mesmo dia" é o de Brasília.
insert into public.sessions (event_id, venue_id, starts_at) values
  ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000f1', '2030-11-21 02:30:00+00'),
  ('00000000-0000-0000-0000-0000000000e3', '00000000-0000-0000-0000-0000000000f2', now() - interval '1 year'),
  ('00000000-0000-0000-0000-0000000000e4', '00000000-0000-0000-0000-0000000000f2', '2030-11-20 22:00:00+00');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;

select results_eq(
  $$ select event_id, strong from public.find_possible_duplicates('FORRO NA PRACA!') $$,
  $$ values ('00000000-0000-0000-0000-0000000000e1'::uuid, true) $$,
  'acha o mesmo título sem acento e com outra caixa; ignora o arquivado'
);
select results_eq(
  $$ select event_id, strong from public.find_possible_duplicates(
       'Forró do Zé no Galpão', array['2030-11-20']::date[], array['00000000-0000-0000-0000-0000000000f1']::uuid[]) $$,
  $$ values ('00000000-0000-0000-0000-0000000000e2'::uuid, true) $$,
  'mesmo dia em Brasília e mesmo local com título parecido é forte'
);
select is_empty(
  $$ select 1 from public.find_possible_duplicates('Forró do Zé no Galpão', array['2030-11-21']::date[],
       array['00000000-0000-0000-0000-0000000000f1']::uuid[]) $$,
  'o dia seguinte em UTC não conta como o mesmo dia'
);
select is_empty(
  $$ select 1 from public.find_possible_duplicates('Samba da Tia Zélia', array['2030-11-20']::date[],
       array['00000000-0000-0000-0000-0000000000f2']::uuid[]) $$,
  'mesmo dia e local com título sem relação não é duplicata'
);
select is_empty(
  $$ select 1 from public.find_possible_duplicates('Festival de Jazz 2026') $$,
  'edição de um ano atrás não aparece só pelo título'
);
select results_eq(
  $$ select event_id from public.find_possible_duplicates('Festival de Jazz 2026', array[(now() - interval '1 year')::date]) $$,
  $$ values ('00000000-0000-0000-0000-0000000000e3'::uuid) $$,
  'mas aparece se a data também bate'
);
select is_empty(
  $$ select 1 from public.find_possible_duplicates('Forró na Praça', '{}', '{}', '00000000-0000-0000-0000-0000000000e1') $$,
  'o próprio evento não é duplicata de si mesmo'
);

-- Um evento novo, cadastrado de outra fonte, para o mesmo rolê do e2.
insert into public.events (id, slug, title, category_id)
values ('00000000-0000-0000-0000-0000000000e6', 'forro-do-ze', 'Forró do Zé no Galpão', 1);
insert into public.sessions (event_id, venue_id, starts_at)
values ('00000000-0000-0000-0000-0000000000e6', '00000000-0000-0000-0000-0000000000f1', '2030-11-20 23:00:00-03');
select results_eq(
  $$ select event_id from public.possible_duplicates_of_event('00000000-0000-0000-0000-0000000000e6') $$,
  $$ values ('00000000-0000-0000-0000-0000000000e2'::uuid) $$,
  'evento cadastrado é comparado pelas próprias sessões'
);

insert into public.duplicate_dismissals (event_id, other_event_id)
values ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000e6');
select is_empty(
  $$ select 1 from public.possible_duplicates_of_event('00000000-0000-0000-0000-0000000000e6') $$,
  'par marcado como "não é duplicata" deixa de aparecer'
);
select is(
  (select dismissed_by from public.duplicate_dismissals), '00000000-0000-0000-0000-0000000000a1'::uuid,
  'registra quem marcou o par'
);
reset role;

set local role anon;
select throws_ok(
  $$ select * from public.find_possible_duplicates('Forró na Praça') $$,
  '42501', null, 'visitante não consulta duplicatas'
);
reset role;

select * from finish();
rollback;
