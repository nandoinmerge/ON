import { useState, useEffect } from 'react';
import { Building2, Mail, User } from 'lucide-react';
import { getClients } from '@services/db/index.js';
import {
  CLIENT_STATUS_LABELS,
  CLIENT_HEALTH_LABELS,
  CLIENT_HEALTH_CLASSES,
} from '../lib/labels';

export default function ClientesPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const result = await getClients();
    if (result.error) setError(result.error);
    if (result.data) setClients(result.data);
    setLoading(false);
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

  if (error) {
    return (
      <div className="card empty-state">
        <p className="text-status-danger-fg font-medium">Não foi possível carregar os clientes</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="card empty-state">
        <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center mb-4">
          <Building2 size={22} className="text-brand-600" />
        </div>
        <p className="text-text-primary font-medium mb-1">Nenhum cliente ainda</p>
        <p className="text-sm">Cadastre o primeiro cliente para começar a organizar projetos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-text-secondary text-sm">{clients.length} cliente(s)</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map((client) => (
          <div key={client.id} className="card-hover">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                <Building2 size={18} className="text-brand-600" />
              </div>
              <span
                className={`badge ${CLIENT_HEALTH_CLASSES[client.health] ?? 'bg-surface-muted text-text-secondary'}`}
              >
                {CLIENT_HEALTH_LABELS[client.health] ?? client.health}
              </span>
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

            <div className="mt-3">
              <span className="text-caption text-text-tertiary">
                {CLIENT_STATUS_LABELS[client.status] ?? client.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
