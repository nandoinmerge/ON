-- 0002_profiles_policies.sql
-- Insert intencionalmente sem política própria de linha: só
-- create_organization_with_owner ou o fluxo de convite (próxima entrega da
-- Fase 1) podem inserir um profile.

create policy "profiles_select_same_org"
  on public.profiles
  for select
  using (organization_id in (select public.current_organization_ids()));

create policy "profiles_update_self"
  on public.profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles_update_owner_admin"
  on public.profiles
  for update
  using (public.has_role_in_org(organization_id, array['owner','admin']))
  with check (public.has_role_in_org(organization_id, array['owner','admin']));
