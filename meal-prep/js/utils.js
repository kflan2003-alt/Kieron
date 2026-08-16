// Date, money and small DOM helpers shared across modules.

export const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
export const DAY_LABELS = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday',
  friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
};
export const DAY_SHORT = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu',
  friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
};

export const SLOT_KEYS = ['breakfast', 'lunch', 'dinner', 'snack', 'snack2'];
export const SLOT_LABELS = {
  breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner',
  snack: 'Snack', snack2: 'Second snack',
};
// Icon names from the sprite in js/icons.js, not emoji: emoji can't take the
// theme's colour and render differently on every phone.
export const SLOT_ICONS = {
  breakfast: 'sunrise', lunch: 'sandwich', dinner: 'utensils-crossed',
  snack: 'apple', snack2: 'cookie',
};

// Both snack slots eat from the same pool of snack recipes.
export function baseSlot(slot) {
  return slot === 'snack2' ? 'snack' : slot;
}

// JS getDay(): 0=Sun..6=Sat. Our week starts Monday.
export function dayKeyFor(date) {
  return DAY_KEYS[(date.getDay() + 6) % 7];
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

export function stripTime(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
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

export function formatWeekRange(weekStart) {
  const end = addDays(weekStart, 6);
  const sameMonth = weekStart.getMonth() === end.getMonth();
  const startStr = weekStart.toLocaleDateString(undefined, { day: 'numeric', month: sameMonth ? undefined : 'short' });
  const endStr = end.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  return `${startStr} – ${endStr}`;
}

// £4.5 -> "£4.50", £0.4 -> "£0.40". Keeps pence honest; the whole app is
// arithmetic on prices so rounding only ever happens at display time.
export function money(n) {
  const v = Number.isFinite(n) ? n : 0;
  return `£${v.toFixed(2)}`;
}

// The same number set the way a shelf-edge ticket sets it: small raised sign,
// big pounds, small pence. Used wherever a price is the point rather than an
// aside — the headline total, the running total, the money you're deciding on.
export function moneyTicket(n, cls = '') {
  const v = Number.isFinite(n) ? n : 0;
  const [pounds, pence] = Math.abs(v).toFixed(2).split('.');
  const sign = v < 0 ? '-' : '';
  return `<span class="ticket ${cls}"><span class="cur">£</span>${sign}${pounds}<span class="pence">.${pence}</span></span>`;
}

// Quantities read better without trailing noise: 87.5g -> "88g", 0.5 -> "½".
export function qty(n, unit) {
  if (unit === 'unit') {
    const rounded = Math.round(n * 100) / 100;
    if (Math.abs(rounded - 0.5) < 0.01) return '½';
    if (Math.abs(rounded - 0.25) < 0.01) return '¼';
    return String(rounded % 1 === 0 ? rounded : rounded.toFixed(2).replace(/0$/, ''));
  }
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 2)}${unit === 'ml' ? 'L' : 'kg'}`;
  return `${Math.round(n)}${unit}`;
}

export function unitNoun(ing, amount) {
  if (ing.unit !== 'unit') return '';
  const n = ing.unitNoun || 'x';
  return amount === 1 ? n : `${n}s`;
}

// "750g" for weighed things, "7 bananas" for things sold by the item.
export function amountLabel(ing, amount) {
  if (!ing) return '';
  if (ing.unit === 'unit') return `${qty(amount, 'unit')} ${unitNoun(ing, amount)}`.trim();
  return qty(amount, ing.unit);
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

// Deterministic shuffle so "regenerate" gives a different plan each tap but the
// same plan if you reopen the app without regenerating.
export function seededShuffle(arr, seed) {
  const out = arr.slice();
  let s = seed || 1;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) % 2147483648;
    const j = Math.abs(s) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
