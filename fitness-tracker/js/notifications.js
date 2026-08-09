// Best-effort local reminder for the day's session. Browsers do not allow web
// pages to schedule a wake-up alarm while fully closed without a push server,
// so this only fires while the app/tab is open (foreground or backgrounded) —
// it checks the clock periodically and shows a notification once per day.

import { getSessionForDate } from './schedule.js';
import { isoDate } from './utils.js';

let lastFiredIso = null;
let intervalHandle = null;

export function isSupported() {
  return typeof Notification !== 'undefined';
}

export async function requestPermission() {
  if (!isSupported()) return 'unsupported';
  return Notification.requestPermission();
}

export function permissionState() {
  return isSupported() ? Notification.permission : 'unsupported';
}

async function fire(title, body) {
  if (navigator.serviceWorker) {
    try {
      const reg = await navigator.serviceWorker.ready;
      reg.showNotification(title, { body, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: 'fitness-reminder' });
      return;
    } catch (e) { /* fall through to plain Notification */ }
  }
  new Notification(title, { body });
}

export function startReminderWatcher(getState) {
  if (intervalHandle) return;
  intervalHandle = setInterval(() => {
    const state = getState();
    if (!state.settings.notificationsEnabled) return;
    if (permissionState() !== 'granted') return;
    const now = new Date();
    const iso = isoDate(now);
    if (lastFiredIso === iso) return;
    const [h, m] = state.settings.startTime.split(':').map(Number);
    if (now.getHours() !== h || now.getMinutes() < m || now.getMinutes() > m + 2) return;
    const entry = state.logs[iso];
    if (entry && entry.completed) return;
    const session = getSessionForDate(now, state);
    lastFiredIso = iso;
    fire(`Time to train: ${session.name}`, "Tap to open your fitness tracker and log today's session.");
  }, 30000);
}

export function stopReminderWatcher() {
  if (intervalHandle) clearInterval(intervalHandle);
  intervalHandle = null;
}
