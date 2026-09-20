-- 0003_organization_members_policies.sql

create policy "org_members_select_same_org"
  on public.organization_members
  for select
  using (organization_id in (select public.current_organization_ids()));

create policy "org_members_write_owner_admin"
  on public.organization_members
  for all
  using (public.has_role_in_org(organization_id, array['owner','admin']))
  with check (public.has_role_in_org(organization_id, array['owner','admin']));
