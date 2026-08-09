// Google Calendar sync. Client-side only, via Google Identity Services (GIS)
// token flow — no backend. The user supplies their own OAuth Client ID
// (created in their own Google Cloud project) in Settings.

import { DAY_KEYS, DAY_LABELS, addDays, isoDate } from './utils.js';
import { TEMPLATE, korfballSession, durationForSession } from './schedule.js';

const GIS_SRC = 'https://accounts.google.com/gsi/client';
const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events';

let gisLoadPromise = null;
let tokenClient = null;
let accessToken = null;
let tokenExpiresAt = 0;

function loadGis() {
  if (gisLoadPromise) return gisLoadPromise;
  gisLoadPromise = new Promise((resolve, reject) => {
    if (window.google && window.google.accounts && window.google.accounts.oauth2) return resolve();
    const s = document.createElement('script');
    s.src = GIS_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Could not load Google Identity Services — check your internet connection.'));
    document.head.appendChild(s);
  });
  return gisLoadPromise;
}

export function hasValidToken() {
  return !!accessToken && Date.now() < tokenExpiresAt;
}

export async function signIn(clientId, { interactive = true } = {}) {
  if (!clientId) throw new Error('Add your Google OAuth Client ID in Settings first.');
  await loadGis();
  return new Promise((resolve, reject) => {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: CALENDAR_SCOPE,
      callback: (resp) => {
        if (resp.error) {
          reject(new Error(resp.error_description || resp.error));
          return;
        }
        accessToken = resp.access_token;
        tokenExpiresAt = Date.now() + (Number(resp.expires_in) || 3300) * 1000;
        resolve(accessToken);
      },
      error_callback: (err) => reject(new Error(err && err.message ? err.message : 'Google sign-in was cancelled or failed.')),
    });
    tokenClient.requestAccessToken({ prompt: interactive ? 'consent' : '' });
  });
}

export function signOut() {
  if (accessToken && window.google) {
    try { window.google.accounts.oauth2.revoke(accessToken, () => {}); } catch (e) { /* ignore */ }
  }
  accessToken = null;
  tokenExpiresAt = 0;
}

export function isSignedIn() {
  return hasValidToken();
}

async function apiFetch(path, options = {}) {
  if (!hasValidToken()) throw new Error('Not signed in to Google Calendar.');
  const res = await fetch(`https://www.googleapis.com/calendar/v3${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...(options.headers || {}),
    },
  });
  if (res.status === 404) return { notFound: true };
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Google Calendar API error ${res.status}: ${body.slice(0, 200)}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

function nextOccurrence(dayKey, from = new Date()) {
  const targetIdx = DAY_KEYS.indexOf(dayKey);
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  for (let i = 0; i < 7; i++) {
    const cur = addDays(d, i);
    if ((cur.getDay() + 6) % 7 === targetIdx) return cur;
  }
  return d;
}

function pad2(n) { return String(n).padStart(2, '0'); }

function localDateTimeString(date, hh, mm) {
  return `${isoDate(date)}T${pad2(hh)}:${pad2(mm)}:00`;
}

function buildDescription(session) {
  const lines = [];
  const isRunDay = session.dayKey === 'tuesday' || session.dayKey === 'wednesday';
  if (isRunDay && session.type === 'run') {
    // Tue/Wed follow a week-by-week progressive running plan, so the exact
    // prescription changes over time — a single recurring event can't show
    // a different description each week, so point at the app instead.
    lines.push('Follows your progressive half-marathon running plan — open the Fitness Tracker app for today\'s specific run/walk workout.');
  } else if (session.exercises && session.exercises.length) {
    for (const ex of session.exercises) {
      lines.push(`• ${ex.name}: ${ex.targetLabel}`);
    }
  } else if (session.type === 'korfball') {
    lines.push('Korfball training / match.');
  }
  if (isRunDay) {
    lines.push('', 'Short sleep day — keep intensity easy.');
  }
  return lines.join('\n');
}

function sessionForDayKey(dayKey, settings) {
  return settings.korfballDay === dayKey ? korfballSession(dayKey) : TEMPLATE[dayKey];
}

function buildEventBody(dayKey, settings, calendarSettings) {
  const session = sessionForDayKey(dayKey, settings);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [startH, startM] = settings.startTime.split(':').map(Number);
  const durationMin = durationForSession(session, settings);
  const startDate = nextOccurrence(dayKey);
  const startStr = localDateTimeString(startDate, startH, startM);
  const endMinutesTotal = startH * 60 + startM + durationMin;
  const endStr = localDateTimeString(startDate, Math.floor(endMinutesTotal / 60) % 24, endMinutesTotal % 60);

  const recurrence = calendarSettings.indefinite
    ? ['RRULE:FREQ=WEEKLY']
    : [`RRULE:FREQ=WEEKLY;COUNT=${Math.max(1, Number(calendarSettings.weeksToRepeat) || 1)}`];

  return {
    summary: session.name,
    description: buildDescription(session),
    start: { dateTime: startStr, timeZone },
    end: { dateTime: endStr, timeZone },
    recurrence,
  };
}

/**
 * Pushes (or re-syncs) all 7 weekly sessions as recurring events.
 * Existing events (tracked by id in calendarSettings.eventIds) are updated in
 * place rather than duplicated; if one was deleted on the Google side, a
 * fresh event is created and its id recorded.
 */
export async function syncSchedule(settings, calendarSettings, { onProgress } = {}) {
  const results = { eventIds: { ...calendarSettings.eventIds } };
  for (const dayKey of DAY_KEYS) {
    onProgress && onProgress(dayKey);
    const body = buildEventBody(dayKey, settings, calendarSettings);
    const existingId = calendarSettings.eventIds[dayKey];
    let saved = null;
    if (existingId) {
      saved = await apiFetch(`/calendars/primary/events/${existingId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      if (saved && saved.notFound) saved = null;
    }
    if (!saved) {
      saved = await apiFetch('/calendars/primary/events', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    }
    results.eventIds[dayKey] = saved.id;
  }
  results.lastSyncedAt = new Date().toISOString();
  return results;
}

export { DAY_LABELS };
