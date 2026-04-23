/**
 * StorageService.js
 *
 * Replaces ALL backend API calls with local on-device storage.
 * - Native (Android/iOS): expo-sqlite for alarms & sleep, expo-file-system for ringtones
 * - Web: AsyncStorage fallback (expo-sqlite doesn't support web)
 * - User settings always: @react-native-async-storage/async-storage
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Conditional SQLite (Native only) ────────────────────────────────────────
let SQLite = null;
if (Platform.OS !== 'web') {
  SQLite = require('expo-sqlite');
}

// ─── Conditional FileSystem (Native only) ────────────────────────────────────
let FileSystem = null;
if (Platform.OS !== 'web') {
  FileSystem = require('expo-file-system');
}

// ─── AsyncStorage keys (used as web fallback + settings) ─────────────────────
const ALARMS_KEY = '@wakelock_alarms';
const SLEEP_KEY  = '@wakelock_sleep_sessions';
const SETTINGS_KEY = '@wakelock_settings';

// ─── DB Singleton (native only) ──────────────────────────────────────────────
let _db = null;

async function getDB() {
  if (Platform.OS === 'web') return null;
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync('wakelock.db');
  await _db.execAsync(`
    CREATE TABLE IF NOT EXISTS alarms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      time TEXT NOT NULL,
      label TEXT DEFAULT '',
      isEnabled INTEGER DEFAULT 1,
      taskType TEXT DEFAULT 'Math Problem',
      ringtone TEXT DEFAULT 'alarm.mp3',
      repeatDays TEXT DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS sleep_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      duration REAL NOT NULL,
      date TEXT NOT NULL,
      dayOfWeek TEXT NOT NULL
    );
  `);
  return _db;
}

// ─── ALARM OPERATIONS ────────────────────────────────────────────────────────

export async function getAlarms() {
  if (Platform.OS === 'web') {
    // Web: use AsyncStorage
    const raw = await AsyncStorage.getItem(ALARMS_KEY);
    const alarms = raw ? JSON.parse(raw) : [];
    return alarms.map(a => ({ ...a, enabled: a.isEnabled === 1 }));
  }
  const db = await getDB();
  const rows = await db.getAllAsync('SELECT * FROM alarms ORDER BY time ASC');
  return rows.map(row => ({ ...row, enabled: row.isEnabled === 1 }));
}

export async function addAlarm({ time, taskType = 'Math Problem', ringtone = 'alarm.mp3', label = '', repeatDays = '' }) {
  if (Platform.OS === 'web') {
    const raw = await AsyncStorage.getItem(ALARMS_KEY);
    const alarms = raw ? JSON.parse(raw) : [];
    const newAlarm = {
      id: Date.now(),
      time, label, isEnabled: 1,
      taskType, ringtone, repeatDays,
    };
    alarms.push(newAlarm);
    await AsyncStorage.setItem(ALARMS_KEY, JSON.stringify(alarms));
    return { success: true, id: newAlarm.id };
  }
  const db = await getDB();
  const result = await db.runAsync(
    'INSERT INTO alarms (time, label, isEnabled, taskType, ringtone, repeatDays) VALUES (?, ?, 1, ?, ?, ?)',
    [time, label, taskType, ringtone, repeatDays]
  );
  return { success: true, id: result.lastInsertRowId };
}

export async function deleteAlarm(id) {
  if (Platform.OS === 'web') {
    const raw = await AsyncStorage.getItem(ALARMS_KEY);
    const alarms = raw ? JSON.parse(raw) : [];
    const filtered = alarms.filter(a => a.id !== id);
    await AsyncStorage.setItem(ALARMS_KEY, JSON.stringify(filtered));
    return { success: true };
  }
  const db = await getDB();
  await db.runAsync('DELETE FROM alarms WHERE id = ?', [id]);
  return { success: true };
}

export async function toggleAlarm(id, enabled) {
  if (Platform.OS === 'web') {
    const raw = await AsyncStorage.getItem(ALARMS_KEY);
    const alarms = raw ? JSON.parse(raw) : [];
    const updated = alarms.map(a =>
      a.id === id ? { ...a, isEnabled: enabled ? 1 : 0 } : a
    );
    await AsyncStorage.setItem(ALARMS_KEY, JSON.stringify(updated));
    return { success: true };
  }
  const db = await getDB();
  await db.runAsync('UPDATE alarms SET isEnabled = ? WHERE id = ?', [enabled ? 1 : 0, id]);
  return { success: true };
}

export async function getAlarmById(id) {
  const alarms = await getAlarms();
  return alarms.find(a => a.id === id) || null;
}

// ─── USER SETTINGS ────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS = {
  bedtimeMode: false,
  bedtimeStart: null,
  volumePreference: 1.0,
  theme: 'light',
};

export async function getUserSettings() {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    return DEFAULT_SETTINGS;
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

export async function updateUserSettings(updates) {
  try {
    const current = await getUserSettings();
    const merged = { ...current, ...updates };
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
    return { success: true };
  } catch (e) {
    return { success: false };
  }
}

export async function updateBedtimeMode({ bedtimeMode, bedtimeStart }) {
  return updateUserSettings({ bedtimeMode, bedtimeStart });
}

// ─── SLEEP TRACKING ───────────────────────────────────────────────────────────

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export async function logSleepSession({ duration }) {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const dayOfWeek = DAYS[now.getDay()];

  if (Platform.OS === 'web') {
    const raw = await AsyncStorage.getItem(SLEEP_KEY);
    const sessions = raw ? JSON.parse(raw) : [];
    sessions.unshift({ id: Date.now(), duration, date, dayOfWeek });
    // keep last 30
    await AsyncStorage.setItem(SLEEP_KEY, JSON.stringify(sessions.slice(0, 30)));
    return { success: true };
  }
  const db = await getDB();
  await db.runAsync(
    'INSERT INTO sleep_sessions (duration, date, dayOfWeek) VALUES (?, ?, ?)',
    [duration, date, dayOfWeek]
  );
  return { success: true };
}

export async function getSleepStats() {
  let sessions = [];

  if (Platform.OS === 'web') {
    const raw = await AsyncStorage.getItem(SLEEP_KEY);
    sessions = raw ? JSON.parse(raw).slice(0, 7) : [];
  } else {
    const db = await getDB();
    sessions = await db.getAllAsync(
      'SELECT * FROM sleep_sessions ORDER BY id DESC LIMIT 7'
    );
  }

  if (!sessions || sessions.length === 0) {
    return {
      lastSleep: 0,
      avgSleep: '0.0',
      streak: 0,
      bestDay: 'None',
      worstDay: 'None',
      bestSleepVal: '0.0',
      worstSleepVal: '0.0',
      chartData: [0, 0, 0, 0, 0, 0, 0],
    };
  }

  const durations = sessions.map(s => s.duration);
  const avg = (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(1);
  const best  = sessions.reduce((a, b) => (a.duration > b.duration ? a : b));
  const worst = sessions.reduce((a, b) => (a.duration < b.duration ? a : b));

  let streak = 0;
  for (const s of sessions) {
    if (s.duration >= 6) streak++;
    else break;
  }

  const chartData = new Array(7).fill(0);
  [...sessions].reverse().forEach((s, i) => {
    if (i < 7) chartData[i] = s.duration;
  });

  return {
    lastSleep: sessions[0].duration,
    avgSleep: avg,
    streak,
    bestDay: best.dayOfWeek,
    worstDay: worst.dayOfWeek,
    bestSleepVal: best.duration.toFixed(1),
    worstSleepVal: worst.duration.toFixed(1),
    chartData,
  };
}

// ─── CUSTOM RINGTONE (Native only) ───────────────────────────────────────────

const RINGTONE_DIR = Platform.OS !== 'web'
  ? (FileSystem?.documentDirectory || '') + 'ringtones/'
  : '';

async function ensureRingtoneDir() {
  if (Platform.OS === 'web' || !FileSystem) return;
  const info = await FileSystem.getInfoAsync(RINGTONE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(RINGTONE_DIR, { intermediates: true });
  }
}

export async function saveCustomRingtone({ uri, filename }) {
  if (Platform.OS === 'web' || !FileSystem) {
    return { success: false, filename, localUri: '' };
  }
  try {
    await ensureRingtoneDir();
    const destUri = RINGTONE_DIR + filename;
    await FileSystem.copyAsync({ from: uri, to: destUri });
    return { success: true, filename, localUri: destUri };
  } catch (e) {
    return { success: false, filename, localUri: '' };
  }
}

export async function getCustomRingtoneUri(filename) {
  if (Platform.OS === 'web' || !FileSystem) return null;
  try {
    const uri = RINGTONE_DIR + filename;
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists ? uri : null;
  } catch (e) {
    return null;
  }
}
