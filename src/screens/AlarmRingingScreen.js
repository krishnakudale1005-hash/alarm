import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Animated, BackHandler, Dimensions } from 'react-native';
import { Audio } from 'expo-av';
import { COLORS } from '../constants/theme';
import { useNavigation } from '@react-navigation/native';
import { Accelerometer } from 'expo-sensors';

const { width } = Dimensions.get('window');

export default function AlarmRingingScreen({ route }) {
  const navigation = useNavigation();
  const { alarm } = route.params || {};
  
  const [taskType, setTaskType] = useState(alarm?.taskType || 'Math Problem');
  const [solved, setSolved] = useState(false);
  const soundRef = useRef(null);
  
  // Math State
  const [problem, setProblem] = useState({ math: '', answer: '' });
  const [userInput, setUserInput] = useState('');
  
  // Memory Grid State
  const [gridSequence, setGridSequence] = useState([]);
  const [userSequence, setUserSequence] = useState([]);
  const [isShowingSequence, setIsShowingSequence] = useState(false);
  const [activeButton, setActiveButton] = useState(null);

  // Shake State
  const [shakeCount, setShakeCount] = useState(0);
  const SHAKE_GOAL = 50;

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const onBackPress = () => true;
    BackHandler.addEventListener('hardwareBackPress', onBackPress);
    
    initAlarm();
    startPulse();

    return () => {
      BackHandler.removeEventListener('hardwareBackPress', onBackPress);
      stopSound();
      Accelerometer.removeAllListeners();
    };
  }, []);

  const initAlarm = async () => {
    playSound(alarm?.ringtone || 'alarm.mp3');
    
    if (taskType === 'Math Problem') {
      generateMath();
    } else if (taskType === 'Memory Game') {
      startMemoryGame();
    } else if (taskType === 'Shake to Wake') {
      startShakeDetection();
    }
  };

  const playSound = async (ringtoneName) => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      let asset;
      if (ringtoneName === 'chime.mp3') asset = require('../../assets/chime.mp3');
      else if (ringtoneName === 'digital.mp3') asset = require('../../assets/digital.mp3');
      else if (ringtoneName === 'alarm.mp3') asset = require('../../assets/alarm.mp3');
      else asset = { uri: `http://localhost:3000/uploads/${ringtoneName}` };

      const { sound } = await Audio.Sound.createAsync(asset, { shouldPlay: true, isLooping: true, volume: 1.0 });
      soundRef.current = sound;
    } catch (e) { console.log(e); }
  };

  const stopSound = async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
    }
  };

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true })
      ])
    ).start();
  };

  // --- MATH TASK ---
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

  // --- MEMORY GRID TASK ---
  const startMemoryGame = () => {
    const seq = [];
    for(let i=0; i<4; i++) seq.push(Math.floor(Math.random() * 9));
    setGridSequence(seq);
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
    
    if (idx !== gridSequence[newSeq.length - 1]) {
      setUserSequence([]);
      shakeScreen();
      showSequence(gridSequence);
      return;
    }

    if (newSeq.length === gridSequence.length) {
      completeAlarm();
    }
  };

  // --- SHAKE TASK ---
  const startShakeDetection = () => {
    Accelerometer.setUpdateInterval(100);
    Accelerometer.addListener(({ x, y, z }) => {
      const acceleration = Math.sqrt(x*x + y*y + z*z);
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

  const completeAlarm = () => {
    setSolved(true);
    stopSound();
    // In a real app, update sleep stats here
  };

  const shakeScreen = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true })
    ]).start();
  };

  if (solved) {
    return (
      <View style={[styles.container, {backgroundColor: '#fff'}]}>
        <Text style={styles.successTitle}>Good Morning! 🌅</Text>
        <Text style={styles.motivation}>"Your future is created by what you do today, not tomorrow."</Text>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('MainTabs')}>
          <Text style={styles.btnText}>Start Day</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <Text style={styles.wakeUpText}>WAKE UP!</Text>
      </Animated.View>

      <Text style={styles.instruction}>
        {taskType === 'Math Problem' ? "Solve to stop alarm:" : 
         taskType === 'Memory Game' ? "Follow the pattern:" : 
         "Shake your phone vigorously!"}
      </Text>

      <Animated.View style={{ transform: [{ translateX: shakeAnim }], width: '100%', alignItems: 'center' }}>
        {taskType === 'Math Problem' && (
          <View style={styles.taskCard}>
            <Text style={styles.problemText}>{problem.math}</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={userInput}
              onChangeText={setUserInput}
              placeholder="?"
              autoFocus
            />
            <TouchableOpacity style={styles.submitBtn} onPress={checkMath}>
              <Text style={styles.btnText}>GO</Text>
            </TouchableOpacity>
          </View>
        )}

        {taskType === 'Memory Game' && (
          <View style={styles.gridContainer}>
            {[0,1,2,3,4,5,6,7,8].map(idx => (
              <TouchableOpacity
                key={idx}
                onPress={() => handleGridPress(idx)}
                style={[
                  styles.gridButton,
                  activeButton === idx && { backgroundColor: COLORS.primary }
                ]}
              />
            ))}
          </View>
        )}

        {taskType === 'Shake to Wake' && (
          <View style={styles.shakeContainer}>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${(shakeCount/SHAKE_GOAL)*100}%` }]} />
            </View>
            <Text style={styles.shakeText}>{Math.floor((shakeCount/SHAKE_GOAL)*100)}% DONE</Text>
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
    padding: 20,
  },
  wakeUpText: {
    color: COLORS.primary,
    fontSize: 56,
    fontWeight: '900',
    marginBottom: 20,
  },
  instruction: {
    color: COLORS.textSecondary,
    fontSize: 18,
    marginBottom: 40,
    textAlign: 'center',
    fontWeight: '600',
  },
  taskCard: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 32,
    width: '90%',
    alignItems: 'center',
    ...COLORS.shadow
  },
  problemText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 20,
  },
  input: {
    fontSize: 32,
    backgroundColor: '#f1f5f9',
    width: '100%',
    textAlign: 'center',
    padding: 15,
    borderRadius: 16,
    marginBottom: 20,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 300,
    height: 300,
    gap: 10,
  },
  gridButton: {
    width: 90,
    height: 90,
    backgroundColor: '#e2e8f0',
    borderRadius: 16,
  },
  shakeContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBg: {
    width: '80%',
    height: 40,
    backgroundColor: '#e2e8f0',
    borderRadius: 20,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  shakeText: {
    marginTop: 20,
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  successTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 20,
  },
  motivation: {
    fontSize: 18,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 30,
  },
  btn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
  },
  btnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  }
});
