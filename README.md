# ⏰ WakeLock — Smart Alarm App

A production-ready smart alarm app built with **Expo React Native** (frontend) and **Node.js + SQLite** (backend). Forces you to actually wake up by requiring you to complete a task before the alarm turns off.

---

## ✨ Features

### 🔔 Smart Alarm System
- Set multiple alarms with custom times
- Enable/disable individual alarms with a toggle switch
- Alarms auto-disable after ringing (won't ring again without re-enabling)

### 🧠 Wake-Up Tasks (Choose One Per Alarm)
| Task | Description |
|------|-------------|
| 🧮 Math Problem | Solve a random arithmetic problem |
| 🧠 Memory Game | Repeat a 4-step light pattern |
| 📱 Shake to Wake | Shake your phone 50 times |

### 🔊 Audio & UX
- **Gentle Wake:** Volume fades in over 30 seconds for a smoother wake-up
- **Volume Lock:** Alarm forces maximum volume every few seconds
- **12-hour Format:** Support for AM/PM across all screens
- **Custom Ringtones:** Upload your own audio via web interface

### 🕒 Clock Suite
- **World Clock:** Track time across multiple global cities
- **Stopwatch:** High-precision lap timer
- **Timer:** Elegant countdown timer with sound alerts
- **Analog Clock:** Classic clock view for your home dashboard

### ⛅ Weather & Insights
- **Weather Widget:** Live temperature and condition status on home screen
- **Sleep Quality:** Smart analysis of your sleep duration patterns

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)

### 1. Clone the repo
```bash
git clone https://github.com/krishnakudale1005/ALAM.git
cd ALAM
```

### 2. Install frontend dependencies
```bash
npm install
```

### 3. Install & start backend
```bash
cd backend
npm install
node server.js
```
Backend runs at: `http://localhost:3000`

### 4. Start the app (in the root directory)
```bash
# Web
npm run web

# Android
npm run android

# iOS
npm run ios
```

---

## 📁 Project Structure

```
ALAM/
├── App.js                    # Root navigator + alarm poller
├── app.json                  # Expo config (permissions, plugins)
├── index.js                  # Entry point
├── assets/                   # Images, audio files
│   ├── alarm.mp3
│   ├── chime.mp3
│   └── digital.mp3
├── src/
│   ├── constants/
│   │   └── theme.js          # Color palette & shadow tokens
│   └── screens/
│       ├── HomeScreen.js         # Dashboard + Weather + Status
│       ├── AlarmSetScreen.js     # Multiple Alarm management
│       ├── AlarmRingingScreen.js # Full-screen takeover + Puzzle tasks
│       ├── ClockScreen.js        # Analog, World, Stopwatch, Timer suite
│       └── StatsScreen.js        # Sleep analytics & Charts
└── backend/
    ├── server.js             # Express REST API
    ├── database.js           # SQLite setup & schema
    └── uploads/              # Uploaded custom ringtones
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/alarms` | Get all alarms |
| POST | `/api/alarms` | Add new alarm |
| DELETE | `/api/alarms/:id` | Delete alarm |
| PATCH | `/api/alarms/:id/toggle` | Toggle alarm on/off |
| GET | `/api/user/settings` | Get user settings |
| POST | `/api/user/settings/bedtime` | Update bedtime mode |
| POST | `/api/user/sleep` | Log sleep session |
| GET | `/api/user/stats` | Get sleep statistics |
| POST | `/api/user/upload-ringtone` | Upload custom ringtone |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React Native (Expo SDK 54) |
| Navigation | React Navigation v7 |
| Audio | expo-av |
| Notifications | expo-notifications |
| Wake Lock | expo-keep-awake |
| Sensors | expo-sensors (Accelerometer) |
| Charts | react-native-chart-kit |
| Backend | Node.js + Express 5 |
| Database | SQLite (sqlite3) |
| File Uploads | Multer |

---

## 📱 Permissions Required

### Android
- `WAKE_LOCK` — Keep screen on during alarm
- `FOREGROUND_SERVICE` — Keep audio running in background
- `VIBRATE` — Vibration support
- `SCHEDULE_EXACT_ALARM` — Precise alarm scheduling
- `USE_FULL_SCREEN_INTENT` — Full-screen alarm takeover

### iOS
- `UIBackgroundModes: audio` — Background audio playback
- Notifications permission — Alarm alerts

---

## 🤝 Contributing

Pull requests are welcome. For major changes, open an issue first.

---

## 📄 License

MIT © Krishna Kudale
