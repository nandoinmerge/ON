import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Mail,
  User,
  FolderKanban,
  CheckSquare,
  Wallet,
  Pencil,
} from 'lucide-react';
import {
  getClientById,
  getProjectsByClient,
  getTasksByProjectIds,
  getBillingItemsByClient,
  updateClient,
  getCurrentUserRole,
} from '@services/db/index.js';
import {
  CLIENT_STATUS_LABELS,
  CLIENT_HEALTH_LABELS,
  CLIENT_HEALTH_CLASSES,
  PROJECT_STATUS_LABELS,
  TASK_STATUS_LABELS,
  TASK_STATUS_CLASSES,
  BILLING_STATUS_LABELS,
  BILLING_STATUS_CLASSES,
  formatCurrencyBRL,
  formatDateBR,
} from '../lib/labels';
import { canManageContent } from '../lib/permissions';
import Modal from '../components/Modal';

export default function ClienteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [client, setClient] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [billingItems, setBillingItems] = useState<any[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    industry: '',
    status: 'active',
    health: 'good',
    contact_name: '',
    contact_email: '',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (id) load(id);
  }, [id]);

  async function load(clientId: string) {
    setLoading(true);
    const [clientResult, roleResult] = await Promise.all([getClientById(clientId), getCurrentUserRole()]);
    setRole(roleResult.data);
    if (clientResult.error || !clientResult.data) {
      setError(clientResult.error || 'Cliente não encontrado');
      setLoading(false);
      return;
    }
    setClient(clientResult.data);

    const projectsResult = await getProjectsByClient(clientId);
    const clientProjects = projectsResult.data || [];
    setProjects(clientProjects);

    const tasksResult = await getTasksByProjectIds(clientProjects.map((p: any) => p.id));
    setTasks(tasksResult.data || []);

    const billingResult = await getBillingItemsByClient(clientId);
    setBillingItems(billingResult.data || []);

    setLoading(false);
  }

  function openEditModal() {
    setForm({
      name: client.name ?? '',
      industry: client.industry ?? '',
      status: client.status ?? 'active',
      health: client.health ?? 'good',
      contact_name: client.contact_name ?? '',
      contact_email: client.contact_email ?? '',
    });
    setFormError('');
    setEditOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    if (!form.name.trim()) {
      setFormError('O nome do cliente é obrigatório');
      return;
    }
    setSaving(true);
    const result = await updateClient(id!, form);
    setSaving(false);
    if (result.error) {
      setFormError(result.error);
      return;
    }
    setEditOpen(false);
    if (id) load(id);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="card h-24 animate-pulse bg-surface-muted" />
        <div className="card h-40 animate-pulse bg-surface-muted" />
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="card empty-state">
        <p className="text-status-danger-fg font-medium">Não foi possível carregar o cliente</p>
        <p className="text-sm mb-4">{error}</p>
        <Link to="/app/clientes" className="btn-secondary">
          Voltar para Clientes
        </Link>
      </div>
    );
  }

  const totalPending = billingItems.filter((i) => i.status === 'pending').reduce((s, i) => s + Number(i.amount), 0);
  const totalOverdue = billingItems.filter((i) => i.status === 'overdue').reduce((s, i) => s + Number(i.amount), 0);
  const openTasks = tasks.filter((t) => t.status !== 'done');

  return (
    <div className="space-y-6">
      {/* Voltar */}
      <button
        onClick={() => navigate('/app/clientes')}
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft size={16} />
        Clientes
      </button>

      {/* Cabeçalho do cliente */}
      <div className="card">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-14 h-14 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
              <Building2 size={26} className="text-brand-600" />
            </div>
            <div className="min-w-0">
              <h1 className="text-h1 truncate">{client.name}</h1>
              {client.industry && <p className="text-text-secondary">{client.industry}</p>}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className={`badge ${CLIENT_HEALTH_CLASSES[client.health] ?? 'bg-surface-muted text-text-secondary'}`}>
                  {CLIENT_HEALTH_LABELS[client.health] ?? client.health}
                </span>
                <span className="text-caption text-text-tertiary">
                  {CLIENT_STATUS_LABELS[client.status] ?? client.status}
                </span>
              </div>
            </div>
          </div>
          {canManageContent(role) && (
            <button onClick={openEditModal} className="btn-secondary inline-flex items-center gap-2 shrink-0">
              <Pencil size={14} />
              Editar
            </button>
          )}
        </div>

        {(client.contact_name || client.contact_email) && (
          <div className="mt-5 pt-5 border-t border-border-subtle flex flex-wrap gap-6">
            {client.contact_name && (
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <User size={14} />
                {client.contact_name}
              </div>
            )}
            {client.contact_email && (
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Mail size={14} />
                {client.contact_email}
              </div>
            )}
          </div>
        )}
      </div>

      {/* KPIs do cliente */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
            <FolderKanban size={18} className="text-brand-600" />
          </div>
          <div>
            <p className="text-caption text-text-secondary">Projetos</p>
            <p className="text-lg font-semibold text-text-primary">{projects.length}</p>
          </div>
        </div>
        <div className="card flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
            <CheckSquare size={18} className="text-brand-600" />
          </div>
          <div>
            <p className="text-caption text-text-secondary">Tarefas em aberto</p>
            <p className="text-lg font-semibold text-text-primary">{openTasks.length}</p>
          </div>
        </div>
        <div className="card flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-status-warning-bg flex items-center justify-center shrink-0">
            <Wallet size={18} className="text-status-warning-fg" />
          </div>
          <div>
            <p className="text-caption text-text-secondary">Pendente + atrasado</p>
            <p className="text-lg font-semibold text-text-primary">
              {formatCurrencyBRL(totalPending + totalOverdue)}
            </p>
          </div>
        </div>
      </div>

      {/* Projetos do cliente */}
      <div className="card">
        <h2 className="text-h2 mb-4">Projetos</h2>
        {projects.length === 0 ? (
          <p className="text-sm text-text-secondary">Nenhum projeto cadastrado para este cliente.</p>
        ) : (
          <div className="space-y-2">
            {projects.map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between gap-3 py-2.5 border-b border-border-subtle last:border-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{project.name}</p>
                  {project.due_date && (
                    <p className="text-xs text-text-tertiary">Prazo: {formatDateBR(project.due_date)}</p>
                  )}
                </div>
                <span className="badge bg-brand-50 text-brand-600 shrink-0">
                  {PROJECT_STATUS_LABELS[project.status] ?? project.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tarefas do cliente (via projetos) */}
      <div className="card">
        <h2 className="text-h2 mb-4">Tarefas</h2>
        {tasks.length === 0 ? (
          <p className="text-sm text-text-secondary">Nenhuma tarefa vinculada aos projetos deste cliente.</p>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between gap-3 py-2.5 border-b border-border-subtle last:border-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{task.title}</p>
                  <p className="text-xs text-text-tertiary truncate">{task.projects?.name}</p>
                </div>
                <span className={`badge shrink-0 ${TASK_STATUS_CLASSES[task.status] ?? ''}`}>
                  {TASK_STATUS_LABELS[task.status] ?? task.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Financeiro do cliente */}
      <div className="card">
        <h2 className="text-h2 mb-4">Financeiro</h2>
        {billingItems.length === 0 ? (
          <p className="text-sm text-text-secondary">Nenhum item financeiro para este cliente.</p>
        ) : (
          <div className="space-y-2">
            {billingItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 py-2.5 border-b border-border-subtle last:border-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{item.description}</p>
                  {item.due_date && (
                    <p className="text-xs text-text-tertiary">Vencimento: {formatDateBR(item.due_date)}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-medium text-text-primary">
                    {formatCurrencyBRL(Number(item.amount))}
                  </span>
                  <span className={`badge ${BILLING_STATUS_CLASSES[item.status] ?? ''}`}>
                    {BILLING_STATUS_LABELS[item.status] ?? item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Editar cliente">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-caption font-medium mb-1.5">Nome *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-text"
              required
            />
          </div>
          <div>
            <label className="block text-caption font-medium mb-1.5">Ramo de atividade</label>
            <input
              type="text"
              value={form.industry}
              onChange={(e) => setForm({ ...form, industry: e.target.value })}
              className="input-text"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-caption font-medium mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="input-text"
              >
                <option value="active">Ativo</option>
                <option value="paused">Pausado</option>
                <option value="archived">Encerrado</option>
              </select>
            </div>
            <div>
              <label className="block text-caption font-medium mb-1.5">Saúde do relacionamento</label>
              <select
                value={form.health}
                onChange={(e) => setForm({ ...form, health: e.target.value })}
                className="input-text"
              >
                <option value="good">Saudável</option>
                <option value="attention">Atenção</option>
                <option value="risk">Risco</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-caption font-medium mb-1.5">Nome do contato</label>
            <input
              type="text"
              value={form.contact_name}
              onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
              className="input-text"
            />
          </div>
          <div>
            <label className="block text-caption font-medium mb-1.5">E-mail do contato</label>
            <input
              type="email"
              value={form.contact_email}
              onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
              className="input-text"
            />
          </div>

          {formError && (
            <div className="p-3 bg-status-danger-bg text-status-danger-fg rounded-lg text-sm">{formError}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setEditOpen(false)} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
