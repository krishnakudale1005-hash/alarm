# ⏰ WakeLock — Smart Alarm App

![Platform](https://img.shields.io/badge/platform-Android%20%7C%20iOS-blue)
![Expo](https://img.shields.io/badge/Expo-SDK%2054-black)
![License](https://img.shields.io/badge/license-MIT-green)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)
![Version](https://img.shields.io/badge/version-1.0.0-purple)
![Tests](https://img.shields.io/badge/tests-Jest-orange)

A production-ready smart alarm app built with **Expo React Native**. Forces you to actually wake up by requiring you to complete a task before the alarm turns off. Works **100% offline** — no backend server required.

> **Note:** The `/backend` folder is included in the repo but is **optional** — it is only needed for future cloud sync. The app runs entirely on-device using `expo-sqlite`, `AsyncStorage`, and `expo-file-system`.

---

## 📸 Screenshots

| Home Screen | Alarm Set | Alarm Ringing | Clock Suite |
|---|---|---|---|
| ![Home](screenshots/home.png) | ![Alarm](screenshots/alarm.png) | ![Ringing](screenshots/ringing.png) | ![Clock](screenshots/clock.png) |

> 📷 Add your own screenshots to the `/screenshots` folder and update the table above.

---

## 🎬 Demo

> [Watch demo video](https://your-demo-link-here.com)

![App Demo](screenshots/demo.gif)

> 🎥 Record a demo with Expo Go and add the GIF to `/screenshots/demo.gif`.

---

## ✨ Features

### 🔔 Smart Alarm System
- Set multiple alarms with custom times
- Enable/disable individual alarms with a toggle switch
- Alarms auto-disable after ringing (won't ring again without re-enabling)
- **Background firing** — alarms fire even when app is closed (via `expo-background-fetch`)
- **Local notifications** — scheduled with `expo-notifications`

### 🧠 Wake-Up Tasks (Choose One Per Alarm)
| Task | Description |
|------|-------------|
| 🧮 Math Problem | Solve a random arithmetic problem |
| 🧠 Memory Game | Repeat a 4-step light pattern |
| 📱 Shake to Wake | Shake your phone 50 times |

### 🔊 Audio & UX
- **Gentle Wake:** Volume fades in over 30 seconds
- **Volume Lock:** Gradually increases to max
- **12-hour Format:** AM/PM across all screens
- **Custom Ringtones:** Save audio files locally on device

### 🕒 Clock Suite
- **World Clock:** Track time across 8 global cities
- **Stopwatch:** High-precision lap timer
- **Timer:** Elegant countdown timer
- **Analog Clock:** Classic clock view

### 📊 Sleep Tracking
- Bedtime Mode toggle — tracks sleep duration automatically
- Sleep stats persisted in local SQLite database
- 7-day chart with best/worst/average analysis

---

## 📁 Project Structure

```
WakeLock/
├── App.js                        # Root navigator + foreground poller + background task registration
├── app.json                      # Expo config (permissions, plugins)
├── index.js                      # Entry point
├── assets/                       # Images, audio files
│   ├── alarm.mp3
│   ├── chime.mp3
│   └── digital.mp3
├── screenshots/                  # App screenshots for README
├── src/
│   ├── constants/
│   │   └── theme.js              # Color palette & shadow tokens
│   ├── services/
│   │   ├── StorageService.js     # All local DB/storage operations (replaces backend API)
│   │   └── AlarmScheduler.js    # Background task + notification scheduling
│   ├── utils/
│   │   └── alarmUtils.js         # Pure utility functions (time matching, conversions)
│   └── screens/
│       ├── HomeScreen.js         # Dashboard + Weather + Sleep status
│       ├── AlarmSetScreen.js     # Alarm management (CRUD)
│       ├── AlarmRingingScreen.js # Full-screen alarm with puzzle tasks
│       ├── ClockScreen.js        # Analog, World, Stopwatch, Timer
│       └── StatsScreen.js        # Sleep analytics & charts
├── __tests__/                    # Jest test suite
│   ├── unit/
│   ├── components/
│   └── integration/
├── .github/                      # GitHub templates
│   ├── CONTRIBUTING.md
│   ├── CHANGELOG.md
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── ISSUE_TEMPLATE/
│       ├── bug_report.md
│       └── feature_request.md
└── backend/                      # Optional — for future cloud sync only
    ├── server.js
    └── database.js
```

---

## 🚀 Local Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo Go app on your phone (or Android/iOS emulator)

### Step 1 — Clone the repo
```bash
git clone https://github.com/krishnakudale1005-hash/alarm.git
cd alarm
```

**What you should see:** The repo cloned into a new folder.

### Step 2 — Install dependencies
```bash
npm install
```

**What you should see:** Packages installing, `node_modules/` folder created.

### Step 3 — Start the development server
```bash
npm start
```

**What you should see:** A QR code in the terminal and Expo DevTools at `http://localhost:8081`.

### Step 4 — Run on your device
- **Android/iOS:** Scan the QR code with the Expo Go app
- **Android Emulator:** Press `a` in the terminal
- **iOS Simulator:** Press `i` in the terminal
- **Web:** Press `w` in the terminal (alarm background features limited on web)

> **Note:** No backend server is needed. The app runs fully offline.

### Step 5 — Run tests
```bash
npm test
```

---

## 🏗️ Architecture

### Storage Layer
| Data | Technology | Location |
|------|-----------|----------|
| Alarms | `expo-sqlite` | Device SQLite DB |
| Sleep sessions | `expo-sqlite` | Device SQLite DB |
| User settings | `AsyncStorage` | Device key-value store |
| Custom ringtones | `expo-file-system` | `documents/ringtones/` |

### Background Alarm Reliability
```
App Startup → registerBackgroundAlarmCheck()
    ↓
BackgroundFetch (every 60s) → ALARM_CHECK_TASK
    ↓
Read enabled alarms from SQLite
    ↓
Compare current HH:mm with alarm times
    ↓
Match found → scheduleNotificationAsync({ trigger: null })
    ↓
Notification tapped → navigate to AlarmRingingScreen
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React Native (Expo SDK 54) |
| Navigation | React Navigation v7 |
| Local DB | expo-sqlite |
| Settings | @react-native-async-storage/async-storage |
| File Storage | expo-file-system |
| Background Tasks | expo-task-manager + expo-background-fetch |
| Notifications | expo-notifications |
| Audio | expo-av |
| Wake Lock | expo-keep-awake |
| Sensors | expo-sensors (Accelerometer) |
| Charts | react-native-chart-kit |
| Testing | Jest + @testing-library/react-native |

---

## 📱 Permissions Required

### Android
- `WAKE_LOCK` — Keep screen on during alarm
- `FOREGROUND_SERVICE` — Keep audio running in background
- `RECEIVE_BOOT_COMPLETED` — Re-register alarms after device reboot
- `SCHEDULE_EXACT_ALARM` — Precise alarm scheduling
- `USE_FULL_SCREEN_INTENT` — Full-screen alarm takeover
- `VIBRATE` — Vibration support
- `POST_NOTIFICATIONS` — Show alarm notifications

### iOS
- `UIBackgroundModes: fetch, audio` — Background fetch & audio playback
- Notifications permission — Alarm alerts

---

## 🗺️ Roadmap

### v1.1.0
- [ ] Cloud sync via optional backend (the `/backend` folder)
- [ ] Repeat alarm support (Mon–Fri, weekends, custom)
- [ ] Snooze functionality with configurable interval
- [ ] Alarm label / name customization

### v1.2.0
- [ ] Weather integration with real API (OpenWeatherMap)
- [ ] Sunrise alarm mode (gradual screen brightness)
- [ ] iCloud / Google Drive backup for alarm settings
- [ ] Apple Watch / Wear OS companion app

### v2.0.0
- [ ] AI-powered smart wake window (wakes you at lightest sleep phase)
- [ ] Wearable heart rate integration
- [ ] White noise / sleep sounds library
- [ ] Social challenges (share wake streaks)

---

## 🔌 API Reference (StorageService.js)

These functions replace the old `localhost:3000` API:

| Function | Description |
|----------|-------------|
| `getAlarms()` | Get all alarms |
| `addAlarm(data)` | Add new alarm |
| `deleteAlarm(id)` | Delete alarm by ID |
| `toggleAlarm(id, enabled)` | Enable/disable alarm |
| `getUserSettings()` | Get user preferences |
| `updateBedtimeMode(data)` | Update bedtime state |
| `logSleepSession(data)` | Log a sleep session |
| `getSleepStats()` | Get 7-day sleep analytics |
| `saveCustomRingtone(data)` | Store custom audio file |

---

## 🤝 Contributing

Please read [CONTRIBUTING.md](.github/CONTRIBUTING.md) before submitting pull requests.

---

## 📋 Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

---

## 📄 License

MIT © Krishna Kudale
