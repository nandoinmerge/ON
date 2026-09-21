import { useState, useEffect } from 'react';
import { Wallet, TrendingUp, AlertCircle } from 'lucide-react';
import { getBillingItems } from '@services/db/index.js';
import { BILLING_STATUS_LABELS, BILLING_STATUS_CLASSES, formatCurrencyBRL, formatDateBR } from '../lib/labels';

export default function FinanceiroPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const result = await getBillingItems();
    if (result.error) setError(result.error);
    if (result.data) setItems(result.data);
    setLoading(false);
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

  if (items.length === 0) {
    return (
      <div className="card empty-state">
        <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center mb-4">
          <Wallet size={22} className="text-brand-600" />
        </div>
        <p className="text-text-primary font-medium mb-1">Nenhum item financeiro ainda</p>
        <p className="text-sm">Cobranças de clientes aparecem aqui.</p>
      </div>
    );
  }

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

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-text-secondary">
              <th className="font-medium px-4 py-3">Descrição</th>
              <th className="font-medium px-4 py-3 hidden sm:table-cell">Cliente</th>
              <th className="font-medium px-4 py-3">Valor</th>
              <th className="font-medium px-4 py-3">Status</th>
              <th className="font-medium px-4 py-3 hidden sm:table-cell">Vencimento</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-border-subtle last:border-0 hover:bg-surface-muted transition-colors">
                <td className="px-4 py-3 text-text-primary">{item.description}</td>
                <td className="px-4 py-3 text-text-secondary hidden sm:table-cell truncate">
                  {item.clients?.name ?? '—'}
                </td>
                <td className="px-4 py-3 text-text-primary font-medium">{formatCurrencyBRL(Number(item.amount))}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${BILLING_STATUS_CLASSES[item.status] ?? ''}`}>
                    {BILLING_STATUS_LABELS[item.status] ?? item.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-text-tertiary hidden sm:table-cell">
                  {formatDateBR(item.due_date)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
