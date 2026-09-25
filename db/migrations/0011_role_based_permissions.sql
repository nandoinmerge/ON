-- 0011_role_based_permissions.sql
-- Substitui as políticas "qualquer membro ativo lê/escreve tudo" por regras
-- por papel, seguindo a matriz original desenhada para o sistema:
--
--   owner / admin  -> acesso total a tudo
--   manager        -> gerencia clientes, projetos, tarefas e leads
--                     (não mexe no financeiro)
--   collaborator   -> lê tudo (contexto), mas só edita/conclui as
--                     PRÓPRIAS tarefas (assignee_profile_id = auth.uid())
--   finance        -> gerencia o financeiro; lê o resto só como contexto

-- ===== clients =====
drop policy if exists "clients_all_org_member" on public.clients;

create policy "clients_select_any_member"
  on public.clients for select
  using (organization_id in (select public.current_organization_ids()));

create policy "clients_write_owner_admin_manager"
  on public.clients for all
  using (public.has_role_in_org(organization_id, array['owner','admin','manager']))
  with check (public.has_role_in_org(organization_id, array['owner','admin','manager']));

-- ===== projects =====
drop policy if exists "projects_all_org_member" on public.projects;

create policy "projects_select_any_member"
  on public.projects for select
  using (organization_id in (select public.current_organization_ids()));

create policy "projects_write_owner_admin_manager"
  on public.projects for all
  using (public.has_role_in_org(organization_id, array['owner','admin','manager']))
  with check (public.has_role_in_org(organization_id, array['owner','admin','manager']));

-- ===== tasks =====
drop policy if exists "tasks_all_org_member" on public.tasks;

create policy "tasks_select_any_member"
  on public.tasks for select
  using (organization_id in (select public.current_organization_ids()));

create policy "tasks_write_owner_admin_manager"
  on public.tasks for all
  using (public.has_role_in_org(organization_id, array['owner','admin','manager']))
  with check (public.has_role_in_org(organization_id, array['owner','admin','manager']));

-- Colaborador só atualiza a própria tarefa (ex: mudar status para "done").
create policy "tasks_update_own_collaborator"
  on public.tasks for update
  using (
    public.has_role_in_org(organization_id, array['collaborator'])
    and assignee_profile_id = auth.uid()
  )
  with check (
    public.has_role_in_org(organization_id, array['collaborator'])
    and assignee_profile_id = auth.uid()
  );

-- ===== leads =====
drop policy if exists "leads_all_org_member" on public.leads;

create policy "leads_select_any_member"
  on public.leads for select
  using (organization_id in (select public.current_organization_ids()));

create policy "leads_write_owner_admin_manager"
  on public.leads for all
  using (public.has_role_in_org(organization_id, array['owner','admin','manager']))
  with check (public.has_role_in_org(organization_id, array['owner','admin','manager']));

-- ===== billing_items =====
drop policy if exists "billing_items_all_org_member" on public.billing_items;

create policy "billing_items_select_any_member"
  on public.billing_items for select
  using (organization_id in (select public.current_organization_ids()));

create policy "billing_items_write_owner_admin_finance"
  on public.billing_items for all
  using (public.has_role_in_org(organization_id, array['owner','admin','finance']))
  with check (public.has_role_in_org(organization_id, array['owner','admin','finance']));
