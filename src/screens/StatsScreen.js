import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { COLORS } from '../constants/theme';
import { useIsFocused } from '@react-navigation/native';

export default function StatsScreen() {
  const isFocused = useIsFocused();
  const screenWidth = Dimensions.get('window').width;

  const [data, setData] = useState({
    avgSleep: '0.0',
    streak: 0,
    bestDay: 'None',
    worstDay: 'None',
    bestSleepVal: '0.0',
    worstSleepVal: '0.0',
    chartData: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }],
    },
  });

  useEffect(() => {
    if (isFocused) loadStats();
  }, [isFocused]);

  const loadStats = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/user/stats');
      const stats = await res.json();

      if (stats.chartData) {
        setData({
          avgSleep: stats.avgSleep || '0.0',
          streak: stats.streak || 0,
          bestDay: stats.bestDay || 'None',
          worstDay: stats.worstDay || 'None',
          bestSleepVal: stats.bestSleepVal || '0.0',
          worstSleepVal: stats.worstSleepVal || '0.0',
          chartData: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{ data: stats.chartData }],
          },
        });
      }
    } catch (e) {
      console.log('Stats load error:', e);
    }
  };

  // FIX: parse strings to floats before comparison
  const bestVal = parseFloat(data.bestSleepVal) || 0;
  const worstVal = parseFloat(data.worstSleepVal) || 0;
  const avgVal = parseFloat(data.avgSleep) || 0;

  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.6,
    decimalPlaces: 1,
    propsForBackgroundLines: {
      stroke: '#f1f5f9',
    },
  };

  const getSleepQuality = (hours) => {
    if (hours >= 8) return { label: 'Excellent', color: '#10b981' };
    if (hours >= 7) return { label: 'Good', color: '#6366f1' };
    if (hours >= 6) return { label: 'Fair', color: '#f59e0b' };
    return { label: 'Poor', color: '#ef4444' };
  };

  const quality = getSleepQuality(avgVal);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Sleep Stats</Text>

      {/* Streak Banner */}
      <View style={styles.streakBox}>
        <Text style={styles.streakEmoji}>🔥</Text>
        <View>
          <Text style={styles.streakNum}>{data.streak} Day Streak</Text>
          <Text style={styles.streakSub}>You woke up on time!</Text>
        </View>
      </View>

      {/* Quality Indicator */}
      <View style={styles.qualityCard}>
        <Text style={styles.qualityLabel}>Sleep Quality</Text>
        <Text style={[styles.qualityValue, { color: quality.color }]}>{quality.label}</Text>
        <Text style={styles.qualityAvg}>Avg {avgVal.toFixed(1)} hrs / night</Text>
      </View>

      {/* Chart */}
      <View style={styles.chartContainer}>
        <Text style={styles.sectionTitle}>7-Day Sleep Duration</Text>
        <BarChart
          data={data.chartData}
          width={screenWidth - 72}
          height={200}
          yAxisLabel=""
          yAxisSuffix="h"
          chartConfig={chartConfig}
          verticalLabelRotation={0}
          style={styles.chart}
          fromZero
          showValuesOnTopOfBars
        />
      </View>

      {/* Stat Cards */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>⭐</Text>
          <Text style={styles.statLabel}>Best</Text>
          {/* FIX: use parseFloat() not string comparison */}
          <Text style={styles.statValue}>{bestVal > 0 ? `${bestVal.toFixed(1)}h` : '--'}</Text>
          <Text style={styles.statSubText}>{bestVal > 0 ? data.bestDay : 'N/A'}</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>📊</Text>
          <Text style={styles.statLabel}>Average</Text>
          <Text style={styles.statValue}>{avgVal > 0 ? `${avgVal.toFixed(1)}h` : '--'}</Text>
          <Text style={styles.statSubText}>Per night</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>📉</Text>
          <Text style={styles.statLabel}>Worst</Text>
          {/* FIX: use parseFloat() not string comparison */}
          <Text style={styles.statValue}>{worstVal > 0 ? `${worstVal.toFixed(1)}h` : '--'}</Text>
          <Text style={styles.statSubText}>{worstVal > 0 ? data.worstDay : 'N/A'}</Text>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  title: {
    color: COLORS.text,
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  streakBox: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  streakEmoji: {
    fontSize: 32,
  },
  streakNum: {
    color: '#92400e',
    fontSize: 18,
    fontWeight: 'bold',
  },
  streakSub: {
    color: '#b45309',
    fontSize: 13,
    marginTop: 2,
  },
  qualityCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    ...COLORS.shadow,
  },
  qualityLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  qualityValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  qualityAvg: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  chartContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    ...COLORS.shadow,
    overflow: 'hidden',
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chart: {
    borderRadius: 12,
    marginLeft: -16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  statCard: {
    backgroundColor: COLORS.card,
    flex: 1,
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    ...COLORS.shadow,
  },
  statEmoji: {
    fontSize: 22,
    marginBottom: 6,
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  statSubText: {
    color: COLORS.primary,
    fontSize: 11,
    marginTop: 3,
    textAlign: 'center',
  },
});
