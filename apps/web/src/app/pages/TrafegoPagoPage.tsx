import { useState, useEffect, useMemo } from 'react';
import { Target, Plus, Pencil, Trash2, Phone, Mail, CalendarPlus } from 'lucide-react';
import {
  getLeads,
  getClients,
  getCurrentUserProfile,
  getCurrentUserRole,
  createLead,
  updateLead,
  deleteLead,
} from '@services/db/index.js';
import {
  LEAD_STAGE_LABELS,
  LEAD_STAGE_ORDER,
  LEAD_SOURCE_LABELS,
  LEAD_SOURCE_CLASSES,
  formatCurrencyBRL,
} from '../lib/labels';
import { canManageContent } from '../lib/permissions';
import { getStoredAccessToken, createCalendarEvent } from '@services/calendar/index.js';
import Modal from '../components/Modal';

const EMPTY_FORM = {
  client_id: '',
  name: '',
  phone: '',
  email: '',
  source: 'manual',
  stage: 'novo',
  estimated_value: '',
  notes: '',
};

export default function TrafegoPagoPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
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
    const [leadsResult, clientsResult, profileResult, roleResult] = await Promise.all([
      getLeads(),
      getClients(),
      getCurrentUserProfile(),
      getCurrentUserRole(),
    ]);
    if (leadsResult.error) setError(leadsResult.error);
    if (leadsResult.data) setLeads(leadsResult.data);
    if (clientsResult.data) setClients(clientsResult.data);
    if (profileResult.data?.organization_id) setOrganizationId(profileResult.data.organization_id);
    setRole(roleResult.data);
    setLoading(false);
  }

  const visibleLeads = useMemo(
    () => (clientFilter === 'all' ? leads : leads.filter((l) => l.client_id === clientFilter)),
    [leads, clientFilter]
  );

  const totals = useMemo(() => {
    const aberto = visibleLeads.filter((l) => l.stage !== 'ganho' && l.stage !== 'perdido');
    const ganho = visibleLeads.filter((l) => l.stage === 'ganho');
    return {
      abertoValor: aberto.reduce((s, l) => s + Number(l.estimated_value || 0), 0),
      ganhoValor: ganho.reduce((s, l) => s + Number(l.estimated_value || 0), 0),
      abertoCount: aberto.length,
    };
  }, [visibleLeads]);

  function openCreateModal() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, client_id: clientFilter !== 'all' ? clientFilter : clients[0]?.id ?? '' });
    setFormError('');
    setModalOpen(true);
  }

  function openEditModal(lead: any) {
    setEditingId(lead.id);
    setForm({
      client_id: lead.client_id ?? '',
      name: lead.name ?? '',
      phone: lead.phone ?? '',
      email: lead.email ?? '',
      source: lead.source ?? 'manual',
      stage: lead.stage ?? 'novo',
      estimated_value: lead.estimated_value != null ? String(lead.estimated_value) : '',
      notes: lead.notes ?? '',
    });
    setFormError('');
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    if (!form.name.trim()) {
      setFormError('O nome do lead é obrigatório');
      return;
    }
    if (!form.client_id) {
      setFormError('Selecione o cliente dono desse lead');
      return;
    }

    setSaving(true);
    const payload = {
      ...form,
      phone: form.phone || null,
      email: form.email || null,
      notes: form.notes || null,
      estimated_value: form.estimated_value ? Number(form.estimated_value) : null,
    };

    if (editingId) {
      const result = await updateLead(editingId, payload);
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
      const result = await createLead({ ...payload, organization_id: organizationId });
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
    if (!confirm('Excluir este lead?')) return;
    const result = await deleteLead(id);
    if (result.error) {
      alert(result.error);
      return;
    }
    load();
  }

  async function openGoogleCalendar(lead: any) {
    const token = getStoredAccessToken();

    if (token) {
      const start = new Date();
      start.setHours(start.getHours() + 1, 0, 0, 0);
      const end = new Date(start.getTime() + 30 * 60 * 1000);
      const notesParts = [lead.phone && `Telefone: ${lead.phone}`, lead.notes && `Notas: ${lead.notes}`].filter(
        Boolean
      );
      try {
        const event = await createCalendarEvent(token, {
          summary: `Reunião com ${lead.name}${lead.clients?.name ? ` (${lead.clients.name})` : ''}`,
          description: notesParts.join('\n'),
          startISO: start.toISOString(),
          endISO: end.toISOString(),
          attendeeEmail: lead.email || null,
        });
        if (event.hangoutLink) window.open(event.hangoutLink, '_blank');
        alert('Reunião criada no Google Calendar, 1h a partir de agora. Ajuste o horário lá se precisar.');
        return;
      } catch (err: any) {
        // se falhar (token expirado, etc.), cai no link simples abaixo
      }
    }

    const title = encodeURIComponent(`Reunião com ${lead.name}${lead.clients?.name ? ` (${lead.clients.name})` : ''}`);
    const detailsParts = [
      lead.phone && `Telefone: ${lead.phone}`,
      lead.email && `E-mail: ${lead.email}`,
      lead.notes && `Notas: ${lead.notes}`,
    ].filter(Boolean);
    const details = encodeURIComponent(detailsParts.join('\n'));
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}`;
    window.open(url, '_blank');
  }

  async function handleStageChange(id: string, stage: string) {
    const result = await updateLead(id, { stage });
    if (result.error) {
      alert(result.error);
      return;
    }
    load();
  }

  function handleDragStart(e: React.DragEvent, leadId: string) {
    e.dataTransfer.setData('text/plain', leadId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingId(leadId);
  }

  function handleDragEnd() {
    setDraggingId(null);
    setDragOverColumn(null);
  }

  function handleColumnDragOver(e: React.DragEvent, stage: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== stage) setDragOverColumn(stage);
  }

  function handleColumnDrop(e: React.DragEvent, stage: string) {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain');
    setDragOverColumn(null);
    setDraggingId(null);
    const lead = leads.find((l) => l.id === leadId);
    if (lead && lead.stage !== stage) handleStageChange(leadId, stage);
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="card h-56 animate-pulse bg-surface-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
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
          <button onClick={openCreateModal} className="btn-primary inline-flex items-center gap-2">
            <Plus size={16} />
            Novo lead
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-caption text-text-secondary">Leads em aberto</p>
          <p className="text-lg font-semibold text-text-primary">{totals.abertoCount}</p>
        </div>
        <div className="card">
          <p className="text-caption text-text-secondary">Valor em aberto</p>
          <p className="text-lg font-semibold text-text-primary">{formatCurrencyBRL(totals.abertoValor)}</p>
        </div>
        <div className="card">
          <p className="text-caption text-text-secondary">Valor ganho</p>
          <p className="text-lg font-semibold text-status-success-fg">{formatCurrencyBRL(totals.ganhoValor)}</p>
        </div>
      </div>

      {error && (
        <div className="card empty-state">
          <p className="text-status-danger-fg font-medium">Não foi possível carregar os leads</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {!error && visibleLeads.length === 0 && (
        <div className="card empty-state">
          <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center mb-4">
            <Target size={22} className="text-brand-600" />
          </div>
          <p className="text-text-primary font-medium mb-1">Nenhum lead ainda</p>
          <p className="text-sm">Cadastre manualmente, ou conecte Meta/Google Ads futuramente para receber automático.</p>
        </div>
      )}

      {!error && visibleLeads.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
          {LEAD_STAGE_ORDER.map((stage) => {
            const columnLeads = visibleLeads.filter((l) => l.stage === stage);
            return (
              <div
                key={stage}
                onDragOver={(e) => handleColumnDragOver(e, stage)}
                onDragLeave={() => setDragOverColumn((c) => (c === stage ? null : c))}
                onDrop={(e) => handleColumnDrop(e, stage)}
                className={`space-y-3 rounded-2xl transition-colors ${
                  dragOverColumn === stage ? 'bg-brand-50/60 ring-2 ring-brand-200' : ''
                }`}
              >
                <div className="flex items-center justify-between px-1 pt-1">
                  <h3 className="text-caption font-semibold text-text-secondary uppercase tracking-wide">
                    {LEAD_STAGE_LABELS[stage]}
                  </h3>
                  <span className="text-xs text-text-tertiary bg-surface-muted rounded-full px-2 py-0.5">
                    {columnLeads.length}
                  </span>
                </div>

                <div className="space-y-3 px-1 pb-1 min-h-[40px]">
                  {columnLeads.map((lead) => {
                    const canEdit = canManageContent(role);
                    return (
                    <div
                      key={lead.id}
                      draggable={canEdit}
                      onDragStart={canEdit ? (e) => handleDragStart(e, lead.id) : undefined}
                      onDragEnd={canEdit ? handleDragEnd : undefined}
                      onClick={canEdit ? () => openEditModal(lead) : undefined}
                      className={`card p-4 group/card transition-all ${
                        canEdit ? 'cursor-grab active:cursor-grabbing hover:shadow-soft-lg' : ''
                      } ${draggingId === lead.id ? 'opacity-40' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-medium text-text-primary text-sm leading-snug">{lead.name}</h4>
                        <span
                          className={`badge shrink-0 ${LEAD_SOURCE_CLASSES[lead.source] ?? 'bg-surface-muted text-text-secondary'}`}
                        >
                          {LEAD_SOURCE_LABELS[lead.source] ?? lead.source}
                        </span>
                      </div>

                      <p className="text-xs text-text-secondary truncate mb-1">{lead.clients?.name ?? 'Sem cliente'}</p>

                      {(lead.phone || lead.email) && (
                        <div className="space-y-0.5 mb-2">
                          {lead.phone && (
                            <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
                              <Phone size={11} />
                              {lead.phone}
                            </div>
                          )}
                          {lead.email && (
                            <div className="flex items-center gap-1.5 text-xs text-text-tertiary truncate">
                              <Mail size={11} />
                              <span className="truncate">{lead.email}</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        {lead.estimated_value ? (
                          <span className="text-xs font-medium text-text-primary">
                            {formatCurrencyBRL(Number(lead.estimated_value))}
                          </span>
                        ) : (
                          <span />
                        )}
                        {canEdit && (
                          <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openGoogleCalendar(lead);
                              }}
                              className="p-1 rounded hover:bg-surface-muted text-text-secondary"
                              title="Agendar reunião no Google Calendar"
                            >
                              <CalendarPlus size={12} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(lead);
                              }}
                              className="p-1 rounded hover:bg-surface-muted text-text-secondary"
                              title="Editar"
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(lead.id);
                              }}
                              className="p-1 rounded hover:bg-status-danger-bg hover:text-status-danger-fg text-text-secondary"
                              title="Excluir"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>

                      {canEdit && (
                        <select
                          value={lead.stage}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleStageChange(lead.id, e.target.value);
                          }}
                          className="sm:hidden mt-3 w-full text-xs border border-border-subtle rounded-lg px-2 py-1.5 bg-surface-muted text-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-600"
                        >
                          {LEAD_STAGE_ORDER.map((s) => (
                            <option key={s} value={s}>
                              Mover para: {LEAD_STAGE_LABELS[s]}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    );
                  })}

                  {columnLeads.length === 0 && (
                    <div className="border border-dashed border-border-subtle rounded-2xl p-4 text-center text-xs text-text-tertiary">
                      Arraste um lead para cá
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Editar lead' : 'Novo lead'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-caption font-medium mb-1.5">Nome *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-text"
              placeholder="Nome do lead"
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
              <label className="block text-caption font-medium mb-1.5">Telefone</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="input-text"
                placeholder="(00) 00000-0000"
              />
            </div>
            <div>
              <label className="block text-caption font-medium mb-1.5">E-mail</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input-text"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-caption font-medium mb-1.5">Origem</label>
              <select
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                className="input-text"
              >
                {Object.entries(LEAD_SOURCE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-caption font-medium mb-1.5">Estágio</label>
              <select
                value={form.stage}
                onChange={(e) => setForm({ ...form, stage: e.target.value })}
                className="input-text"
              >
                {LEAD_STAGE_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {LEAD_STAGE_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-caption font-medium mb-1.5">Valor estimado (R$)</label>
            <input
              type="number"
              step="0.01"
              value={form.estimated_value}
              onChange={(e) => setForm({ ...form, estimated_value: e.target.value })}
              className="input-text"
              placeholder="0,00"
            />
          </div>

          <div>
            <label className="block text-caption font-medium mb-1.5">Notas</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="input-text"
              rows={3}
              placeholder="Observações sobre a conversa, objeções, etc."
            />
          </div>

          {formError && (
            <div className="p-3 bg-status-danger-bg text-status-danger-fg rounded-lg text-sm">{formError}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
              {saving ? 'Salvando...' : editingId ? 'Salvar' : 'Criar lead'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
