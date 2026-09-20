-- 0004_helper_functions.sql
-- Funções auxiliares usadas pelas políticas de RLS.
-- SECURITY DEFINER porque precisam ler organization_members mesmo antes de a
-- própria política de select da tabela liberar a leitura para o usuário
-- (evita recursão infinita entre a política e a checagem de escopo).

create or replace function public.current_organization_ids()
returns setof uuid
language sql
security definer
stable
set search_path = public
as $$
  select organization_id
  from public.organization_members
  where profile_id = auth.uid()
    and status = 'active';
$$;

create or replace function public.has_role_in_org(org uuid, allowed_roles text[])
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members
    where organization_id = org
      and profile_id = auth.uid()
      and status = 'active'
      and role = any(allowed_roles)
  );
$$;

-- Função de bootstrap: cria organização, perfil e vínculo de owner em uma
-- única transação. É a única forma permitida de criar uma organização nova,
-- porque uma organização recém-criada ainda não tem membro nenhum que possa
-- autorizar o insert através de uma política normal de linha.
create or replace function public.create_organization_with_owner(
  org_name text,
  org_slug text,
  owner_full_name text,
  owner_email text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado';
  end if;

  insert into public.organizations (name, slug)
  values (org_name, org_slug)
  returning id into new_org_id;

  insert into public.profiles (id, organization_id, full_name, email, role_default)
  values (auth.uid(), new_org_id, owner_full_name, owner_email, 'owner')
  on conflict (id) do update
    set organization_id = excluded.organization_id,
        full_name = excluded.full_name,
        email = excluded.email,
        role_default = 'owner';

  insert into public.organization_members (organization_id, profile_id, role, status)
  values (new_org_id, auth.uid(), 'owner', 'active');

  return new_org_id;
end;
$$;

comment on function public.create_organization_with_owner is
  'Único caminho permitido para criar uma organização nova. Chamada pela camada services/auth logo após o primeiro signup do proprietário.';
