// Date, formatting and small DOM helpers shared across modules.

export const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
export const DAY_LABELS = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday',
  friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
};
export const DAY_SHORT = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu',
  friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
};

// JS getDay(): 0=Sun..6=Sat. Our week starts Monday.
export function dayKeyFor(date) {
  const idx = date.getDay();
  return DAY_KEYS[(idx + 6) % 7];
}

export function isoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseIsoDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function startOfWeek(date) {
  const idx = (date.getDay() + 6) % 7; // 0=Mon
  return addDays(stripTime(date), -idx);
}

export function stripTime(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function isSameDay(a, b) {
  return isoDate(a) === isoDate(b);
}

export function formatDayLabel(date) {
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function formatWeekRange(weekStart) {
  const end = addDays(weekStart, 6);
  const sameMonth = weekStart.getMonth() === end.getMonth();
  const startStr = weekStart.toLocaleDateString(undefined, { day: 'numeric', month: sameMonth ? undefined : 'short' });
  const endStr = end.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  return `${startStr} – ${endStr}`;
}

export function formatDateLong(date) {
  return date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
}

export function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function qs(sel, root = document) {
  return root.querySelector(sel);
}

export function qsa(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}
