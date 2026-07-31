import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import "../../global.css";

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { RemindersProvider } from '@/context/RemindersContext';
import { useEffect } from 'react';
import { requestNotificationPermissions } from '@/utils/notifications';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();

  // Request notification permissions on app start
  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <RemindersProvider>
          <AnimatedSplashOverlay />
          <AppTabs />
        </RemindersProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
