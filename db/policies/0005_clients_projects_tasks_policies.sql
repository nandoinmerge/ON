-- 0005_clients_projects_tasks_policies.sql
-- Escopo por organização: qualquer membro ativo lê e escreve.
-- Refinar para escopo por project_members quando esse fluxo existir.

create policy "clients_all_org_member"
  on public.clients
  for all
  using (organization_id in (select public.current_organization_ids()))
  with check (organization_id in (select public.current_organization_ids()));

create policy "projects_all_org_member"
  on public.projects
  for all
  using (organization_id in (select public.current_organization_ids()))
  with check (organization_id in (select public.current_organization_ids()));

create policy "tasks_all_org_member"
  on public.tasks
  for all
  using (organization_id in (select public.current_organization_ids()))
  with check (organization_id in (select public.current_organization_ids()));
