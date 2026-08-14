import { Tabs } from 'expo-router';
import { Platform, useWindowDimensions, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { TabBarIcon } from '@/components/icons/AppIcons';
import type { IoniconName } from '@/components/icons/AppIcons';

interface TabIconProps {
  name: IoniconName;
  focused: boolean;
}

function Icon({ name, focused }: TabIconProps) {
  return <TabBarIcon name={name} focused={focused} size={24} />;
}

export default function AppTabs() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // "Media Query" style scaling based on device width
  const isTablet = width >= 768;
  const baseHeight = isTablet ? 70 : 60;
  
  // Safe padding. If Android reports 0 inset, force a minimum padding to avoid overlapping the 3-button nav.
  const paddingBottom = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'android' ? 14 : 10);
  const tabBarHeight = baseHeight + paddingBottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute', // Allows content to scroll behind the tab bar
          backgroundColor: 'rgba(10, 10, 28, 0.4)', // Slightly tinted transparent background
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.05)',
          elevation: 0, // Remove Android shadow to let blur shine
          height: tabBarHeight,
          paddingBottom: paddingBottom,
          paddingTop: isTablet ? 12 : 8,
        },
        tabBarBackground: () => (
          <BlurView
            tint="dark"
            intensity={60}
            style={StyleSheet.absoluteFill}
          />
        ),
        tabBarActiveTintColor: '#A78BFA',
        tabBarInactiveTintColor: '#4B5563',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.4,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Recordatorios',
          tabBarIcon: ({ focused }) => (
            <Icon name={focused ? 'alarm' : 'alarm-outline'} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendario',
          tabBarIcon: ({ focused }) => (
            <Icon name={focused ? 'calendar' : 'calendar-outline'} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Estadísticas',
          tabBarIcon: ({ focused }) => (
            <Icon name={focused ? 'stats-chart' : 'stats-chart-outline'} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
