import { useState, useEffect, useMemo } from 'react';
import { Plus, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import {
  getSocialPosts,
  getClients,
  getCurrentUserProfile,
  getCurrentUserRole,
  createSocialPost,
  updateSocialPost,
  deleteSocialPost,
} from '@services/db/index.js';
import { POST_STATUS_LABELS, POST_STATUS_ORDER, POST_STATUS_CLASSES, PLATFORM_LABELS } from '../lib/labels';
import { canManageContent } from '../lib/permissions';
import Modal from '../components/Modal';
import AttachmentsPanel from '../components/AttachmentsPanel';

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function buildMonthGrid(monthStart: Date): Date[] {
  const firstWeekday = monthStart.getDay();
  const gridStart = new Date(monthStart);
  gridStart.setDate(gridStart.getDate() - firstWeekday);

  const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
  const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;

  return Array.from({ length: totalCells }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

const EMPTY_FORM = {
  client_id: '',
  title: '',
  caption: '',
  platform: 'instagram',
  scheduled_date: '',
  status: 'draft',
  notes: '',
};

export default function ConteudoPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [monthStart, setMonthStart] = useState(() => startOfMonth(new Date()));
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
    const [postsResult, clientsResult, profileResult, roleResult] = await Promise.all([
      getSocialPosts(),
      getClients(),
      getCurrentUserProfile(),
      getCurrentUserRole(),
    ]);
    if (postsResult.error) setError(postsResult.error);
    if (postsResult.data) setPosts(postsResult.data);
    if (clientsResult.data) setClients(clientsResult.data);
    if (profileResult.data?.organization_id) setOrganizationId(profileResult.data.organization_id);
    setRole(roleResult.data);
    setLoading(false);
  }

  const visiblePosts = useMemo(
    () => (clientFilter === 'all' ? posts : posts.filter((p) => p.client_id === clientFilter)),
    [posts, clientFilter]
  );

  const postsByDay = useMemo(() => {
    const map: Record<string, any[]> = {};
    visiblePosts.forEach((post) => {
      const key = post.scheduled_date;
      if (!map[key]) map[key] = [];
      map[key].push(post);
    });
    return map;
  }, [visiblePosts]);

  const monthGrid = useMemo(() => buildMonthGrid(monthStart), [monthStart]);
  const today = new Date();

  function openCreateModal(date?: Date) {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      client_id: clientFilter !== 'all' ? clientFilter : clients[0]?.id ?? '',
      scheduled_date: date ? toDateKey(date) : toDateKey(new Date()),
    });
    setFormError('');
    setModalOpen(true);
  }

  function openEditModal(post: any) {
    setEditingId(post.id);
    setForm({
      client_id: post.client_id ?? '',
      title: post.title ?? '',
      caption: post.caption ?? '',
      platform: post.platform ?? 'instagram',
      scheduled_date: post.scheduled_date ?? '',
      status: post.status ?? 'draft',
      notes: post.notes ?? '',
    });
    setFormError('');
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    if (!form.title.trim()) {
      setFormError('Dê um título para o post');
      return;
    }
    if (!form.client_id) {
      setFormError('Selecione o cliente');
      return;
    }
    if (!form.scheduled_date) {
      setFormError('Escolha a data');
      return;
    }

    setSaving(true);
    const payload = { ...form, caption: form.caption || null, notes: form.notes || null };

    if (editingId) {
      const result = await updateSocialPost(editingId, payload);
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
      const result = await createSocialPost({ ...payload, organization_id: organizationId });
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
    if (!confirm('Excluir este post?')) return;
    const result = await deleteSocialPost(id);
    if (result.error) {
      alert(result.error);
      return;
    }
    load();
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="card h-10 animate-pulse bg-surface-muted" />
        <div className="card h-96 animate-pulse bg-surface-muted" />
      </div>
    );
  }

  const monthLabel = monthStart.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMonthStart(startOfMonth(new Date()))}
            className="btn-secondary text-sm"
          >
            Hoje
          </button>
          <button
            onClick={() => setMonthStart((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
            className="p-2 rounded-lg hover:bg-surface-muted text-text-secondary"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setMonthStart((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
            className="p-2 rounded-lg hover:bg-surface-muted text-text-secondary"
          >
            <ChevronRight size={16} />
          </button>
          <p className="text-text-primary font-medium capitalize ml-1">{monthLabel}</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="input-text w-auto text-sm"
          >
            <option value="all">Todos os clientes</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {canManageContent(role) && (
            <button onClick={() => openCreateModal()} className="btn-primary inline-flex items-center gap-2">
              <Plus size={16} />
              Novo post
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="card empty-state">
          <p className="text-status-danger-fg font-medium">{error}</p>
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-border-subtle">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="text-center py-2 text-[11px] uppercase tracking-wide text-text-tertiary">
              {label}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {monthGrid.map((day) => {
            const isCurrentMonth = day.getMonth() === monthStart.getMonth();
            const isToday = day.toDateString() === today.toDateString();
            const dayPosts = postsByDay[toDateKey(day)] || [];
            return (
              <div
                key={day.toISOString()}
                onClick={() => canManageContent(role) && openCreateModal(day)}
                className={`min-h-[92px] border-b border-r border-border-subtle p-1.5 ${
                  isCurrentMonth ? '' : 'bg-surface-muted/40'
                } ${canManageContent(role) ? 'cursor-pointer hover:bg-brand-50/40' : ''} transition-colors`}
              >
                <p
                  className={`text-xs mb-1 inline-flex items-center justify-center w-5 h-5 rounded-full ${
                    isToday ? 'bg-brand-600 text-white' : isCurrentMonth ? 'text-text-primary' : 'text-text-tertiary'
                  }`}
                >
                  {day.getDate()}
                </p>
                <div className="space-y-1">
                  {dayPosts.slice(0, 3).map((post) => (
                    <button
                      key={post.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(post);
                      }}
                      className={`w-full text-left text-[10px] leading-tight px-1.5 py-1 rounded truncate ${
                        POST_STATUS_CLASSES[post.status] ?? 'bg-surface-muted text-text-secondary'
                      }`}
                      title={post.title}
                    >
                      {post.title}
                    </button>
                  ))}
                  {dayPosts.length > 3 && (
                    <p className="text-[10px] text-text-tertiary px-1.5">+{dayPosts.length - 3} mais</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Editar post' : 'Novo post'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-caption font-medium mb-1.5">Título *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input-text"
              placeholder="Ex: Lançamento coleção verão"
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
              <label className="block text-caption font-medium mb-1.5">Data</label>
              <input
                type="date"
                value={form.scheduled_date}
                onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
                className="input-text"
                required
              />
            </div>
            <div>
              <label className="block text-caption font-medium mb-1.5">Plataforma</label>
              <select
                value={form.platform}
                onChange={(e) => setForm({ ...form, platform: e.target.value })}
                className="input-text"
              >
                {Object.entries(PLATFORM_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-caption font-medium mb-1.5">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="input-text"
            >
              {POST_STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {POST_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-caption font-medium mb-1.5">Legenda</label>
            <textarea
              value={form.caption}
              onChange={(e) => setForm({ ...form, caption: e.target.value })}
              className="input-text"
              rows={3}
              placeholder="Texto que vai junto com o post"
            />
          </div>

          <div>
            <label className="block text-caption font-medium mb-1.5">Notas internas</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="input-text"
              rows={2}
            />
          </div>

          {editingId && organizationId && (
            <div className="pt-2 border-t border-border-subtle">
              <AttachmentsPanel organizationId={organizationId} entityType="post" entityId={editingId} />
            </div>
          )}

          {formError && (
            <div className="p-3 bg-status-danger-bg text-status-danger-fg rounded-lg text-sm">{formError}</div>
          )}

          <div className="flex gap-3 pt-2">
            {editingId && canManageContent(role) && (
              <button
                type="button"
                onClick={() => {
                  handleDelete(editingId);
                  setModalOpen(false);
                }}
                className="p-2.5 rounded-lg hover:bg-status-danger-bg hover:text-status-danger-fg text-text-secondary"
                title="Excluir"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
              {saving ? 'Salvando...' : editingId ? 'Salvar' : 'Criar post'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
