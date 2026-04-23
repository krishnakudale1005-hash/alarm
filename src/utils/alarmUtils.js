/**
 * alarmUtils.js
 * 
 * Pure utility functions for alarm time matching, conversions,
 * and repeat-day filtering. No side effects — easy to test.
 */

/**
 * Convert 12-hour time string to 24-hour HH:mm format.
 * @param {string} time12 — e.g. "2:30 PM" or "12:00 AM"
 * @returns {string} — e.g. "14:30" or "00:00"
 */
export function convert12to24(time12) {
  const match = time12.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return time12; // already 24hr or invalid
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === 'AM' && h === 12) h = 0;
  else if (period === 'PM' && h !== 12) h += 12;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Convert 24-hour HH:mm to 12-hour format.
 * @param {string} time24 — e.g. "14:30"
 * @returns {string} — e.g. "2:30 PM"
 */
export function convert24to12(time24) {
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

/**
 * Check if the alarm time (HH:mm) matches the current time (HH:mm).
 * @param {string} alarmTime — "HH:mm"
 * @param {Date} [now] — defaults to new Date()
 * @returns {boolean}
 */
export function doesAlarmMatchNow(alarmTime, now = new Date()) {
  const currentHH = String(now.getHours()).padStart(2, '0');
  const currentMM = String(now.getMinutes()).padStart(2, '0');
  const currentTime = `${currentHH}:${currentMM}`;
  return alarmTime === currentTime;
}

/**
 * Check if alarm should fire today based on repeatDays.
 * @param {string} repeatDays — comma-separated day names like "Monday,Tuesday,Friday"
 *                               or empty string for one-time alarms
 * @param {Date} [now] — defaults to new Date()
 * @returns {boolean}
 */
export function shouldFireToday(repeatDays, now = new Date()) {
  if (!repeatDays || repeatDays.trim() === '') return true; // one-time alarm fires any day
  const days = repeatDays.split(',').map(d => d.trim().toLowerCase());
  const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const todayName = DAYS[now.getDay()];
  return days.includes(todayName);
}

/**
 * Calculate sleep duration in hours from bedtime start timestamp to wake time.
 * @param {number} bedtimeStartMs — start timestamp in ms
 * @param {number} wakeTimeMs — wake timestamp in ms
 * @returns {number} — hours (e.g. 7.5)
 */
export function calculateSleepDuration(bedtimeStartMs, wakeTimeMs) {
  const diffMs = wakeTimeMs - bedtimeStartMs;
  if (diffMs <= 0) return 0;
  return parseFloat((diffMs / (1000 * 60 * 60)).toFixed(1));
}

/**
 * Calculate weekly average from an array of sleep durations.
 * @param {number[]} durations — array of hours
 * @returns {number}
 */
export function calculateWeeklyAverage(durations) {
  if (!durations || durations.length === 0) return 0;
  const sum = durations.reduce((a, b) => a + b, 0);
  return parseFloat((sum / durations.length).toFixed(1));
}
