import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { COLORS } from '../constants/theme';
import { useIsFocused } from '@react-navigation/native';

export default function StatsScreen() {
  const isFocused = useIsFocused();
  const screenWidth = Dimensions.get('window').width;

  const [data, setData] = useState({
    avgSleep: '7.2',
    streak: 4,
    bestDay: 'None',
    worstDay: 'None',
    bestSleepVal: '0.0',
    worstSleepVal: '0.0',
    chartData: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [
        {
          data: [0, 0, 0, 0, 0, 0, 0],
        },
      ],
    }
  });

  useEffect(() => {
    if (isFocused) {
      loadStats();
    }
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
            datasets: [{ data: stats.chartData }]
          }
        });
      }
    } catch (e) {
      console.log(e);
    }
  };

  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    decimalPlaces: 1,
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Sleep Activity</Text>

      <View style={styles.streakBox}>
        <Text style={styles.streakText}>🔥 You woke up on time {data.streak} days in a row</Text>
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.sectionTitle}>7-Day Sleep Duration</Text>
        <BarChart
          data={data.chartData}
          width={screenWidth - 40}
          height={220}
          yAxisLabel=""
          yAxisSuffix="h"
          chartConfig={chartConfig}
          verticalLabelRotation={0}
          style={styles.chart}
          fromZero
        />
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Avg Sleep</Text>
          <Text style={styles.statValue}>{data.avgSleep}h</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Best Day</Text>
          <Text style={styles.statValue}>{data.bestDay}</Text>
          <Text style={styles.statSubText}>{data.bestSleepVal > 0 ? data.bestSleepVal : '0.0'}h</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Worst Day</Text>
          <Text style={styles.statValue}>{data.worstDay}</Text>
          <Text style={styles.statSubText}>{data.worstSleepVal > 0 ? data.worstSleepVal : '0.0'}h</Text>
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
    paddingTop: 60,
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  streakBox: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#f59e0b',
    padding: 15,
    borderRadius: 12,
    marginBottom: 30,
  },
  streakText: {
    color: '#b45309',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  chartContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 15,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    ...COLORS.shadow
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 16,
    marginBottom: 15,
    fontWeight: '600',
  },
  chart: {
    borderRadius: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 60,
  },
  statCard: {
    backgroundColor: COLORS.card,
    flex: 1,
    padding: 15,
    borderRadius: 16,
    marginHorizontal: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    ...COLORS.shadow
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 8,
  },
  statValue: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  statSubText: {
    color: COLORS.primary,
    fontSize: 12,
    marginTop: 4,
  }
});
