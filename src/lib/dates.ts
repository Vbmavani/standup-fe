// All "date" strings are local calendar dates in YYYY-MM-DD form.

const pad = (n: number) => String(n).padStart(2, '0');

export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Parse YYYY-MM-DD as a local date at midnight (not UTC). */
export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function isDateKey(value: string | null | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return toDateKey(parseDateKey(value)) === value;
}

export function localToday(now: Date = new Date()): string {
  return toDateKey(now);
}

export function addDays(key: string, days: number): string {
  const d = parseDateKey(key);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

/** Monday of the week containing `key` (weeks start on Monday). */
export function weekStart(key: string): string {
  const d = parseDateKey(key);
  const offset = (d.getDay() + 6) % 7; // Mon=0 ... Sun=6
  d.setDate(d.getDate() - offset);
  return toDateKey(d);
}

export function compareDateKeys(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** True when a due date is strictly before today (local). */
export function isOverdue(dueDate: string | null, today: string = localToday()): boolean {
  return !!dueDate && dueDate < today;
}

export function formatDateLong(key: string): string {
  return parseDateKey(key).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateShort(key: string, withYear = false): string {
  return parseDateKey(key).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(withYear ? { year: 'numeric' } : {}),
  });
}

export function formatWeekRange(start: string, end: string = addDays(start, 6)): string {
  const s = parseDateKey(start);
  const e = parseDateKey(end);
  const sameYear = s.getFullYear() === e.getFullYear();
  const left = s.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
  const right = e.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  return `${left} – ${right}`;
}

/** Human label relative to today: "Today", "Yesterday", "Tomorrow" or a short date. */
export function relativeDayLabel(key: string, today: string = localToday()): string {
  if (key === today) return 'Today';
  if (key === addDays(today, -1)) return 'Yesterday';
  if (key === addDays(today, 1)) return 'Tomorrow';
  return formatDateShort(key, key.slice(0, 4) !== today.slice(0, 4));
}

/** "just now", "5m ago", "3h ago", "2d ago", or a date for older timestamps. */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const sec = Math.round((now.getTime() - t) / 1000);
  if (sec < 45) return 'just now';
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d ago`;
  const d = new Date(t);
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(d.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}),
  });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
