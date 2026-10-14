-- Políticas de acesso. Visitantes (anon) só leem o que é público; a equipe
-- (tabela staff) edita o catálogo; exclusões e configuração exigem admin.
-- Sugestões e denúncias públicas entram por funções próprias, não por insert direto.

alter table public.regions enable row level security;
alter table public.categories enable row level security;
alter table public.staff enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_contacts enable row level security;
alter table public.venues enable row level security;
alter table public.events enable row level security;
alter table public.sessions enable row level security;
alter table public.sources enable row level security;
alter table public.submissions enable row level security;
alter table public.reports enable row level security;
alter table public.audit_log enable row level security;

-- Tabelas sem nenhuma leitura pública: tira até o privilégio básico do anon.
revoke all on public.staff, public.organization_contacts, public.sources,
  public.submissions, public.reports, public.audit_log from anon;
-- Auditoria só é escrita pelo gatilho.
revoke insert, update, delete, truncate on public.audit_log from authenticated;

-- Referência territorial e categorias
create policy "leitura pública" on public.regions for select to anon, authenticated using (true);
create policy "admin edita" on public.regions for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "leitura pública" on public.categories for select to anon, authenticated using (true);
create policy "admin edita" on public.categories for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Equipe
create policy "equipe lê a equipe" on public.staff for select to authenticated
  using ((select public.is_staff()));
create policy "admin gerencia a equipe" on public.staff for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Organizações (dados públicos) e contatos (só equipe)
create policy "leitura pública" on public.organizations for select to anon, authenticated using (true);
create policy "equipe cria" on public.organizations for insert to authenticated
  with check ((select public.is_staff()));
create policy "equipe edita" on public.organizations for update to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "admin exclui" on public.organizations for delete to authenticated
  using ((select public.is_admin()));

create policy "equipe gerencia" on public.organization_contacts for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

-- Locais
create policy "leitura pública" on public.venues for select to anon, authenticated using (true);
create policy "equipe cria" on public.venues for insert to authenticated
  with check ((select public.is_staff()));
create policy "equipe edita" on public.venues for update to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "admin exclui" on public.venues for delete to authenticated
  using ((select public.is_admin()));

-- Eventos: o público vê publicados e também adiados ou cancelados, para que um
-- link compartilhado mostre o aviso em vez de sumir. A descoberta filtra à parte.
create policy "leitura pública dos visíveis" on public.events for select to anon, authenticated
  using (status in ('published', 'postponed', 'cancelled') or (select public.is_staff()));
create policy "equipe cria" on public.events for insert to authenticated
  with check ((select public.is_staff()));
create policy "equipe edita" on public.events for update to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "admin exclui" on public.events for delete to authenticated
  using ((select public.is_admin()));

-- Sessões herdam a visibilidade do evento.
create policy "leitura pública dos visíveis" on public.sessions for select to anon, authenticated
  using (
    (select public.is_staff())
    or exists (
      select 1 from public.events e
      where e.id = event_id and e.status in ('published', 'postponed', 'cancelled')
    )
  );
create policy "equipe cria" on public.sessions for insert to authenticated
  with check ((select public.is_staff()));
create policy "equipe edita" on public.sessions for update to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "equipe exclui" on public.sessions for delete to authenticated
  using ((select public.is_staff()));

-- Fontes, sugestões e denúncias: só equipe.
create policy "equipe gerencia" on public.sources for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "equipe gerencia" on public.submissions for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "equipe gerencia" on public.reports for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

create policy "equipe lê" on public.audit_log for select to authenticated
  using ((select public.is_staff()));

-- Funções internas não devem ser chamadas diretamente pelo público.
revoke execute on function public.write_audit_log() from anon, authenticated, public;
revoke execute on function public.enforce_event_lifecycle() from anon, authenticated, public;
