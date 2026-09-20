-- 0001_organizations_policies.sql
-- Insert não tem política própria de linha: só acontece via
-- public.create_organization_with_owner (SECURITY DEFINER).

create policy "organizations_select_member"
  on public.organizations
  for select
  using (id in (select public.current_organization_ids()));

create policy "organizations_update_owner_admin"
  on public.organizations
  for update
  using (public.has_role_in_org(id, array['owner','admin']))
  with check (public.has_role_in_org(id, array['owner','admin']));
