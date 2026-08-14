import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import {
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
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
import { LinearGradient } from 'expo-linear-gradient';
import ConfettiCannon from 'react-native-confetti-cannon';

import { AddReminderModal } from '@/components/reminders/AddReminderModal';
import { AlarmOverlay } from '@/components/reminders/AlarmOverlay';
import { EditReminderModal } from '@/components/reminders/EditReminderModal';
import { ReminderCard } from '@/components/reminders/ReminderCard';
import { SimpleModeModal } from '@/components/reminders/SimpleModeModal';
import { useReminders, type Reminder } from '@/context/RemindersContext';
import { getGreeting, getLiveTime } from '@/utils/helpers';
import { CATEGORIES, type Category } from '@/constants/categories';

// ─── Alarm sound ──────────────────────────────────────────────────────────────
const ALARM_SOURCE = require('../../assets/audio/alarm.ogg');

// ─── Sort options ─────────────────────────────────────────────────────────────
type SortMode = 'date' | 'priority' | 'time' | 'category';
const SORT_OPTIONS: { value: SortMode; label: string; icon: string }[] = [
  { value: 'date',     label: 'Fecha',     icon: 'calendar-outline' },
  { value: 'time',     label: 'Hora',      icon: 'time-outline' },
  { value: 'priority', label: 'Prioridad', icon: 'flag-outline' },
  { value: 'category', label: 'Categoría', icon: 'pricetag-outline' },
];

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

// ─── Dynamic Background Theme ────────────────────────────────────────────────
function getGradientColors(): readonly [string, string] {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    // Morning (sunrise vibes)
    return ['#1E1B4B', '#2E1065'];
  } else if (hour >= 12 && hour < 18) {
    // Afternoon (bright)
    return ['#0F172A', '#1E1B4B'];
  } else if (hour >= 18 && hour < 21) {
    // Evening (sunset)
    return ['#2E1065', '#0F172A'];
  } else {
    // Night
    return ['#020617', '#0F172A'];
  }
}

function sortReminders(list: Reminder[], mode: SortMode, asc: boolean): Reminder[] {
  const sorted = [...list].sort((a, b) => {
    switch (mode) {
      case 'date':
        return a.date.localeCompare(b.date) || (a.hour * 60 + a.minute) - (b.hour * 60 + b.minute);
      case 'time':
        return (a.hour * 60 + a.minute) - (b.hour * 60 + b.minute);
      case 'priority':
        return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      case 'category':
        return (a.category || 'personal').localeCompare(b.category || 'personal');
      default:
        return 0;
    }
  });
  return asc ? sorted : sorted.reverse();
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
  const [simpleMode, setSimpleMode] = useState(false);
  const [liveTime, setLiveTime] = useState(getLiveTime());
  const [weather, setWeather] = useState<{ temp: string; icon: keyof typeof Ionicons.glyphMap }>({
    temp: '22°C',
    icon: 'partly-sunny',
  });

  // ── New V4 state ──
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [sortMode, setSortMode] = useState<SortMode>('date');
  const [sortAsc, setSortAsc] = useState(true);
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

  // FAB pulse animation
  const fabScale = useSharedValue(1);
  useEffect(() => {
    fabScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1,    { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);
  const fabStyle = useAnimatedStyle(() => ({ transform: [{ scale: fabScale.value }] }));

  // Mode toggle animation
  const modeScale = useSharedValue(1);
  const modeStyle = useAnimatedStyle(() => ({ transform: [{ scale: modeScale.value }] }));

  function toggleMode() {
    modeScale.value = withSpring(0.85, { damping: 5 }, () => {
      modeScale.value = withSpring(1, { damping: 10 });
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSimpleMode((v) => !v);
  }

  // Fetch real temperature from Open-Meteo
  useEffect(() => {
    async function loadWeather() {
      try {
        const res = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=19.4326&longitude=-99.1332&current_weather=true'
        );
        const data = await res.json();
        if (data.current_weather?.temperature !== undefined) {
          const t    = Math.round(data.current_weather.temperature);
          const code = data.current_weather.weathercode ?? 0;
          let iconName: keyof typeof Ionicons.glyphMap = 'partly-sunny';
          if (code === 0)                         iconName = 'sunny';
          else if (code >= 1  && code <= 3)       iconName = 'partly-sunny';
          else if (code >= 45 && code <= 48)      iconName = 'cloudy';
          else if (code >= 51)                    iconName = 'rainy';
          setWeather({ temp: `${t}°C`, icon: iconName });
        }
      } catch (_) {}
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

  // ── Filter, search, and sort ──
  const activeCount = reminders.filter((r) => r.active && !r.completedAt).length;

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

  // Sort
  filtered = sortReminders(filtered, sortMode, sortAsc);

  function handleSortPress(mode: SortMode) {
    Haptics.selectionAsync();
    if (sortMode === mode) {
      setSortAsc((v) => !v);
    } else {
      setSortMode(mode);
      setSortAsc(true);
    }
  }

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

  const bgColors = getGradientColors();

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

        {/* ── Header ── */}
      <Animated.View
        entering={FadeInDown.duration(550).springify()}
        style={{
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: 14,
          borderBottomWidth: 1,
          borderBottomColor: '#141428',
        }}
      >
        {/* Row 1: Greeting + Weather */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="partly-sunny" size={22} color="#FBBF24" />
            <Text style={{ color: '#FFF', fontSize: 20, fontWeight: '800', letterSpacing: 0.5 }}>
              {getGreeting()}
            </Text>
          </View>

          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 6,
            backgroundColor: '#1A1A2E', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
          }}>
            <Ionicons name={weather.icon} size={15} color="#FBBF24" />
            <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '700' }}>
              {weather.temp}
            </Text>
          </View>
        </View>

        {/* Row 2: Title + Simple Mode Toggle */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <Text style={{ color: '#FFFFFF', fontSize: 28, fontWeight: '900', letterSpacing: -0.5 }}>
            Mis Recordatorios
          </Text>

          {/* ── Simple / Normal Toggle ── */}
          <Animated.View style={modeStyle}>
            <TouchableOpacity
              onPress={toggleMode}
              activeOpacity={0.75}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                backgroundColor: simpleMode ? '#A78BFA22' : '#12122A',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 20,
                borderWidth: 1.5,
                borderColor: simpleMode ? '#A78BFA' : '#252550',
              }}
            >
              <Ionicons
                name={simpleMode ? 'flash' : 'options-outline'}
                size={14}
                color={simpleMode ? '#A78BFA' : '#4B5563'}
              />
              <Text style={{
                color: simpleMode ? '#A78BFA' : '#4B5563',
                fontSize: 12,
                fontWeight: '800',
                letterSpacing: 0.3,
              }}>
                {simpleMode ? 'Simple' : 'Normal'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Row 3: Live clock + active badge */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="time-outline" size={17} color="#A78BFA" />
            <Text style={{ color: '#A78BFA', fontSize: 16, fontWeight: '700', letterSpacing: 0.8 }}>
              {liveTime}
            </Text>
          </View>
          <View style={{
            backgroundColor: '#160D35', borderRadius: 20,
            paddingHorizontal: 12, paddingVertical: 5,
            borderWidth: 1, borderColor: '#2D1F5E',
            flexDirection: 'row', alignItems: 'center', gap: 6,
          }}>
            <Ionicons name="alarm-outline" size={19} color="#C084FC" />
            <Text style={{ color: '#C084FC', fontSize: 13, fontWeight: '700' }}>
              {activeCount} activos
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* ── Search Bar ── */}
      <Animated.View
        entering={FadeInDown.delay(80).springify()}
        style={{ paddingHorizontal: 18, paddingTop: 14, paddingBottom: 6 }}
      >
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 10,
          backgroundColor: '#111128',
          borderRadius: 18,
          paddingHorizontal: 16,
          paddingVertical: Platform.OS === 'ios' ? 12 : 4,
          borderWidth: 1.5,
          borderColor: searchQuery ? '#7C3AED' : '#1A1A35',
        }}>
          <Ionicons name="search" size={18} color={searchQuery ? '#A78BFA' : '#4B5563'} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar recordatorios..."
            placeholderTextColor="#2D3748"
            returnKeyType="search"
            style={{
              flex: 1,
              color: '#FFF',
              fontSize: 15,
              fontWeight: '600',
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#4B5563" />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* ── Category Filter Chips (hidden in simple mode) ── */}
      {!simpleMode && (
        <Animated.View entering={FadeInDown.delay(120).springify()}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 18, paddingVertical: 8, gap: 8 }}
          >
            {/* "All" chip */}
            <TouchableOpacity
              onPress={() => { Haptics.selectionAsync(); setCategoryFilter('all'); }}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 5,
                paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100,
                backgroundColor: categoryFilter === 'all' ? '#7C3AED22' : '#0F0F28',
                borderWidth: 1.5,
                borderColor: categoryFilter === 'all' ? '#7C3AED' : '#1A1A35',
              }}
            >
              <Ionicons name="apps-outline" size={13} color={categoryFilter === 'all' ? '#A78BFA' : '#4B5563'} />
              <Text style={{ color: categoryFilter === 'all' ? '#A78BFA' : '#4B5563', fontSize: 12, fontWeight: '700' }}>
                Todos
              </Text>
            </TouchableOpacity>

            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c.value}
                onPress={() => { Haptics.selectionAsync(); setCategoryFilter(c.value); }}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 5,
                  paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100,
                  backgroundColor: categoryFilter === c.value ? `${c.color}22` : '#0F0F28',
                  borderWidth: 1.5,
                  borderColor: categoryFilter === c.value ? c.color : '#1A1A35',
                }}
              >
                <Ionicons name={c.icon as any} size={13} color={categoryFilter === c.value ? c.color : '#4B5563'} />
                <Text style={{ color: categoryFilter === c.value ? c.color : '#4B5563', fontSize: 12, fontWeight: '700' }}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      )}

      {/* ── Sort Chips (hidden in simple mode) ── */}
      {!simpleMode && (
        <Animated.View entering={FadeInDown.delay(160).springify()}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 8, gap: 6 }}
          >
            {SORT_OPTIONS.map((opt) => {
              const active = sortMode === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => handleSortPress(opt.value)}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 4,
                    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100,
                    backgroundColor: active ? '#16163A' : 'transparent',
                    borderWidth: 1,
                    borderColor: active ? '#2D1F5E' : 'transparent',
                  }}
                >
                  <Ionicons name={opt.icon as any} size={12} color={active ? '#A78BFA' : '#374151'} />
                  <Text style={{ color: active ? '#A78BFA' : '#374151', fontSize: 11, fontWeight: '700' }}>
                    {opt.label}
                  </Text>
                  {active && (
                    <Ionicons
                      name={sortAsc ? 'arrow-up' : 'arrow-down'}
                      size={11}
                      color="#A78BFA"
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>
      )}

      {/* ── Reminders list ── */}
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
              simpleMode={simpleMode}
              onToggle={() => toggleReminder(r.id)}
              onDelete={() => deleteReminder(r.id)}
              onEdit={() => setEditingReminder(r)}
              onComplete={() => completeReminder(r.id)}
            />
          ))
        )}
      </ScrollView>

      {/* ── FAB ──
          Position is calculated from bottom using safe area insets.
          This ensures the FAB never overlaps the Android nav bar buttons
          (3-button nav) or gesture bar (swipe nav / iPhone home bar).
          
          - Samsung with 3 buttons: insets.bottom ≈ 48dp → FAB moves up
          - Gesture navigation / iPhone: insets.bottom ≈ 0-34dp → FAB adjusts
      */}
      <View style={{
        position: 'absolute',
        bottom: fabBottom,
        right: 22,
        zIndex: 50,          // Lower than splash (9999) but above content
      }}>
        <Animated.View style={fabStyle}>
          <TouchableOpacity
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowModal(true); }}
            activeOpacity={0.85}
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: simpleMode ? '#A78BFA' : '#FFFFFF',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#7C3AED',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.5,
              shadowRadius: 10,
              elevation: 8,
            }}
          >
            <Ionicons
              name={simpleMode ? 'flash' : 'add'}
              size={simpleMode ? 30 : 38}
              color={simpleMode ? '#FFF' : '#7C3AED'}
            />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* ── Simple Mode Modal ── */}
      <SimpleModeModal
        visible={showModal && simpleMode}
        onClose={() => setShowModal(false)}
        onSave={(params) => {
          addReminder(params);
          setShowModal(false);
        }}
      />

      {/* ── Advanced Add Modal ── */}
      <AddReminderModal
        visible={showModal && !simpleMode}
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