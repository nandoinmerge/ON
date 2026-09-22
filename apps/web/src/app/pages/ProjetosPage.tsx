import { useState, useEffect } from 'react';
import { FolderKanban, Calendar, Plus, Pencil, Archive } from 'lucide-react';
import {
  getProjects,
  getClients,
  getCurrentUserProfile,
  createProject,
  updateProject,
  archiveProject,
} from '@services/db/index.js';
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_ORDER,
  PRIORITY_LABELS,
  PRIORITY_CLASSES,
  formatDateBR,
} from '../lib/labels';
import Modal from '../components/Modal';

const EMPTY_FORM = {
  name: '',
  client_id: '',
  status: 'todo',
  priority: 'medium',
  due_date: '',
};

export default function ProjetosPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const [projectsResult, clientsResult, profileResult] = await Promise.all([
      getProjects(),
      getClients(),
      getCurrentUserProfile(),
    ]);
    if (projectsResult.error) setError(projectsResult.error);
    if (projectsResult.data) setProjects(projectsResult.data);
    if (clientsResult.data) setClients(clientsResult.data);
    if (profileResult.data?.organization_id) setOrganizationId(profileResult.data.organization_id);
    setLoading(false);
  }

  function openCreateModal() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, client_id: clients[0]?.id ?? '' });
    setFormError('');
    setModalOpen(true);
  }

  function openEditModal(project: any) {
    setEditingId(project.id);
    setForm({
      name: project.name ?? '',
      client_id: project.client_id ?? '',
      status: project.status ?? 'todo',
      priority: project.priority ?? 'medium',
      due_date: project.due_date ?? '',
    });
    setFormError('');
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    if (!form.name.trim()) {
      setFormError('O nome do projeto é obrigatório');
      return;
    }
    if (!form.client_id) {
      setFormError('Selecione o cliente do projeto');
      return;
    }

    setSaving(true);
    const payload = { ...form, due_date: form.due_date || null };

    if (editingId) {
      const result = await updateProject(editingId, payload);
      if (result.error) {
        setFormError(result.error);
        setSaving(false);
        return;
      }
    } else {
      if (!organizationId) {
        setFormError('Organização não encontrada');
        setSaving(false);
        return;
      }
      const result = await createProject({ ...payload, organization_id: organizationId });
      if (result.error) {
        setFormError(result.error);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    setModalOpen(false);
    load();
  }

  async function handleArchive(id: string) {
    if (!confirm('Arquivar este projeto?')) return;
    const result = await archiveProject(id);
    if (result.error) {
      alert(result.error);
      return;
    }
    load();
  }

  async function handleStatusChange(id: string, status: string) {
    const result = await updateProject(id, { status });
    if (result.error) {
      alert(result.error);
      return;
    }
    load();
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card h-64 animate-pulse bg-surface-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-text-secondary text-sm">{projects.length} projeto(s)</p>
        <button
          onClick={openCreateModal}
          disabled={clients.length === 0}
          className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
          title={clients.length === 0 ? 'Cadastre um cliente primeiro' : undefined}
        >
          <Plus size={16} />
          Novo projeto
        </button>
      </div>

      {error && (
        <div className="card empty-state">
          <p className="text-status-danger-fg font-medium">Não foi possível carregar os projetos</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {!error && projects.length === 0 && (
        <div className="card empty-state">
          <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center mb-4">
            <FolderKanban size={22} className="text-brand-600" />
          </div>
          <p className="text-text-primary font-medium mb-1">Nenhum projeto ainda</p>
          <p className="text-sm">Crie um projeto vinculado a um cliente para começar.</p>
        </div>
      )}

      {!error && projects.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {PROJECT_STATUS_ORDER.map((statusKey) => {
            const columnProjects = projects.filter((p) => p.status === statusKey);
            return (
              <div key={statusKey} className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-caption font-semibold text-text-secondary uppercase tracking-wide">
                    {PROJECT_STATUS_LABELS[statusKey]}
                  </h3>
                  <span className="text-xs text-text-tertiary bg-surface-muted rounded-full px-2 py-0.5">
                    {columnProjects.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {columnProjects.map((project) => (
                    <div key={project.id} className="card p-4 group/card">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-medium text-text-primary text-sm leading-snug">
                          {project.name}
                        </h4>
                        <span
                          className={`badge shrink-0 ${PRIORITY_CLASSES[project.priority] ?? 'bg-surface-muted text-text-secondary'}`}
                        >
                          {PRIORITY_LABELS[project.priority] ?? project.priority}
                        </span>
                      </div>

                      <p className="text-xs text-text-secondary truncate mb-3">
                        {project.clients?.name ?? 'Sem cliente'}
                      </p>

                      <div className="flex items-center justify-between">
                        {project.due_date ? (
                          <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
                            <Calendar size={12} />
                            {formatDateBR(project.due_date)}
                          </div>
                        ) : (
                          <span />
                        )}
                        <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditModal(project)}
                            className="p-1 rounded hover:bg-surface-muted text-text-secondary"
                            aria-label="Editar"
                            title="Editar"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            onClick={() => handleArchive(project.id)}
                            className="p-1 rounded hover:bg-status-danger-bg hover:text-status-danger-fg text-text-secondary"
                            aria-label="Arquivar"
                            title="Arquivar"
                          >
                            <Archive size={12} />
                          </button>
                        </div>
                      </div>

                      <select
                        value={project.status}
                        onChange={(e) => handleStatusChange(project.id, e.target.value)}
                        className="mt-3 w-full text-xs border border-border-subtle rounded-lg px-2 py-1.5 bg-surface-muted text-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-600"
                      >
                        {PROJECT_STATUS_ORDER.map((s) => (
                          <option key={s} value={s}>
                            Mover para: {PROJECT_STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}

                  {columnProjects.length === 0 && (
                    <div className="border border-dashed border-border-subtle rounded-2xl p-4 text-center text-xs text-text-tertiary">
                      Nenhum projeto
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Editar projeto' : 'Novo projeto'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-caption font-medium mb-1.5">Nome *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-text"
              placeholder="Nome do projeto"
              required
            />
          </div>

          <div>
            <label className="block text-caption font-medium mb-1.5">Cliente *</label>
            <select
              value={form.client_id}
              onChange={(e) => setForm({ ...form, client_id: e.target.value })}
              className="input-text"
              required
            >
              <option value="" disabled>
                Selecione um cliente
              </option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-caption font-medium mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="input-text"
              >
                {PROJECT_STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {PROJECT_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-caption font-medium mb-1.5">Prioridade</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="input-text"
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-caption font-medium mb-1.5">Prazo</label>
            <input
              type="date"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              className="input-text"
            />
          </div>

          {formError && (
            <div className="p-3 bg-status-danger-bg text-status-danger-fg rounded-lg text-sm">
              {formError}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
              {saving ? 'Salvando...' : editingId ? 'Salvar' : 'Criar projeto'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
