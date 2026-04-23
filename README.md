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

### 🔊 Volume Lock
- Alarm plays at **maximum volume** and cannot be reduced
- Volume restores to 100% every 2 seconds automatically
- Plays even in **Silent Mode** (iOS)
- Will not be interrupted by other apps

### 📵 Wake Lock (Screen stays ON)
- Screen stays **fully awake** while alarm is ringing
- Alarm keeps playing even in the **background**
- Persistent notification shown — cannot be dismissed until task is complete
- Android `WAKE_LOCK` permission enables deep OS-level screen hold

### 😴 Bedtime Mode
- Toggle to start tracking sleep
- Toggle off in the morning to record your sleep duration automatically
- Sleep data stored in local SQLite database

### 📊 Sleep Statistics
- 7-day bar chart of sleep durations
- Average, best, and worst sleep days
- Sleep quality indicator (Excellent / Good / Fair / Poor)
- Day streak counter

### 🔔 Ringtone Options
- 3 built-in ringtones: Alarm, Chime, Digital
- Upload your own custom audio file (web)

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
│       ├── HomeScreen.js     # Dashboard + bedtime toggle
│       ├── AlarmSetScreen.js # Alarm list + add/delete/toggle
│       ├── AlarmRingingScreen.js # Full-screen alarm + tasks
│       └── StatsScreen.js    # Sleep charts & stats
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
