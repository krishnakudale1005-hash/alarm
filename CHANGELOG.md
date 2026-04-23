# Changelog

All notable changes to WakeLock will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] - 2026-04-23

### Added
- **Offline-first architecture** — removed Node.js/SQLite backend; all data stored locally via `expo-sqlite` + `AsyncStorage`
- **Background alarms** — `expo-task-manager` + `expo-background-fetch` fire alarms even when app is closed
- **Snooze button** — 5-minute snooze with live countdown on alarm ringing screen
- **Custom ringtone upload** — native: `expo-document-picker`; web: HTML5 file input with Blob URL playback
- **Web audio fallback** — `window.Audio()` (HTML5 Audio API) plays alarm sound in browser when `expo-av` unavailable
- **Metro WASM fix** — `metro.config.js` stubs `.wasm` to prevent `expo-sqlite` web bundling crash
- **Platform guards** — all native-only modules (`expo-av`, `expo-notifications`, `expo-sensors`, `expo-keep-awake`) load conditionally
- **Comprehensive test suite** — 90 passing tests across 6 suites (unit, component, integration)
- **GitHub templates** — `.github/` folder with CONTRIBUTING, PR template, issue templates
- **CHANGELOG.md** and `VERSION` file added

### Fixed
- `expo-sqlite` WASM crash on web browsers
- Alarm sound silent on web (`expo-av` replaced with `window.Audio`)
- Custom ringtone disappearing after refactor
- Background notification listeners crashing on web
- `InterruptionModeIOS/Android` enum replaced with numeric constants for compatibility

### Changed
- `StorageService.js` — web uses `AsyncStorage` fallback; native uses `expo-sqlite`
- `AlarmScheduler.js` — all task-manager/notification code wrapped in `Platform.OS !== 'web'`
- `AlarmRingingScreen.js` — full web + native support with snooze + audio fallback
- `AlarmSetScreen.js` — custom ringtone picker works on both web and native

---

## [Unreleased]

### Planned
- Repeat alarm support (Mon–Fri, weekends, custom days)
- Snooze functionality with configurable interval
- Cloud sync via optional backend
- Real weather API integration

---

## [1.0.0] - 2025-04-23

### Added
- Initial release of WakeLock smart alarm app
- Multiple alarm scheduling with CRUD operations (add, delete, toggle)
- Three wake-up task modes: Math Problem, Memory Game, Shake to Wake
- Full-screen alarm ringing takeover with puzzle enforcement
- Gentle alarm: volume fades from 0% to 100% over 30 seconds
- **Local storage** — all data stored on-device (no backend server needed)
  - `expo-sqlite` for alarms and sleep sessions
  - `AsyncStorage` for user settings (bedtime, preferences)
  - `expo-file-system` for custom ringtone files
- **Background alarm reliability** via `expo-task-manager` + `expo-background-fetch`
  - `ALARM_CHECK_TASK` runs every 60 seconds in background
  - Fires notifications when app is closed or backgrounded
- Local notifications via `expo-notifications` with alarm data payload
- Permission warning banner when background permissions are denied
- Clock suite: Analog, World Clock (8 cities), Stopwatch, Countdown Timer
- Sleep tracking: Bedtime Mode toggle logs sleep duration to SQLite
- Sleep stats screen with 7-day BarChart, streaks, best/worst analysis
- `StorageService.js` module — clean abstraction layer over all storage operations
- `AlarmScheduler.js` — background task + notification scheduling/cancellation
- `alarmUtils.js` — pure utility functions (time matching, 12/24hr conversion, repeat day logic)
- Home screen with analog clock hero, weather widget, quick action grid
- 12-hour AM/PM format across all time displays
- Android permissions: WAKE_LOCK, FOREGROUND_SERVICE, SCHEDULE_EXACT_ALARM, USE_FULL_SCREEN_INTENT, VIBRATE, RECEIVE_BOOT_COMPLETED, POST_NOTIFICATIONS
- iOS background modes: fetch, audio
- GitHub templates: CONTRIBUTING.md, bug_report, feature_request, PR template
- Jest test suite with unit, component, and integration tests
- `screenshots/` folder for README documentation

### Fixed
- Alarm poller now reads from local SQLite instead of `localhost:3000`
- Custom ringtone now resolved from device filesystem (not HTTP URL)
- Alarm disable after ringing now updates local SQLite (not backend)
- Sleep session logging now uses local DB

### Security
- Removed all hardcoded `localhost:3000` URLs
- Backend is now optional/isolated — app never makes network requests for core functionality

---

## [0.3.0] - 2025-04-22 (Pre-release)

### Added
- Clock suite with Stopwatch and Timer
- World Clock across 8 timezone cities
- Analog clock on Home and Clock screens
- Shake to Wake task using Accelerometer

---

## [0.2.0] - 2025-04-22 (Pre-release)

### Added
- Multiple alarm support replacing single-alarm system
- Memory Game task with 4-step grid sequence
- Sleep stats with BarChart visualization
- Bedtime mode sleep tracking

---

## [0.1.0] - 2025-04-21 (Initial build)

### Added
- Basic alarm set + ringing screen
- Math Problem wake-up task
- Node.js + SQLite backend
- React Navigation tab bar
