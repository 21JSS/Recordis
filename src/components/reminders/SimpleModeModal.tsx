/**
 * SimpleModeModal.tsx
 * A beautiful, minimal reminder creation modal.
 * Only requires: name, time (hour/minute/AM-PM), and date.
 */

import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import type { NewReminderParams } from '@/context/RemindersContext';
import { REMINDER_COLORS } from '@/constants/reminderOptions';
import { pad, todayISO, buildCalendarCells, DAY_NAMES_SHORT, MONTH_NAMES, dateISO } from '@/utils/helpers';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Quick Day Selector ──────────────────────────────────────────────────────
const QUICK_DAYS = [
  { label: 'Hoy', getDays: () => 0 },
  { label: 'Mañana', getDays: () => 1 },
  { label: 'Dom', getDays: () => getDaysUntilWeekday(0) },
  { label: 'Lun', getDays: () => getDaysUntilWeekday(1) },
  { label: 'Mar', getDays: () => getDaysUntilWeekday(2) },
  { label: 'Mié', getDays: () => getDaysUntilWeekday(3) },
  { label: 'Jue', getDays: () => getDaysUntilWeekday(4) },
  { label: 'Vie', getDays: () => getDaysUntilWeekday(5) },
  { label: 'Sáb', getDays: () => getDaysUntilWeekday(6) },
];

function getDaysUntilWeekday(target: number): number {
  const today = new Date().getDay();
  let diff = target - today;
  if (diff <= 0) diff += 7;
  return diff;
}

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ─── AM/PM Drum Toggle ───────────────────────────────────────────────────────
function AmPmToggle({ value, onChange }: { value: 'AM' | 'PM'; onChange: (v: 'AM' | 'PM') => void }) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  function handlePress() {
    scale.value = withSpring(0.9, { damping: 6 }, () => { scale.value = withSpring(1); });
    onChange(value === 'AM' ? 'PM' : 'AM');
  }

  return (
    <Animated.View style={style}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        style={{
          backgroundColor: value === 'PM' ? '#4C1D95' : '#1A1A35',
          borderRadius: 18,
          paddingHorizontal: 20,
          paddingVertical: 16,
          alignItems: 'center',
          borderWidth: 1.5,
          borderColor: value === 'PM' ? '#7C3AED' : '#2A1A50',
          minWidth: 72,
        }}
      >
        <Text style={{ color: '#FFF', fontSize: 22, fontWeight: '900', letterSpacing: 1 }}>
          {value}
        </Text>
        <Text style={{ color: '#A78BFA', fontSize: 10, marginTop: 2, fontWeight: '600' }}>
          toca
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Large Number Stepper ────────────────────────────────────────────────────
function BigStepper({
  value, min, max, onChange,
}: {
  value: number; min: number; max: number; onChange: (v: number) => void;
}) {
  return (
    <View style={{ alignItems: 'center', gap: 6 }}>
      <TouchableOpacity
        onPress={() => onChange(value >= max ? min : value + 1)}
        style={{ padding: 10, backgroundColor: '#12122A', borderRadius: 14 }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="chevron-up" size={24} color="#A78BFA" />
      </TouchableOpacity>

      <Text style={{
        color: '#FFF', fontSize: 52, fontWeight: '900',
        letterSpacing: -1, lineHeight: 60, textAlign: 'center', minWidth: 72,
      }}>
        {pad(value)}
      </Text>

      <TouchableOpacity
        onPress={() => onChange(value <= min ? max : value - 1)}
        style={{ padding: 10, backgroundColor: '#12122A', borderRadius: 14 }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="chevron-down" size={24} color="#A78BFA" />
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Simple Modal ───────────────────────────────────────────────────────
interface SimpleModeModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (params: NewReminderParams) => void;
}

export function SimpleModeModal({ visible, onClose, onSave }: SimpleModeModalProps) {
  const [title, setTitle] = useState('');
  const [hour, setHour] = useState(8);
  const [minute, setMinute] = useState(0);
  const [ampm, setAmPm] = useState<'AM' | 'PM'>('AM');
  const [date, setDate] = useState(todayISO());

  function reset() {
    setTitle(''); setHour(8); setMinute(0); setAmPm('AM'); setDate(todayISO());
  }

  function handleClose() { reset(); onClose(); }

  function handleSave() {
    const trimmed = title.trim();
    if (!trimmed) return;
    const realHour = ampm === 'PM' && hour !== 12 ? hour + 12 : ampm === 'AM' && hour === 12 ? 0 : hour;
    onSave({
      title: trimmed,
      hour: realHour,
      minute,
      date,
      color: REMINDER_COLORS[0].hex,
      repeat: 'none',
      priority: 'medium',
      notes: '',
      snoozeMinutes: 10,
    });
    reset();
  }

  const canSave = title.trim().length > 0;

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <TouchableOpacity
            style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000000CC' }]}
            activeOpacity={1}
            onPress={handleClose}
          />
          <Animated.View
              entering={FadeInUp.duration(400).springify()}
              style={{
                backgroundColor: '#09091E',
                borderTopLeftRadius: 36,
                borderTopRightRadius: 36,
                borderTopWidth: 1.5,
                borderColor: '#2A1A50',
                paddingBottom: Platform.OS === 'ios' ? 40 : 24,
              }}
            >
              {/* Drag Handle */}
              <View style={{ alignItems: 'center', paddingTop: 14, paddingBottom: 8 }}>
                <View style={{ width: 42, height: 4, borderRadius: 2, backgroundColor: '#2A1A50' }} />
              </View>

              {/* ── Header ── */}
              <Animated.View
                entering={FadeInDown.delay(80).springify()}
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  paddingHorizontal: 28, paddingBottom: 20,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{
                    width: 42, height: 42, borderRadius: 21,
                    backgroundColor: '#A78BFA22',
                    alignItems: 'center', justifyContent: 'center',
                    borderWidth: 1.5, borderColor: '#7C3AED',
                  }}>
                    <Ionicons name="flash" size={20} color="#A78BFA" />
                  </View>
                  <View>
                    <Text style={{ color: '#FFF', fontSize: 22, fontWeight: '900' }}>
                      Modo Simple
                    </Text>
                    <Text style={{ color: '#4B5563', fontSize: 13, fontWeight: '500', marginTop: 1 }}>
                      Rápido y fácil
                    </Text>
                  </View>
                </View>

                {/* ── Close Button ── */}
                <TouchableOpacity
                  onPress={handleClose}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  style={{
                    width: 40, height: 40, borderRadius: 20,
                    backgroundColor: '#1E1040',
                    alignItems: 'center', justifyContent: 'center',
                    borderWidth: 2, borderColor: '#3D2370',
                  }}
                >
                  <Ionicons name="close" size={22} color="#C084FC" />
                </TouchableOpacity>
              </Animated.View>

              {/* ── Name Input ── */}
              <Animated.View
                entering={FadeInDown.delay(130).springify()}
                style={{ paddingHorizontal: 24, marginBottom: 24 }}
              >
                <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>
                  ¿Qué necesitas recordar?
                </Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Escribe aquí..."
                  placeholderTextColor="#1F2937"
                  autoFocus={false}
                  returnKeyType="done"
                  style={{
                    backgroundColor: '#0D0D22',
                    color: '#FFF',
                    borderRadius: 20,
                    paddingHorizontal: 22,
                    paddingVertical: 18,
                    fontSize: 18,
                    fontWeight: '600',
                    borderWidth: 1.5,
                    borderColor: title.length > 0 ? '#7C3AED' : '#1A1A35',
                  }}
                />
              </Animated.View>

              {/* ── Time Selector ── */}
              <Animated.View
                entering={FadeInDown.delay(180).springify()}
                style={{ paddingHorizontal: 24, marginBottom: 22 }}
              >
                <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>
                  ¿A qué hora?
                </Text>

                <View style={{
                  backgroundColor: '#0D0D22', borderRadius: 24,
                  paddingVertical: 18, paddingHorizontal: 16,
                  borderWidth: 1.5, borderColor: '#1A1A35',
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16,
                }}>
                  <BigStepper value={hour} min={1} max={12} onChange={setHour} />

                  <Text style={{ color: '#A78BFA', fontSize: 48, fontWeight: '900', lineHeight: 56, marginBottom: 4 }}>:</Text>

                  <BigStepper value={minute} min={0} max={59} onChange={setMinute} />

                  <AmPmToggle value={ampm} onChange={setAmPm} />
                </View>
              </Animated.View>

              {/* ── Quick Day Selector ── */}
              <Animated.View
                entering={FadeInDown.delay(230).springify()}
                style={{ paddingHorizontal: 24, marginBottom: 28 }}
              >
                <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>
                  ¿Cuándo?
                </Text>

                {/* Quick chips */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  {QUICK_DAYS.slice(0, 4).map((qd) => {
                    const qDate = addDays(qd.getDays());
                    const isSelected = qDate === date;
                    return (
                      <TouchableOpacity
                        key={qd.label}
                        onPress={() => setDate(qDate)}
                        style={{
                          paddingHorizontal: 18, paddingVertical: 10,
                          borderRadius: 100,
                          backgroundColor: isSelected ? '#7C3AED22' : '#0D0D22',
                          borderWidth: 1.5,
                          borderColor: isSelected ? '#7C3AED' : '#1A1A35',
                        }}
                      >
                        <Text style={{ color: isSelected ? '#A78BFA' : '#6B7280', fontSize: 14, fontWeight: '700' }}>
                          {qd.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Weekday chips */}
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {QUICK_DAYS.slice(2).map((qd) => {
                    const qDate = addDays(qd.getDays());
                    const isSelected = qDate === date;
                    return (
                      <TouchableOpacity
                        key={qd.label}
                        onPress={() => setDate(qDate)}
                        style={{
                          flex: 1, paddingVertical: 10,
                          borderRadius: 14, alignItems: 'center',
                          backgroundColor: isSelected ? '#7C3AED22' : '#0D0D22',
                          borderWidth: 1.5,
                          borderColor: isSelected ? '#7C3AED' : '#1A1A35',
                        }}
                      >
                        <Text style={{ color: isSelected ? '#A78BFA' : '#4B5563', fontSize: 12, fontWeight: '700' }}>
                          {qd.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Selected date display */}
                <View style={{
                  marginTop: 12, backgroundColor: '#0D0D22', borderRadius: 14,
                  paddingVertical: 10, paddingHorizontal: 16,
                  flexDirection: 'row', alignItems: 'center', gap: 8,
                  borderWidth: 1, borderColor: '#1A1A35',
                }}>
                  <Ionicons name="calendar-outline" size={16} color="#4B5563" />
                  <Text style={{ color: '#9CA3AF', fontSize: 14, fontWeight: '600' }}>
                    {date}
                  </Text>
                  <Text style={{ color: `${pad(hour)}` === '' ? 'transparent' : '#A78BFA', fontSize: 14, fontWeight: '700', marginLeft: 'auto' }}>
                    {pad(hour)}:{pad(minute)} {ampm}
                  </Text>
                </View>
              </Animated.View>

              {/* ── Save Button ── */}
              <Animated.View entering={FadeInDown.delay(280).springify()} style={{ paddingHorizontal: 24 }}>
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={!canSave}
                  activeOpacity={0.85}
                  style={{
                    backgroundColor: canSave ? '#7C3AED' : '#1A1A35',
                    borderRadius: 22,
                    paddingVertical: 20,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 12,
                    shadowColor: canSave ? '#7C3AED' : 'transparent',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.5,
                    shadowRadius: 20,
                    elevation: canSave ? 14 : 0,
                  }}
                >
                  <Ionicons name="flash" size={24} color={canSave ? '#FFF' : '#374151'} />
                  <Text style={{ color: canSave ? '#FFF' : '#374151', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 }}>
                    Guardar Recordatorio
                  </Text>
                </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
