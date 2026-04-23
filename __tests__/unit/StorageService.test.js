/**
 * StorageService.test.js — Unit tests for all StorageService functions
 */

// Reset modules before each test so DB singleton is fresh
beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

// ─── Helper: get fresh mocked DB ─────────────────────────────────────────────
function getMockDb() {
  const SQLite = require('expo-sqlite');
  return SQLite.__mockDb;
}

// ─── getAlarms ────────────────────────────────────────────────────────────────
describe('getAlarms()', () => {
  test('returns empty array when no alarms exist', async () => {
    getMockDb().getAllAsync.mockResolvedValueOnce([]);
    const { getAlarms } = require('../../src/services/StorageService');
    const result = await getAlarms();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  test('returns array of alarms with `enabled` boolean field', async () => {
    getMockDb().getAllAsync.mockResolvedValueOnce([
      { id: 1, time: '07:00', label: 'Morning', isEnabled: 1, taskType: 'Math Problem', ringtone: 'alarm.mp3', repeatDays: '' },
      { id: 2, time: '08:30', label: '', isEnabled: 0, taskType: 'Memory Game', ringtone: 'chime.mp3', repeatDays: '' },
    ]);
    const { getAlarms } = require('../../src/services/StorageService');
    const alarms = await getAlarms();
    expect(alarms).toHaveLength(2);
    expect(alarms[0].enabled).toBe(true);
    expect(alarms[1].enabled).toBe(false);
    expect(alarms[0].time).toBe('07:00');
  });
});

// ─── addAlarm ─────────────────────────────────────────────────────────────────
describe('addAlarm()', () => {
  test('saves alarm to DB and returns success with a numeric id', async () => {
    getMockDb().runAsync.mockResolvedValueOnce({ lastInsertRowId: 42, changes: 1 });
    const { addAlarm } = require('../../src/services/StorageService');
    const result = await addAlarm({ time: '06:30', taskType: 'Shake to Wake', ringtone: 'alarm.mp3' });
    expect(result.success).toBe(true);
    expect(result.id).toBe(42);
  });

  test('uses default taskType and ringtone when not provided', async () => {
    getMockDb().runAsync.mockResolvedValueOnce({ lastInsertRowId: 1, changes: 1 });
    const { addAlarm } = require('../../src/services/StorageService');
    const result = await addAlarm({ time: '07:00' });
    expect(result.success).toBe(true);
    // Should not throw — defaults applied inside service
    expect(getMockDb().runAsync).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining(['07:00', '', 'Math Problem', 'alarm.mp3', ''])
    );
  });
});

// ─── deleteAlarm ──────────────────────────────────────────────────────────────
describe('deleteAlarm()', () => {
  test('calls DELETE query with correct id', async () => {
    getMockDb().runAsync.mockResolvedValueOnce({ changes: 1 });
    const { deleteAlarm } = require('../../src/services/StorageService');
    const result = await deleteAlarm(5);
    expect(result.success).toBe(true);
    expect(getMockDb().runAsync).toHaveBeenCalledWith(
      expect.stringContaining('DELETE'),
      [5]
    );
  });

  test('returns success even if alarm id does not exist', async () => {
    getMockDb().runAsync.mockResolvedValueOnce({ changes: 0 });
    const { deleteAlarm } = require('../../src/services/StorageService');
    const result = await deleteAlarm(999);
    expect(result.success).toBe(true);
  });
});

// ─── toggleAlarm ──────────────────────────────────────────────────────────────
describe('toggleAlarm()', () => {
  test('sets isEnabled to 1 when enabling', async () => {
    getMockDb().runAsync.mockResolvedValueOnce({ changes: 1 });
    const { toggleAlarm } = require('../../src/services/StorageService');
    await toggleAlarm(3, true);
    expect(getMockDb().runAsync).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE'),
      [1, 3]
    );
  });

  test('sets isEnabled to 0 when disabling', async () => {
    getMockDb().runAsync.mockResolvedValueOnce({ changes: 1 });
    const { toggleAlarm } = require('../../src/services/StorageService');
    await toggleAlarm(3, false);
    expect(getMockDb().runAsync).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE'),
      [0, 3]
    );
  });

  test('returns success object', async () => {
    getMockDb().runAsync.mockResolvedValueOnce({ changes: 1 });
    const { toggleAlarm } = require('../../src/services/StorageService');
    const result = await toggleAlarm(1, true);
    expect(result).toEqual({ success: true });
  });
});

// ─── getUserSettings ──────────────────────────────────────────────────────────
describe('getUserSettings()', () => {
  test('returns default settings when nothing stored', async () => {
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    AsyncStorage.getItem.mockResolvedValueOnce(null);
    const { getUserSettings } = require('../../src/services/StorageService');
    const settings = await getUserSettings();
    expect(settings).toHaveProperty('bedtimeMode', false);
    expect(settings).toHaveProperty('volumePreference');
    expect(settings).toHaveProperty('theme');
  });

  test('returns merged settings when data exists in AsyncStorage', async () => {
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify({ bedtimeMode: true, theme: 'dark' }));
    const { getUserSettings } = require('../../src/services/StorageService');
    const settings = await getUserSettings();
    expect(settings.bedtimeMode).toBe(true);
    expect(settings.theme).toBe('dark');
  });
});

// ─── logSleepSession & getSleepStats ─────────────────────────────────────────
describe('logSleepSession()', () => {
  test('inserts sleep session with duration, date, and dayOfWeek', async () => {
    getMockDb().runAsync.mockResolvedValueOnce({ lastInsertRowId: 1 });
    const { logSleepSession } = require('../../src/services/StorageService');
    const result = await logSleepSession({ duration: 7.5 });
    expect(result.success).toBe(true);
    expect(getMockDb().runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT'),
      expect.arrayContaining([7.5])
    );
  });
});

describe('getSleepStats()', () => {
  test('returns zeroed stats when no sessions', async () => {
    getMockDb().getAllAsync.mockResolvedValueOnce([]);
    const { getSleepStats } = require('../../src/services/StorageService');
    const stats = await getSleepStats();
    expect(stats.avgSleep).toBe('0.0');
    expect(stats.streak).toBe(0);
    expect(stats.chartData).toHaveLength(7);
  });

  test('returns correct average and streak with sessions', async () => {
    getMockDb().getAllAsync.mockResolvedValueOnce([
      { id: 3, duration: 8, date: '2025-04-23', dayOfWeek: 'Wednesday' },
      { id: 2, duration: 7, date: '2025-04-22', dayOfWeek: 'Tuesday' },
      { id: 1, duration: 6, date: '2025-04-21', dayOfWeek: 'Monday' },
    ]);
    const { getSleepStats } = require('../../src/services/StorageService');
    const stats = await getSleepStats();
    expect(parseFloat(stats.avgSleep)).toBeCloseTo(7.0, 1);
    expect(stats.streak).toBe(3); // all >= 6hrs
    expect(stats.bestDay).toBe('Wednesday');
    expect(stats.worstDay).toBe('Monday');
  });
});
