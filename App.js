import React, { useEffect } from 'react';
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

import * as Notifications from 'expo-notifications';
import { COLORS } from './src/constants/theme';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

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
  useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('WakeLock needs notification permissions to ring alarms.');
      }
    };
    requestPermissions();

    const sub1 = Notifications.addNotificationReceivedListener(() => {
      if (navigationRef.isReady()) {
        navigationRef.navigate('AlarmRinging');
      }
    });

    const sub2 = Notifications.addNotificationResponseReceivedListener(() => {
      if (navigationRef.isReady()) {
        navigationRef.navigate('AlarmRinging');
      }
    });

    let lastTriggeredMinute = '';

    const webPoller = setInterval(async () => {
      try {
        const now = new Date();
        const currentMinute = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        if (currentMinute === lastTriggeredMinute) return;

        const res = await fetch('http://localhost:3000/api/alarms');
        const alarms = await res.json();

        const triggeringAlarm = alarms.find(a => a.enabled && a.time === currentMinute);

        if (triggeringAlarm) {
          lastTriggeredMinute = currentMinute;
          if (navigationRef.isReady()) {
            navigationRef.navigate('AlarmRinging', { alarm: triggeringAlarm });
          }
        }
      } catch (e) {}
    }, 5000);

    return () => {
      sub1.remove();
      sub2.remove();
      clearInterval(webPoller);
    };
  }, []);

  return (
    <NavigationContainer ref={navigationRef} theme={AppTheme}>
      <StatusBar style="dark" />
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
