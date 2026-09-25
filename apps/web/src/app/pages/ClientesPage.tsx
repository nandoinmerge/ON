import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Mail, User, Plus, Pencil, Archive } from 'lucide-react';
import {
  getClients,
  getCurrentUserProfile,
  getCurrentUserRole,
  createClient,
  updateClient,
  archiveClient,
} from '@services/db/index.js';
import { canManageContent } from '../lib/permissions';
import {
  CLIENT_STATUS_LABELS,
  CLIENT_HEALTH_LABELS,
  CLIENT_HEALTH_CLASSES,
} from '../lib/labels';
import Modal from '../components/Modal';

const EMPTY_FORM = {
  name: '',
  industry: '',
  status: 'active',
  health: 'good',
  contact_name: '',
  contact_email: '',
};

export default function ClientesPage() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<any[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
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
    const [clientsResult, profileResult, roleResult] = await Promise.all([
      getClients(),
      getCurrentUserProfile(),
      getCurrentUserRole(),
    ]);
    if (clientsResult.error) setError(clientsResult.error);
    if (clientsResult.data) setClients(clientsResult.data);
    if (profileResult.data?.organization_id) setOrganizationId(profileResult.data.organization_id);
    setRole(roleResult.data);
    setLoading(false);
  }

  function openCreateModal() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
  }

  function openEditModal(client: any) {
    setEditingId(client.id);
    setForm({
      name: client.name ?? '',
      industry: client.industry ?? '',
      status: client.status ?? 'active',
      health: client.health ?? 'good',
      contact_name: client.contact_name ?? '',
      contact_email: client.contact_email ?? '',
    });
    setFormError('');
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    if (!form.name.trim()) {
      setFormError('O nome do cliente é obrigatório');
      return;
    }

    setSaving(true);

    if (editingId) {
      const result = await updateClient(editingId, form);
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
      const result = await createClient({ ...form, organization_id: organizationId });
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
    if (!confirm('Arquivar este cliente? Ele deixa de aparecer nas listas, mas os dados são mantidos.')) {
      return;
    }
    const result = await archiveClient(id);
    if (result.error) {
      alert(result.error);
      return;
    }
    load();
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card h-40 animate-pulse bg-surface-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-text-secondary text-sm">{clients.length} cliente(s)</p>
        {canManageContent(role) && (
          <button onClick={openCreateModal} className="btn-primary inline-flex items-center gap-2">
            <Plus size={16} />
            Novo cliente
          </button>
        )}
      </div>

      {error && (
        <div className="card empty-state">
          <p className="text-status-danger-fg font-medium">Não foi possível carregar os clientes</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {!error && clients.length === 0 && (
        <div className="card empty-state">
          <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center mb-4">
            <Building2 size={22} className="text-brand-600" />
          </div>
          <p className="text-text-primary font-medium mb-1">Nenhum cliente ainda</p>
          <p className="text-sm">Cadastre o primeiro cliente para começar a organizar projetos.</p>
        </div>
      )}

      {!error && clients.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
            <div
              key={client.id}
              onClick={() => navigate(`/app/clientes/${client.id}`)}
              className="card group/card relative cursor-pointer hover:shadow-soft-lg hover:border-brand-200 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                  <Building2 size={18} className="text-brand-600" />
                </div>
                <div className="flex items-center gap-1">
                  <span
                    className={`badge ${CLIENT_HEALTH_CLASSES[client.health] ?? 'bg-surface-muted text-text-secondary'}`}
                  >
                    {CLIENT_HEALTH_LABELS[client.health] ?? client.health}
                  </span>
                </div>
              </div>

              <h3 className="font-semibold text-text-primary truncate">{client.name}</h3>
              {client.industry && (
                <p className="text-sm text-text-secondary truncate">{client.industry}</p>
              )}

              <div className="mt-4 pt-4 border-t border-border-subtle space-y-1.5">
                {client.contact_name && (
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <User size={14} className="shrink-0" />
                    <span className="truncate">{client.contact_name}</span>
                  </div>
                )}
                {client.contact_email && (
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <Mail size={14} className="shrink-0" />
                    <span className="truncate">{client.contact_email}</span>
                  </div>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-caption text-text-tertiary">
                  {CLIENT_STATUS_LABELS[client.status] ?? client.status}
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                  {canManageContent(role) && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(client);
                        }}
                        className="p-1.5 rounded-lg hover:bg-surface-muted text-text-secondary"
                        aria-label="Editar"
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleArchive(client.id);
                        }}
                        className="p-1.5 rounded-lg hover:bg-status-danger-bg hover:text-status-danger-fg text-text-secondary"
                        aria-label="Arquivar"
                        title="Arquivar"
                      >
                        <Archive size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Editar cliente' : 'Novo cliente'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-caption font-medium mb-1.5">Nome *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-text"
              placeholder="Nome do cliente"
              required
            />
          </div>

          <div>
            <label className="block text-caption font-medium mb-1.5">Ramo de atuação</label>
            <input
              type="text"
              value={form.industry}
              onChange={(e) => setForm({ ...form, industry: e.target.value })}
              className="input-text"
              placeholder="Ex: Moda e vestuário"
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
              <label className="block text-caption font-medium mb-1.5">Saúde</label>
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
              placeholder="Nome de quem responde pelo cliente"
            />
          </div>

          <div>
            <label className="block text-caption font-medium mb-1.5">E-mail do contato</label>
            <input
              type="email"
              value={form.contact_email}
              onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
              className="input-text"
              placeholder="email@cliente.com"
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
              {saving ? 'Salvando...' : editingId ? 'Salvar' : 'Criar cliente'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
