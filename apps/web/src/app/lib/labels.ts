/**
 * Rótulos e classes de cor para badges de status, prioridade e saúde do
 * cliente. Centralizado aqui para as páginas de Clientes, Projetos, Tarefas
 * e Financeiro usarem exatamente a mesma linguagem visual.
 */

export const CLIENT_STATUS_LABELS: Record<string, string> = {
  active: 'Ativo',
  paused: 'Pausado',
  churned: 'Encerrado',
  archived: 'Encerrado',
};

export const CLIENT_HEALTH_LABELS: Record<string, string> = {
  good: 'Saudável',
  attention: 'Atenção',
  risk: 'Risco',
};

export const CLIENT_HEALTH_CLASSES: Record<string, string> = {
  good: 'bg-status-success-bg text-status-success-fg',
  attention: 'bg-status-warning-bg text-status-warning-fg',
  risk: 'bg-status-danger-bg text-status-danger-fg',
};

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  todo: 'A fazer',
  in_progress: 'Em andamento',
  in_review: 'Em aprovação',
  done: 'Concluído',
};

export const PROJECT_STATUS_ORDER = ['todo', 'in_progress', 'in_review', 'done'];

export const PRIORITY_LABELS: Record<string, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
};

export const PRIORITY_CLASSES: Record<string, string> = {
  low: 'bg-status-info-bg text-status-info-fg',
  medium: 'bg-status-warning-bg text-status-warning-fg',
  high: 'bg-status-danger-bg text-status-danger-fg',
};

export const TASK_STATUS_LABELS: Record<string, string> = {
  todo: 'A fazer',
  in_progress: 'Em andamento',
  done: 'Concluída',
};

export const TASK_STATUS_CLASSES: Record<string, string> = {
  todo: 'bg-surface-muted text-text-secondary',
  in_progress: 'bg-status-info-bg text-status-info-fg',
  done: 'bg-status-success-bg text-status-success-fg',
};

export const BILLING_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  overdue: 'Atrasado',
};

export const BILLING_STATUS_CLASSES: Record<string, string> = {
  pending: 'bg-status-warning-bg text-status-warning-fg',
  paid: 'bg-status-success-bg text-status-success-fg',
  overdue: 'bg-status-danger-bg text-status-danger-fg',
};

export function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatDateBR(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('pt-BR');
}

export const LEAD_STAGE_LABELS: Record<string, string> = {
  novo: 'Novo',
  contato: 'Em contato',
  proposta: 'Proposta',
  ganho: 'Ganho',
  perdido: 'Perdido',
};

export const LEAD_STAGE_ORDER = ['novo', 'contato', 'proposta', 'ganho', 'perdido'];

export const LEAD_SOURCE_LABELS: Record<string, string> = {
  meta_ads: 'Meta Ads',
  google_ads: 'Google Ads',
  manual: 'Manual',
  webhook: 'Webhook',
  other: 'Outro',
};

export const LEAD_SOURCE_CLASSES: Record<string, string> = {
  meta_ads: 'bg-[#e7effe] text-[#1877f2]',
  google_ads: 'bg-status-warning-bg text-status-warning-fg',
  manual: 'bg-surface-muted text-text-secondary',
  webhook: 'bg-brand-50 text-brand-600',
  other: 'bg-surface-muted text-text-secondary',
};

export const POST_STATUS_LABELS: Record<string, string> = {
  draft: 'Rascunho',
  pending_approval: 'Aguardando aprovação',
  approved: 'Aprovado',
  scheduled: 'Agendado',
  published: 'Publicado',
};

export const POST_STATUS_ORDER = ['draft', 'pending_approval', 'approved', 'scheduled', 'published'];

export const POST_STATUS_CLASSES: Record<string, string> = {
  draft: 'bg-surface-muted text-text-secondary',
  pending_approval: 'bg-status-warning-bg text-status-warning-fg',
  approved: 'bg-[#e7effe] text-[#1877f2]',
  scheduled: 'bg-brand-50 text-brand-600',
  published: 'bg-status-success-bg text-status-success-fg',
};

export const PLATFORM_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  other: 'Outra',
};
