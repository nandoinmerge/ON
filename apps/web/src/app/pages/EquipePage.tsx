import { useState, useEffect } from 'react';
import { Users, Plus, X, Copy, Check } from 'lucide-react';
import {
  getCurrentUserProfile,
  getCurrentUserRole,
  getOrganizationMembers,
  getPendingInvitations,
  cancelInvitation,
} from '@services/db/index.js';
import { inviteMember } from '@services/auth/invite.js';
import { ROLE_LABELS, canManageTeam } from '../lib/permissions';
import Modal from '../components/Modal';

const INVITE_ROLES = ['admin', 'manager', 'collaborator', 'finance'];

export default function EquipePage() {
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('collaborator');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const [profileResult, roleResult] = await Promise.all([getCurrentUserProfile(), getCurrentUserRole()]);
    setRole(roleResult.data);
    const orgId = profileResult.data?.organization_id;
    if (!orgId) {
      setError('Organização não encontrada');
      setLoading(false);
      return;
    }
    setOrganizationId(orgId);

    const [membersResult, invitationsResult] = await Promise.all([
      getOrganizationMembers(orgId),
      getPendingInvitations(orgId),
    ]);
    if (membersResult.data) setMembers(membersResult.data);
    if (invitationsResult.data) setInvitations(invitationsResult.data);
    setLoading(false);
  }

  function openInviteModal() {
    setEmail('');
    setInviteRole('collaborator');
    setFormError('');
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    if (!organizationId) return;

    setSaving(true);
    const result = await inviteMember({ organizationId, email, role: inviteRole as any });
    setSaving(false);

    if (!result.success) {
      setFormError(result.error || 'Não foi possível criar o convite');
      return;
    }

    setModalOpen(false);
    load();
  }

  async function handleCancel(invitationId: string) {
    if (!confirm('Cancelar este convite?')) return;
    await cancelInvitation(invitationId);
    load();
  }

  function inviteLink(token: string) {
    return `${window.location.origin}/auth/accept-invite?token=${token}`;
  }

  async function handleCopy(id: string, token: string) {
    await navigator.clipboard.writeText(inviteLink(token));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="card h-16 animate-pulse bg-surface-muted" />
        <div className="card h-16 animate-pulse bg-surface-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-text-secondary text-sm">{members.length} membro(s)</p>
        {canManageTeam(role) && (
          <button onClick={openInviteModal} className="btn-primary inline-flex items-center gap-2">
            <Plus size={16} />
            Convidar membro
          </button>
        )}
      </div>

      {error && (
        <div className="card empty-state">
          <p className="text-status-danger-fg font-medium">{error}</p>
        </div>
      )}

      <div className="card">
        <h2 className="text-h2 mb-4">Membros</h2>
        <div className="space-y-2">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between gap-3 py-2.5 border-b border-border-subtle last:border-0"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center shrink-0">
                  <Users size={15} className="text-brand-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {m.profiles?.full_name || m.profiles?.email || 'Sem nome'}
                  </p>
                  <p className="text-xs text-text-tertiary truncate">{m.profiles?.email}</p>
                </div>
              </div>
              <span className="badge bg-surface-muted text-text-secondary shrink-0">
                {ROLE_LABELS[m.role] ?? m.role}
              </span>
            </div>
          ))}
        </div>
      </div>

      {invitations.length > 0 && (
        <div className="card">
          <h2 className="text-h2 mb-4">Convites pendentes</h2>
          <div className="space-y-2">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between gap-3 py-2.5 border-b border-border-subtle last:border-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{inv.email}</p>
                  <p className="text-xs text-text-tertiary">{ROLE_LABELS[inv.role] ?? inv.role}</p>
                </div>
                {canManageTeam(role) && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleCopy(inv.id, inv.token)}
                      className="p-1.5 rounded-lg hover:bg-surface-muted text-text-secondary"
                      title="Copiar link do convite"
                    >
                      {copiedId === inv.id ? (
                        <Check size={14} className="text-status-success-fg" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                    <button
                      onClick={() => handleCancel(inv.id)}
                      className="p-1.5 rounded-lg hover:bg-status-danger-bg hover:text-status-danger-fg text-text-secondary"
                      title="Cancelar convite"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-text-tertiary mt-3">
            O envio de e-mail automático ainda não está configurado — copie o link e envie você mesmo (WhatsApp,
            e-mail) pra pessoa convidada.
          </p>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Convidar membro">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-caption font-medium mb-1.5">E-mail *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-text"
              placeholder="pessoa@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-caption font-medium mb-1.5">Papel</label>
            <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="input-text">
              {INVITE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>

          {formError && (
            <div className="p-3 bg-status-danger-bg text-status-danger-fg rounded-lg text-sm">{formError}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
              {saving ? 'Enviando...' : 'Criar convite'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
