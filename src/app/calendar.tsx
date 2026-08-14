import { useState } from 'react';
import {
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInRight, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { useReminders } from '@/context/RemindersContext';
import { CalendarGrid } from '@/components/calendar/CalendarGrid';
import {
  buildCalendarCells,
  dateISO,
  MONTH_NAMES,
  formatTime,
} from '@/utils/helpers';
import { categoryColor, categoryIcon, categoryLabel } from '@/constants/categories';

// ─── Calendar Screen ──────────────────────────────────────────────────────────
export default function CalendarScreen() {
  const { reminders } = useReminders();
  const today = new Date();

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number>(today.getDate());

  // Build calendar grid cells
  const cells = buildCalendarCells(viewYear, viewMonth);
  const monthKey = `${viewYear}-${viewMonth}`;

  // Is this the current real month?
  const isCurrentMonth =
    viewYear === today.getFullYear() && viewMonth === today.getMonth();
  const todayDay = isCurrentMonth ? today.getDate() : null;

  const monthPrefix = dateISO(viewYear, viewMonth, 1).slice(0, 7); // YYYY-MM
  const monthReminders = reminders.filter((r) => r.date?.startsWith(monthPrefix));

  // Which days in this month have reminders?
  const daysWithReminders = new Set(
    monthReminders
      .map((r) => parseInt(r.date.split('-')[2], 10))
      .filter((d) => d > 0)
  );

  // Map day → array of reminder colors (for colored dots)
  const reminderColors = new Map<number, string[]>();
  monthReminders.forEach((r) => {
    const d = parseInt(r.date.split('-')[2], 10);
    if (d > 0) {
      const existing = reminderColors.get(d) ?? [];
      reminderColors.set(d, [...existing, r.color ?? '#A78BFA']);
    }
  });

  // Reminders for the selected day
  const selectedISO = dateISO(viewYear, viewMonth, selectedDay);
  const selectedReminders = reminders.filter((r) => r.date === selectedISO);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
    setSelectedDay(1);
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
    setSelectedDay(1);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#080816' }}>
      <StatusBar barStyle="light-content" backgroundColor="#080816" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* ── Header ── */}
        <Animated.View
          entering={FadeInDown.duration(500).springify()}
          style={{
            paddingHorizontal: 24,
            paddingTop: 18,
            paddingBottom: 14,
            borderBottomWidth: 1,
            borderBottomColor: '#141428',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <Ionicons name="calendar-outline" size={14} color="#7C3AED" />
            <Text
              style={{
                color: '#7C3AED',
                fontSize: 12,
                fontWeight: '700',
                letterSpacing: 1.5,
                textTransform: 'uppercase',
              }}
            >
              Calendario
            </Text>
          </View>
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 30,
              fontWeight: '900',
              letterSpacing: -0.5,
            }}
          >
            Mis Fechas
          </Text>
        </Animated.View>

        {/* ── Month navigation ── */}
        <Animated.View
          entering={FadeInDown.delay(80).springify()}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 24,
            paddingVertical: 18,
          }}
        >
          <TouchableOpacity
            onPress={prevMonth}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: '#111128',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: '#2D1F5E',
            }}
          >
            <Ionicons name="chevron-back" size={22} color="#A78BFA" />
          </TouchableOpacity>

          <View style={{ alignItems: 'center' }}>
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 22,
                fontWeight: '900',
                letterSpacing: -0.3,
              }}
            >
              {MONTH_NAMES[viewMonth]}
            </Text>
            <Text style={{ color: '#6B7280', fontSize: 14, fontWeight: '600' }}>
              {viewYear}
            </Text>
          </View>

          <TouchableOpacity
            onPress={nextMonth}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: '#111128',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: '#2D1F5E',
            }}
          >
            <Ionicons name="chevron-forward" size={22} color="#A78BFA" />
          </TouchableOpacity>
        </Animated.View>

        {/* ── Calendar grid ── */}
        <CalendarGrid
          cells={cells}
          monthKey={monthKey}
          selectedDay={selectedDay}
          todayDay={todayDay}
          daysWithReminders={daysWithReminders}
          reminderColors={reminderColors}
          onDayPress={setSelectedDay}
        />

        {/* ── Selected day reminder list ── */}
        <Animated.View
          entering={FadeInUp.delay(250).springify()}
          style={{ marginTop: 28, paddingHorizontal: 18 }}
        >
          {/* Section divider */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <View style={{ flex: 1, height: 1, backgroundColor: '#141428' }} />
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                marginHorizontal: 12,
              }}
            >
              <Ionicons name="list" size={14} color="#A78BFA" />
              <Text
                style={{
                  color: '#A78BFA',
                  fontSize: 12,
                  fontWeight: '700',
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                }}
              >
                {selectedDay} de {MONTH_NAMES[viewMonth]}
              </Text>
            </View>
            <View style={{ flex: 1, height: 1, backgroundColor: '#141428' }} />
          </View>

          {selectedReminders.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 36 }}>
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: '#111128',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: '#1A1A35',
                  marginBottom: 14,
                }}
              >
                <Ionicons name="calendar-outline" size={32} color="#1F2937" />
              </View>
              <Text
                style={{
                  color: '#374151',
                  fontSize: 15,
                  fontWeight: '600',
                  textAlign: 'center',
                }}
              >
                Sin recordatorios este día
              </Text>
            </View>
          ) : (
            selectedReminders.map((r, i) => {
              const isCompleted = !!r.completedAt;
              const catColor = categoryColor(r.category || 'personal');
              const catIconName = categoryIcon(r.category || 'personal');
              const catLbl = categoryLabel(r.category || 'personal');

              return (
                <Animated.View
                  key={r.id}
                  entering={FadeInDown.delay(i * 50).duration(400)}
                  style={{
                    backgroundColor: isCompleted ? '#0A0F0A' : '#111128',
                    borderRadius: 18,
                    padding: 16,
                    marginBottom: 12,
                    borderWidth: 1.5,
                    borderColor: isCompleted ? '#1A3A1A' : '#2D1F5E',
                    flexDirection: 'row',
                    alignItems: 'center',
                    opacity: isCompleted ? 0.7 : 1,
                  }}
                >
                  {/* Time pill */}
                  <View
                    style={{
                      backgroundColor: '#160D35',
                      borderRadius: 12,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      marginRight: 14,
                      borderWidth: 1,
                      borderColor: '#3B1A6B',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="time" size={14} color="#7C3AED" style={{ marginBottom: 2 }} />
                    <Text
                      style={{
                        color: '#A78BFA',
                        fontSize: 14,
                        fontWeight: '900',
                        textAlign: 'center',
                        textDecorationLine: isCompleted ? 'line-through' : 'none',
                      }}
                    >
                      {formatTime(r.hour, r.minute)}
                    </Text>
                  </View>

                  {/* Info */}
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: isCompleted ? '#4B5563' : '#E5E7EB',
                        fontSize: 15,
                        fontWeight: '700',
                        textDecorationLine: isCompleted ? 'line-through' : 'none',
                      }}
                      numberOfLines={1}
                    >
                      {r.title}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 }}>
                      {/* Status dot */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <View
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: 4,
                            backgroundColor: isCompleted ? '#10B981' : r.active ? '#10B981' : '#EF4444',
                          }}
                        />
                        <Text
                          style={{
                            color: isCompleted ? '#10B981' : r.active ? '#10B981' : '#EF4444',
                            fontSize: 11,
                            fontWeight: '600',
                          }}
                        >
                          {isCompleted ? 'Completado' : r.active ? 'Activo' : 'Inactivo'}
                        </Text>
                      </View>

                      {/* Category badge */}
                      <View style={{
                        flexDirection: 'row', alignItems: 'center', gap: 3,
                        backgroundColor: `${catColor}15`,
                        borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
                        borderWidth: 1, borderColor: `${catColor}30`,
                      }}>
                        <Ionicons name={catIconName as any} size={10} color={catColor} />
                        <Text style={{ color: catColor, fontSize: 10, fontWeight: '700' }}>
                          {catLbl}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Animated.View>
              );
            })
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
