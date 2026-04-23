/**
 * alarmUtils.test.js — Unit tests for pure alarm utility functions
 */

import {
  convert12to24,
  convert24to12,
  doesAlarmMatchNow,
  shouldFireToday,
  calculateSleepDuration,
  calculateWeeklyAverage,
} from '../../src/utils/alarmUtils';

// ─── convert12to24 ────────────────────────────────────────────────────────────
describe('convert12to24()', () => {
  test('converts 12:00 AM to 00:00', () => {
    expect(convert12to24('12:00 AM')).toBe('00:00');
  });

  test('converts 12:00 PM to 12:00', () => {
    expect(convert12to24('12:00 PM')).toBe('12:00');
  });

  test('converts 2:30 PM to 14:30', () => {
    expect(convert12to24('2:30 PM')).toBe('14:30');
  });

  test('converts 6:05 AM to 06:05', () => {
    expect(convert12to24('6:05 AM')).toBe('06:05');
  });

  test('converts 11:59 PM to 23:59', () => {
    expect(convert12to24('11:59 PM')).toBe('23:59');
  });

  test('returns original string if already 24hr or invalid', () => {
    expect(convert12to24('14:30')).toBe('14:30');
  });
});

// ─── convert24to12 ────────────────────────────────────────────────────────────
describe('convert24to12()', () => {
  test('converts 00:00 to 12:00 AM', () => {
    expect(convert24to12('00:00')).toBe('12:00 AM');
  });

  test('converts 12:00 to 12:00 PM', () => {
    expect(convert24to12('12:00')).toBe('12:00 PM');
  });

  test('converts 14:30 to 2:30 PM', () => {
    expect(convert24to12('14:30')).toBe('2:30 PM');
  });

  test('converts 06:05 to 6:05 AM', () => {
    expect(convert24to12('06:05')).toBe('6:05 AM');
  });

  test('converts 23:59 to 11:59 PM', () => {
    expect(convert24to12('23:59')).toBe('11:59 PM');
  });
});

// ─── doesAlarmMatchNow ───────────────────────────────────────────────────────
describe('doesAlarmMatchNow()', () => {
  test('returns true when alarm time matches current time exactly', () => {
    const fakeNow = new Date('2025-04-23T07:30:00');
    expect(doesAlarmMatchNow('07:30', fakeNow)).toBe(true);
  });

  test('returns false when alarm time does not match', () => {
    const fakeNow = new Date('2025-04-23T07:31:00');
    expect(doesAlarmMatchNow('07:30', fakeNow)).toBe(false);
  });

  test('returns false when hours match but minutes differ', () => {
    const fakeNow = new Date('2025-04-23T07:00:00');
    expect(doesAlarmMatchNow('07:30', fakeNow)).toBe(false);
  });

  test('handles midnight (00:00) correctly', () => {
    const fakeNow = new Date('2025-04-23T00:00:00');
    expect(doesAlarmMatchNow('00:00', fakeNow)).toBe(true);
  });

  test('handles seconds not affecting match (only HH:mm compared)', () => {
    const fakeNow = new Date('2025-04-23T07:30:59');
    expect(doesAlarmMatchNow('07:30', fakeNow)).toBe(true);
  });
});

// ─── shouldFireToday ─────────────────────────────────────────────────────────
describe('shouldFireToday()', () => {
  // Wednesday = day index 3
  const wednesday = new Date('2025-04-23T07:30:00'); // April 23, 2025 is a Wednesday

  test('returns true for one-time alarm (empty repeatDays)', () => {
    expect(shouldFireToday('', wednesday)).toBe(true);
  });

  test('returns true when today is in repeatDays', () => {
    expect(shouldFireToday('Monday,Wednesday,Friday', wednesday)).toBe(true);
  });

  test('returns false when today is NOT in repeatDays', () => {
    expect(shouldFireToday('Monday,Tuesday,Thursday', wednesday)).toBe(false);
  });

  test('returns true for weekdays only (Mon–Fri), fires on Wednesday', () => {
    expect(shouldFireToday('Monday,Tuesday,Wednesday,Thursday,Friday', wednesday)).toBe(true);
  });

  test('returns false for weekends only on Wednesday', () => {
    expect(shouldFireToday('Saturday,Sunday', wednesday)).toBe(false);
  });

  test('is case-insensitive', () => {
    expect(shouldFireToday('WEDNESDAY,friday', wednesday)).toBe(true);
  });
});

// ─── calculateSleepDuration ──────────────────────────────────────────────────
describe('calculateSleepDuration()', () => {
  test('calculates 8 hours correctly', () => {
    const start = new Date('2025-04-23T22:00:00').getTime();
    const wake = new Date('2025-04-24T06:00:00').getTime();
    expect(calculateSleepDuration(start, wake)).toBe(8.0);
  });

  test('calculates 7.5 hours correctly', () => {
    const start = new Date('2025-04-23T23:00:00').getTime();
    const wake = new Date('2025-04-24T06:30:00').getTime();
    expect(calculateSleepDuration(start, wake)).toBe(7.5);
  });

  test('handles sleep crossing midnight', () => {
    const start = new Date('2025-04-23T23:30:00').getTime();
    const wake = new Date('2025-04-24T07:00:00').getTime();
    expect(calculateSleepDuration(start, wake)).toBe(7.5);
  });

  test('returns 0 when wake time is before bed time', () => {
    const start = new Date('2025-04-24T08:00:00').getTime();
    const wake = new Date('2025-04-24T06:00:00').getTime();
    expect(calculateSleepDuration(start, wake)).toBe(0);
  });
});

// ─── calculateWeeklyAverage ───────────────────────────────────────────────────
describe('calculateWeeklyAverage()', () => {
  test('calculates average of 7 nights correctly', () => {
    const durations = [6, 7, 8, 7.5, 6.5, 8, 7];
    const avg = calculateWeeklyAverage(durations);
    expect(avg).toBe(7.1);
  });

  test('returns 0 for empty array', () => {
    expect(calculateWeeklyAverage([])).toBe(0);
  });

  test('returns the single value for array of one', () => {
    expect(calculateWeeklyAverage([8])).toBe(8.0);
  });

  test('handles all zeros', () => {
    expect(calculateWeeklyAverage([0, 0, 0])).toBe(0);
  });
});
