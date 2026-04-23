/**
 * sleepStats.test.js — Unit tests for sleep-related calculations
 */

import {
  calculateSleepDuration,
  calculateWeeklyAverage,
} from '../../src/utils/alarmUtils';

// We also test the getSleepStats logic by simulating what StorageService does

// ─── Sleep Duration Calculation ───────────────────────────────────────────────
describe('Sleep duration calculation', () => {
  test('8 hours of sleep (10pm to 6am)', () => {
    const bedtime = new Date('2025-04-23T22:00:00').getTime();
    const wakeTime = new Date('2025-04-24T06:00:00').getTime();
    expect(calculateSleepDuration(bedtime, wakeTime)).toBe(8.0);
  });

  test('7.5 hours of sleep (11pm to 6:30am)', () => {
    const bedtime = new Date('2025-04-23T23:00:00').getTime();
    const wakeTime = new Date('2025-04-24T06:30:00').getTime();
    expect(calculateSleepDuration(bedtime, wakeTime)).toBe(7.5);
  });

  test('sleep crossing midnight — 11:30pm to 7am = 7.5 hrs', () => {
    const bedtime = new Date('2025-04-23T23:30:00').getTime();
    const wakeTime = new Date('2025-04-24T07:00:00').getTime();
    expect(calculateSleepDuration(bedtime, wakeTime)).toBe(7.5);
  });

  test('very short sleep — 2 hours', () => {
    const bedtime = new Date('2025-04-24T03:00:00').getTime();
    const wakeTime = new Date('2025-04-24T05:00:00').getTime();
    expect(calculateSleepDuration(bedtime, wakeTime)).toBe(2.0);
  });

  test('edge case: negative duration returns 0', () => {
    const bedtime = new Date('2025-04-24T10:00:00').getTime();
    const wakeTime = new Date('2025-04-24T08:00:00').getTime(); // earlier than bed
    expect(calculateSleepDuration(bedtime, wakeTime)).toBe(0);
  });

  test('exactly 6 hours (midnight to 6am)', () => {
    const bedtime = new Date('2025-04-24T00:00:00').getTime();
    const wakeTime = new Date('2025-04-24T06:00:00').getTime();
    expect(calculateSleepDuration(bedtime, wakeTime)).toBe(6.0);
  });
});

// ─── Weekly Average Computation ───────────────────────────────────────────────
describe('Weekly average sleep computation', () => {
  test('perfect week of 8hr sleep averages to 8.0', () => {
    const durations = [8, 8, 8, 8, 8, 8, 8];
    expect(calculateWeeklyAverage(durations)).toBe(8.0);
  });

  test('mixed week calculates correct average', () => {
    const durations = [5, 6, 7, 8, 7, 6, 5];
    // sum = 44, avg = 6.285... rounds to 6.3
    expect(calculateWeeklyAverage(durations)).toBe(6.3);
  });

  test('single night of sleep returns that value', () => {
    expect(calculateWeeklyAverage([7.5])).toBe(7.5);
  });

  test('empty array returns 0', () => {
    expect(calculateWeeklyAverage([])).toBe(0);
  });

  test('below 7hr average is flagged correctly (quality check)', () => {
    const avg = calculateWeeklyAverage([5, 5, 5, 5, 5, 5, 5]);
    expect(avg).toBeLessThan(7);
  });

  test('above 8hr average is excellent quality', () => {
    const avg = calculateWeeklyAverage([9, 8.5, 9, 8, 8, 9, 9]);
    expect(avg).toBeGreaterThanOrEqual(8);
  });
});

// ─── Sleep Stats Aggregation Logic ───────────────────────────────────────────
describe('Sleep stats aggregation (getSleepStats logic)', () => {
  // Mirror the logic in StorageService.getSleepStats
  function computeStats(sessions) {
    if (!sessions || sessions.length === 0) {
      return { avgSleep: '0.0', streak: 0, bestDay: 'None', worstDay: 'None' };
    }
    const durations = sessions.map(s => s.duration);
    const avg = (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(1);
    const best = sessions.reduce((a, b) => (a.duration > b.duration ? a : b));
    const worst = sessions.reduce((a, b) => (a.duration < b.duration ? a : b));
    let streak = 0;
    for (const s of sessions) {
      if (s.duration >= 6) streak++;
      else break;
    }
    return { avgSleep: avg, streak, bestDay: best.dayOfWeek, worstDay: worst.dayOfWeek };
  }

  test('identifies best and worst day correctly', () => {
    const sessions = [
      { duration: 8.5, dayOfWeek: 'Saturday' },
      { duration: 5.0, dayOfWeek: 'Sunday' },
      { duration: 7.0, dayOfWeek: 'Monday' },
    ];
    const stats = computeStats(sessions);
    expect(stats.bestDay).toBe('Saturday');
    expect(stats.worstDay).toBe('Sunday');
  });

  test('streak counts consecutive >= 6hr nights from most recent', () => {
    const sessions = [
      { duration: 7, dayOfWeek: 'Wednesday' }, // most recent first
      { duration: 6, dayOfWeek: 'Tuesday' },
      { duration: 4, dayOfWeek: 'Monday' }, // streak breaks here
      { duration: 8, dayOfWeek: 'Sunday' },
    ];
    const stats = computeStats(sessions);
    expect(stats.streak).toBe(2); // only Wed + Tue before the 4hr break
  });

  test('empty sessions returns zeroed stats', () => {
    const stats = computeStats([]);
    expect(stats.avgSleep).toBe('0.0');
    expect(stats.streak).toBe(0);
    expect(stats.bestDay).toBe('None');
  });
});
