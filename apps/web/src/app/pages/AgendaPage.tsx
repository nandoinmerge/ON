import { useState, useEffect, useMemo } from 'react';
import { CalendarDays, Plus, Video, ChevronLeft, ChevronRight, LogOut, RefreshCw } from 'lucide-react';
import {
  getStoredAccessToken,
  clearAccessToken,
  requestCalendarAccessToken,
  listEventsInRange,
  createCalendarEvent,
} from '@services/calendar/index.js';
import Modal from '../components/Modal';

const START_HOUR = 7;
const END_HOUR = 21; // exclusivo — grade vai até 21h
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
const ROW_HEIGHT = 52; // px por hora

const WEEKDAY_LABELS = ['Dom.', 'Seg.', 'Ter.', 'Qua.', 'Qui.', 'Sex.', 'Sáb.'];

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

function eventTopHeight(event: any, day: Date) {
  const start = new Date(event.start?.dateTime ?? `${event.start?.date}T${START_HOUR}:00:00`);
  const end = new Date(event.end?.dateTime ?? `${event.end?.date}T${START_HOUR}:30:00`);

  const dayStart = new Date(day);
  dayStart.setHours(START_HOUR, 0, 0, 0);
  const dayEnd = new Date(day);
  dayEnd.setHours(END_HOUR, 0, 0, 0);

  const clampedStart = start < dayStart ? dayStart : start;
  const clampedEnd = end > dayEnd ? dayEnd : end;

  const startFraction = (clampedStart.getTime() - dayStart.getTime()) / (1000 * 60 * 60);
  const durationHours = Math.max((clampedEnd.getTime() - clampedStart.getTime()) / (1000 * 60 * 60), 0.4);

  return { top: startFraction * ROW_HEIGHT, height: durationHours * ROW_HEIGHT };
}

function formatHour(hour: number): string {
  return `${hour}:00`;
}

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function toTimeInputValue(date: Date): string {
  return date.toTimeString().slice(0, 5);
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
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [viewingEvent, setViewingEvent] = useState<any>(null);

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const today = new Date();

  useEffect(() => {
    const token = getStoredAccessToken();
    setConnected(!!token);
  }, []);

  useEffect(() => {
    if (connected) loadEvents();
  }, [connected, weekStart]);

  async function loadEvents() {
    const token = getStoredAccessToken();
    if (!token) {
      setConnected(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const items = await listEventsInRange(token, weekStart.toISOString(), addDays(weekStart, 7).toISOString());
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
      await requestCalendarAccessToken();
      setConnected(true);
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

  function openCreateModal(prefillDate?: Date, prefillHour?: number) {
    const base = prefillDate ? new Date(prefillDate) : new Date();
    if (prefillHour != null) base.setHours(prefillHour, 0, 0, 0);
    setForm({ ...EMPTY_FORM, date: toDateInputValue(base), time: toTimeInputValue(base) });
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
      loadEvents();
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
          Veja sua semana e agende reuniões com link do Meet automático, direto por aqui.
        </p>
        {error && <p className="text-xs text-status-danger-fg mb-3">{error}</p>}
        <button onClick={handleConnect} disabled={connecting} className="btn-primary disabled:opacity-50">
          {connecting ? 'Conectando...' : 'Conectar Google Calendar'}
        </button>
      </div>
    );
  }

  const monthLabel = weekStart.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekStart(startOfWeek(new Date()))} className="btn-secondary text-sm">
            Hoje
          </button>
          <button
            onClick={() => setWeekStart((d) => addDays(d, -7))}
            className="p-2 rounded-lg hover:bg-surface-muted text-text-secondary"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setWeekStart((d) => addDays(d, 7))}
            className="p-2 rounded-lg hover:bg-surface-muted text-text-secondary"
          >
            <ChevronRight size={16} />
          </button>
          <p className="text-text-primary font-medium capitalize ml-1">{monthLabel}</p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={loadEvents} className="p-2 rounded-lg hover:bg-surface-muted text-text-secondary" title="Atualizar">
            <RefreshCw size={15} />
          </button>
          <button onClick={() => openCreateModal()} className="btn-primary inline-flex items-center gap-2">
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

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[720px]">
            <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-border-subtle">
              <div />
              {weekDays.map((day) => {
                const isToday = isSameDay(day, today);
                return (
                  <div key={day.toISOString()} className="text-center py-2.5 border-l border-border-subtle">
                    <p className="text-[11px] uppercase tracking-wide text-text-tertiary">
                      {WEEKDAY_LABELS[day.getDay()]}
                    </p>
                    <p
                      className={`text-sm font-semibold mt-0.5 inline-flex items-center justify-center w-7 h-7 rounded-full ${
                        isToday ? 'bg-brand-600 text-white' : 'text-text-primary'
                      }`}
                    >
                      {day.getDate()}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="relative grid grid-cols-[56px_repeat(7,1fr)]">
              <div>
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    style={{ height: ROW_HEIGHT }}
                    className="text-right pr-2 -mt-2 text-[11px] text-text-tertiary"
                  >
                    {formatHour(hour)}
                  </div>
                ))}
              </div>

              {weekDays.map((day) => {
                const dayEvents = events.filter((ev) => {
                  const start = new Date(ev.start?.dateTime ?? ev.start?.date);
                  return isSameDay(start, day);
                });
                return (
                  <div key={day.toISOString()} className="relative border-l border-border-subtle">
                    {HOURS.map((hour) => (
                      <div
                        key={hour}
                        style={{ height: ROW_HEIGHT }}
                        onClick={() => openCreateModal(day, hour)}
                        className="border-b border-border-subtle/60 hover:bg-brand-50/40 cursor-pointer transition-colors"
                      />
                    ))}

                    {dayEvents.map((event) => {
                      const { top, height } = eventTopHeight(event, day);
                      return (
                        <button
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingEvent(event);
                          }}
                          style={{ top, height, position: 'absolute', left: 3, right: 3 }}
                          className="rounded-md bg-brand-600 text-white text-left px-1.5 py-1 overflow-hidden hover:bg-brand-700 transition-colors"
                        >
                          <p className="text-[11px] font-medium leading-tight truncate">
                            {event.summary || '(sem título)'}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {loading && <p className="text-xs text-text-tertiary">Atualizando...</p>}

      <Modal open={!!viewingEvent} onClose={() => setViewingEvent(null)} title={viewingEvent?.summary || 'Evento'}>
        {viewingEvent && (
          <div className="space-y-3">
            <p className="text-sm text-text-secondary">
              {new Date(viewingEvent.start?.dateTime ?? viewingEvent.start?.date).toLocaleString('pt-BR', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                hour: viewingEvent.start?.dateTime ? '2-digit' : undefined,
                minute: viewingEvent.start?.dateTime ? '2-digit' : undefined,
              })}
            </p>
            {viewingEvent.description && <p className="text-sm text-text-primary">{viewingEvent.description}</p>}
            {viewingEvent.hangoutLink && (
              <a
                href={viewingEvent.hangoutLink}
                target="_blank"
                rel="noreferrer"
                className="btn-primary inline-flex items-center gap-2 text-sm"
              >
                <Video size={14} />
                Entrar no Meet
              </a>
            )}
          </div>
        )}
      </Modal>

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
