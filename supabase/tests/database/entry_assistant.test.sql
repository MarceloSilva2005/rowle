begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

-- Fixtures (como superusuário, sem RLS). O rollback do fim devolve tudo.
truncate public.events, public.venues, public.organizations, public.audit_log cascade;
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'curadoria@exemplo.test'),
  ('00000000-0000-0000-0000-0000000000a2', 'sem-papel@exemplo.test');
insert into public.staff (user_id, role, display_name)
values ('00000000-0000-0000-0000-0000000000a1', 'curator', 'Curadoria de teste');
insert into public.venues (id, slug, name, address, region_id)
values ('00000000-0000-0000-0000-0000000000f1', 'galpao-17', 'Galpão 17', 'SIA Trecho 17, Brasília', 1);
insert into public.events (slug, title, category_id) values ('roda-de-samba', 'Roda de samba antiga', 1);

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;

select results_eq(
  $$ select id from public.suggest_venues('GALPAO 17 - SIA') $$,
  $$ values ('00000000-0000-0000-0000-0000000000f1'::uuid) $$,
  'sugere o local cadastrado pelo nome parecido'
);
select is_empty($$ select 1 from public.suggest_venues('Teatro Nacional') $$, 'nome sem relação não sugere local');

select lives_ok(
  $$ select public.create_event_from_assistant(
       p_title => 'Roda de samba', p_slug => 'roda-de-samba', p_category_id => 1::smallint,
       p_new_venue_name => 'Quintal da Tia', p_new_venue_address => 'QNM 1, Ceilândia', p_new_venue_region => 9::smallint,
       p_starts_at => '2030-11-21 21:00-03', p_price_kind => 'fixed', p_price_min_cents => 3000,
       p_ticket_url => 'https://www.sympla.com.br/roda', p_source_kind => 'ticketing', p_source_url => 'https://www.sympla.com.br/roda',
       p_started_at => now() - interval '4 minutes') $$,
  'cria rascunho com local novo, sessão e fonte'
);
select is(
  (select status::text || ' ' || slug from public.events where title = 'Roda de samba'), 'draft roda-de-samba-2',
  'nasce rascunho e o endereço repetido ganha sufixo'
);
select is(
  (select count(*)::int from public.sessions s join public.venues v on v.id = s.venue_id
   where v.slug = 'quintal-da-tia' and s.price_min_cents = 3000),
  1, 'sessão fica no local novo, com o preço'
);
select is(
  (select count(*)::int from public.sources where kind = 'ticketing'), 1, 'fonte registrada'
);
select is(
  (select median_seconds from public.entry_time_stats() where method = 'assistant'), 240,
  'tempo de cadastro registrado'
);

select throws_ok(
  $$ select public.create_event_from_assistant(
       p_title => 'Preço errado', p_slug => 'preco-errado', p_category_id => 1::smallint,
       p_venue_id => '00000000-0000-0000-0000-0000000000f1', p_starts_at => '2030-11-21 21:00-03',
       p_price_kind => 'free', p_price_min_cents => 1000) $$,
  '23514', null, 'sessão inválida é recusada'
);
select is_empty(
  $$ select 1 from public.events where slug = 'preco-errado' $$,
  'e o evento não fica pela metade'
);
reset role;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;
select throws_ok(
  $$ select public.create_event_from_assistant(p_title => 'Intruso', p_slug => 'intruso', p_category_id => 1::smallint) $$,
  '42501', null, 'conta sem papel na equipe não usa o assistente'
);
reset role;

select * from finish();
rollback;
