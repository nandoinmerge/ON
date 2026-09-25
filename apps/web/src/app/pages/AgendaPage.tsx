import { useState, useEffect } from 'react';
import { CalendarDays, Plus, Video, Clock, LogOut, RefreshCw } from 'lucide-react';
import {
  getStoredAccessToken,
  clearAccessToken,
  requestCalendarAccessToken,
  listUpcomingEvents,
  createCalendarEvent,
} from '@services/calendar/index.js';
import Modal from '../components/Modal';

function formatEventTime(event: any): string {
  const start = event.start?.dateTime || event.start?.date;
  if (!start) return '';
  const date = new Date(start);
  if (event.start?.date && !event.start?.dateTime) {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) + ' · dia todo';
  }
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const EMPTY_FORM = {
  summary: '',
  date: '',
  time: '',
  durationMinutes: '30',
  attendeeEmail: '',
  description: '',
};

export default function AgendaPage() {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const token = getStoredAccessToken();
    if (token) {
      setConnected(true);
      loadEvents(token);
    }
  }, []);

  async function loadEvents(token: string) {
    setLoading(true);
    setError('');
    try {
      const items = await listUpcomingEvents(token);
      setEvents(items);
    } catch (err: any) {
      setError(err.message);
      setConnected(false);
    }
    setLoading(false);
  }

  async function handleConnect() {
    setConnecting(true);
    setError('');
    try {
      const token = await requestCalendarAccessToken();
      setConnected(true);
      await loadEvents(token);
    } catch (err: any) {
      setError(err.message);
    }
    setConnecting(false);
  }

  function handleDisconnect() {
    clearAccessToken();
    setConnected(false);
    setEvents([]);
  }

  function openCreateModal() {
    const now = new Date();
    const in1h = new Date(now.getTime() + 60 * 60 * 1000);
    setForm({
      ...EMPTY_FORM,
      date: in1h.toISOString().slice(0, 10),
      time: in1h.toTimeString().slice(0, 5),
    });
    setFormError('');
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    if (!form.summary.trim()) {
      setFormError('Dê um título para o evento');
      return;
    }
    if (!form.date || !form.time) {
      setFormError('Escolha data e horário');
      return;
    }

    const token = getStoredAccessToken();
    if (!token) {
      setFormError('Conecte o Google Calendar primeiro');
      return;
    }

    setSaving(true);
    try {
      const start = new Date(`${form.date}T${form.time}:00`);
      const end = new Date(start.getTime() + Number(form.durationMinutes) * 60 * 1000);
      await createCalendarEvent(token, {
        summary: form.summary,
        description: form.description || undefined,
        startISO: start.toISOString(),
        endISO: end.toISOString(),
        attendeeEmail: form.attendeeEmail || null,
      });
      setModalOpen(false);
      loadEvents(token);
    } catch (err: any) {
      setFormError(err.message);
    }
    setSaving(false);
  }

  if (!connected) {
    return (
      <div className="card empty-state">
        <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center mb-4">
          <CalendarDays size={22} className="text-brand-600" />
        </div>
        <p className="text-text-primary font-medium mb-1">Conecte seu Google Calendar</p>
        <p className="text-sm mb-4">
          Veja seus próximos compromissos e agende reuniões com criação automática de link do Meet, direto
          por aqui.
        </p>
        {error && <p className="text-xs text-status-danger-fg mb-3">{error}</p>}
        <button onClick={handleConnect} disabled={connecting} className="btn-primary disabled:opacity-50">
          {connecting ? 'Conectando...' : 'Conectar Google Calendar'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-text-secondary text-sm">Próximos compromissos</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadEvents(getStoredAccessToken()!)}
            className="p-2 rounded-lg hover:bg-surface-muted text-text-secondary"
            title="Atualizar"
          >
            <RefreshCw size={15} />
          </button>
          <button onClick={openCreateModal} className="btn-primary inline-flex items-center gap-2">
            <Plus size={16} />
            Novo evento
          </button>
          <button
            onClick={handleDisconnect}
            className="p-2 rounded-lg hover:bg-status-danger-bg hover:text-status-danger-fg text-text-secondary"
            title="Desconectar"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>

      {error && (
        <div className="card empty-state">
          <p className="text-status-danger-fg font-medium">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card h-16 animate-pulse bg-surface-muted" />
          ))}
        </div>
      ) : events.length === 0 && !error ? (
        <div className="card empty-state">
          <p className="text-text-primary font-medium mb-1">Nenhum compromisso próximo</p>
          <p className="text-sm">Sua agenda está livre por enquanto.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <div key={event.id} className="card flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {event.summary || '(sem título)'}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-text-tertiary mt-0.5">
                  <Clock size={12} />
                  {formatEventTime(event)}
                </div>
              </div>
              {event.hangoutLink && (
                <a
                  href={event.hangoutLink}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary text-xs inline-flex items-center gap-1.5 shrink-0"
                >
                  <Video size={13} />
                  Entrar
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo evento">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-caption font-medium mb-1.5">Título *</label>
            <input
              type="text"
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              className="input-text"
              placeholder="Reunião com..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-caption font-medium mb-1.5">Data *</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="input-text"
                required
              />
            </div>
            <div>
              <label className="block text-caption font-medium mb-1.5">Horário *</label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="input-text"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-caption font-medium mb-1.5">Duração</label>
            <select
              value={form.durationMinutes}
              onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
              className="input-text"
            >
              <option value="15">15 minutos</option>
              <option value="30">30 minutos</option>
              <option value="60">1 hora</option>
              <option value="90">1h30</option>
            </select>
          </div>

          <div>
            <label className="block text-caption font-medium mb-1.5">Convidado (e-mail)</label>
            <input
              type="email"
              value={form.attendeeEmail}
              onChange={(e) => setForm({ ...form, attendeeEmail: e.target.value })}
              className="input-text"
              placeholder="opcional"
            />
          </div>

          <div>
            <label className="block text-caption font-medium mb-1.5">Descrição</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input-text"
              rows={2}
            />
          </div>

          <p className="text-xs text-text-tertiary">Um link do Google Meet é criado automaticamente.</p>

          {formError && (
            <div className="p-3 bg-status-danger-bg text-status-danger-fg rounded-lg text-sm">{formError}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
              {saving ? 'Criando...' : 'Criar evento'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
