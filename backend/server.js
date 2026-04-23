const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + '-' + file.originalname)
  }
});
const upload = multer({ storage: storage });

// --- User Settings Endpoints ---

// Get User Settings
app.get('/api/user/settings', (req, res) => {
  db.get("SELECT * FROM user_settings WHERE id = 1", (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      bedtimeMode: Boolean(row.bedtime_mode),
      bedtimeStart: row.bedtime_start ? row.bedtime_start.toString() : null,
      alarmTaskType: row.alarm_task_type,
      alarmTime: row.alarm_time ? row.alarm_time.toString() : null,
      alarmRingtone: row.alarm_ringtone || 'alarm.mp3'
    });
  });
});

// Update Bedtime Mode
app.post('/api/user/settings/bedtime', (req, res) => {
  const { bedtimeMode, bedtimeStart } = req.body;
  
  db.run(
    "UPDATE user_settings SET bedtime_mode = ?, bedtime_start = ? WHERE id = 1",
    [bedtimeMode ? 1 : 0, bedtimeStart || null],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, bedtimeMode, bedtimeStart });
    }
  );
});

// Update Alarm Task Type & Ringtone
app.post('/api/user/settings/task', (req, res) => {
  const { alarmTaskType, alarmTime, alarmRingtone } = req.body;
  if (!alarmTaskType) return res.status(400).json({ error: "Task type required" });

  db.run(
    "UPDATE user_settings SET alarm_task_type = ?, alarm_time = ?, alarm_ringtone = ? WHERE id = 1",
    [alarmTaskType, alarmTime || null, alarmRingtone || 'alarm.mp3'],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, alarmTaskType, alarmTime, alarmRingtone });
    }
  );
});

// --- Multiple Alarms Endpoints ---

// Get All Alarms
app.get('/api/alarms', (req, res) => {
  db.all("SELECT * FROM alarms ORDER BY time ASC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(row => ({
      id: row.id,
      time: row.time,
      taskType: row.task_type,
      ringtone: row.ringtone,
      enabled: Boolean(row.enabled)
    })));
  });
});

// Add New Alarm
app.post('/api/alarms', (req, res) => {
  const { time, taskType, ringtone } = req.body;
  if (!time) return res.status(400).json({ error: "Time is required" });

  db.run(
    "INSERT INTO alarms (time, task_type, ringtone, enabled) VALUES (?, ?, ?, 1)",
    [time, taskType || 'Math Problem', ringtone || 'alarm.mp3'],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID });
    }
  );
});

// Delete Alarm
app.delete('/api/alarms/:id', (req, res) => {
  db.run("DELETE FROM alarms WHERE id = ?", [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Toggle Alarm
app.patch('/api/alarms/:id/toggle', (req, res) => {
  const { enabled } = req.body;
  db.run(
    "UPDATE alarms SET enabled = ? WHERE id = ?",
    [enabled ? 1 : 0, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// Clear Alarm Time (Old Endpoint - Keeping for compatibility or cleanup)
app.post('/api/user/settings/clear-alarm', (req, res) => {
  db.run(
    "UPDATE user_settings SET alarm_time = NULL WHERE id = 1",
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// Upload Ringtone
app.post('/api/user/upload-ringtone', upload.single('ringtone'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  res.json({ success: true, filename: req.file.filename });
});

// --- Sleep Logs Endpoints ---

// Save a new sleep session
app.post('/api/user/sleep', (req, res) => {
  const { duration } = req.body;
  if (duration == null) return res.status(400).json({ error: "Duration required" });

  db.run("INSERT INTO sleep_logs (user_id, duration) VALUES (1, ?)", [duration], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, id: this.lastID, duration });
  });
});

// Get Sleep Stats
app.get('/api/user/stats', (req, res) => {
  // Get last sleeping duration for HomeScreen
  db.get("SELECT duration FROM sleep_logs ORDER BY id DESC LIMIT 1", (err, lastSleepRow) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Fallback value
    const lastSleep = lastSleepRow ? lastSleepRow.duration : '0';

    // Get the last 7 days for the chart
    db.all("SELECT duration, date_logged FROM sleep_logs ORDER BY id DESC LIMIT 7", (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      
      let data = [0, 0, 0, 0, 0, 0, 0];
      // Reverse array so oldest is first
      const sortedRows = rows.reverse();
      sortedRows.forEach((r, idx) => {
        data[6 - (rows.length - 1 - idx)] = r.duration; // fill from right to left
      });

      // Calculate avg, best, worst, streak
      const total = data.reduce((a, b) => a + b, 0);
      const activeCount = sortedRows.length || 1;
      const avgSleep = (total / activeCount).toFixed(1);

      const nonZeroData = data.filter(d => d > 0);
      // FIX: guard against empty array — Math.min/max of empty returns Infinity/-Infinity
      const bestSleep = nonZeroData.length > 0 ? Math.max(...nonZeroData).toFixed(1) : '0.0';
      const worstSleep = nonZeroData.length > 0 ? Math.min(...nonZeroData).toFixed(1) : '0.0';

      res.json({
        lastSleep,
        avgSleep,
        streak: sortedRows.length,
        bestDay: parseFloat(bestSleep) > 0 ? "Last Active" : "None",
        worstDay: parseFloat(worstSleep) > 0 ? "Least Active" : "None",
        chartData: data,
        bestSleepVal: bestSleep,
        worstSleepVal: worstSleep,
      });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
