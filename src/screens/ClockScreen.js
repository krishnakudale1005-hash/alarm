import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Dimensions, Platform,
} from 'react-native';
import { COLORS } from '../constants/theme';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── World Zones ──────────────────────────────────────────────────────────────
const WORLD_ZONES = [
  { city: 'Mumbai',   zone: 'Asia/Kolkata',        flag: '🇮🇳', abbr: 'IST'  },
  { city: 'New York', zone: 'America/New_York',    flag: '🇺🇸', abbr: 'EST'  },
  { city: 'London',   zone: 'Europe/London',       flag: '🇬🇧', abbr: 'GMT'  },
  { city: 'Dubai',    zone: 'Asia/Dubai',          flag: '🇦🇪', abbr: 'GST'  },
  { city: 'Tokyo',    zone: 'Asia/Tokyo',          flag: '🇯🇵', abbr: 'JST'  },
  { city: 'Paris',    zone: 'Europe/Paris',        flag: '🇫🇷', abbr: 'CET'  },
  { city: 'Sydney',   zone: 'Australia/Sydney',    flag: '🇦🇺', abbr: 'AEDT' },
  { city: 'Beijing',  zone: 'Asia/Shanghai',       flag: '🇨🇳', abbr: 'CST'  },
];

// ─── Helper: get h/m/s in a timezone ────────────────────────────────────────
function getZoneTime(timezone) {
  try {
    const now = new Date();
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone, hour: 'numeric', minute: 'numeric',
      second: 'numeric', hour12: false,
    });
    const parts = fmt.formatToParts(now);
    const get = (type) => parseInt(parts.find(p => p.type === type)?.value || '0');
    return { h: get('hour') % 24, m: get('minute'), s: get('second') };
  } catch (e) {
    const n = new Date();
    return { h: n.getHours(), m: n.getMinutes(), s: n.getSeconds() };
  }
}

// ─── Helper: format 12-hr ────────────────────────────────────────────────────
function fmt12(h, m, s, showSec = false) {
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return showSec
    ? `${h12}:${mm}:${ss} ${period}`
    : `${h12}:${mm} ${period}`;
}

// ─── Analog Clock (pure RN, no SVG) ─────────────────────────────────────────
function Hand({ angle, length, width, color, cx, cy }) {
  // angle: 0 = 12 o'clock, goes clockwise
  const rad = ((angle - 90) * Math.PI) / 180;
  const ex = cx + length * Math.cos(rad);
  const ey = cy + length * Math.sin(rad);
  const midX = (cx + ex) / 2;
  const midY = (cy + ey) / 2;
  const rot = (Math.atan2(ey - cy, ex - cx) * 180) / Math.PI + 90;
  return (
    <View style={{
      position: 'absolute',
      left: midX - width / 2,
      top: midY - length / 2,
      width, height: length,
      backgroundColor: color,
      borderRadius: width / 2,
      transform: [{ rotate: `${rot}deg` }],
    }} />
  );
}

function AnalogClock({ timeObj, size = 140, accent = COLORS.primary }) {
  const { h, m, s } = timeObj;
  const r = size / 2;
  const secAngle  = s * 6;
  const minAngle  = m * 6 + s * 0.1;
  const hourAngle = (h % 12) * 30 + m * 0.5;

  return (
    <View style={{ width: size, height: size }}>
      {/* Face */}
      <View style={[styles.clockFace, { width: size, height: size, borderRadius: r, borderColor: accent }]} />
      {/* Hour ticks */}
      {Array.from({ length: 12 }, (_, i) => {
        const a = i * 30;
        const rad = ((a - 90) * Math.PI) / 180;
        const outerR = r - 6;
        const innerR = r - 18;
        const midR   = (outerR + innerR) / 2;
        const tx = r + midR * Math.cos(rad);
        const ty = r + midR * Math.sin(rad);
        const len = outerR - innerR;
        const rot = (Math.atan2(
          r + outerR * Math.sin(rad) - (r + innerR * Math.sin(rad)),
          r + outerR * Math.cos(rad) - (r + innerR * Math.cos(rad))
        ) * 180) / Math.PI + 90;
        return (
          <View key={i} style={{
            position: 'absolute',
            left: tx - 2, top: ty - len / 2,
            width: 3, height: len,
            backgroundColor: i % 3 === 0 ? '#1e293b' : '#94a3b8',
            borderRadius: 2,
            transform: [{ rotate: `${a}deg` }],
          }} />
        );
      })}
      {/* Hands */}
      <Hand angle={hourAngle} length={r * 0.52} width={4}   color="#1e293b" cx={r} cy={r} />
      <Hand angle={minAngle}  length={r * 0.72} width={3}   color="#334155" cx={r} cy={r} />
      <Hand angle={secAngle}  length={r * 0.80} width={1.5} color={COLORS.error}  cx={r} cy={r} />
      {/* Center dot */}
      <View style={[styles.centerDot, { left: r - 5, top: r - 5, backgroundColor: accent }]} />
    </View>
  );
}

// ─── SECTION: Clock ──────────────────────────────────────────────────────────
function ClockSection({ now }) {
  const h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <View style={styles.section}>
      {/* Analog */}
      <View style={styles.mainClockWrap}>
        <AnalogClock timeObj={{ h, m, s }} size={220} />
      </View>
      {/* Digital 12hr */}
      <View style={styles.digitalWrap}>
        <Text style={styles.digitalTime}>{fmt12(h, m, s, true)}</Text>
        <Text style={styles.digitalDate}>{dateStr}</Text>
      </View>
    </View>
  );
}

// ─── SECTION: World Clock ────────────────────────────────────────────────────
function WorldSection({ now }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.worldRow}
    >
      {WORLD_ZONES.map((z) => {
        const t = getZoneTime(z.zone);
        const isDay = t.h >= 6 && t.h < 20;
        return (
          <View key={z.city} style={styles.worldCard}>
            <Text style={styles.worldFlag}>{z.flag}</Text>
            <Text style={styles.worldCity}>{z.city}</Text>
            <Text style={styles.worldAbbr}>{z.abbr}</Text>
            <AnalogClock timeObj={t} size={110} accent={isDay ? COLORS.primary : '#475569'} />
            <Text style={styles.worldTime}>{fmt12(t.h, t.m, t.s)}</Text>
            <Text style={[styles.worldDayNight, { color: isDay ? COLORS.success : '#64748b' }]}>
              {isDay ? '☀️ Day' : '🌙 Night'}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

// ─── SECTION: Stopwatch ─────────────────────────────────────────────────────
function StopwatchSection() {
  const [elapsed, setElapsed] = useState(0); // ms
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState([]);
  const intervalRef = useRef(null);
  const startRef = useRef(0);

  const start = () => {
    startRef.current = Date.now() - elapsed;
    intervalRef.current = setInterval(() => {
      setElapsed(Date.now() - startRef.current);
    }, 33);
    setRunning(true);
  };

  const stop = () => {
    clearInterval(intervalRef.current);
    setRunning(false);
  };

  const reset = () => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setElapsed(0);
    setLaps([]);
  };

  const lap = () => {
    if (!running) return;
    setLaps(prev => [{ id: prev.length + 1, time: elapsed }, ...prev]);
  };

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const fmtMs = (ms) => {
    const cs = Math.floor((ms % 1000) / 10);
    const s  = Math.floor(ms / 1000) % 60;
    const m  = Math.floor(ms / 60000) % 60;
    const h  = Math.floor(ms / 3600000);
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${String(cs).padStart(2,'0')}`;
  };

  return (
    <View style={styles.section}>
      <View style={styles.swDisplay}>
        <Text style={styles.swTime}>{fmtMs(elapsed)}</Text>
      </View>
      <View style={styles.swBtnRow}>
        <TouchableOpacity style={[styles.swBtn, styles.swBtnSecondary]} onPress={running ? lap : reset}>
          <Text style={styles.swBtnSecText}>{running ? 'Lap' : 'Reset'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.swBtn, { backgroundColor: running ? COLORS.error : COLORS.primary }]}
          onPress={running ? stop : start}>
          <Text style={styles.swBtnText}>{running ? 'Stop' : 'Start'}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.lapList} showsVerticalScrollIndicator={false}>
        {laps.map((lap, i) => (
          <View key={lap.id} style={styles.lapRow}>
            <Text style={styles.lapLabel}>Lap {lap.id}</Text>
            <Text style={[styles.lapTime, i === 0 && { color: COLORS.primary }]}>{fmtMs(lap.time)}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// ─── SECTION: Timer ──────────────────────────────────────────────────────────
function TimerSection() {
  const [hInput, setHInput] = useState('0');
  const [mInput, setMInput] = useState('5');
  const [sInput, setSInput] = useState('0');
  const [remaining, setRemaining] = useState(null); // ms or null = not started
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const intervalRef = useRef(null);
  const endRef = useRef(0);

  const totalMs = () =>
    (parseInt(hInput || 0) * 3600 + parseInt(mInput || 0) * 60 + parseInt(sInput || 0)) * 1000;

  const start = () => {
    const ms = remaining !== null ? remaining : totalMs();
    if (ms <= 0) return;
    setFinished(false);
    endRef.current = Date.now() + ms;
    intervalRef.current = setInterval(() => {
      const left = endRef.current - Date.now();
      if (left <= 0) {
        clearInterval(intervalRef.current);
        setRemaining(0);
        setRunning(false);
        setFinished(true);
      } else {
        setRemaining(left);
      }
    }, 100);
    setRunning(true);
    setRemaining(ms);
  };

  const pause = () => {
    clearInterval(intervalRef.current);
    setRunning(false);
  };

  const reset = () => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setRemaining(null);
    setFinished(false);
  };

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const displayMs = remaining !== null ? remaining : totalMs();
  const displayS  = Math.ceil(displayMs / 1000);
  const dH = Math.floor(displayS / 3600);
  const dM = Math.floor((displayS % 3600) / 60);
  const dS = displayS % 60;

  const progress = remaining !== null ? remaining / totalMs() : 1;

  return (
    <View style={styles.section}>
      {/* Progress arc (simple bar) */}
      <View style={styles.timerProgressBg}>
        <View style={[styles.timerProgressFill, { width: `${Math.max(0, progress * 100)}%`, backgroundColor: finished ? COLORS.error : COLORS.primary }]} />
      </View>

      {/* Display */}
      <View style={styles.timerDisplay}>
        <Text style={[styles.timerTime, finished && { color: COLORS.error }]}>
          {finished ? '⏰ Done!' : `${String(dH).padStart(2,'0')}:${String(dM).padStart(2,'0')}:${String(dS).padStart(2,'0')}`}
        </Text>
      </View>

      {/* Set time inputs (shown only when not running) */}
      {!running && remaining === null && (
        <View style={styles.timerInputRow}>
          {[
            { label: 'H', val: hInput, set: setHInput },
            { label: 'M', val: mInput, set: setMInput },
            { label: 'S', val: sInput, set: setSInput },
          ].map(({ label, val, set }) => (
            <View key={label} style={styles.timerInputWrap}>
              <TextInput
                style={styles.timerInput}
                value={val}
                onChangeText={v => set(v.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                maxLength={2}
                selectTextOnFocus
              />
              <Text style={styles.timerInputLabel}>{label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Buttons */}
      <View style={styles.swBtnRow}>
        <TouchableOpacity style={[styles.swBtn, styles.swBtnSecondary]} onPress={reset}>
          <Text style={styles.swBtnSecText}>Reset</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.swBtn, { backgroundColor: running ? '#f59e0b' : COLORS.primary }]}
          onPress={running ? pause : start}
        >
          <Text style={styles.swBtnText}>{running ? 'Pause' : finished ? 'Restart' : 'Start'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main ClockScreen ────────────────────────────────────────────────────────
const TABS = ['Clock', 'World', 'Stopwatch', 'Timer'];

export default function ClockScreen({ route }) {
  const initialTab = route?.params?.initialTab || 'Clock';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [now, setNow] = useState(new Date());

  // If navigated with a new initialTab, switch to it
  useEffect(() => {
    if (route?.params?.initialTab) {
      setActiveTab(route.params.initialTab);
    }
  }, [route?.params?.initialTab]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);


  const renderContent = () => {
    switch (activeTab) {
      case 'Clock':     return <ClockSection now={now} />;
      case 'World':     return <WorldSection now={now} />;
      case 'Stopwatch': return <StopwatchSection />;
      case 'Timer':     return <TimerSection />;
      default:          return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.screenTitle}>Clock</Text>

      {/* Tab Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}
        contentContainerStyle={styles.pillRow}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.pill, activeTab === tab && styles.pillActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.pillText, activeTab === tab && styles.pillTextActive]}>
              {tab === 'Clock' ? '🕐 ' : tab === 'World' ? '🌍 ' : tab === 'Stopwatch' ? '⏱ ' : '⏳ '}{tab}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={activeTab !== 'World'}
      >
        {renderContent()}
      </ScrollView>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 60,
  },
  screenTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: COLORS.text,
    paddingHorizontal: 24,
    marginBottom: 14,
  },

  // Pills
  pillScroll: { maxHeight: 50, marginBottom: 8 },
  pillRow: { paddingHorizontal: 20, gap: 10, alignItems: 'center', paddingBottom: 4 },
  pill: {
    paddingVertical: 8, paddingHorizontal: 18,
    borderRadius: 50, backgroundColor: '#f1f5f9',
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  pillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  pillText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 14 },
  pillTextActive: { color: '#fff' },

  // Sections
  section: { flex: 1, alignItems: 'center', padding: 20 },

  // Main Analog
  mainClockWrap: {
    marginTop: 8, marginBottom: 24,
    ...COLORS.shadow,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.15,
  },
  clockFace: {
    position: 'absolute', backgroundColor: '#fff',
    borderWidth: 3,
    ...COLORS.shadow,
  },
  centerDot: {
    position: 'absolute', width: 10, height: 10, borderRadius: 5,
  },

  // Digital clock
  digitalWrap: { alignItems: 'center' },
  digitalTime: {
    fontSize: 44, fontWeight: '800', color: COLORS.primary, letterSpacing: 1,
  },
  digitalDate: {
    fontSize: 15, color: COLORS.textSecondary, marginTop: 6, fontWeight: '500',
  },

  // World clock
  worldRow: { paddingHorizontal: 16, paddingVertical: 8, gap: 16 },
  worldCard: {
    backgroundColor: '#fff', borderRadius: 24, padding: 16,
    alignItems: 'center', width: 160,
    borderWidth: 1, borderColor: '#f1f5f9',
    ...COLORS.shadow,
  },
  worldFlag:  { fontSize: 28, marginBottom: 4 },
  worldCity:  { fontSize: 15, fontWeight: 'bold', color: COLORS.text, marginBottom: 2 },
  worldAbbr:  { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600',
                 textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  worldTime:  { fontSize: 18, fontWeight: 'bold', color: COLORS.primary, marginTop: 12 },
  worldDayNight: { fontSize: 12, fontWeight: '600', marginTop: 4 },

  // Stopwatch
  swDisplay: {
    backgroundColor: '#fff', borderRadius: 24, padding: 24,
    width: '100%', alignItems: 'center', marginBottom: 24,
    borderWidth: 1, borderColor: '#f1f5f9',
    ...COLORS.shadow,
  },
  swTime: { fontSize: 42, fontWeight: '800', color: COLORS.text, letterSpacing: 1, fontVariant: ['tabular-nums'] },
  swBtnRow: { flexDirection: 'row', gap: 16, marginBottom: 20, width: '100%' },
  swBtn: {
    flex: 1, paddingVertical: 18, borderRadius: 50,
    alignItems: 'center', backgroundColor: COLORS.primary,
    ...COLORS.shadow,
  },
  swBtnSecondary: { backgroundColor: '#f1f5f9' },
  swBtnText:    { color: '#fff', fontWeight: 'bold', fontSize: 17 },
  swBtnSecText: { color: COLORS.textSecondary, fontWeight: 'bold', fontSize: 17 },
  lapList: { width: '100%', flex: 1 },
  lapRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  lapLabel: { color: COLORS.textSecondary, fontWeight: '600' },
  lapTime:  { color: COLORS.text, fontWeight: '700', fontVariant: ['tabular-nums'] },

  // Timer
  timerProgressBg: {
    width: '100%', height: 8, backgroundColor: '#e2e8f0',
    borderRadius: 4, overflow: 'hidden', marginBottom: 28,
  },
  timerProgressFill: { height: '100%', borderRadius: 4 },
  timerDisplay: {
    backgroundColor: '#fff', borderRadius: 24, padding: 28,
    width: '100%', alignItems: 'center', marginBottom: 20,
    borderWidth: 1, borderColor: '#f1f5f9',
    ...COLORS.shadow,
  },
  timerTime: { fontSize: 56, fontWeight: '900', color: COLORS.text, letterSpacing: 2, fontVariant: ['tabular-nums'] },
  timerInputRow: { flexDirection: 'row', gap: 16, marginBottom: 24, justifyContent: 'center' },
  timerInputWrap: { alignItems: 'center' },
  timerInput: {
    fontSize: 32, fontWeight: 'bold', color: COLORS.primary,
    backgroundColor: '#fff', borderRadius: 16,
    width: 72, height: 72, textAlign: 'center',
    borderWidth: 2, borderColor: '#e2e8f0',
  },
  timerInputLabel: { color: COLORS.textSecondary, fontWeight: '600', marginTop: 4, fontSize: 13 },
});
