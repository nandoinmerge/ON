import { useState, useEffect } from 'react';
import { Building2, ShieldCheck, Users, FolderKanban, CheckSquare } from 'lucide-react';
import {
  getUserOrganizations,
  getCurrentUserProfile,
  getOrganizationMembers,
  getClients,
  getProjects,
  getTasks,
} from '@services/db/index.js';
import { PROJECT_STATUS_LABELS } from '../lib/labels';

const ROLE_LABELS: Record<string, string> = {
  owner: 'Proprietário',
  admin: 'Administrador',
  manager: 'Gestor de projeto',
  collaborator: 'Colaborador',
  finance: 'Financeiro',
};

export default function DashboardPage() {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [orgsResult, profileResult, clientsResult, projectsResult, tasksResult] = await Promise.all([
      getUserOrganizations(),
      getCurrentUserProfile(),
      getClients(),
      getProjects(),
      getTasks(),
    ]);

    if (orgsResult.data) setOrganizations(orgsResult.data);
    if (profileResult.data) setProfile(profileResult.data);
    if (clientsResult.data) setClients(clientsResult.data);
    if (projectsResult.data) setProjects(projectsResult.data);
    if (tasksResult.data) setTasks(tasksResult.data);

    if (profileResult.data?.organization_id) {
      const membersResult = await getOrganizationMembers(profileResult.data.organization_id);
      setMemberCount(membersResult.count ?? membersResult.data?.length ?? null);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card h-28 animate-pulse bg-surface-muted" />
        ))}
      </div>
    );
  }

  const currentOrg = organizations[0];
  const openTasks = tasks.filter((t) => t.status !== 'done');
  const activeProjects = projects.filter((p) => p.status !== 'done');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-h1 mb-1">Bem-vindo{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}</h2>
        <p className="text-text-secondary">Sistema de gestão para a agência ON Digital.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard icon={Building2} label="Organização" value={currentOrg?.name ?? '—'} />
        <KpiCard
          icon={ShieldCheck}
          label="Seu papel"
          value={profile?.role_default ? ROLE_LABELS[profile.role_default] ?? profile.role_default : '—'}
        />
        <KpiCard icon={Users} label="Membros da equipe" value={memberCount !== null ? String(memberCount) : '—'} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard icon={Building2} label="Clientes ativos" value={String(clients.filter((c) => c.status === 'active').length)} />
        <KpiCard icon={FolderKanban} label="Projetos em andamento" value={String(activeProjects.length)} />
        <KpiCard icon={CheckSquare} label="Tarefas em aberto" value={String(openTasks.length)} />
      </div>

      {/* Projetos recentes */}
      <div className="card">
        <h3 className="text-h2 mb-4">Projetos recentes</h3>
        {projects.length === 0 ? (
          <div className="empty-state py-6">
            <p className="text-text-primary font-medium mb-1">Nenhum projeto ainda</p>
            <p className="text-sm">Vá até Projetos para acompanhar o quadro kanban.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {projects.slice(0, 5).map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between gap-3 py-2.5 border-b border-border-subtle last:border-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{project.name}</p>
                  <p className="text-xs text-text-secondary truncate">{project.clients?.name ?? 'Sem cliente'}</p>
                </div>
                <span className="badge bg-brand-50 text-brand-600 shrink-0">
                  {PROJECT_STATUS_LABELS[project.status] ?? project.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="card flex items-start gap-4">
      <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
        <Icon size={18} className="text-brand-600" />
      </div>
      <div className="min-w-0">
        <p className="text-caption text-text-secondary">{label}</p>
        <p className="text-lg font-semibold text-text-primary truncate">{value}</p>
      </div>
    </div>
  );
}
