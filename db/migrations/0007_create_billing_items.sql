-- 0009_create_billing_items.sql
-- Itens financeiros essenciais (versão simplificada; contratos completos ficam para a Fase 5).

create table if not exists public.billing_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  client_id uuid references public.clients (id) on delete set null,
  description text not null,
  amount numeric(12,2) not null,
  status text not null default 'pending' check (status in ('pending','paid','overdue')),
  due_date date,
  created_at timestamptz not null default now()
);

alter table public.billing_items enable row level security;

comment on table public.billing_items is
  'Itens financeiros simples (cobrança por cliente). Versão essencial; contratos e recorrência chegam na Fase 5.';
