-- 0003_create_organization_members.sql
-- Vínculo explícito de papel de um perfil dentro de uma organização.
-- Existe separado de profiles.role_default para permitir, no futuro, que um
-- mesmo usuário pertença a mais de uma organização sem quebrar o modelo, e
-- porque é esta tabela (e não profiles) que toda política de RLS consulta.

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('owner','admin','manager','collaborator','finance')),
  status text not null default 'active' check (status in ('active','invited','suspended')),
  invited_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  unique (organization_id, profile_id)
);

alter table public.organization_members enable row level security;

comment on table public.organization_members is
  'Papel ativo de um perfil dentro de uma organização. Toda política de RLS do sistema consulta esta tabela para decidir escopo.';
