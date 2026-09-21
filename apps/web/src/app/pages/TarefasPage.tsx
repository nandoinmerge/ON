import { useState, useEffect } from 'react';
import { CheckSquare, Calendar } from 'lucide-react';
import { getTasks } from '@services/db/index.js';
import { TASK_STATUS_LABELS, TASK_STATUS_CLASSES, formatDateBR } from '../lib/labels';

export default function TarefasPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const result = await getTasks();
    if (result.error) setError(result.error);
    if (result.data) setTasks(result.data);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card h-16 animate-pulse bg-surface-muted" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="card empty-state">
        <p className="text-status-danger-fg font-medium">Não foi possível carregar as tarefas</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="card empty-state">
        <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center mb-4">
          <CheckSquare size={22} className="text-brand-600" />
        </div>
        <p className="text-text-primary font-medium mb-1">Nenhuma tarefa ainda</p>
        <p className="text-sm">As tarefas de um projeto aparecem aqui.</p>
      </div>
    );
  }

  return (
    <div className="card p-0 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-subtle text-left text-text-secondary">
            <th className="font-medium px-4 py-3">Tarefa</th>
            <th className="font-medium px-4 py-3 hidden sm:table-cell">Projeto</th>
            <th className="font-medium px-4 py-3">Status</th>
            <th className="font-medium px-4 py-3 hidden sm:table-cell">Prazo</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} className="border-b border-border-subtle last:border-0 hover:bg-surface-muted transition-colors">
              <td className="px-4 py-3 text-text-primary">{task.title}</td>
              <td className="px-4 py-3 text-text-secondary hidden sm:table-cell truncate">
                {task.projects?.name ?? '—'}
              </td>
              <td className="px-4 py-3">
                <span className={`badge ${TASK_STATUS_CLASSES[task.status] ?? ''}`}>
                  {TASK_STATUS_LABELS[task.status] ?? task.status}
                </span>
              </td>
              <td className="px-4 py-3 text-text-tertiary hidden sm:table-cell">
                <div className="flex items-center gap-1.5">
                  <Calendar size={12} />
                  {formatDateBR(task.due_date)}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
