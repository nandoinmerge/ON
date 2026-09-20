-- 0001_create_organizations.sql
-- Cria a tabela de organizações (tenants) e habilita RLS.
-- Insert de linha não é liberado por política própria: só acontece via
-- public.create_organization_with_owner (ver 0004_helper_functions.sql).

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

alter table public.organizations enable row level security;

comment on table public.organizations is
  'Uma organização representa uma agência cliente do sistema (tenant). No piloto, existe apenas a ON Digital.';
