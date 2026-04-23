import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { NavigationContainer, DefaultTheme, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import AlarmSetScreen from './src/screens/AlarmSetScreen';
import ClockScreen from './src/screens/ClockScreen';
import StatsScreen from './src/screens/StatsScreen';
import AlarmRingingScreen from './src/screens/AlarmRingingScreen';

import { COLORS } from './src/constants/theme';
import { getAlarms } from './src/services/StorageService';
import { registerBackgroundAlarmCheck, getBackgroundFetchStatus } from './src/services/AlarmScheduler';
import { doesAlarmMatchNow, shouldFireToday } from './src/utils/alarmUtils';

// Native-only imports
let Notifications = null;
let BackgroundFetch = null;
if (Platform.OS !== 'web') {
  Notifications   = require('expo-notifications');
  BackgroundFetch = require('expo-background-fetch');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}



const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
export const navigationRef = createNavigationContainerRef();

const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.primary,
    background: COLORS.background,
    card: COLORS.surface,
    text: COLORS.text,
    border: '#e2e8f0',
  },
};

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e2e8f0',
          borderTopWidth: 1,
          height: 65,
          paddingBottom: 10,
          paddingTop: 5,
          ...COLORS.shadow,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Home')  iconName = 'home';
          else if (route.name === 'Alarm') iconName = 'alarm';
          else if (route.name === 'Clock') iconName = 'time';
          else if (route.name === 'Stats') iconName = 'bar-chart';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home"  component={HomeScreen}  options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Alarm" component={AlarmSetScreen} options={{ tabBarLabel: 'Alarms' }} />
      <Tab.Screen name="Clock" component={ClockScreen} options={{ tabBarLabel: 'Clock' }} />
      <Tab.Screen name="Stats" component={StatsScreen} options={{ tabBarLabel: 'Stats' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [bgWarning, setBgWarning] = useState(false);

  useEffect(() => {
    // Request notification permissions (native only)
    if (Platform.OS !== 'web' && Notifications) {
      Notifications.requestPermissionsAsync().then(({ status }) => {
        if (status !== 'granted') {
          alert('WakeLock needs notification permissions to ring alarms.');
        }
      });
    }

    // Register background alarm check task (native only)
    registerBackgroundAlarmCheck();

    // Check background fetch status (native only)
    if (Platform.OS !== 'web') {
      (async () => {
        try {
          const status = await getBackgroundFetchStatus();
          if (BackgroundFetch &&
             (status === BackgroundFetch.BackgroundFetchStatus.Denied ||
              status === BackgroundFetch.BackgroundFetchStatus.Restricted)) {
            setBgWarning(true);
          }
        } catch (e) {}
      })();
    }

    // Notification listeners (native only)
    let sub1 = null, sub2 = null;
    if (Platform.OS !== 'web' && Notifications) {
      sub1 = Notifications.addNotificationReceivedListener((notification) => {
        const alarmData = notification.request.content.data?.alarm;
        if (navigationRef.isReady()) {
          navigationRef.navigate('AlarmRinging', { alarm: alarmData || {} });
        }
      });
      sub2 = Notifications.addNotificationResponseReceivedListener((response) => {
        const alarmData = response.notification.request.content.data?.alarm;
        if (navigationRef.isReady()) {
          navigationRef.navigate('AlarmRinging', { alarm: alarmData || {} });
        }
      });
    }

    // Foreground alarm poller — checks every 5 seconds using LOCAL storage
    let lastTriggeredMinute = '';

    const foregroundPoller = setInterval(async () => {
      try {
        const now = new Date();
        const currentMinute = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        if (currentMinute === lastTriggeredMinute) return;

        const alarms = await getAlarms();
        const triggeringAlarm = alarms.find(a =>
          a.enabled &&
          doesAlarmMatchNow(a.time, now) &&
          shouldFireToday(a.repeatDays || '', now)
        );

        if (triggeringAlarm) {
          lastTriggeredMinute = currentMinute;
          if (navigationRef.isReady()) {
            navigationRef.navigate('AlarmRinging', { alarm: triggeringAlarm });
          }
        }
      } catch (e) {}
    }, 5000);

    return () => {
      if (sub1) sub1.remove();
      if (sub2) sub2.remove();
      clearInterval(foregroundPoller);
    };
  }, []);

  return (
    <NavigationContainer ref={navigationRef} theme={AppTheme}>
      <StatusBar style="dark" />
      {bgWarning && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>
            ⚠️ Background permissions not granted. Alarms may not fire when app is closed.
          </Text>
        </View>
      )}
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        <Stack.Screen
          name="AlarmRinging"
          component={AlarmRingingScreen}
          options={{ presentation: 'fullScreenModal', gestureEnabled: false, animation: 'fade' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  warningBanner: {
    backgroundColor: '#fef3c7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#fde68a',
  },
  warningText: {
    color: '#92400e',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
