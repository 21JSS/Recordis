import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import Animated, {
  Easing,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddReminderModal } from '@/components/reminders/AddReminderModal';
import { AlarmOverlay } from '@/components/reminders/AlarmOverlay';
import { EditReminderModal } from '@/components/reminders/EditReminderModal';
import { ReminderCard } from '@/components/reminders/ReminderCard';

// Nuevos componentes refactorizados
import { HomeHeader } from '@/components/home/HomeHeader';
import { SearchBar } from '@/components/home/SearchBar';
import { CategoryChips } from '@/components/home/CategoryChips';
import { FAB } from '@/components/home/FAB';

import { CATEGORIES, type Category } from '@/constants/categories';
import { useReminders, type Reminder } from '@/context/RemindersContext';
import { getLiveTime, todayISO } from '@/utils/helpers';

// ─── Alarm sound ──────────────────────────────────────────────────────────────
const ALARM_SOURCE = require('../../assets/audio/alarm.ogg');

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

// ─── Premium Themes (Day / Night) ───────────────────────────────────────────
function getGradientColors(isDaytime: boolean): readonly [string, string] {
  // Original deep purple theme
  return ['#1A0B2E', '#0B0514'];
}



function sortRemindersTimeline(list: Reminder[]): Reminder[] {
  // Ordenar siempre como Timeline (por fecha y luego por hora)
  const sorted = [...list].sort((a, b) => {
    return a.date.localeCompare(b.date) || (a.hour * 60 + a.minute) - (b.hour * 60 + b.minute);
  });
  return sorted;
}

// ─── Home Screen ──────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const {
    reminders,
    addReminder,
    editReminder,
    deleteReminder,
    toggleReminder,
    completeReminder,
    dismissAlarm,
    snoozeReminder,
    ringingReminder,
  } = useReminders();

  const [showModal, setShowModal] = useState(false);
  const [liveTime, setLiveTime] = useState(getLiveTime());
  const [weather, setWeather] = useState<{ temp: string; icon: keyof typeof Ionicons.glyphMap }>({
    temp: '22°C',
    icon: 'partly-sunny',
  });

  // ── New V4 state ──
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);

  // ─── Safe area insets (auto-detects Android nav bar, iPhone home bar, etc) ──
  const insets = useSafeAreaInsets();

  // FAB positioned above tab bar:
  // Tab bar is 70dp tall + safe area bottom inset
  // Reduced margin (4dp instead of 16dp) so FAB is closer to the tab bar
  const fabBottom = insets.bottom + 70 + 4;

  // Extra scroll padding to ensure last item is not hidden behind tab bar
  const scrollPaddingBottom = insets.bottom + 70 + 100;

  // ── Confetti gamification ──
  const [showConfetti, setShowConfetti] = useState(false);
  const prevActiveCount = useRef(-1);

  // Sound ref
  const soundRef = useRef<Audio.Sound | null>(null);
  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch real temperature from Open-Meteo ──
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
      } catch (_) { }
    }
    loadWeather();
  }, []);

  // Live clock — updates every second
  useEffect(() => {
    clockRef.current = setInterval(() => setLiveTime(getLiveTime()), 1000);
    return () => { if (clockRef.current) clearInterval(clockRef.current); };
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
          } catch (_) { }
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

  // ── Filter, search, and sort ──
  const activeCount = reminders.filter((r) => r.active && !r.completedAt).length;
  
  const todayStr = todayISO();
  const totalTodayCount = reminders.filter(r => r.date === todayStr || r.repeat !== 'none').length;
  const completedTodayCount = reminders.filter(r => r.completedAt && r.completedAt.startsWith(todayStr)).length;

  let filtered = reminders;

  // Category filter
  if (categoryFilter !== 'all') {
    filtered = filtered.filter((r) => (r.category || 'personal') === categoryFilter);
  }

  // Search filter
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.notes && r.notes.toLowerCase().includes(q))
    );
  }

  // Sort Timeline (Always Date + Time)
  filtered = sortRemindersTimeline(filtered);

  // Confetti effect trigger
  useEffect(() => {
    if (prevActiveCount.current > 0 && activeCount === 0) {
      // User just completed their last active reminder!
      setShowConfetti(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => setShowConfetti(false), 5000);
    }
    prevActiveCount.current = activeCount;
  }, [activeCount]);

  const isDaytime = useMemo(() => {
    const h = new Date().getHours();
    return h >= 6 && h < 18;
  }, [liveTime]);

  const bgColors = getGradientColors(isDaytime);

  return (
    <View style={{ flex: 1, backgroundColor: bgColors[0] }}>
      <LinearGradient
        colors={bgColors}
        style={{ position: 'absolute', width: '100%', height: '100%' }}
      />
      <SafeAreaView
        style={{ flex: 1 }}
        edges={['top', 'left', 'right']}
      >
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent={true}
        />

        {/* ── Encabezado principal (Saludo, Clima, Reloj, Progreso) ── */}
        <HomeHeader
          weather={weather}
          liveTime={liveTime}
          activeCount={activeCount}
          totalTodayCount={totalTodayCount}
          completedTodayCount={completedTodayCount}
        />

        {/* ── Barra de Búsqueda ── */}
        <SearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* ── Chips de Categorías ── */}
        <CategoryChips
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
        />

        {/* ── Lista de Recordatorios ── */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 18,
            paddingTop: 8,
            // SAFE AREA FIX: enough bottom padding so last card isn't behind tab bar
            paddingBottom: scrollPaddingBottom,
          }}
          showsVerticalScrollIndicator={false}
          // ANDROID TOUCH FIX: these three are critical for smooth scroll on physical devices
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
          overScrollMode="always"
          bounces={Platform.OS === 'ios'}
        >
          {filtered.length === 0 ? (
            <Animated.View
              entering={FadeInUp.delay(200).springify()}
              style={{ alignItems: 'center', marginTop: 72 }}
            >
              <View style={{
                width: 100, height: 100, borderRadius: 50,
                backgroundColor: '#111128',
                alignItems: 'center', justifyContent: 'center',
                borderWidth: 1.5, borderColor: '#2D1F5E',
                marginBottom: 20,
              }}>
                <Ionicons name={searchQuery ? 'search-outline' : 'alarm-outline'} size={48} color="#2D1F5E" />
              </View>
              <Text style={{ color: '#4B5563', fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 6 }}>
                {searchQuery ? 'Sin resultados' : 'Sin recordatorios'}
              </Text>
              <Text style={{ color: '#1F2937', fontSize: 14, textAlign: 'center' }}>
                {searchQuery ? `No hay recordatorios que coincidan con "${searchQuery}"` : 'Toca el botón + para crear uno'}
              </Text>
            </Animated.View>
          ) : (
            filtered.map((r, i) => (
              <ReminderCard
                key={r.id}
                reminder={r}
                index={i}
                onToggle={() => toggleReminder(r.id)}
                onDelete={() => deleteReminder(r.id)}
                onEdit={() => setEditingReminder(r)}
                onComplete={() => completeReminder(r.id)}
              />
            ))
          )}
        </ScrollView>
        {/* ── Botón Flotante Animado ── */}
        {!showModal && !editingReminder && (
          <FAB
            fabBottom={fabBottom}
            onPress={() => setShowModal(true)}
          />
        )}

        {/* ── Add Reminder Modal (Progressive Disclosure) ── */}
        <AddReminderModal
          visible={showModal}
          onClose={() => setShowModal(false)}
          onSave={(params) => {
            addReminder(params);
            setShowModal(false);
          }}
        />

        {/* ── Edit Modal ── */}
        <EditReminderModal
          visible={!!editingReminder}
          reminder={editingReminder}
          onClose={() => setEditingReminder(null)}
          onSave={(id, params) => {
            editReminder(id, params);
            setEditingReminder(null);
          }}
        />

        {/* ── Alarm Overlay ── */}
        <AlarmOverlay
          reminder={ringingReminder}
          onDismiss={dismissAlarm}
          onSnooze={() => ringingReminder && snoozeReminder(ringingReminder.id)}
        />

        {showConfetti && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }} pointerEvents="none">
            <ConfettiCannon count={150} origin={{ x: -10, y: 0 }} fallSpeed={3000} fadeOut />
            <ConfettiCannon count={150} origin={{ x: 400, y: 0 }} fallSpeed={3000} fadeOut />
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}