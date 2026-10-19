-- Dados SÓ para os testes do app no banco local (Maestro). Nunca roda em produção.
-- Recria os eventos "maestro-*" com datas relativas a hoje (horário de Brasília),
-- passando pelo ciclo normal: rascunho → revisão → publicado (→ cancelado).
begin;

delete from public.events where slug like 'maestro-%';
delete from public.venues where slug = 'maestro-casa';

do $$
declare
  hoje timestamp := date_trunc('day', now() at time zone 'America/Sao_Paulo');
  casa uuid;
  forro uuid;
  show uuid;
  cancelado uuid;
begin
  insert into public.venues (slug, name, address, region_id)
  values ('maestro-casa', 'Casa do Teste Maestro', 'SCS Quadra 2, Bloco C, Asa Sul', 1)
  returning id into casa;

  insert into public.events (slug, title, description, category_id, age_rating, status)
  values ('maestro-forro', 'Forró Maestro na Praça', 'Evento de teste do app.',
          (select id from public.categories where slug = 'shows-musica'), 'L', 'draft')
  returning id into forro;
  insert into public.sessions (event_id, venue_id, starts_at, price_kind)
  values (forro, casa, (hoje + interval '1 day 20 hours') at time zone 'America/Sao_Paulo', 'free');

  insert into public.events (slug, title, description, category_id, age_rating, age_rating_official, status)
  values ('maestro-show', 'Show Elétrico do Maestro', 'Evento de teste do app.',
          (select id from public.categories where slug = 'festas'), '18', true, 'draft')
  returning id into show;
  insert into public.sessions (event_id, venue_id, starts_at, price_kind, price_min_cents, ticket_url) values
    (show, casa, (hoje + interval '2 days 22 hours') at time zone 'America/Sao_Paulo', 'fixed', 4000, 'https://example.com/ingresso'),
    (show, casa, (hoje + interval '3 days 22 hours') at time zone 'America/Sao_Paulo', 'fixed', 4000, 'https://example.com/ingresso');

  insert into public.events (slug, title, description, category_id, status)
  values ('maestro-cancelado', 'Sarau Cancelado do Maestro', 'Evento de teste do app.',
          (select id from public.categories where slug = 'cultura-arte'), 'draft')
  returning id into cancelado;
  insert into public.sessions (event_id, venue_id, starts_at, price_kind)
  values (cancelado, casa, (hoje + interval '4 days 19 hours') at time zone 'America/Sao_Paulo', 'unknown');

  insert into public.sources (event_id, kind, description, last_verified_at)
  select id, 'other', 'Teste do app (Maestro).', now() from unnest(array[forro, show, cancelado]) as id;

  update public.events set status = 'in_review' where id in (forro, show, cancelado);
  update public.events set status = 'published' where id in (forro, show, cancelado);
  update public.events set status = 'cancelled', status_note = 'Chuva forte no local.' where id = cancelado;
end $$;

commit;
