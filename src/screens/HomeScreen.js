import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { COLORS } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [bedtimeMode, setBedtimeMode] = useState(false);
  const [sleepDuration, setSleepDuration] = useState('0');

  useEffect(() => {
    if (isFocused) {
      loadData();
    }
  }, [isFocused]);

  const loadData = async () => {
    try {
      const statsRes = await fetch('http://localhost:3000/api/user/stats');
      const stats = await statsRes.json();
      if (stats.lastSleep !== undefined) setSleepDuration(stats.lastSleep.toString());
      
      const settingsRes = await fetch('http://localhost:3000/api/user/settings');
      const settings = await settingsRes.json();
      if (settings.bedtimeMode !== undefined) setBedtimeMode(settings.bedtimeMode);
    } catch (e) {
      console.log(e);
    }
  };

  const toggleBedtime = async (value) => {
    setBedtimeMode(value);
    
    let bedtimeStart = null;
    if (value) {
      bedtimeStart = new Date().getTime().toString();
    } else {
      try {
        const getRes = await fetch('http://localhost:3000/api/user/settings');
        const set = await getRes.json();
        if (set.bedtimeStart) {
          const diffHrs = ((new Date().getTime() - parseInt(set.bedtimeStart)) / (1000 * 60 * 60)).toFixed(1);
          if (parseFloat(diffHrs) > 0) {
            setSleepDuration(diffHrs);
            await fetch('http://localhost:3000/api/user/sleep', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ duration: parseFloat(diffHrs) })
            });
          }
        }
      } catch (e) { console.log(e); }
    }

    try {
      await fetch('http://localhost:3000/api/user/settings/bedtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bedtimeMode: value, bedtimeStart })
      });
    } catch (e) { console.log(e); }
  };

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const quotes = [
    "Wake up with determination. Go to bed with satisfaction.",
    "Today is a new beginning. Take a deep breath and start again.",
    "Make today your masterpiece."
  ];
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.date}>{today}</Text>
        <Text style={styles.quote}>"{randomQuote}"</Text>
      </View>

      <View style={styles.sleepCard}>
        <Text style={styles.sleepTitle}>Last Night's Sleep</Text>
        <Text style={styles.sleepDuration}>You slept {sleepDuration} hours</Text>
      </View>

      <TouchableOpacity 
        onPress={() => navigation.navigate('Alarm')}
        activeOpacity={0.8}
        style={{ marginVertical: 40 }}
      >
        <LinearGradient
          colors={[COLORS.primaryVariant, COLORS.primary]}
          start={[0, 0]}
          end={[1, 1]}
          style={styles.alarmBtn}
        >
          <Text style={styles.alarmBtnText}>SET ALARM</Text>
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.bottomSection}>
        <Text style={styles.bedtimeText}>Bedtime Mode</Text>
        <Switch
          trackColor={{ false: '#767577', true: COLORS.primaryVariant }}
          thumbColor={bedtimeMode ? COLORS.primary : '#f4f3f4'}
          onValueChange={toggleBedtime}
          value={bedtimeMode}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
    justifyContent: 'space-between',
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  date: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  quote: {
    color: COLORS.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  sleepCard: {
    backgroundColor: COLORS.card,
    padding: 30,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    ...COLORS.shadow
  },
  sleepTitle: {
    color: COLORS.textSecondary,
    fontSize: 16,
    marginBottom: 8,
  },
  sleepDuration: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: 'bold',
  },
  alarmBtn: {
    paddingVertical: 25,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    ...COLORS.shadow,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
  },
  alarmBtnText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    ...COLORS.shadow
  },
  bedtimeText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '500',
  }
});
