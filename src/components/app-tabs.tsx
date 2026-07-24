import { Tabs } from 'expo-router';
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
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0A0A1C',
          borderTopWidth: 1,
          borderTopColor: '#1A1A30',
          paddingBottom: 10,
          paddingTop: 8,
          height: 70,
        },
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
