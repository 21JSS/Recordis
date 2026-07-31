import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();

  /**
   * AUTOMATIC SAFE AREA DETECTION:
   *
   * useSafeAreaInsets() reads the actual device insets:
   *   - Samsung / Android 3-button nav:  insets.bottom ≈ 48dp
   *   - Android gesture navigation:      insets.bottom ≈ 0-28dp
   *   - iPhone with home bar (Face ID):  insets.bottom ≈ 34pt
   *   - iPhone with home button:         insets.bottom ≈ 0pt
   *
   * The tab bar height = fixed content height (56dp) + insets.bottom
   * paddingBottom = insets.bottom + small visual margin (6dp)
   *
   * This means:
   * - On Samsung with 3-button nav: paddingBottom ≈ 54dp, height ≈ 104dp
   * - On gesture Android / iPhone:  paddingBottom ≈ 6-40dp, height ≈ 56-90dp
   * - All buttons remain fully clickable above the system nav bar
   */
  const TAB_CONTENT_HEIGHT = 56;
  const tabBarHeight = TAB_CONTENT_HEIGHT + insets.bottom;
  const tabBarPaddingBottom = insets.bottom > 0 ? insets.bottom + 6 : 10;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0A0A1C',
          borderTopWidth: 1,
          borderTopColor: '#1A1A30',
          // Height automatically adapts to the device nav bar
          height: tabBarHeight,
          // Padding above the system nav bar
          paddingBottom: tabBarPaddingBottom,
          paddingTop: 8,
          // Ensure the tab bar sits above the Android nav bar
          ...(Platform.OS === 'android' && {
            elevation: 20,
          }),
        },
        tabBarActiveTintColor: '#A78BFA',
        tabBarInactiveTintColor: '#4B5563',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.4,
          marginTop: 2,
        },
        // Let the tab bar background fill behind the navigation bar
        tabBarBackground: undefined,
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
      {/* Explicitly hide explore tab */}
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
