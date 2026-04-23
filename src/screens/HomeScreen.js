import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { COLORS } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { getAlarms, getUserSettings, updateBedtimeMode, logSleepSession, getSleepStats } from '../services/StorageService';

// ─── Inline Analog Clock (small, for home) ──────────────────────────────────
function Hand({ angle, length, width, color, cx, cy }) {
  const rad = ((angle - 90) * Math.PI) / 180;
  const ex = cx + length * Math.cos(rad);
  const ey = cy + length * Math.sin(rad);
  const midX = (cx + ex) / 2;
  const midY = (cy + ey) / 2;
  const rot = (Math.atan2(ey - cy, ex - cx) * 180) / Math.PI + 90;
  return (
    <View style={{
      position: 'absolute',
      left: midX - width / 2, top: midY - length / 2,
      width, height: length,
      backgroundColor: color,
      borderRadius: width / 2,
      transform: [{ rotate: `${rot}deg` }],
    }} />
  );
}

function HomeClock({ now, size = 190 }) {
  const h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
  const r = size / 2;
  const secAngle  = s * 6;
  const minAngle  = m * 6 + s * 0.1;
  const hourAngle = (h % 12) * 30 + m * 0.5;

  return (
    <View style={{ width: size, height: size }}>
      {/* Face */}
      <View style={{
        position: 'absolute', width: size, height: size,
        borderRadius: r, backgroundColor: '#fff',
        borderWidth: 3, borderColor: COLORS.primary,
        shadowColor: COLORS.primary, shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 6 }, shadowRadius: 16, elevation: 8,
      }} />
      {/* Ticks */}
      {Array.from({ length: 12 }, (_, i) => {
        const a = i * 30;
        const rad = ((a - 90) * Math.PI) / 180;
        const outerR = r - 6, innerR = r - 18;
        const midR = (outerR + innerR) / 2;
        const tx = r + midR * Math.cos(rad);
        const ty = r + midR * Math.sin(rad);
        const len = outerR - innerR;
        return (
          <View key={i} style={{
            position: 'absolute',
            left: tx - 1.5, top: ty - len / 2,
            width: i % 3 === 0 ? 3 : 1.5,
            height: len,
            backgroundColor: i % 3 === 0 ? '#1e293b' : '#94a3b8',
            borderRadius: 2,
            transform: [{ rotate: `${a}deg` }],
          }} />
        );
      })}
      <Hand angle={hourAngle} length={r * 0.52} width={4}   color="#1e293b" cx={r} cy={r} />
      <Hand angle={minAngle}  length={r * 0.72} width={3}   color="#334155" cx={r} cy={r} />
      <Hand angle={secAngle}  length={r * 0.80} width={1.5} color={COLORS.error} cx={r} cy={r} />
      <View style={{
        position: 'absolute', width: 10, height: 10, borderRadius: 5,
        backgroundColor: COLORS.primary, left: r - 5, top: r - 5,
      }} />
    </View>
  );
}

const QUOTES = [
  "Wake up with determination. Go to bed with satisfaction.",
  "Today is a new beginning. Take a deep breath and start again.",
  "Make today your masterpiece.",
  "The secret of getting ahead is getting started.",
  "Every morning is a chance at a new day.",
];

function fmt12(h, m, showSec = false, s = 0) {
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return showSec ? `${h12}:${mm}:${ss} ${period}` : `${h12}:${mm} ${period}`;
}

// ─── Quick Action Card ───────────────────────────────────────────────────────
function QuickCard({ emoji, label, sublabel, onPress, gradient }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.82} style={styles.quickCard}>
      {gradient ? (
        <LinearGradient colors={gradient} start={[0, 0]} end={[1, 1]} style={styles.quickCardGrad}>
          <Text style={styles.quickCardEmoji}>{emoji}</Text>
          <Text style={styles.quickCardLabelLight}>{label}</Text>
          {sublabel ? <Text style={styles.quickCardSubLight}>{sublabel}</Text> : null}
        </LinearGradient>
      ) : (
        <View style={styles.quickCardPlain}>
          <Text style={styles.quickCardEmoji}>{emoji}</Text>
          <Text style={styles.quickCardLabel}>{label}</Text>
          {sublabel ? <Text style={styles.quickCardSub}>{sublabel}</Text> : null}
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Main HomeScreen ─────────────────────────────────────────────────────────
export default function HomeScreen() {
  const navigation = useNavigation();
  const isFocused  = useIsFocused();
  const [now, setNow] = useState(new Date());
  const [bedtimeMode, setBedtimeMode] = useState(false);
  const [sleepDuration, setSleepDuration] = useState('0');
  const [nextAlarm, setNextAlarm] = useState(null);
  const [weather, setWeather] = useState({ temp: '--', condition: 'Loading...', city: 'New York' });
  const randomQuote = useMemo(() => QUOTES[Math.floor(Math.random() * QUOTES.length)], []);

  // Mock Weather fetch
  useEffect(() => {
    setTimeout(() => {
      setWeather({ temp: '24°', condition: 'Partly Cloudy', city: 'Mumbai' });
    }, 2000);
  }, []);


  // Live clock tick
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (isFocused) loadData();
  }, [isFocused]);

  const loadData = async () => {
    try {
      const [stats, settings, alarms] = await Promise.all([
        getSleepStats(),
        getUserSettings(),
        getAlarms(),
      ]);
      if (stats.lastSleep !== undefined) setSleepDuration(stats.lastSleep.toString());
      if (settings.bedtimeMode !== undefined) setBedtimeMode(settings.bedtimeMode);
      if (Array.isArray(alarms)) {
        const enabled = alarms.filter(a => a.enabled);
        if (enabled.length > 0) {
          const now2 = new Date();
          const nowM = now2.getHours() * 60 + now2.getMinutes();
          const sorted = enabled.map(a => {
            const [ah, am] = a.time.split(':').map(Number);
            const alarmM = ah * 60 + am;
            const diff = alarmM >= nowM ? alarmM - nowM : 1440 - nowM + alarmM;
            return { ...a, diff };
          }).sort((a, b) => a.diff - b.diff);
          setNextAlarm(sorted[0]);
        } else setNextAlarm(null);
      }
    } catch (e) { console.log(e); }
  };

  const toggleBedtime = async (value) => {
    setBedtimeMode(value);
    let bedtimeStart = null;
    if (value) {
      bedtimeStart = new Date().getTime().toString();
    } else {
      try {
        const settings = await getUserSettings();
        if (settings.bedtimeStart) {
          const diffHrs = ((new Date().getTime() - parseInt(settings.bedtimeStart)) / (1000 * 60 * 60)).toFixed(1);
          if (parseFloat(diffHrs) > 0) {
            setSleepDuration(diffHrs);
            await logSleepSession({ duration: parseFloat(diffHrs) });
          }
        }
      } catch (e) { console.log(e); }
    }
    try {
      await updateBedtimeMode({ bedtimeMode: value, bedtimeStart });
    } catch (e) { console.log(e); }
  };

  const h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // Navigate to Clock tab with a specific section
  const goToClockTab = (tab) =>
    navigation.navigate('Clock', { initialTab: tab });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>

      {/* ── App Name ── */}
      <Text style={styles.appName}>WakeLock</Text>

      {/* ── Clock Hero ── */}
      <View style={styles.clockHero}>
        <HomeClock now={now} size={190} />
        <View style={styles.clockHeroRight}>
          <Text style={styles.heroTime}>{fmt12(h, m, false)}</Text>
          <Text style={styles.heroSeconds}>{String(s).padStart(2, '0')} sec</Text>
          <Text style={styles.heroDate}>{dateStr}</Text>
          {nextAlarm && (
            <View style={styles.nextAlarmBadge}>
              <Text style={styles.nextAlarmBadgeText}>⏰ {nextAlarm.time}</Text>
            </View>
          )}
        </View>
      </View>

      {/* ── Weather & Status ── */}
      <View style={styles.statusRow}>
        <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.weatherCard}>
          <Text style={styles.weatherTemp}>{weather.temp}</Text>
          <View>
            <Text style={styles.weatherCond}>{weather.condition}</Text>
            <Text style={styles.weatherCity}>{weather.city}</Text>
          </View>
        </LinearGradient>
        <View style={styles.healthCard}>
          <Text style={styles.healthLabel}>Sleep Quality</Text>
          <Text style={styles.healthScore}>{parseFloat(sleepDuration) >= 7 ? 'Optimal' : 'Fair'}</Text>
          <Text style={styles.healthSub}>{sleepDuration}h tracked</Text>
        </View>
      </View>

      {/* ── Quote ── */}
      <Text style={styles.quote}>"{randomQuote}"</Text>

      {/* ── Quick Actions Grid ── */}
      <Text style={styles.sectionLabel}>Quick Actions</Text>
      <View style={styles.quickGrid}>

        {/* Alarms */}
        <QuickCard
          emoji="⏰"
          label="Alarms"
          sublabel={nextAlarm ? `Next: ${nextAlarm.time}` : 'No alarms'}
          gradient={[COLORS.primaryVariant, COLORS.primary]}
          onPress={() => navigation.navigate('Alarm')}
        />

        {/* World Clock */}
        <QuickCard
          emoji="🌍"
          label="World Clock"
          sublabel="8 cities"
          onPress={() => goToClockTab('World')}
        />

        {/* Stopwatch */}
        <QuickCard
          emoji="⏱"
          label="Stopwatch"
          sublabel="Precision timer"
          onPress={() => goToClockTab('Stopwatch')}
        />

        {/* Timer */}
        <QuickCard
          emoji="⏳"
          label="Timer"
          sublabel="Countdown"
          onPress={() => goToClockTab('Timer')}
        />

        {/* Sleep Stats */}
        <QuickCard
          emoji="📊"
          label="Sleep Stats"
          sublabel={parseFloat(sleepDuration) > 0 ? `${sleepDuration} hrs last night` : 'No data yet'}
          onPress={() => navigation.navigate('Stats')}
        />

        {/* Analog Clock */}
        <QuickCard
          emoji="🕐"
          label="Clock"
          sublabel="Analog view"
          onPress={() => goToClockTab('Clock')}
        />
      </View>

      {/* ── Sleep / Bedtime ── */}
      <Text style={styles.sectionLabel}>Sleep Tracker</Text>
      <View style={styles.sleepRow}>
        <View style={styles.sleepCard}>
          <Text style={styles.sleepLabel}>Last Night</Text>
          <Text style={styles.sleepVal}>
            {parseFloat(sleepDuration) > 0 ? `${sleepDuration} hrs` : '--'}
          </Text>
        </View>
        <View style={styles.bedtimeCard}>
          <View>
            <Text style={styles.bedtimeText}>Bedtime Mode</Text>
            <Text style={styles.bedtimeSub}>
              {bedtimeMode ? '🌙 Tracking...' : 'Track sleep'}
            </Text>
          </View>
          <Switch
            trackColor={{ false: '#e2e8f0', true: COLORS.primaryVariant }}
            thumbColor={bedtimeMode ? COLORS.primary : '#94a3b8'}
            onValueChange={toggleBedtime}
            value={bedtimeMode}
          />
        </View>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20 },

  appName: {
    fontSize: 26, fontWeight: '900', color: COLORS.primary,
    letterSpacing: 1, marginBottom: 20, textAlign: 'center',
  },

  // Clock hero
  clockHero: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 28,
    padding: 20, marginBottom: 14,
    borderWidth: 1, borderColor: '#f1f5f9',
    ...COLORS.shadow,
  },
  clockHeroRight: { flex: 1, paddingLeft: 18 },
  heroTime: {
    fontSize: 36, fontWeight: '800', color: COLORS.primary, letterSpacing: 0.5,
  },
  heroSeconds: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  heroDate: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, lineHeight: 18 },
  nextAlarmBadge: {
    marginTop: 10, backgroundColor: '#ede9fe', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start',
  },
  nextAlarmBadgeText: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },

  // Status cards
  statusRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  weatherCard: {
    flex: 1.2, borderRadius: 24, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  weatherTemp: { fontSize: 32, fontWeight: '800', color: '#fff' },
  weatherCond: { fontSize: 13, fontWeight: '700', color: '#fff' },
  weatherCity: { fontSize: 11, color: 'rgba(255,255,255,0.8)' },
  healthCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 24, padding: 16,
    borderWidth: 1, borderColor: '#f1f5f9', ...COLORS.shadow,
  },
  healthLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase' },
  healthScore: { fontSize: 18, fontWeight: '800', color: COLORS.primary, marginTop: 4 },
  healthSub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },

  quote: {
    fontSize: 13, color: COLORS.textSecondary, fontStyle: 'italic',
    textAlign: 'center', marginBottom: 22, lineHeight: 20, paddingHorizontal: 4,
  },

  sectionLabel: {
    fontSize: 16, fontWeight: '700', color: COLORS.text,
    marginBottom: 12, letterSpacing: 0.3,
  },

  // Quick grid
  quickGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 12, marginBottom: 24,
  },
  quickCard: {
    width: '47%', borderRadius: 20,
    overflow: 'hidden',
    ...COLORS.shadow,
  },
  quickCardGrad: {
    padding: 18, minHeight: 90, justifyContent: 'center',
  },
  quickCardPlain: {
    padding: 18, minHeight: 90, justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#f1f5f9',
    borderRadius: 20,
  },
  quickCardEmoji: { fontSize: 26, marginBottom: 6 },
  quickCardLabel: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  quickCardLabelLight: { fontSize: 15, fontWeight: '700', color: '#fff' },
  quickCardSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  quickCardSubLight: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  // Sleep section
  sleepRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  sleepCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 20,
    padding: 18, alignItems: 'center',
    borderWidth: 1, borderColor: '#f1f5f9',
    ...COLORS.shadow,
  },
  sleepLabel: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  sleepVal: { fontSize: 26, fontWeight: 'bold', color: COLORS.text, marginTop: 6 },
  bedtimeCard: {
    flex: 2, backgroundColor: '#fff', borderRadius: 20,
    padding: 18, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: '#f1f5f9',
    ...COLORS.shadow,
  },
  bedtimeText: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  bedtimeSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
});
