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
