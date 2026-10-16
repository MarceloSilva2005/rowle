begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

-- Fixtures (como superusuário, sem RLS). O rollback do fim devolve tudo.
truncate public.events, public.venues, public.organizations, public.audit_log cascade;
insert into public.venues (id, slug, name, address, region_id) values
  ('00000000-0000-0000-0000-00000000b001', 'galpao', 'Galpão', 'QNM 34, Área Especial', 9);
insert into public.events (id, slug, title, category_id, status, age_rating, age_rating_official) values
  ('00000000-0000-0000-0000-00000000e001', 'publicado', 'Evento publicado', 1, 'draft', '6', true),
  ('00000000-0000-0000-0000-00000000e002', 'rascunho', 'Evento em rascunho', 1, 'draft', '18', false);
insert into public.sessions (event_id, venue_id, starts_at) values
  ('00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-00000000b001', now() + interval '1 day'),
  ('00000000-0000-0000-0000-00000000e002', '00000000-0000-0000-0000-00000000b001', now() + interval '1 day');
insert into public.sources (event_id, kind, url, last_verified_at) values
  ('00000000-0000-0000-0000-00000000e001', 'official_site', 'https://exemplo.test/a', '2026-10-15 12:00-03'),
  ('00000000-0000-0000-0000-00000000e002', 'official_site', 'https://exemplo.test/b', '2026-10-15 12:00-03');
update public.events set status = 'in_review' where id = '00000000-0000-0000-0000-00000000e001';
update public.events set status = 'published' where id = '00000000-0000-0000-0000-00000000e001';

select ok('6' = any (enum_range(null::public.age_rating)::text[]), 'a faixa de 6 anos existe');
select col_default_is('public', 'events', 'age_rating_official', 'false', 'classificação começa como autoclassificação');

set local role anon;

select results_eq(
  $$ select age_rating::text, age_rating_official, venue_address from public.discoverable_sessions $$,
  $$ values ('6', true, 'QNM 34, Área Especial') $$,
  'a descoberta traz classificação e endereço do evento publicado'
);
select results_eq(
  $$ select event_id from public.event_last_verified $$,
  $$ values ('00000000-0000-0000-0000-00000000e001'::uuid) $$,
  'o público vê a data de conferência só de eventos publicados'
);
select results_eq(
  $$ select last_verified_at from public.event_last_verified $$,
  $$ values ('2026-10-15 12:00-03'::timestamptz) $$,
  'a data é a da última conferência'
);
select throws_ok($$ select url from public.sources $$, '42501', null, 'o público continua sem acesso às fontes');
select is((select count(*)::int from public.events where slug = 'rascunho'), 0, 'rascunho continua invisível');

select * from finish();
rollback;
