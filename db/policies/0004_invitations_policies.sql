-- 0004_invitations_policies.sql
-- Políticas para a tabela de convites.
-- Acesso:
-- - Owner/Admin: veem e gerenciam todos os convites da organização
-- - Colaboradores: podem ver convites (para tracking) mas não criar/editar
-- - Convite pode ser aceito publicamente pelo link + token (sem precisa de RLS)

create policy "invitations_select_org_member"
  on public.invitations
  for select
  using (organization_id in (select public.current_organization_ids()));

create policy "invitations_insert_owner_admin"
  on public.invitations
  for insert
  with check (public.has_role_in_org(organization_id, array['owner','admin']));

create policy "invitations_update_owner_admin"
  on public.invitations
  for update
  using (public.has_role_in_org(organization_id, array['owner','admin']))
  with check (public.has_role_in_org(organization_id, array['owner','admin']));

create policy "invitations_delete_owner_admin"
  on public.invitations
  for delete
  using (public.has_role_in_org(organization_id, array['owner','admin']));
