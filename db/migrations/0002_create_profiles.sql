-- 0002_create_profiles.sql
-- Um perfil por usuário autenticado da equipe interna da agência.
-- Contatos de cliente do portal não usam esta tabela: usam client_contacts,
-- criada na Fase 4 junto com o portal do cliente.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete restrict,
  full_name text not null,
  email text not null,
  role_default text not null check (role_default in ('owner','admin','manager','collaborator','finance')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

comment on table public.profiles is
  'Perfil de um usuário interno da agência. role_default é o papel de referência do usuário; a política de RLS consulta organization_members, não esta coluna.';
