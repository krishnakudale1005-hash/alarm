<div align="center">

<img src="assets/icon.png" alt="WakeLock Logo" width="120" height="120" style="border-radius: 24px"/>

# ⏰ WakeLock — Smart Alarm App

**The alarm that won't let you sleep through.**

[![CI Tests](https://github.com/krishnakudale1005-hash/alarm/actions/workflows/ci.yml/badge.svg)](https://github.com/krishnakudale1005-hash/alarm/actions)
[![Version](https://img.shields.io/badge/version-1.1.0-6366f1?style=flat-square)](./VERSION)
[![Platform](https://img.shields.io/badge/platform-Android%20%7C%20iOS%20%7C%20Web-brightgreen?style=flat-square&logo=expo)](https://expo.dev)
[![Expo SDK](https://img.shields.io/badge/Expo%20SDK-54-000020?style=flat-square&logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?style=flat-square&logo=react&logoColor=white)](https://reactnative.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](./LICENSE)
[![Tests](https://img.shields.io/badge/tests-90%20passing-success?style=flat-square&logo=jest)](./\_\_tests\_\_)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square)](./CONTRIBUTING.md)

<br/>

*WakeLock forces you awake with math problems, memory games, and shake challenges — because snoozing is not an option.*

[📱 Download APK](#-installation) · [🚀 Try on Web](https://github.com/krishnakudale1005-hash/alarm) · [🐛 Report Bug](https://github.com/krishnakudale1005-hash/alarm/issues) · [✨ Request Feature](https://github.com/krishnakudale1005-hash/alarm/issues)

</div>

---

## 📸 Screenshots

<div align="center">

| Home Screen | Alarms | Clock Suite |
|:-----------:|:------:|:-----------:|
| ![Home](screenshots/home.png) | ![Alarms](screenshots/alarm.png) | ![Clock](screenshots/clock.png) |

| Alarm Ringing | Stats | Dark Theme |
|:-------------:|:-----:|:----------:|
| ![Ringing](screenshots/ringing.png) | ![Stats](screenshots/stats.png) | ![Dark](screenshots/dark.png) |

</div>

> 📹 **Demo GIF** — *Coming soon. Record with `npx expo start` and use screen recorder.*

---

## ✨ Features

### 🔔 Smart Alarm System
- ✅ **Multiple alarms** — set as many as you need
- ✅ **Repeat days** — daily, weekdays, weekends, custom
- ✅ **5-minute snooze** with live countdown timer
- ✅ **Custom ringtones** — upload your own MP3 (web + native)
- ✅ **3 preset ringtones** — alarm, chime, digital

### 🧠 Wake-Up Tasks (Can't dismiss without completing!)
| Task | Description |
|------|-------------|
| 🧮 **Math Problem** | Solve arithmetic — forces your brain online |
| 🧠 **Memory Game** | Repeat a light sequence — no auto-pilot dismissal |
| 📱 **Shake to Wake** | Shake your phone 50× — gets you physically moving |

### 🕐 Clock Suite
- 🕐 Analog + digital clock (12hr format)
- 🌍 World clock — multiple time zones
- ⏱️ Stopwatch with lap tracking
- ⏳ Countdown timer

### 📊 Sleep Analytics
- 📈 7-day sleep duration chart
- 🏆 Best/worst sleep day analysis
- 🔥 Sleep streak tracker
- 💤 Average sleep quality score

### 🌐 Works Everywhere
- **Android** — full background alarms, shake detection, volume escalation
- **iOS** — notification-based alarms, keep-awake screen
- **Web** — full UI, HTML5 audio, file-based custom ringtone upload

---

## 🏗️ Architecture

```
WakeLock (Offline-First)
├── 📱 UI Layer
│   ├── HomeScreen      → Sleep tracker + weather widget
│   ├── AlarmSetScreen  → CRUD alarms + custom ringtone upload
│   ├── AlarmRingingScreen → Full-screen takeover + wake task + snooze
│   ├── ClockScreen     → Analog/digital/world/stopwatch/timer
│   └── StatsScreen     → Sleep charts + analytics
│
├── 🗄️ Data Layer
│   ├── StorageService.js  → expo-sqlite (native) / AsyncStorage (web)
│   └── alarmUtils.js      → Pure time/alarm utility functions
│
└── 🔔 Background Layer
    └── AlarmScheduler.js  → expo-task-manager + expo-background-fetch
                             fires every 60s even when app is killed
```

### Background Alarm Flow
```
App killed/backgrounded
        ↓
expo-background-fetch (every 60s)
        ↓
ALARM_CHECK_TASK runs
        ↓
getAlarms() → expo-sqlite
        ↓
doesAlarmMatchNow() ?
        ↓ YES
scheduleNotificationAsync()
        ↓
User taps notification
        ↓
AlarmRingingScreen (Full-screen takeover)
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | ![Expo](https://img.shields.io/badge/Expo-000020?style=flat&logo=expo) React Native 0.81 |
| **Local DB** | ![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat&logo=sqlite&logoColor=white) expo-sqlite v16 |
| **Storage** | AsyncStorage (settings + web fallback) |
| **Background** | expo-task-manager + expo-background-fetch |
| **Notifications** | expo-notifications (daily triggers) |
| **Audio** | expo-av (native) + HTML5 Audio API (web) |
| **Navigation** | React Navigation v7 (bottom tabs + stack) |
| **Charts** | react-native-chart-kit + react-native-svg |
| **Sensors** | expo-sensors (Accelerometer — shake) |
| **Testing** | Jest + @testing-library/react-native |
| **CI/CD** | GitHub Actions |

---

## 🚀 Installation

### Prerequisites
```bash
node >= 18
npm >= 9
expo-cli (latest)
```

### Quick Start
```bash
# Clone the repo
git clone https://github.com/krishnakudale1005-hash/alarm.git
cd alarm

# Install dependencies
npm install

# Start on web (instant, no setup needed)
npm run web

# Start with Expo Go (scan QR with Expo Go app)
npm start

# Start on Android emulator
npm run android

# Start on iOS simulator (Mac only)
npm run ios
```

### Run Tests
```bash
# Run all 90 tests
npm test

# Watch mode
npm run test:watch

# With coverage report
npm run test:coverage
```

---

## 📦 Build for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build Android APK
eas build --platform android --profile preview

# Build Android AAB (Play Store)
eas build --platform android --profile production

# Build iOS
eas build --platform ios --profile production
```

> ⚠️ **Important:** Background alarms require a production build via EAS. They do **not** work in Expo Go due to sandbox restrictions.

---

## 📚 StorageService API

All data is stored locally — no internet required.

| Function | Description | Returns |
|----------|-------------|---------|
| `getAlarms()` | Fetch all alarms | `Alarm[]` |
| `addAlarm(opts)` | Add new alarm | `{ success, id }` |
| `deleteAlarm(id)` | Delete alarm by ID | `{ success }` |
| `toggleAlarm(id, enabled)` | Enable/disable alarm | `{ success }` |
| `getUserSettings()` | Get user preferences | `Settings` |
| `updateUserSettings(updates)` | Save settings | `{ success }` |
| `logSleepSession({ duration })` | Log a sleep session | `{ success }` |
| `getSleepStats()` | Get 7-day sleep stats | `SleepStats` |
| `saveCustomRingtone({ uri, filename })` | Save custom MP3 | `{ success, localUri }` |

---

## 🧪 Testing

```
Test Suites: 6 passed, 6 total
Tests:       90 passed, 90 total
Time:        1.5s
```

| Suite | File | Tests |
|-------|------|-------|
| Unit | `alarmUtils.test.js` | 25 |
| Unit | `sleepStats.test.js` | 15 |
| Unit | `StorageService.test.js` | 16 |
| Component | `AlarmCard.test.js` | 12 |
| Component | `TaskModal.test.js` | 14 |
| Integration | `alarmFlow.test.js` | 8 |

---

## 📁 Project Structure

```
alarm/
├── .github/
│   ├── workflows/ci.yml          # GitHub Actions — auto-test on push
│   ├── CONTRIBUTING.md
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── ISSUE_TEMPLATE/
├── __mocks__/                    # Jest mocks for native modules
├── __tests__/                    # 90 test cases
│   ├── unit/
│   ├── components/
│   └── integration/
├── assets/                       # App icons + audio files
├── src/
│   ├── components/AlarmCard.js
│   ├── constants/theme.js
│   ├── screens/
│   │   ├── HomeScreen.js
│   │   ├── AlarmSetScreen.js
│   │   ├── AlarmRingingScreen.js
│   │   ├── ClockScreen.js
│   │   └── StatsScreen.js
│   ├── services/
│   │   ├── StorageService.js     # All local data ops
│   │   └── AlarmScheduler.js    # Background task + notifications
│   └── utils/alarmUtils.js      # Pure utility functions
├── App.js                        # Root — nav + background setup
├── app.json                      # Expo config + permissions
├── metro.config.js               # WASM stub for web
├── jest.config.js
├── babel.config.jest.js
├── CHANGELOG.md
└── VERSION
```

---

## 🗺️ Roadmap

| Version | Feature |
|---------|---------|
| `v1.2` | ☁️ Cloud sync (Firebase) |
| `v1.2` | 🌙 Dynamic bedtime recommendations (ML) |
| `v1.3` | 🎵 Spotify / YouTube Music ringtone integration |
| `v1.3` | 👥 Social sleep challenges |
| `v2.0` | ⌚ Wear OS / watchOS companion app |
| `v2.0` | 🏥 Health app integration (Google Fit / Apple Health) |

---

## 🤝 Contributing

Contributions are what make open source amazing! See [CONTRIBUTING.md](.github/CONTRIBUTING.md) for guidelines.

```bash
# Fork → clone → branch → code → test → PR
git checkout -b feat/your-feature-name
npm test  # make sure all 90 tests pass
git commit -m "feat: add your feature"
git push origin feat/your-feature-name
# Open a Pull Request 🎉
```

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

## 👨‍💻 Author

**Krishna Kudale**
- GitHub: [@krishnakudale1005-hash](https://github.com/krishnakudale1005-hash)

---

<div align="center">

⭐ **Star this repo if WakeLock helped you wake up on time!** ⭐

*Built with ❤️ using React Native + Expo*

</div>
