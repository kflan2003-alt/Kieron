// Deterministic expiry-urgency logic. This is plain date arithmetic —
// it must never depend on the language model. AI is only ever used to
// *read* a date off a photo; once a date exists, urgency is computed here.

export type ExpiryUrgency =
  | 'expired'
  | 'today'
  | 'tomorrow'
  | 'within3'
  | 'within7'
  | 'longlife';

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Days between now and an expiry date. Negative means already past. */
export function daysUntil(expiryDate: string | null, now: Date = new Date()): number | null {
  if (!expiryDate) return null;
  const target = startOfDay(new Date(expiryDate));
  const today = startOfDay(now);
  return Math.round((target.getTime() - today.getTime()) / DAY_MS);
}

export function getExpiryUrgency(
  expiryDate: string | null,
  now: Date = new Date(),
): ExpiryUrgency {
  if (!expiryDate) return 'longlife';
  const days = daysUntil(expiryDate, now);
  if (days === null) return 'longlife';
  if (days < 0) return 'expired';
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days <= 3) return 'within3';
  if (days <= 7) return 'within7';
  return 'longlife';
}

export function urgencyRank(urgency: ExpiryUrgency): number {
  const order: ExpiryUrgency[] = ['expired', 'today', 'tomorrow', 'within3', 'within7', 'longlife'];
  return order.indexOf(urgency);
}

export function formatExpiryLabel(expiryDate: string | null, now: Date = new Date()): string {
  const urgency = getExpiryUrgency(expiryDate, now);
  const days = daysUntil(expiryDate, now);
  switch (urgency) {
    case 'expired':
      return days === -1 ? 'Expired yesterday' : `Expired ${Math.abs(days ?? 0)} days ago`;
    case 'today':
      return 'Today';
    case 'tomorrow':
      return 'Tomorrow';
    case 'within3':
      return `${days} days`;
    case 'within7':
      return `${days} days`;
    case 'longlife':
      return expiryDate ? formatDate(expiryDate) : 'Long life';
  }
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
