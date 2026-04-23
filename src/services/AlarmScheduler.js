/**
 * AlarmScheduler.js
 *
 * Handles background alarm checking and notification scheduling.
 * - Native (Android/iOS): expo-task-manager + expo-background-fetch + expo-notifications
 * - Web: stubs only (background tasks not supported in browsers)
 */

import { Platform } from 'react-native';

export const ALARM_CHECK_TASK = 'ALARM_CHECK_TASK';

// ─── Native-only imports ──────────────────────────────────────────────────────
let Notifications = null;
let TaskManager   = null;
let BackgroundFetch = null;

if (Platform.OS !== 'web') {
  Notifications   = require('expo-notifications');
  TaskManager     = require('expo-task-manager');
  BackgroundFetch = require('expo-background-fetch');
}

// ─── Background Task (native only) ───────────────────────────────────────────
if (Platform.OS !== 'web' && TaskManager) {
  const { getAlarms, toggleAlarm } = require('./StorageService');
  const { doesAlarmMatchNow, shouldFireToday } = require('../utils/alarmUtils');

  TaskManager.defineTask(ALARM_CHECK_TASK, async () => {
    try {
      const alarms = await getAlarms();
      const now = new Date();

      for (const alarm of alarms) {
        if (!alarm.enabled) continue;
        if (!shouldFireToday(alarm.repeatDays, now)) continue;
        if (!doesAlarmMatchNow(alarm.time, now)) continue;

        await Notifications.scheduleNotificationAsync({
          content: {
            title: '⏰ WakeLock Alarm!',
            body: `Time to wake up! Task: ${alarm.taskType || 'Math Problem'}`,
            data: { alarmId: alarm.id, alarm },
            sound: 'alarm.wav',
            priority: Notifications.AndroidNotificationPriority.MAX,
          },
          trigger: null,
        });

        if (!alarm.repeatDays || alarm.repeatDays.trim() === '') {
          await toggleAlarm(alarm.id, false);
        }
      }

      return BackgroundFetch.BackgroundFetchResult.NewData;
    } catch (error) {
      console.log('ALARM_CHECK_TASK error:', error);
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  });
}

// ─── registerBackgroundAlarmCheck ────────────────────────────────────────────
export async function registerBackgroundAlarmCheck() {
  if (Platform.OS === 'web') return; // not supported on web
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(ALARM_CHECK_TASK);
    if (isRegistered) return;
    await BackgroundFetch.registerTaskAsync(ALARM_CHECK_TASK, {
      minimumInterval: 60,
      stopOnTerminate: false,
      startOnBoot: true,
    });
  } catch (e) {
    console.log('Background alarm register error:', e);
  }
}

// ─── scheduleAlarmNotification ────────────────────────────────────────────────
export async function scheduleAlarmNotification(alarm) {
  if (Platform.OS === 'web' || !Notifications) return null;
  try {
    const [hStr, mStr] = alarm.time.split(':');
    const hour   = parseInt(hStr, 10);
    const minute = parseInt(mStr, 10);

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏰ WakeLock Alarm!',
        body: alarm.label || `Time to wake up! Task: ${alarm.taskType || 'Math Problem'}`,
        data: { alarmId: alarm.id, alarm },
        sound: 'alarm.wav',
        priority: Notifications.AndroidNotificationPriority.MAX,
      },
      trigger: { type: 'daily', hour, minute },
    });
    return id;
  } catch (e) {
    console.log('scheduleAlarmNotification error:', e);
    return null;
  }
}

// ─── cancelAlarmNotifications ─────────────────────────────────────────────────
export async function cancelAlarmNotifications(alarmId) {
  if (Platform.OS === 'web' || !Notifications) return;
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
      if (notif.content?.data?.alarmId === alarmId) {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }
  } catch (e) {
    console.log('cancelAlarmNotifications error:', e);
  }
}

// ─── getBackgroundFetchStatus ─────────────────────────────────────────────────
export async function getBackgroundFetchStatus() {
  if (Platform.OS === 'web' || !BackgroundFetch) return null;
  return BackgroundFetch.getStatusAsync();
}
