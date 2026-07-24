import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import "../../global.css";

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { RemindersProvider } from '@/context/RemindersContext';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <RemindersProvider>
        <AnimatedSplashOverlay />
        <AppTabs />
      </RemindersProvider>
    </ThemeProvider>
  );
}
