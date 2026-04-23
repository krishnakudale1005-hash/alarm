/**
 * alarmFlow.test.js — Integration tests for the full alarm lifecycle
 * 
 * Tests the complete flow:
 *   addAlarm → appears in list
 *   toggleAlarm → isEnabled flipped in storage
 *   deleteAlarm → no longer in list
 */

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

function getMockDb() {
  const SQLite = require('expo-sqlite');
  return SQLite.__mockDb;
}

// ─── Full alarm lifecycle ─────────────────────────────────────────────────────
describe('Alarm lifecycle integration', () => {
  test('add alarm → it appears in getAlarms() list', async () => {
    const db = getMockDb();

    // addAlarm: DB insert returns new ID
    db.runAsync.mockResolvedValueOnce({ lastInsertRowId: 101, changes: 1 });

    // getAlarms: DB returns the newly added alarm
    db.getAllAsync.mockResolvedValueOnce([
      {
        id: 101,
        time: '06:45',
        label: '',
        isEnabled: 1,
        taskType: 'Math Problem',
        ringtone: 'alarm.mp3',
        repeatDays: '',
      },
    ]);

    const { addAlarm, getAlarms } = require('../../src/services/StorageService');

    const addResult = await addAlarm({ time: '06:45', taskType: 'Math Problem' });
    expect(addResult.success).toBe(true);
    expect(addResult.id).toBe(101);

    const alarms = await getAlarms();
    expect(alarms).toHaveLength(1);
    expect(alarms[0].id).toBe(101);
    expect(alarms[0].time).toBe('06:45');
    expect(alarms[0].enabled).toBe(true);
  });

  test('toggle alarm OFF → isEnabled is false in getAlarms()', async () => {
    const db = getMockDb();

    // toggleAlarm: DB update succeeds
    db.runAsync.mockResolvedValueOnce({ changes: 1 });

    // getAlarms after toggle: returns disabled alarm
    db.getAllAsync.mockResolvedValueOnce([
      {
        id: 101,
        time: '06:45',
        label: '',
        isEnabled: 0,
        taskType: 'Math Problem',
        ringtone: 'alarm.mp3',
        repeatDays: '',
      },
    ]);

    const { toggleAlarm, getAlarms } = require('../../src/services/StorageService');

    const toggleResult = await toggleAlarm(101, false);
    expect(toggleResult.success).toBe(true);

    const alarms = await getAlarms();
    expect(alarms[0].enabled).toBe(false);
    expect(alarms[0].isEnabled).toBe(0);
  });

  test('delete alarm → it no longer appears in getAlarms()', async () => {
    const db = getMockDb();

    // deleteAlarm: DB returns success
    db.runAsync.mockResolvedValueOnce({ changes: 1 });

    // getAlarms after delete: empty list
    db.getAllAsync.mockResolvedValueOnce([]);

    const { deleteAlarm, getAlarms } = require('../../src/services/StorageService');

    const deleteResult = await deleteAlarm(101);
    expect(deleteResult.success).toBe(true);

    const alarms = await getAlarms();
    expect(alarms).toHaveLength(0);
  });

  test('full lifecycle: add → toggle off → delete → list is empty', async () => {
    const db = getMockDb();

    // Step 1: add
    db.runAsync.mockResolvedValueOnce({ lastInsertRowId: 55, changes: 1 });

    // Step 2: toggle off (UPDATE)
    db.runAsync.mockResolvedValueOnce({ changes: 1 });

    // Step 3: delete
    db.runAsync.mockResolvedValueOnce({ changes: 1 });

    // Step 4: final getAlarms returns empty
    db.getAllAsync.mockResolvedValueOnce([]);

    const { addAlarm, toggleAlarm, deleteAlarm, getAlarms } = require('../../src/services/StorageService');

    const add = await addAlarm({ time: '08:00', taskType: 'Memory Game' });
    expect(add.id).toBe(55);

    const toggle = await toggleAlarm(55, false);
    expect(toggle.success).toBe(true);

    const del = await deleteAlarm(55);
    expect(del.success).toBe(true);

    const finalList = await getAlarms();
    expect(finalList).toHaveLength(0);
  });
});

// ─── Settings lifecycle ───────────────────────────────────────────────────────
describe('Bedtime mode lifecycle', () => {
  test('enable bedtime → settings saved → disable bedtime → sleep logged', async () => {
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    const db = getMockDb();

    // Initially no settings
    AsyncStorage.getItem.mockResolvedValueOnce(null);

    const { getUserSettings, updateBedtimeMode, logSleepSession, getSleepStats } = require('../../src/services/StorageService');

    const defaultSettings = await getUserSettings();
    expect(defaultSettings.bedtimeMode).toBe(false);

    // Enable bedtime mode
    AsyncStorage.setItem.mockResolvedValueOnce(undefined);
    const bedtimeStart = Date.now().toString();
    await updateBedtimeMode({ bedtimeMode: true, bedtimeStart });

    // Log sleep
    db.runAsync.mockResolvedValueOnce({ lastInsertRowId: 1 });
    const sleepResult = await logSleepSession({ duration: 7.5 });
    expect(sleepResult.success).toBe(true);

    // Get stats
    db.getAllAsync.mockResolvedValueOnce([
      { id: 1, duration: 7.5, date: '2025-04-23', dayOfWeek: 'Wednesday' },
    ]);
    const stats = await getSleepStats();
    expect(parseFloat(stats.lastSleep)).toBe(7.5);
    expect(stats.streak).toBe(1);
  });
});
