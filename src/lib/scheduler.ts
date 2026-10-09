import type { SavingsFrequency } from '../types/challenge';

/**
 * Format a Date object to YYYY-MM-DD local string
 */
export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parse YYYY-MM-DD string into a local Date object (avoids UTC timezone shift)
 */
export function parseISODate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Check if a date falls on a weekend (Saturday = 6, Sunday = 0)
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * Given a start date, finds the first valid date according to the frequency.
 * For weekdays mode, if start date is Saturday or Sunday, moves forward to next Monday.
 */
export function normalizeStartDate(startDateStr: string, frequency: SavingsFrequency): string {
  const date = parseISODate(startDateStr);
  if (frequency === 'weekdays' && isWeekend(date)) {
    while (isWeekend(date)) {
      date.setDate(date.getDate() + 1);
    }
  }
  return formatDateISO(date);
}

/**
 * Returns the next valid date following currentDate according to frequency
 */
export function getNextDateForFrequency(currentDateStr: string, frequency: SavingsFrequency): string {
  const date = parseISODate(currentDateStr);

  switch (frequency) {
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;

    case 'weekdays':
      do {
        date.setDate(date.getDate() + 1);
      } while (isWeekend(date));
      break;

    case 'daily':
    default:
      date.setDate(date.getDate() + 1);
      break;
  }

  return formatDateISO(date);
}

/**
 * Generates an array of scheduled date strings (YYYY-MM-DD) for N entries.
 */
export function generateScheduledDates(
  startDateStr: string,
  count: number,
  frequency: SavingsFrequency
): string[] {
  if (count <= 0) return [];

  const dates: string[] = [];
  let currentDate = normalizeStartDate(startDateStr, frequency);
  dates.push(currentDate);

  for (let i = 1; i < count; i++) {
    currentDate = getNextDateForFrequency(currentDate, frequency);
    dates.push(currentDate);
  }

  return dates;
}

/**
 * Returns today's date formatted as YYYY-MM-DD
 */
export function getTodayDateString(): string {
  return formatDateISO(new Date());
}

/**
 * Checks whether an entry is considered missed (plannedDate in the past and still pending)
 */
export function isEntryMissed(plannedDateStr: string, status: string): boolean {
  if (status === 'saved') return false;
  const today = getTodayDateString();
  return plannedDateStr < today;
}

/**
 * Human friendly date formatting (e.g. "Mon, 12 Oct" or "Tomorrow" or "Today")
 */
export function formatFriendlyDate(dateStr: string): string {
  const today = getTodayDateString();
  if (dateStr === today) return 'Today';

  const d = parseISODate(dateStr);
  const now = parseISODate(today);
  const diffDays = Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';

  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}
