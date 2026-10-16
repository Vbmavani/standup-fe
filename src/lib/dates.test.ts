import { describe, expect, it } from 'vitest';
import { addDays, isDateKey, isOverdue, localToday, parseDateKey, timeAgo, toDateKey, weekStart } from './dates';

describe('date helpers', () => {
  it('localToday uses the local calendar date, not UTC', () => {
    // 23:30 local time on Jan 5 — toISOString() could already be Jan 6 in UTC-negative zones.
    const late = new Date(2026, 0, 5, 23, 30);
    expect(localToday(late)).toBe('2026-01-05');
    const early = new Date(2026, 0, 5, 0, 15);
    expect(localToday(early)).toBe('2026-01-05');
  });

  it('round-trips YYYY-MM-DD keys', () => {
    expect(toDateKey(parseDateKey('2026-03-09'))).toBe('2026-03-09');
  });

  it('addDays crosses month, year and DST boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-07', 2)).toBe('2026-03-09'); // US DST starts Mar 8
    expect(addDays('2026-10-24', 3)).toBe('2026-10-27'); // EU DST ends Oct 25
    expect(addDays('2026-10-16', -7)).toBe('2026-10-09');
  });

  it('weekStart returns the Monday of the week', () => {
    expect(weekStart('2026-10-12')).toBe('2026-10-12'); // Monday
    expect(weekStart('2026-10-16')).toBe('2026-10-12'); // Friday
    expect(weekStart('2026-10-18')).toBe('2026-10-12'); // Sunday belongs to the previous Monday
    expect(weekStart('2026-10-19')).toBe('2026-10-19'); // next Monday
    expect(weekStart('2027-01-01')).toBe('2026-12-28'); // across the year boundary
  });

  it('validates date keys', () => {
    expect(isDateKey('2026-02-28')).toBe(true);
    expect(isDateKey('2026-02-30')).toBe(false);
    expect(isDateKey('2026-2-3')).toBe(false);
    expect(isDateKey(null)).toBe(false);
  });

  it('isOverdue compares against today', () => {
    expect(isOverdue('2026-10-15', '2026-10-16')).toBe(true);
    expect(isOverdue('2026-10-16', '2026-10-16')).toBe(false);
    expect(isOverdue(null, '2026-10-16')).toBe(false);
  });

  it('timeAgo produces short relative times', () => {
    const now = new Date('2026-10-16T12:00:00Z');
    expect(timeAgo('2026-10-16T11:59:50Z', now)).toBe('just now');
    expect(timeAgo('2026-10-16T11:55:00Z', now)).toBe('5m ago');
    expect(timeAgo('2026-10-16T09:00:00Z', now)).toBe('3h ago');
    expect(timeAgo('2026-10-14T12:00:00Z', now)).toBe('2d ago');
  });
});
