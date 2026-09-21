import { useState, useEffect } from 'react';
import { Building2, ShieldCheck, Users, FolderKanban } from 'lucide-react';
import { getUserOrganizations, getCurrentUserProfile, getOrganizationMembers } from '@services/db/index.js';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [orgsResult, profileResult] = await Promise.all([
      getUserOrganizations(),
      getCurrentUserProfile(),
    ]);

    if (orgsResult.data) setOrganizations(orgsResult.data);
    if (profileResult.data) setProfile(profileResult.data);

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-h1 mb-1">Bem-vindo{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}</h2>
        <p className="text-text-secondary">Sistema de gestão para a agência ON Digital.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          icon={Building2}
          label="Organização"
          value={currentOrg?.name ?? '—'}
        />
        <KpiCard
          icon={ShieldCheck}
          label="Seu papel"
          value={profile?.role_default ? ROLE_LABELS[profile.role_default] ?? profile.role_default : '—'}
        />
        <KpiCard
          icon={Users}
          label="Membros da equipe"
          value={memberCount !== null ? String(memberCount) : '—'}
        />
      </div>

      {/* Estado vazio: clientes e projetos chegam na próxima fase */}
      <div className="card empty-state">
        <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center mb-4">
          <FolderKanban size={22} className="text-brand-600" />
        </div>
        <p className="text-text-primary font-medium mb-1">Nenhum cliente ou projeto ainda</p>
        <p className="text-sm max-w-sm">
          Clientes, projetos e o quadro kanban chegam na próxima fase do sistema.
        </p>
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
