const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'alam.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    
    // Create tables if they don't exist
    db.serialize(() => {
      // User settings table (We'll just use id=1 for the single user)
      db.run(`
        CREATE TABLE IF NOT EXISTS user_settings (
          id INTEGER PRIMARY KEY,
          bedtime_mode BOOLEAN DEFAULT 0,
          bedtime_start INTEGER,
          alarm_task_type TEXT DEFAULT 'Math Problem',
          alarm_time INTEGER,
          alarm_ringtone TEXT DEFAULT 'alarm.mp3'
        )
      `, () => {
        // Safe migration if column is missing
        db.run("ALTER TABLE user_settings ADD COLUMN alarm_time INTEGER", (err) => {
          // ignore if duplicate column error
        });
        db.run("ALTER TABLE user_settings ADD COLUMN alarm_ringtone TEXT DEFAULT 'alarm.mp3'", (err) => {
          // ignore if duplicate column error
        });
      });

      // Alarms table
      db.run(`
        CREATE TABLE IF NOT EXISTS alarms (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          time TEXT,
          task_type TEXT DEFAULT 'Math Problem',
          ringtone TEXT DEFAULT 'alarm.mp3',
          enabled BOOLEAN DEFAULT 1
        )
      `);

      // Insert default settings if empty
      db.get("SELECT id FROM user_settings WHERE id = 1", (err, row) => {
        if (!row) {
          db.run("INSERT INTO user_settings (id, bedtime_mode, bedtime_start, alarm_task_type, alarm_time, alarm_ringtone) VALUES (1, 0, NULL, 'Math Problem', NULL, 'alarm.mp3')");
        }
      });

      // Sleep logs table
      db.run(`
        CREATE TABLE IF NOT EXISTS sleep_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER DEFAULT 1,
          duration REAL,
          date_logged DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Optionally insert some seed stats if perfectly empty? Let's keep it empty first.
    });
  }
});

module.exports = db;
