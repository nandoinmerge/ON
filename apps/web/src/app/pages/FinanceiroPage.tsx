import { useState, useEffect } from 'react';
import { Wallet, TrendingUp, AlertCircle, Plus, Pencil, Trash2 } from 'lucide-react';
import {
  getBillingItems,
  getClients,
  getCurrentUserProfile,
  getCurrentUserRole,
  createBillingItem,
  updateBillingItem,
  deleteBillingItem,
} from '@services/db/index.js';
import {
  BILLING_STATUS_LABELS,
  BILLING_STATUS_CLASSES,
  formatCurrencyBRL,
  formatDateBR,
} from '../lib/labels';
import { canManageFinance } from '../lib/permissions';
import Modal from '../components/Modal';

const EMPTY_FORM = {
  description: '',
  client_id: '',
  amount: '',
  status: 'pending',
  due_date: '',
};

const BILLING_STATUS_ORDER = ['pending', 'paid', 'overdue'];

export default function FinanceiroPage() {
  const [items, setItems] = useState<any[]>([]);
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
    const [itemsResult, clientsResult, profileResult, roleResult] = await Promise.all([
      getBillingItems(),
      getClients(),
      getCurrentUserProfile(),
      getCurrentUserRole(),
    ]);
    if (itemsResult.error) setError(itemsResult.error);
    if (itemsResult.data) setItems(itemsResult.data);
    if (clientsResult.data) setClients(clientsResult.data);
    if (profileResult.data?.organization_id) setOrganizationId(profileResult.data.organization_id);
    setRole(roleResult.data);
    setLoading(false);
  }

  function openCreateModal() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, client_id: clients[0]?.id ?? '' });
    setFormError('');
    setModalOpen(true);
  }

  function openEditModal(item: any) {
    setEditingId(item.id);
    setForm({
      description: item.description ?? '',
      client_id: item.client_id ?? '',
      amount: String(item.amount ?? ''),
      status: item.status ?? 'pending',
      due_date: item.due_date ?? '',
    });
    setFormError('');
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    if (!form.description.trim()) {
      setFormError('A descrição é obrigatória');
      return;
    }
    const amountNumber = Number(form.amount.replace(',', '.'));
    if (!form.amount || Number.isNaN(amountNumber) || amountNumber <= 0) {
      setFormError('Informe um valor válido');
      return;
    }

    setSaving(true);
    const payload = {
      description: form.description,
      client_id: form.client_id || null,
      amount: amountNumber,
      status: form.status,
      due_date: form.due_date || null,
    };

    if (editingId) {
      const result = await updateBillingItem(editingId, payload);
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
      const result = await createBillingItem({ ...payload, organization_id: organizationId });
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
    if (!confirm('Excluir este item financeiro? Essa ação não pode ser desfeita.')) return;
    const result = await deleteBillingItem(id);
    if (result.error) {
      alert(result.error);
      return;
    }
    load();
  }

  async function handleStatusChange(id: string, status: string) {
    const result = await updateBillingItem(id, { status });
    if (result.error) {
      alert(result.error);
      return;
    }
    load();
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card h-24 animate-pulse bg-surface-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card empty-state">
        <p className="text-status-danger-fg font-medium">Não foi possível carregar o financeiro</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  const totalPending = items.filter((i) => i.status === 'pending').reduce((sum, i) => sum + Number(i.amount), 0);
  const totalPaid = items.filter((i) => i.status === 'paid').reduce((sum, i) => sum + Number(i.amount), 0);
  const totalOverdue = items.filter((i) => i.status === 'overdue').reduce((sum, i) => sum + Number(i.amount), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-status-warning-bg flex items-center justify-center shrink-0">
            <Wallet size={18} className="text-status-warning-fg" />
          </div>
          <div>
            <p className="text-caption text-text-secondary">Pendente</p>
            <p className="text-lg font-semibold text-text-primary">{formatCurrencyBRL(totalPending)}</p>
          </div>
        </div>
        <div className="card flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-status-success-bg flex items-center justify-center shrink-0">
            <TrendingUp size={18} className="text-status-success-fg" />
          </div>
          <div>
            <p className="text-caption text-text-secondary">Recebido</p>
            <p className="text-lg font-semibold text-text-primary">{formatCurrencyBRL(totalPaid)}</p>
          </div>
        </div>
        <div className="card flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-status-danger-bg flex items-center justify-center shrink-0">
            <AlertCircle size={18} className="text-status-danger-fg" />
          </div>
          <div>
            <p className="text-caption text-text-secondary">Atrasado</p>
            <p className="text-lg font-semibold text-text-primary">{formatCurrencyBRL(totalOverdue)}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-text-secondary text-sm">{items.length} item(ns)</p>
        {canManageFinance(role) && (
          <button onClick={openCreateModal} className="btn-primary inline-flex items-center gap-2">
            <Plus size={16} />
            Novo item
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="card empty-state">
          <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center mb-4">
            <Wallet size={22} className="text-brand-600" />
          </div>
          <p className="text-text-primary font-medium mb-1">Nenhum item financeiro ainda</p>
          <p className="text-sm">Cobranças de clientes aparecem aqui.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-text-secondary">
                <th className="font-medium px-4 py-3">Descrição</th>
                <th className="font-medium px-4 py-3 hidden sm:table-cell">Cliente</th>
                <th className="font-medium px-4 py-3">Valor</th>
                <th className="font-medium px-4 py-3">Status</th>
                <th className="font-medium px-4 py-3 hidden sm:table-cell">Vencimento</th>
                <th className="font-medium px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-border-subtle last:border-0 hover:bg-surface-muted transition-colors group/row"
                >
                  <td className="px-4 py-3 text-text-primary">{item.description}</td>
                  <td className="px-4 py-3 text-text-secondary hidden sm:table-cell truncate">
                    {item.clients?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-text-primary font-medium">
                    {formatCurrencyBRL(Number(item.amount))}
                  </td>
                  <td className="px-4 py-3">
                    {canManageFinance(role) ? (
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                        className={`badge border-0 cursor-pointer ${BILLING_STATUS_CLASSES[item.status] ?? ''}`}
                      >
                        {BILLING_STATUS_ORDER.map((s) => (
                          <option key={s} value={s}>
                            {BILLING_STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className={`badge ${BILLING_STATUS_CLASSES[item.status] ?? ''}`}>
                        {BILLING_STATUS_LABELS[item.status]}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-tertiary hidden sm:table-cell">
                    {formatDateBR(item.due_date)}
                  </td>
                  <td className="px-4 py-3">
                    {canManageFinance(role) && (
                      <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 rounded-lg hover:bg-white text-text-secondary"
                          aria-label="Editar"
                          title="Editar"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 rounded-lg hover:bg-status-danger-bg hover:text-status-danger-fg text-text-secondary"
                          aria-label="Excluir"
                          title="Excluir"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
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
        title={editingId ? 'Editar item financeiro' : 'Novo item financeiro'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-caption font-medium mb-1.5">Descrição *</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input-text"
              placeholder="Ex: Gestão de redes sociais - Outubro"
              required
            />
          </div>

          <div>
            <label className="block text-caption font-medium mb-1.5">Cliente</label>
            <select
              value={form.client_id}
              onChange={(e) => setForm({ ...form, client_id: e.target.value })}
              className="input-text"
            >
              <option value="">Sem cliente vinculado</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-caption font-medium mb-1.5">Valor (R$) *</label>
              <input
                type="text"
                inputMode="decimal"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="input-text"
                placeholder="0,00"
                required
              />
            </div>
            <div>
              <label className="block text-caption font-medium mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="input-text"
              >
                {BILLING_STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {BILLING_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-caption font-medium mb-1.5">Vencimento</label>
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
              {saving ? 'Salvando...' : editingId ? 'Salvar' : 'Criar item'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
