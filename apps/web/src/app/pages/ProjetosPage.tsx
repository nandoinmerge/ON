import { useState, useEffect } from 'react';
import { FolderKanban, Calendar } from 'lucide-react';
import { getProjects } from '@services/db/index.js';
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_ORDER,
  PRIORITY_LABELS,
  PRIORITY_CLASSES,
  formatDateBR,
} from '../lib/labels';

export default function ProjetosPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const result = await getProjects();
    if (result.error) setError(result.error);
    if (result.data) setProjects(result.data);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card h-64 animate-pulse bg-surface-muted" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="card empty-state">
        <p className="text-status-danger-fg font-medium">Não foi possível carregar os projetos</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="card empty-state">
        <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center mb-4">
          <FolderKanban size={22} className="text-brand-600" />
        </div>
        <p className="text-text-primary font-medium mb-1">Nenhum projeto ainda</p>
        <p className="text-sm">Crie um projeto vinculado a um cliente para começar.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
      {PROJECT_STATUS_ORDER.map((statusKey) => {
        const columnProjects = projects.filter((p) => p.status === statusKey);
        return (
          <div key={statusKey} className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-caption font-semibold text-text-secondary uppercase tracking-wide">
                {PROJECT_STATUS_LABELS[statusKey]}
              </h3>
              <span className="text-xs text-text-tertiary bg-surface-muted rounded-full px-2 py-0.5">
                {columnProjects.length}
              </span>
            </div>

            <div className="space-y-3">
              {columnProjects.map((project) => (
                <div key={project.id} className="card p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-medium text-text-primary text-sm leading-snug">
                      {project.name}
                    </h4>
                    <span
                      className={`badge shrink-0 ${PRIORITY_CLASSES[project.priority] ?? 'bg-surface-muted text-text-secondary'}`}
                    >
                      {PRIORITY_LABELS[project.priority] ?? project.priority}
                    </span>
                  </div>

                  <p className="text-xs text-text-secondary truncate mb-3">
                    {project.clients?.name ?? 'Sem cliente'}
                  </p>

                  {project.due_date && (
                    <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
                      <Calendar size={12} />
                      {formatDateBR(project.due_date)}
                    </div>
                  )}
                </div>
              ))}

              {columnProjects.length === 0 && (
                <div className="border border-dashed border-border-subtle rounded-2xl p-4 text-center text-xs text-text-tertiary">
                  Nenhum projeto
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
