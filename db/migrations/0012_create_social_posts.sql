-- 0012_create_social_posts.sql
-- Módulo de Redes Sociais (fase 1): calendário de conteúdo por cliente,
-- com fluxo de aprovação e anexos (imagem/vídeo do post). A publicação
-- automática no Instagram/Facebook fica para quando a integração com a
-- API do Meta for aprovada (mesmo processo do módulo de Tráfego Pago) —
-- por ora, o campo `platform` já guarda pra onde o post vai, e o status
-- é atualizado manualmente até lá.

create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  title text not null,
  caption text,
  platform text not null default 'instagram' check (platform in ('instagram', 'facebook', 'tiktok', 'linkedin', 'other')),
  scheduled_date date not null,
  status text not null default 'draft' check (status in ('draft', 'pending_approval', 'approved', 'scheduled', 'published')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.social_posts enable row level security;

comment on table public.social_posts is
  'Post de rede social planejado para um cliente: rascunho -> aguardando aprovação -> aprovado -> agendado -> publicado.';

create policy "social_posts_select_any_member"
  on public.social_posts for select
  using (organization_id in (select public.current_organization_ids()));

create policy "social_posts_write_owner_admin_manager"
  on public.social_posts for all
  using (public.has_role_in_org(organization_id, array['owner','admin','manager']))
  with check (public.has_role_in_org(organization_id, array['owner','admin','manager']));

create or replace function public.set_social_posts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger social_posts_set_updated_at
  before update on public.social_posts
  for each row
  execute function public.set_social_posts_updated_at();
