-- 0010_create_leads.sql
-- Módulo de Tráfego Pago (fase 1): funil de leads por cliente, cadastro
-- manual ou por webhook. A integração automática com Meta Ads/Google Ads
-- (puxar CPL, investimento, conversão) fica para quando a conta de
-- desenvolvedor da agência for aprovada nessas plataformas — por ora, o
-- campo `source` já guarda a origem para quando isso existir.

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  name text not null,
  phone text,
  email text,
  source text not null default 'manual' check (source in ('meta_ads', 'google_ads', 'manual', 'webhook', 'other')),
  stage text not null default 'novo' check (stage in ('novo', 'contato', 'proposta', 'ganho', 'perdido')),
  estimated_value numeric,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.leads enable row level security;

comment on table public.leads is
  'Lead gerado por tráfego pago (ou cadastrado manualmente) de um cliente da agência. Funil: novo -> contato -> proposta -> ganho/perdido.';

create policy "leads_all_org_member"
  on public.leads
  for all
  using (organization_id in (select public.current_organization_ids()))
  with check (organization_id in (select public.current_organization_ids()));

-- Atualiza updated_at automaticamente a cada mudança de estágio/dados.
create or replace function public.set_leads_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger leads_set_updated_at
  before update on public.leads
  for each row
  execute function public.set_leads_updated_at();
