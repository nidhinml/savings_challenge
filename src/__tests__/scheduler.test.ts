import { describe, it, expect } from 'vitest';
import {
  generateScheduledDates,
  getNextDateForFrequency,
  normalizeStartDate,
  isEntryMissed,
  parseISODate,
} from '../lib/scheduler';

describe('Scheduler and Frequency Logic', () => {
  describe('Daily Frequency', () => {
    it('schedules consecutive calendar days', () => {
      const dates = generateScheduledDates('2026-10-01', 5, 'daily');
      expect(dates).toEqual([
        '2026-10-01',
        '2026-10-02',
        '2026-10-03',
        '2026-10-04',
        '2026-10-05',
      ]);
    });

    it('advances date using getNextDateForFrequency', () => {
      expect(getNextDateForFrequency('2026-10-01', 'daily')).toBe('2026-10-02');
      expect(getNextDateForFrequency('2026-10-09', 'weekdays')).toBe('2026-10-12');
      expect(getNextDateForFrequency('2026-10-01', 'weekly')).toBe('2026-10-08');
    });
  });

  describe('Weekdays Only Frequency', () => {
    it('skips Saturdays and Sundays', () => {
      // 2026-10-09 is a Friday
      // Next day must be Monday 2026-10-12
      const dates = generateScheduledDates('2026-10-09', 3, 'weekdays');
      expect(dates[0]).toBe('2026-10-09'); // Fri
      expect(dates[1]).toBe('2026-10-12'); // Mon
      expect(dates[2]).toBe('2026-10-13'); // Tue

      for (const d of dates) {
        const day = parseISODate(d).getDay();
        expect(day).not.toBe(0); // Sunday
        expect(day).not.toBe(6); // Saturday
      }
    });

    it('advances to Monday if start date is a Saturday or Sunday', () => {
      // 2026-10-10 is a Saturday
      const normalized = normalizeStartDate('2026-10-10', 'weekdays');
      expect(normalized).toBe('2026-10-12'); // Monday
    });
  });

  describe('Weekly Frequency', () => {
    it('schedules entries exactly 7 days apart', () => {
      const dates = generateScheduledDates('2026-10-01', 4, 'weekly');
      expect(dates).toEqual([
        '2026-10-01',
        '2026-10-08',
        '2026-10-15',
        '2026-10-22',
      ]);
    });
  });

  describe('Missed Entry Detection', () => {
    it('identifies pending entries with planned date in past as missed', () => {
      expect(isEntryMissed('2020-01-01', 'pending')).toBe(true);
    });

    it('never flags completed entries as missed', () => {
      expect(isEntryMissed('2020-01-01', 'saved')).toBe(false);
    });

    it('does not flag future entries as missed', () => {
      expect(isEntryMissed('2099-01-01', 'pending')).toBe(false);
    });
  });
});
