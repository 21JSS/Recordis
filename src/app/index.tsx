import { Audio } from 'expo-av';
import { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { useReminders } from '@/context/RemindersContext';
import { ReminderCard } from '@/components/reminders/ReminderCard';
import { AddReminderModal } from '@/components/reminders/AddReminderModal';
import { AlarmOverlay } from '@/components/reminders/AlarmOverlay';
import { AppIcon } from '@/components/icons/AppIcons';
import { getLiveTime, getGreeting } from '@/utils/helpers';

// ─── Alarm sound ──────────────────────────────────────────────────────────────
const ALARM_SOURCE = require('../../assets/audio/alarm.ogg');

// ─── Home Screen ──────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { reminders, addReminder, deleteReminder, toggleReminder, dismissAlarm, snoozeReminder, ringingReminder } =
    useReminders();
  const [showModal, setShowModal] = useState(false);
  const [liveTime, setLiveTime] = useState(getLiveTime());
  const [weather, setWeather] = useState<{ temp: string; icon: keyof typeof Ionicons.glyphMap }>({
    temp: '22°C',
    icon: 'partly-sunny',
  });

  // Sound ref
  const soundRef = useRef<Audio.Sound | null>(null);
  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // FAB pulse / latido animation
  const fabScale = useSharedValue(1);
  useEffect(() => {
    fabScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);
  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  // Fetch real temperature from Open-Meteo
  useEffect(() => {
    async function loadWeather() {
      try {
        const res = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=19.4326&longitude=-99.1332&current_weather=true'
        );
        const data = await res.json();
        if (data.current_weather?.temperature !== undefined) {
          const t = Math.round(data.current_weather.temperature);
          const code = data.current_weather.weathercode ?? 0;
          let iconName: keyof typeof Ionicons.glyphMap = 'partly-sunny';
          if (code === 0) iconName = 'sunny';
          else if (code >= 1 && code <= 3) iconName = 'partly-sunny';
          else if (code >= 45 && code <= 48) iconName = 'cloudy';
          else if (code >= 51) iconName = 'rainy';
          setWeather({ temp: `${t}°C`, icon: iconName });
        }
      } catch (_) {}
    }
    loadWeather();
  }, []);



  // Live clock — updates every second
  useEffect(() => {
    clockRef.current = setInterval(() => setLiveTime(getLiveTime()), 1000);
    return () => {
      if (clockRef.current) clearInterval(clockRef.current);
    };
  }, []);

  // Alarm sound
  useEffect(() => {
    let mounted = true;
    async function update() {
      if (ringingReminder) {
        try {
          if (soundRef.current) await soundRef.current.unloadAsync();
          const { sound } = await Audio.Sound.createAsync(ALARM_SOURCE, {
            isLooping: true,
            shouldPlay: true,
          });
          if (mounted) soundRef.current = sound;
          else await sound.unloadAsync();
        } catch (e) {
          console.log('Alarm sound error:', e);
        }
      } else {
        if (soundRef.current) {
          try {
            await soundRef.current.stopAsync();
            await soundRef.current.unloadAsync();
          } catch (_) {}
          soundRef.current = null;
        }
      }
    }
    update();
    return () => {
      mounted = false;
      soundRef.current?.unloadAsync();
    };
  }, [ringingReminder?.id]);

  const activeCount = reminders.filter((r) => r.active).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#080816' }}>
      <StatusBar barStyle="light-content" backgroundColor="#080816" />

      {/* ── Header ── */}
      <Animated.View
        entering={FadeInDown.duration(550).springify()}
        style={{
          paddingHorizontal: 24,
          paddingTop: 18,
          paddingBottom: 14,
          borderBottomWidth: 1,
          borderBottomColor: '#141428',
        }}
      >
        {/* Greeting & Weather */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="partly-sunny" size={24} color="#FBBF24" />
            <Text
              style={{
                color: '#FFF',
                fontSize: 22,
                fontWeight: '800',
                letterSpacing: 0.5,
              }}
            >
              {getGreeting()}
            </Text>
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1A1A2E', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}>
            <Ionicons name={weather.icon} size={16} color="#FBBF24" />
            <Text style={{ color: '#A78BFA', fontSize: 14, fontWeight: '700' }}>
              {weather.temp}
            </Text>
          </View>
        </View>

        <Text
          style={{
            color: '#FFFFFF',
            fontSize: 30,
            fontWeight: '900',
            letterSpacing: -0.5,
            marginBottom: 10,
          }}
        >
          Mis Recordatorios
        </Text>

        {/* Live clock + badge */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="time-outline" size={18} color="#A78BFA" />
            <Text
              style={{
                color: '#A78BFA',
                fontSize: 17,
                fontWeight: '700',
                letterSpacing: 0.8,
              }}
            >
              {liveTime}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: '#160D35',
              borderRadius: 20,
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderWidth: 1,
              borderColor: '#2D1F5E',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Ionicons name="alarm-outline" size={13} color="#C084FC" />
            <Text style={{ color: '#C084FC', fontSize: 13, fontWeight: '700' }}>
              {activeCount} activos
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* ── Reminders list ── */}
      <ScrollView
        style={{ flex: 1, paddingHorizontal: 18 }}
        contentContainerStyle={{ paddingBottom: 140, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {reminders.length === 0 ? (
          <Animated.View
            entering={FadeInUp.delay(200).springify()}
            style={{ alignItems: 'center', marginTop: 72 }}
          >
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: '#111128',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1.5,
                borderColor: '#2D1F5E',
                marginBottom: 20,
              }}
            >
              <Ionicons name="alarm-outline" size={48} color="#2D1F5E" />
            </View>
            <Text
              style={{
                color: '#4B5563',
                fontSize: 18,
                fontWeight: '700',
                textAlign: 'center',
                marginBottom: 6,
              }}
            >
              Sin recordatorios
            </Text>
            <Text style={{ color: '#1F2937', fontSize: 14, textAlign: 'center' }}>
              Toca el botón + para crear uno
            </Text>
          </Animated.View>
        ) : (
          reminders.map((r, i) => (
            <ReminderCard
              key={r.id}
              reminder={r}
              index={i}
              onToggle={() => toggleReminder(r.id)}
              onDelete={() => deleteReminder(r.id)}
            />
          ))
        )}
      </ScrollView>

      {/* ── FAB ── */}
      <View style={{ position: 'absolute', bottom: 32, right: 22, zIndex: 100 }}>
        <Animated.View style={fabStyle}>
          <TouchableOpacity
            onPress={() => setShowModal(true)}
            activeOpacity={0.85}
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: '#7C3AED',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#7C3AED',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.5,
              shadowRadius: 10,
              elevation: 8,
            }}
          >
            <Ionicons name="add" size={34} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* ── Add Modal ── */}
      <AddReminderModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSave={(params) => {
          addReminder(params);
          setShowModal(false);
        }}
      />

      {/* ── Alarm Overlay ── */}
      <AlarmOverlay
        reminder={ringingReminder}
        onDismiss={dismissAlarm}
        onSnooze={() => ringingReminder && snoozeReminder(ringingReminder.id)}
      />
    </SafeAreaView>
  );
}