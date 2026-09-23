-- 0008_invitation_functions.sql
-- Reformulação de segurança do fluxo de convite: nenhuma etapa usa a
-- service role key no navegador (a versão anterior expunha essa chave no
-- bundle do frontend, o que é uma falha grave). Agora:
--
-- 1. inviteMember() insere uma linha normal em `invitations`, autenticado
--    como owner/admin (a política de RLS já garante que só eles inserem).
-- 2. get_invitation_preview() é pública (SECURITY DEFINER) e só devolve
--    e-mail, papel e nome da organização — nunca dados sensíveis.
-- 3. O convidado faz signup normal (chave anônima).
-- 4. accept_invitation() roda como SECURITY DEFINER, mas só pode afetar a
--    própria conta de quem chama (auth.uid()), e exige que o e-mail do
--    usuário logado bata com o e-mail do convite.

create or replace function public.get_invitation_preview(p_token text)
returns table(email text, role text, organization_name text, valid boolean)
language sql
security definer
set search_path = public
as $$
  select
    i.email,
    i.role,
    o.name as organization_name,
    (i.status = 'pending' and i.token_expires_at > now()) as valid
  from public.invitations i
  join public.organizations o on o.id = i.organization_id
  where i.token = p_token
  limit 1;
$$;

create or replace function public.accept_invitation(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invitation record;
  v_email text;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado';
  end if;

  v_email := auth.jwt() ->> 'email';

  select * into v_invitation
  from public.invitations
  where token = p_token
    and status = 'pending'
    and lower(email) = lower(v_email)
    and token_expires_at > now()
  limit 1;

  if v_invitation is null then
    raise exception 'Convite inválido, expirado ou já utilizado';
  end if;

  insert into public.profiles (id, organization_id, full_name, email, role_default)
  values (auth.uid(), v_invitation.organization_id, split_part(v_email, '@', 1), v_email, v_invitation.role)
  on conflict (id) do update
    set organization_id = excluded.organization_id,
        role_default = excluded.role_default;

  insert into public.organization_members (organization_id, profile_id, role, status)
  values (v_invitation.organization_id, auth.uid(), v_invitation.role, 'active')
  on conflict (organization_id, profile_id) do update
    set role = excluded.role, status = 'active';

  update public.invitations set status = 'accepted' where id = v_invitation.id;

  return v_invitation.organization_id;
end;
$$;

comment on function public.get_invitation_preview is
  'Pública: mostra e-mail/papel/organização de um convite pelo token, antes do login. Nunca expõe dados sensíveis.';
comment on function public.accept_invitation is
  'Chamada pelo próprio usuário já autenticado. Só afeta auth.uid(), e exige que o e-mail da conta bata com o e-mail do convite.';
