-- 0006_create_clients_projects_tasks.sql
-- Primeira versão de clients/projects/tasks: escopo por organização inteira
-- (qualquer membro ativo lê/escreve). Restrição por project_members (gestor
-- de projeto vê só os projetos atribuídos) fica para quando o fluxo de
-- atribuição de projeto for desenhado — por ora, todo mundo da organização
-- enxerga todos os clientes e projetos, o que já é um MVP funcional.

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  industry text,
  status text not null default 'active' check (status in ('active', 'paused', 'archived')),
  health text not null default 'good' check (health in ('good', 'attention', 'risk')),
  contact_name text,
  contact_email text,
  created_at timestamptz not null default now(),
  archived_at timestamptz
);

alter table public.clients enable row level security;

comment on table public.clients is
  'Cliente da agência. Contatos completos (client_contacts, com acesso ao portal) chegam na Fase 4 — por ora, só um contato de referência em texto.';

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  name text not null,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'in_review', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  due_date date,
  created_at timestamptz not null default now(),
  archived_at timestamptz
);

alter table public.projects enable row level security;

comment on table public.projects is
  'Projeto vinculado a um cliente. status segue as colunas do kanban validado no design system: todo, in_progress, in_review, done.';

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  assignee_profile_id uuid references public.profiles (id),
  due_date date,
  created_at timestamptz not null default now()
);

alter table public.tasks enable row level security;

comment on table public.tasks is
  'Tarefa dentro de um projeto. Checklists e comentários chegam na Fase 3 completa; por ora, só o essencial para a lista de tarefas funcionar.';
