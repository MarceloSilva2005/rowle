begin;
create extension if not exists pgtap with schema extensions;
select plan(24);

-- Fixtures (como superusuário, sem RLS). O catálogo começa vazio mesmo que o banco
-- local tenha dados cadastrados à mão; o rollback do fim devolve tudo.
truncate public.events, public.venues, public.organizations, public.audit_log cascade;
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'curadoria@exemplo.test'),
  ('00000000-0000-0000-0000-0000000000a2', 'sem-papel@exemplo.test');
insert into public.staff (user_id, role, display_name)
values ('00000000-0000-0000-0000-0000000000a1', 'curator', 'Curadoria de teste');

insert into public.venues (id, slug, name, address, region_id)
values ('00000000-0000-0000-0000-0000000000f1', 'local-de-teste', 'Local de teste', 'Endereço de teste, Brasília', 1);
insert into public.organizations (id, slug, name)
values ('00000000-0000-0000-0000-0000000000c1', 'produtora-de-teste', 'Produtora de teste');
insert into public.organization_contacts (organization_id, email)
values ('00000000-0000-0000-0000-0000000000c1', 'contato@exemplo.test');

insert into public.events (id, slug, title, category_id, status) values
  ('00000000-0000-0000-0000-0000000000e1', 'evento-rascunho', 'Evento em rascunho', 1, 'draft'),
  ('00000000-0000-0000-0000-0000000000e2', 'evento-publicado', 'Evento publicado', 1, 'in_review'),
  ('00000000-0000-0000-0000-0000000000e3', 'evento-sem-sessao', 'Evento sem sessão', 1, 'in_review');

insert into public.sessions (event_id, venue_id, starts_at, price_kind, price_min_cents) values
  ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000f1', now() + interval '2 days', 'fixed', 3000),
  ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000f1', now() - interval '3 days', 'unknown', null);
insert into public.sources (event_id, kind, url)
values ('00000000-0000-0000-0000-0000000000e2', 'official_site', 'https://exemplo.test/evento');
update public.events set status = 'published' where id = '00000000-0000-0000-0000-0000000000e2';

-- Estrutura e regras
select is_empty(
  $$ select tablename from pg_tables where schemaname = 'public' and not rowsecurity $$,
  'RLS está ativo em todas as tabelas públicas'
);
select is((select count(*)::int from public.regions), 35, 'as 35 regiões administrativas estão cadastradas');
select isnt(
  (select published_at from public.events where id = '00000000-0000-0000-0000-0000000000e2'), null,
  'publicar registra a data de publicação'
);
select throws_ok(
  $$ update public.events set status = 'published' where id = '00000000-0000-0000-0000-0000000000e1' $$,
  '23514', null, 'rascunho não pula direto para publicado'
);
select throws_ok(
  $$ update public.events set status = 'published' where id = '00000000-0000-0000-0000-0000000000e3' $$,
  '23514', 'Para publicar, o evento precisa de pelo menos uma sessão.', 'não publica evento sem sessão'
);
select throws_ok(
  $$ update public.events set status = 'rejected' where id = '00000000-0000-0000-0000-0000000000e3' $$,
  '23514', null, 'rejeição exige motivo'
);
select throws_ok(
  $$ insert into public.events (slug, title, category_id, status) values ('ja-publicado', 'Já publicado', 1, 'published') $$,
  '23514', null, 'evento novo não nasce publicado'
);
select throws_ok(
  $$ insert into public.sessions (event_id, venue_id, starts_at, price_kind, price_min_cents)
     values ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000f1', now(), 'free', 1000) $$,
  '23514', null, 'gratuito não aceita valor'
);
select throws_ok(
  $$ insert into public.sessions (event_id, venue_id, starts_at, price_kind, price_min_cents, price_max_cents)
     values ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000f1', now(), 'range', 5000, 2000) $$,
  '23514', null, 'faixa de preço invertida é rejeitada'
);

-- Visitante (anon)
set local role anon;
select results_eq(
  $$ select slug from public.events order by slug $$,
  array['evento-publicado'],
  'visitante só vê eventos publicados'
);
select is(
  (select count(*)::int from public.discoverable_sessions), 1,
  'descoberta mostra só a sessão futura'
);
select throws_ok(
  $$ insert into public.events (slug, title, category_id) values ('invasao', 'Invasão', 1) $$,
  '42501', null, 'visitante não cria evento'
);
select throws_ok($$ select * from public.sources $$, '42501', null, 'visitante não lê fontes');
select throws_ok($$ select * from public.organization_contacts $$, '42501', null, 'visitante não lê contatos');
select throws_ok($$ select * from public.audit_log $$, '42501', null, 'visitante não lê auditoria');
select throws_ok($$ select * from public.submissions $$, '42501', null, 'visitante não lê sugestões');
select throws_ok($$ select * from public.reports $$, '42501', null, 'visitante não lê denúncias');
reset role;

-- Equipe (curadoria)
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;
select lives_ok(
  $$ insert into public.events (slug, title, category_id) values ('evento-da-equipe', 'Evento da equipe', 2) $$,
  'equipe cria rascunho'
);
select is(
  (select count(*)::int from public.events), 4,
  'equipe vê rascunhos e eventos em revisão'
);
select is(
  (select actor from public.audit_log where table_name = 'events' and new_data ->> 'slug' = 'evento-da-equipe'),
  '00000000-0000-0000-0000-0000000000a1'::uuid,
  'auditoria registra quem criou'
);
delete from public.events where slug = 'evento-rascunho';
select is(
  (select count(*)::int from public.events where slug = 'evento-rascunho'), 1,
  'curadoria não exclui eventos (só admin)'
);
reset role;

-- Usuário autenticado sem papel na equipe
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;
select throws_ok(
  $$ insert into public.events (slug, title, category_id) values ('intruso', 'Intruso', 1) $$,
  '42501', null, 'conta sem papel não cria evento'
);
select is(
  (select count(*)::int from public.events), 1,
  'conta sem papel vê só o que é público'
);
select is_empty($$ select * from public.organization_contacts $$, 'conta sem papel não vê contatos');
reset role;

select * from finish();
rollback;
