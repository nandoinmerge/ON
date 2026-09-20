-- 0005_create_invitations.sql
-- Tabela de convites para membros da equipe.
-- Um convite é um link temporário que permite a um novo membro:
-- 1. Criar uma conta
-- 2. Confirmar seu e-mail
-- 3. Ser adicionado automaticamente à organização com o papel especificado

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin','manager','collaborator','finance')),
  token text not null unique,
  token_expires_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending','accepted','expired','revoked')),
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (organization_id, email)
);

alter table public.invitations enable row level security;

comment on table public.invitations is
  'Convites para membros da equipe. Cada convite tem um token único e expira em 7 dias. Depois de aceito, gera um profile e um organization_members.';
