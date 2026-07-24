import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[theme];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
        }}
      />
    </Tabs>
  );
}
