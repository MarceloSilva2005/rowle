-- Dados SÓ para o banco local de desenvolvimento (supabase db reset).
-- Nunca roda em produção. Cria uma conta de curadoria para testar o painel.
-- Login local: curadoria@rowle.test (senha definida abaixo, válida apenas aqui).
do $$
declare
  uid uuid := '00000000-0000-0000-0000-00000000c0de';
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'curadoria@rowle.test', crypt('rowle-local-dev', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''
  );
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), uid, uid::text, jsonb_build_object('sub', uid::text, 'email', 'curadoria@rowle.test'), 'email', now(), now(), now());
  insert into public.staff (user_id, role, display_name) values (uid, 'admin', 'Curadoria local');
end $$;

-- Sugestões de exemplo para testar a fila no painel (o formulário público chega no M5).
insert into public.submissions (protocol, tracking_token_hash, payload, contact_email) values
  ('RW-EXEMPLO-01', 'exemplo-sem-token', jsonb_build_object(
    'title', 'Forró na Praça',
    'categoryId', 1,
    'description', 'Forró pé de serra com trio ao vivo. Entrada gratuita.',
    'organizerName', 'Coletivo Xote Candango',
    'venueName', 'Praça do Cruzeiro',
    'venueAddress', 'Eixo Monumental, Cruzeiro',
    'startsAtLocal', '2026-11-28T19:00',
    'priceText', 'Gratuito',
    'sourceUrl', 'https://exemplo.test/forro-na-praca'
  ), 'xote@exemplo.test'),
  ('RW-EXEMPLO-02', 'exemplo-sem-token', jsonb_build_object(
    'title', 'Sarau sem data',
    'description', 'Chegou sem data nem local: serve para testar o pedido de informações.'
  ), null);
