/**
 * Integração com Google Calendar direto do navegador, usando o Google
 * Identity Services (GIS). Não precisa de client secret nem de backend:
 * cada pessoa autoriza o próprio calendário com um clique, e o token fica
 * só na sessão do navegador dela (não é salvo no nosso banco).
 *
 * Exige a variável de ambiente VITE_GOOGLE_CLIENT_ID (Netlify), criada no
 * Google Cloud Console.
 */

declare global {
  interface Window {
    google?: any;
  }
}

const CALENDAR_SCOPES =
  'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly';

const SESSION_KEY = 'on_digital_google_calendar_token';

let gsiScriptPromise: Promise<void> | null = null;

function loadGoogleIdentityScript(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (gsiScriptPromise) return gsiScriptPromise;

  gsiScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Não foi possível carregar o Google Identity Services'));
    document.head.appendChild(script);
  });

  return gsiScriptPromise;
}

export function getStoredAccessToken(): string | null {
  return sessionStorage.getItem(SESSION_KEY);
}

export function clearAccessToken(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

/**
 * Abre o popup de autorização do Google e devolve um access token válido
 * por ~1 hora, guardado na sessão do navegador (some ao fechar a aba).
 */
export function requestCalendarAccessToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      reject(new Error('Integração com Google Calendar ainda não configurada (falta VITE_GOOGLE_CLIENT_ID).'));
      return;
    }

    loadGoogleIdentityScript()
      .then(() => {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: CALENDAR_SCOPES,
          callback: (response: any) => {
            if (response.error) {
              reject(new Error('Autorização recusada ou cancelada.'));
              return;
            }
            sessionStorage.setItem(SESSION_KEY, response.access_token);
            resolve(response.access_token);
          },
        });
        tokenClient.requestAccessToken();
      })
      .catch(reject);
  });
}

export async function listUpcomingEvents(accessToken: string, maxResults = 15) {
  const timeMin = new Date().toISOString();
  const params = new URLSearchParams({
    timeMin,
    maxResults: String(maxResults),
    singleEvents: 'true',
    orderBy: 'startTime',
  });
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (res.status === 401) {
    clearAccessToken();
    throw new Error('Sessão do Google expirou, conecte de novo.');
  }
  if (!res.ok) throw new Error('Falha ao buscar eventos do Google Calendar.');
  const data = await res.json();
  return data.items || [];
}

export async function createCalendarEvent(
  accessToken: string,
  event: { summary: string; description?: string; startISO: string; endISO: string; attendeeEmail?: string | null }
) {
  const body: Record<string, any> = {
    summary: event.summary,
    description: event.description || undefined,
    start: { dateTime: event.startISO },
    end: { dateTime: event.endISO },
    conferenceData: {
      createRequest: {
        requestId: crypto.randomUUID(),
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
  };
  if (event.attendeeEmail) body.attendees = [{ email: event.attendeeEmail }];

  const res = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );
  if (res.status === 401) {
    clearAccessToken();
    throw new Error('Sessão do Google expirou, conecte de novo.');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Falha ao criar evento no Google Calendar.');
  }
  return res.json();
}
