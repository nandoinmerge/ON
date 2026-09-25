/**
 * Permissões por papel — espelham exatamente as políticas de RLS do banco
 * (db/migrations/0011_role_based_permissions.sql). Isso é só para a
 * interface não oferecer uma ação que o banco vai recusar; a segurança de
 * verdade está no banco, não aqui.
 */

export const ROLE_LABELS: Record<string, string> = {
  owner: 'Proprietário',
  admin: 'Administrador',
  manager: 'Gestor',
  collaborator: 'Colaborador',
  finance: 'Financeiro',
};

const CONTENT_ROLES = ['owner', 'admin', 'manager'];
const FINANCE_ROLES = ['owner', 'admin', 'finance'];

/** Pode criar/editar/arquivar clientes, projetos e leads. */
export function canManageContent(role: string | null): boolean {
  return !!role && CONTENT_ROLES.includes(role);
}

/** Pode criar/editar/excluir itens financeiros. */
export function canManageFinance(role: string | null): boolean {
  return !!role && FINANCE_ROLES.includes(role);
}

/** Pode editar uma tarefa específica (dono do conteúdo, ou colaborador dono dela). */
export function canEditTask(role: string | null, task: { assignee_profile_id?: string | null }, userId: string | null): boolean {
  if (canManageContent(role)) return true;
  if (role === 'collaborator' && userId && task.assignee_profile_id === userId) return true;
  return false;
}
