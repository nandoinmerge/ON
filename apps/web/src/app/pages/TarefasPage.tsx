import { useState, useEffect } from 'react';
import { CheckSquare, Calendar, Plus, Pencil, Trash2 } from 'lucide-react';
import {
  getTasks,
  getProjects,
  getCurrentUserProfile,
  createTask,
  updateTask,
  deleteTask,
} from '@services/db/index.js';
import { TASK_STATUS_LABELS, TASK_STATUS_CLASSES, formatDateBR } from '../lib/labels';
import Modal from '../components/Modal';

const EMPTY_FORM = {
  title: '',
  project_id: '',
  status: 'todo',
  due_date: '',
};

const TASK_STATUS_ORDER = ['todo', 'in_progress', 'done'];

export default function TarefasPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
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
    const [tasksResult, projectsResult, profileResult] = await Promise.all([
      getTasks(),
      getProjects(),
      getCurrentUserProfile(),
    ]);
    if (tasksResult.error) setError(tasksResult.error);
    if (tasksResult.data) setTasks(tasksResult.data);
    if (projectsResult.data) setProjects(projectsResult.data);
    if (profileResult.data?.organization_id) setOrganizationId(profileResult.data.organization_id);
    setLoading(false);
  }

  function openCreateModal() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, project_id: projects[0]?.id ?? '' });
    setFormError('');
    setModalOpen(true);
  }

  function openEditModal(task: any) {
    setEditingId(task.id);
    setForm({
      title: task.title ?? '',
      project_id: task.project_id ?? '',
      status: task.status ?? 'todo',
      due_date: task.due_date ?? '',
    });
    setFormError('');
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    if (!form.title.trim()) {
      setFormError('O título da tarefa é obrigatório');
      return;
    }
    if (!form.project_id) {
      setFormError('Selecione o projeto da tarefa');
      return;
    }

    setSaving(true);
    const payload = { ...form, due_date: form.due_date || null };

    if (editingId) {
      const result = await updateTask(editingId, payload);
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
      const result = await createTask({ ...payload, organization_id: organizationId });
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

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta tarefa? Essa ação não pode ser desfeita.')) return;
    const result = await deleteTask(id);
    if (result.error) {
      alert(result.error);
      return;
    }
    load();
  }

  async function handleStatusChange(id: string, status: string) {
    const result = await updateTask(id, { status });
    if (result.error) {
      alert(result.error);
      return;
    }
    load();
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card h-16 animate-pulse bg-surface-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-text-secondary text-sm">{tasks.length} tarefa(s)</p>
        <button
          onClick={openCreateModal}
          disabled={projects.length === 0}
          className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
          title={projects.length === 0 ? 'Cadastre um projeto primeiro' : undefined}
        >
          <Plus size={16} />
          Nova tarefa
        </button>
      </div>

      {error && (
        <div className="card empty-state">
          <p className="text-status-danger-fg font-medium">Não foi possível carregar as tarefas</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {!error && tasks.length === 0 && (
        <div className="card empty-state">
          <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center mb-4">
            <CheckSquare size={22} className="text-brand-600" />
          </div>
          <p className="text-text-primary font-medium mb-1">Nenhuma tarefa ainda</p>
          <p className="text-sm">Crie uma tarefa vinculada a um projeto para começar.</p>
        </div>
      )}

      {!error && tasks.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-text-secondary">
                <th className="font-medium px-4 py-3">Tarefa</th>
                <th className="font-medium px-4 py-3 hidden sm:table-cell">Projeto</th>
                <th className="font-medium px-4 py-3">Status</th>
                <th className="font-medium px-4 py-3 hidden sm:table-cell">Prazo</th>
                <th className="font-medium px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr
                  key={task.id}
                  className="border-b border-border-subtle last:border-0 hover:bg-surface-muted transition-colors group/row"
                >
                  <td className="px-4 py-3 text-text-primary">{task.title}</td>
                  <td className="px-4 py-3 text-text-secondary hidden sm:table-cell truncate">
                    {task.projects?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task.id, e.target.value)}
                      className={`badge border-0 cursor-pointer ${TASK_STATUS_CLASSES[task.status] ?? ''}`}
                    >
                      {TASK_STATUS_ORDER.map((s) => (
                        <option key={s} value={s}>
                          {TASK_STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-text-tertiary hidden sm:table-cell">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} />
                      {formatDateBR(task.due_date)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModal(task)}
                        className="p-1.5 rounded-lg hover:bg-white text-text-secondary"
                        aria-label="Editar"
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="p-1.5 rounded-lg hover:bg-status-danger-bg hover:text-status-danger-fg text-text-secondary"
                        aria-label="Excluir"
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Editar tarefa' : 'Nova tarefa'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-caption font-medium mb-1.5">Título *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input-text"
              placeholder="O que precisa ser feito"
              required
            />
          </div>

          <div>
            <label className="block text-caption font-medium mb-1.5">Projeto *</label>
            <select
              value={form.project_id}
              onChange={(e) => setForm({ ...form, project_id: e.target.value })}
              className="input-text"
              required
            >
              <option value="" disabled>
                Selecione um projeto
              </option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
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
                {TASK_STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {TASK_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
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
              {saving ? 'Salvando...' : editingId ? 'Salvar' : 'Criar tarefa'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
