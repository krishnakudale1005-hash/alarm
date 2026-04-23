import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Animated, BackHandler, Dimensions, Platform,
} from 'react-native';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { COLORS } from '../constants/theme';
import { useNavigation } from '@react-navigation/native';
import { Accelerometer } from 'expo-sensors';
import * as Notifications from 'expo-notifications';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

const { width } = Dimensions.get('window');

export default function AlarmRingingScreen({ route }) {
  const navigation = useNavigation();
  const { alarm } = route.params || {};

  const [taskType] = useState(alarm?.taskType || 'Math Problem');
  const [solved, setSolved] = useState(false);

  const soundRef = useRef(null);
  const volumeIntervalRef = useRef(null);
  const notifIdRef = useRef(null);

  // Math State
  const [problem, setProblem] = useState({ math: '', answer: '' });
  const [userInput, setUserInput] = useState('');

  // Memory Grid State — use ref to prevent stale closure bug
  const gridSequenceRef = useRef([]);
  const [userSequence, setUserSequence] = useState([]);
  const [isShowingSequence, setIsShowingSequence] = useState(false);
  const [activeButton, setActiveButton] = useState(null);

  // Shake State
  const [shakeCount, setShakeCount] = useState(0);
  const SHAKE_GOAL = 50;

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Block hardware back button
    const onBackPress = () => true;
    BackHandler.addEventListener('hardwareBackPress', onBackPress);

    // 🔒 WAKE LOCK: keep screen on
    if (Platform.OS !== 'web') {
      activateKeepAwakeAsync().catch(() => {});
    }

    initAlarm();
    startPulse();

    return () => {
      BackHandler.removeEventListener('hardwareBackPress', onBackPress);
      cleanup();
    };
  }, []);

  // ─── Cleanup ──────────────────────────────────────────────────────────────
  const cleanup = async () => {
    // Clear volume lock interval
    if (volumeIntervalRef.current) {
      clearInterval(volumeIntervalRef.current);
      volumeIntervalRef.current = null;
    }
    // Stop and unload sound
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      } catch (e) {}
    }
    // Stop accelerometer
    if (Platform.OS !== 'web') {
      try { Accelerometer.removeAllListeners(); } catch (e) {}
    }
    // Deactivate wake lock
    if (Platform.OS !== 'web') {
      try { deactivateKeepAwake(); } catch (e) {}
    }
    // Dismiss persistent notification
    if (notifIdRef.current) {
      try {
        await Notifications.dismissNotificationAsync(notifIdRef.current);
        notifIdRef.current = null;
      } catch (e) {}
    }
  };

  // ─── Init ─────────────────────────────────────────────────────────────────
  const initAlarm = async () => {
    await playSound(alarm?.ringtone || 'alarm.mp3');

    // 🔔 Persistent foreground notification (native only)
    if (Platform.OS !== 'web') {
      try {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: '⏰ WakeLock Alarm',
            body: 'Complete the task to dismiss your alarm!',
            priority: Notifications.AndroidNotificationPriority.MAX,
            sound: false,
            sticky: true,
          },
          trigger: null,
        });
        notifIdRef.current = id;
      } catch (e) {}
    }

    if (taskType === 'Math Problem') {
      generateMath();
    } else if (taskType === 'Memory Game') {
      startMemoryGame();
    } else if (taskType === 'Shake to Wake') {
      if (Platform.OS !== 'web') {
        startShakeDetection();
      }
    }
  };

  // ─── Sound (with Volume Lock) ─────────────────────────────────────────────
  const playSound = async (ringtoneName) => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
      });

      let asset;
      if (ringtoneName === 'chime.mp3') asset = require('../../assets/chime.mp3');
      else if (ringtoneName === 'digital.mp3') asset = require('../../assets/digital.mp3');
      else if (ringtoneName === 'alarm.mp3') asset = require('../../assets/alarm.mp3');
      else asset = { uri: `http://localhost:3000/uploads/${ringtoneName}` };

      const { sound } = await Audio.Sound.createAsync(
        asset,
        { shouldPlay: true, isLooping: true, volume: 1.0 }
      );
      soundRef.current = sound;

      // 🔊 VOLUME LOCK: restore volume to 1.0 every 300ms
      // This aggressively resets volume if user tries to lower it
      volumeIntervalRef.current = setInterval(async () => {
        if (soundRef.current) {
          try { await soundRef.current.setVolumeAsync(1.0); } catch (e) {}
        }
      }, 300);
    } catch (e) {
      console.log('Sound error:', e);
    }
  };

  const stopSound = async () => {
    if (volumeIntervalRef.current) {
      clearInterval(volumeIntervalRef.current);
      volumeIntervalRef.current = null;
    }
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      } catch (e) {}
    }
  };

  // ─── Pulse Animation ──────────────────────────────────────────────────────
  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  };

  // ─── MATH TASK ────────────────────────────────────────────────────────────
  const generateMath = () => {
    const n1 = Math.floor(Math.random() * 50) + 10;
    const n2 = Math.floor(Math.random() * 50) + 10;
    const n3 = Math.floor(Math.random() * 10) + 2;
    setProblem({ math: `${n1} + ${n2} - ${n3}`, answer: (n1 + n2 - n3).toString() });
  };

  const checkMath = () => {
    if (userInput.trim() === problem.answer) {
      completeAlarm();
    } else {
      setUserInput('');
      shakeScreen();
    }
  };

  // ─── MEMORY GRID TASK ─────────────────────────────────────────────────────
  const startMemoryGame = () => {
    const seq = Array.from({ length: 4 }, () => Math.floor(Math.random() * 9));
    gridSequenceRef.current = seq; // store in ref to avoid stale closure
    setUserSequence([]);
    showSequence(seq);
  };

  const showSequence = async (seq) => {
    setIsShowingSequence(true);
    for (const idx of seq) {
      setActiveButton(idx);
      await new Promise(r => setTimeout(r, 600));
      setActiveButton(null);
      await new Promise(r => setTimeout(r, 300));
    }
    setIsShowingSequence(false);
  };

  const handleGridPress = (idx) => {
    if (isShowingSequence) return;
    const newSeq = [...userSequence, idx];
    setUserSequence(newSeq);

    // FIX: use gridSequenceRef.current to avoid stale closure
    if (idx !== gridSequenceRef.current[newSeq.length - 1]) {
      setUserSequence([]);
      shakeScreen();
      showSequence(gridSequenceRef.current);
      return;
    }
    if (newSeq.length === gridSequenceRef.current.length) {
      completeAlarm();
    }
  };

  // ─── SHAKE TASK ───────────────────────────────────────────────────────────
  const startShakeDetection = () => {
    Accelerometer.setUpdateInterval(100);
    Accelerometer.addListener(({ x, y, z }) => {
      const acceleration = Math.sqrt(x * x + y * y + z * z);
      if (acceleration > 2.5) {
        setShakeCount(prev => {
          if (prev + 1 >= SHAKE_GOAL) {
            Accelerometer.removeAllListeners();
            completeAlarm();
            return SHAKE_GOAL;
          }
          return prev + 1;
        });
      }
    });
  };

  // ─── Complete Alarm ───────────────────────────────────────────────────────
  const completeAlarm = async () => {
    setSolved(true);
    await stopSound();

    if (Platform.OS !== 'web') {
      try { deactivateKeepAwake(); } catch (e) {}
    }

    // Dismiss the persistent notification
    if (notifIdRef.current) {
      try {
        await Notifications.dismissNotificationAsync(notifIdRef.current);
        notifIdRef.current = null;
      } catch (e) {}
    }

    // ✅ CRITICAL FIX: disable alarm in DB so it doesn't ring again
    if (alarm?.id) {
      try {
        await fetch(`http://localhost:3000/api/alarms/${alarm.id}/toggle`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled: false }),
        });
      } catch (e) {}
    }
  };

  const shakeScreen = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  // ─── Success Screen ───────────────────────────────────────────────────────
  if (solved) {
    return (
      <View style={[styles.container, { backgroundColor: '#fff' }]}>
        <Text style={styles.successEmoji}>🌅</Text>
        <Text style={styles.successTitle}>Good Morning!</Text>
        <Text style={styles.motivation}>
          "Your future is created by what you do today, not tomorrow."
        </Text>
        <TouchableOpacity style={styles.startDayBtn} onPress={() => navigation.navigate('MainTabs')}>
          <Text style={styles.startDayBtnText}>Start Your Day →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── Alarm Ringing Screen ─────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <Text style={styles.wakeUpText}>WAKE UP!</Text>
      </Animated.View>

      <Text style={styles.alarmTimeDisplay}>
        {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
      </Text>

      <Text style={styles.instruction}>
        {taskType === 'Math Problem'
          ? '🧮 Solve the problem to stop the alarm'
          : taskType === 'Memory Game'
          ? '🧠 Repeat the pattern to stop the alarm'
          : Platform.OS === 'web'
          ? '⚠️ Shake not available on web'
          : '📱 Shake your phone vigorously!'}
      </Text>

      <Animated.View style={{ transform: [{ translateX: shakeAnim }], width: '100%', alignItems: 'center' }}>

        {/* ── Math Task ── */}
        {taskType === 'Math Problem' && (
          <View style={styles.taskCard}>
            <Text style={styles.problemText}>{problem.math} = ?</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={userInput}
              onChangeText={setUserInput}
              placeholder="Your answer"
              placeholderTextColor="#94a3b8"
              autoFocus
              onSubmitEditing={checkMath}
            />
            <TouchableOpacity style={styles.submitBtn} onPress={checkMath}>
              <Text style={styles.submitBtnText}>CHECK ✓</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Memory Grid Task ── */}
        {taskType === 'Memory Game' && (
          <View>
            <Text style={styles.memoryHint}>
              {isShowingSequence ? 'Watch carefully...' : 'Now repeat it!'}
            </Text>
            <View style={styles.gridContainer}>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(idx => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => handleGridPress(idx)}
                  style={[
                    styles.gridButton,
                    activeButton === idx && styles.gridButtonActive,
                  ]}
                />
              ))}
            </View>
          </View>
        )}

        {/* ── Shake Task ── */}
        {taskType === 'Shake to Wake' && (
          <View style={styles.shakeContainer}>
            {Platform.OS === 'web' ? (
              <Text style={styles.shakeText}>Shake not available on web</Text>
            ) : (
              <>
                <View style={styles.progressBg}>
                  <View style={[styles.progressFill, { width: `${(shakeCount / SHAKE_GOAL) * 100}%` }]} />
                </View>
                <Text style={styles.shakeText}>{Math.floor((shakeCount / SHAKE_GOAL) * 100)}% DONE</Text>
                <Text style={styles.shakeSubText}>Keep shaking!</Text>
              </>
            )}
          </View>
        )}

      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  wakeUpText: {
    color: COLORS.primary,
    fontSize: 58,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
  },
  alarmTimeDisplay: {
    color: COLORS.textSecondary,
    fontSize: 20,
    marginTop: 6,
    marginBottom: 16,
    fontWeight: '500',
  },
  instruction: {
    color: COLORS.textSecondary,
    fontSize: 16,
    marginBottom: 36,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 24,
  },
  // Math
  taskCard: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 32,
    width: width * 0.88,
    alignItems: 'center',
    ...COLORS.shadow,
  },
  problemText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    fontSize: 28,
    backgroundColor: '#f1f5f9',
    width: '100%',
    textAlign: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    color: COLORS.text,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  // Memory
  memoryHint: {
    color: COLORS.primary,
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 300,
    height: 300,
    gap: 10,
    justifyContent: 'center',
  },
  gridButton: {
    width: 90,
    height: 90,
    backgroundColor: '#e2e8f0',
    borderRadius: 16,
  },
  gridButtonActive: {
    backgroundColor: COLORS.primary,
    ...COLORS.shadow,
    shadowColor: COLORS.primary,
  },
  // Shake
  shakeContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBg: {
    width: '85%',
    height: 40,
    backgroundColor: '#e2e8f0',
    borderRadius: 20,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 20,
  },
  shakeText: {
    marginTop: 20,
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  shakeSubText: {
    color: COLORS.textSecondary,
    marginTop: 6,
    fontSize: 14,
  },
  // Success
  successEmoji: {
    fontSize: 72,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 16,
  },
  motivation: {
    fontSize: 17,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 48,
    paddingHorizontal: 20,
    lineHeight: 26,
    fontStyle: 'italic',
  },
  startDayBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 50,
    ...COLORS.shadow,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
  },
  startDayBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
