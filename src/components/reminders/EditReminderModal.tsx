/**
 * EditReminderModal.tsx
 * Modal for editing an existing reminder — same UI as AddReminderModal but pre-filled.
 */

import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import type { Reminder, NewReminderParams, Priority, RepeatMode } from '@/context/RemindersContext';
import { pad, todayISO, buildCalendarCells, DAY_NAMES_SHORT, MONTH_NAMES, dateISO } from '@/utils/helpers';
import {
  REMINDER_COLORS,
  REPEAT_OPTIONS,
  PRIORITY_OPTIONS,
  SNOOZE_OPTIONS,
} from '@/constants/reminderOptions';
import { CATEGORIES, type Category } from '@/constants/categories';

// ─── Section header ───────────────────────────────────────────────────────────
function SectionLabel({ icon, title }: { icon: string; title: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
      <Ionicons name={icon as any} size={14} color="#7C3AED" />
      <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' }}>
        {title}
      </Text>
    </View>
  );
}

// ─── Number stepper ───────────────────────────────────────────────────────────
function NumberStepper({
  value, min, max, label, onChange, color = '#A78BFA',
}: {
  value: number; min: number; max: number; label: string; onChange: (v: number) => void; color?: string;
}) {
  const [text, setText] = useState(pad(value));
  useEffect(() => { setText(pad(value)); }, [value]);

  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ color: '#4B5563', fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
        {label}
      </Text>
      <View style={{ backgroundColor: '#0C0C20', borderRadius: 14, borderWidth: 1.5, borderColor: `${color}44`, overflow: 'hidden', width: '100%' }}>
        <TouchableOpacity onPress={() => onChange(value >= max ? min : value + 1)} style={{ paddingVertical: 9, alignItems: 'center' }}>
          <Ionicons name="chevron-up" size={18} color={color} />
        </TouchableOpacity>
        <TextInput
          value={text}
          onChangeText={setText}
          onBlur={() => {
            const p = parseInt(text, 10);
            if (!isNaN(p) && p >= min && p <= max) onChange(p);
            else setText(pad(value));
          }}
          keyboardType="number-pad"
          maxLength={2}
          selectTextOnFocus
          style={{ color: '#FFF', fontSize: 26, fontWeight: '900', textAlign: 'center', paddingVertical: 8, backgroundColor: '#16163A' }}
        />
        <TouchableOpacity onPress={() => onChange(value <= min ? max : value - 1)} style={{ paddingVertical: 9, alignItems: 'center' }}>
          <Ionicons name="chevron-down" size={18} color={color} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Mini Calendar Date Picker ────────────────────────────────────────────────
function DatePicker({ value, onChange }: { value: string; onChange: (d: string) => void }) {
  const [viewDate, setViewDate] = useState(() => {
    if (value) {
      const parts = value.split('-');
      if (parts.length === 3) return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, 1);
    }
    return new Date();
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const cells = buildCalendarCells(year, month);

  return (
    <View style={{ backgroundColor: '#0C0C20', borderRadius: 16, borderWidth: 1.5, borderColor: '#7C3AED44', padding: 14, paddingBottom: 18 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <TouchableOpacity onPress={() => setViewDate(new Date(year, month - 1, 1))} style={{ padding: 8, backgroundColor: '#16163A', borderRadius: 12 }}>
          <Ionicons name="chevron-back" size={20} color="#7C3AED" />
        </TouchableOpacity>
        <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '800' }}>
          {MONTH_NAMES[month]} {year}
        </Text>
        <TouchableOpacity onPress={() => setViewDate(new Date(year, month + 1, 1))} style={{ padding: 8, backgroundColor: '#16163A', borderRadius: 12 }}>
          <Ionicons name="chevron-forward" size={20} color="#7C3AED" />
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: 'row', marginBottom: 10 }}>
        {DAY_NAMES_SHORT.map((d) => (
          <View key={d} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '700' }}>{d}</Text>
          </View>
        ))}
      </View>
      <View style={{ gap: 6 }}>
        {Array.from({ length: Math.ceil(cells.length / 7) }, (_, row) => (
          <View key={row} style={{ flexDirection: 'row', gap: 6 }}>
            {cells.slice(row * 7, row * 7 + 7).map((day, col) => {
              if (day === null) return <View key={`e-${col}`} style={{ flex: 1, height: 40 }} />;
              const cellIso = dateISO(year, month, day);
              const selected = cellIso === value;
              const isToday = cellIso === todayISO();
              return (
                <TouchableOpacity
                  key={`d-${day}`}
                  onPress={() => onChange(cellIso)}
                  style={{
                    flex: 1, height: 40, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: selected ? '#7C3AED' : isToday ? '#7C3AED33' : '#111128',
                    borderRadius: 12,
                    borderWidth: 1.5, borderColor: selected ? '#FFF' : isToday ? '#7C3AED' : 'transparent',
                  }}
                >
                  <Text style={{ color: selected ? '#FFF' : isToday ? '#7C3AED' : '#D1D5DB', fontSize: 14, fontWeight: selected || isToday ? '800' : '600' }}>
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Color swatch ─────────────────────────────────────────────────────────────
function ColorSwatch({ hex, selected, onPress }: { hex: string; selected: boolean; onPress: () => void }) {
  const scale = useSharedValue(selected ? 1.2 : 1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  useEffect(() => { scale.value = withSpring(selected ? 1.2 : 1, { damping: 12 }); }, [selected]);
  return (
    <TouchableOpacity onPress={() => { scale.value = withSpring(1.35, { damping: 8 }, () => { scale.value = withSpring(1.2); }); onPress(); }}>
      <Animated.View style={[style, { width: 42, height: 42, borderRadius: 21, backgroundColor: hex, borderWidth: selected ? 3 : 2, borderColor: selected ? '#FFFFFF' : `${hex}44`, alignItems: 'center', justifyContent: 'center' }]}>
        {selected && <Ionicons name="checkmark" size={18} color="#FFF" />}
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Chip row ─────────────────────────────────────────────────────────────────
function ChipRow<T extends string>({ options, value, onChange }: {
  options: { value: T; label: string; icon: string; color?: string }[];
  value: T; onChange: (v: T) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map((o) => {
        const selected = o.value === value;
        const color = o.color ?? '#A78BFA';
        return (
          <TouchableOpacity
            key={o.value}
            onPress={() => onChange(o.value)}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              paddingHorizontal: 14, paddingVertical: 9, borderRadius: 100,
              backgroundColor: selected ? `${color}22` : '#0C0C20',
              borderWidth: 1.5, borderColor: selected ? color : '#1A1A35',
            }}
          >
            <Ionicons name={o.icon as any} size={14} color={selected ? color : '#4B5563'} />
            <Text style={{ color: selected ? color : '#4B5563', fontSize: 13, fontWeight: '700' }}>{o.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Main Edit Modal ──────────────────────────────────────────────────────────
interface EditReminderModalProps {
  visible: boolean;
  reminder: Reminder | null;
  onClose: () => void;
  onSave: (id: string, params: Partial<NewReminderParams>) => void;
}

export function EditReminderModal({ visible, reminder, onClose, onSave }: EditReminderModalProps) {
  const [title, setTitle]       = useState('');
  const [hour, setHour]         = useState(8);
  const [minute, setMinute]     = useState(0);
  const [ampm, setAmPm]         = useState<'AM' | 'PM'>('AM');
  const [date, setDate]         = useState(todayISO());
  const [color, setColor]       = useState(REMINDER_COLORS[0].hex);
  const [repeat, setRepeat]     = useState<RepeatMode>('none');
  const [priority, setPriority] = useState<Priority>('medium');
  const [notes, setNotes]       = useState('');
  const [snooze, setSnooze]     = useState(10);
  const [category, setCategory] = useState<Category>('personal');

  // Pre-fill when reminder changes
  useEffect(() => {
    if (reminder) {
      setTitle(reminder.title);
      const h24 = reminder.hour;
      setAmPm(h24 >= 12 ? 'PM' : 'AM');
      setHour(h24 % 12 || 12);
      setMinute(reminder.minute);
      setDate(reminder.date);
      setColor(reminder.color);
      setRepeat(reminder.repeat);
      setPriority(reminder.priority);
      setNotes(reminder.notes || '');
      setSnooze(reminder.snoozeMinutes);
      setCategory(reminder.category || 'personal');
    }
  }, [reminder?.id, visible]);

  function handleSave() {
    if (!reminder) return;
    const trimmed = title.trim();
    if (!trimmed) return;
    const realHour = ampm === 'PM' && hour !== 12 ? hour + 12 : ampm === 'AM' && hour === 12 ? 0 : hour;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave(reminder.id, { title: trimmed, hour: realHour, minute, date, color, repeat, priority, notes: notes.trim(), snoozeMinutes: snooze, category });
    onClose();
  }

  const canSave = title.trim().length > 0;

  if (!reminder) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <TouchableOpacity
            style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000000CC' }]}
            activeOpacity={1}
            onPress={onClose}
          />
          <View style={{
            backgroundColor: '#09091E',
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            borderTopWidth: 1.5,
            borderColor: '#2A1A50',
            maxHeight: '92%',
          }}>
            {/* Drag Handle */}
            <View style={{ alignItems: 'center', paddingTop: 14, paddingBottom: 6 }}>
              <View style={{ width: 44, height: 5, borderRadius: 3, backgroundColor: '#3A2A60' }} />
            </View>

            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#7C3AED22', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#7C3AED' }}>
                  <Ionicons name="pencil" size={18} color="#7C3AED" />
                </View>
                <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '900' }}>
                  Editar Recordatorio
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
                style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#1E1040', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#3D2370' }}
              >
                <Ionicons name="close" size={22} color="#C084FC" />
              </TouchableOpacity>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              scrollEventThrottle={16}
              overScrollMode="always"
              bounces={Platform.OS === 'ios'}
              contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 48 : 36, gap: 24 }}
            >
              {/* Name */}
              <Animated.View entering={FadeInDown.delay(50).springify()}>
                <SectionLabel icon="pencil-outline" title="Nombre" />
                <TextInput value={title} onChangeText={setTitle} placeholder="¿Qué tienes que hacer?" placeholderTextColor="#2D3748" returnKeyType="done" style={{ backgroundColor: '#0C0C20', color: '#FFF', borderRadius: 16, paddingHorizontal: 18, paddingVertical: 15, fontSize: 16, borderWidth: 1.5, borderColor: '#2A1A50' }} />
              </Animated.View>

              {/* Time */}
              <Animated.View entering={FadeInDown.delay(100).springify()}>
                <SectionLabel icon="time-outline" title="Hora exacta" />
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <NumberStepper value={hour} min={1} max={12} label="Hora" onChange={setHour} />
                  <View style={{ justifyContent: 'center', paddingTop: 28 }}><Text style={{ color: '#A78BFA', fontSize: 28, fontWeight: '900' }}>:</Text></View>
                  <NumberStepper value={minute} min={0} max={59} label="Min" onChange={setMinute} />
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ color: '#4B5563', fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Período</Text>
                    <TouchableOpacity onPress={() => setAmPm(a => a === 'AM' ? 'PM' : 'AM')} style={{ flex: 1, width: '100%', backgroundColor: '#4C1D95', borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#7C3AED', minHeight: 96 }}>
                      <Text style={{ color: '#FFF', fontSize: 22, fontWeight: '900' }}>{ampm}</Text>
                      <Text style={{ color: '#C084FC', fontSize: 9, marginTop: 2 }}>toca</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>

              {/* Date */}
              <Animated.View entering={FadeInDown.delay(150).springify()}>
                <SectionLabel icon="calendar-outline" title="Fecha" />
                <DatePicker value={date} onChange={setDate} />
              </Animated.View>

              {/* Category */}
              <Animated.View entering={FadeInDown.delay(180).springify()}>
                <SectionLabel icon="pricetag-outline" title="Categoría" />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {CATEGORIES.map((c) => {
                    const sel = c.value === category;
                    return (
                      <TouchableOpacity
                        key={c.value}
                        onPress={() => setCategory(c.value)}
                        style={{
                          flexDirection: 'row', alignItems: 'center', gap: 6,
                          paddingHorizontal: 14, paddingVertical: 9, borderRadius: 100,
                          backgroundColor: sel ? `${c.color}22` : '#0C0C20',
                          borderWidth: 1.5, borderColor: sel ? c.color : '#1A1A35',
                        }}
                      >
                        <Ionicons name={c.icon as any} size={14} color={sel ? c.color : '#4B5563'} />
                        <Text style={{ color: sel ? c.color : '#4B5563', fontSize: 13, fontWeight: '700' }}>{c.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Animated.View>

              {/* Color */}
              <Animated.View entering={FadeInDown.delay(200).springify()}>
                <SectionLabel icon="color-palette-outline" title="Color" />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 4 }}>
                  {REMINDER_COLORS.map((c) => (
                    <ColorSwatch key={c.hex} hex={c.hex} selected={c.hex === color} onPress={() => setColor(c.hex)} />
                  ))}
                </ScrollView>
              </Animated.View>

              {/* Repeat */}
              <Animated.View entering={FadeInDown.delay(250).springify()}>
                <SectionLabel icon="repeat-outline" title="Repetición" />
                <ChipRow options={REPEAT_OPTIONS} value={repeat} onChange={setRepeat} />
              </Animated.View>

              {/* Priority */}
              <Animated.View entering={FadeInDown.delay(300).springify()}>
                <SectionLabel icon="flag-outline" title="Prioridad" />
                <ChipRow options={PRIORITY_OPTIONS} value={priority} onChange={setPriority} />
              </Animated.View>

              {/* Snooze */}
              <Animated.View entering={FadeInDown.delay(350).springify()}>
                <SectionLabel icon="alarm-outline" title="Posponer" />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {SNOOZE_OPTIONS.map((s) => {
                    const sel = s.value === snooze;
                    return (
                      <TouchableOpacity key={s.value} onPress={() => setSnooze(s.value)} style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100, backgroundColor: sel ? '#A78BFA22' : '#0C0C20', borderWidth: 1.5, borderColor: sel ? '#A78BFA' : '#1A1A35' }}>
                        <Text style={{ color: sel ? '#A78BFA' : '#4B5563', fontSize: 13, fontWeight: '700' }}>{s.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Animated.View>

              {/* Notes */}
              <Animated.View entering={FadeInDown.delay(400).springify()}>
                <SectionLabel icon="document-text-outline" title="Notas (opcional)" />
                <TextInput value={notes} onChangeText={setNotes} placeholder="Agrega detalles adicionales..." placeholderTextColor="#2D3748" multiline numberOfLines={3} textAlignVertical="top" style={{ backgroundColor: '#0C0C20', color: '#FFF', borderRadius: 16, paddingHorizontal: 18, paddingVertical: 14, fontSize: 15, borderWidth: 1.5, borderColor: '#2A1A50', minHeight: 90 }} />
              </Animated.View>

              {/* Save button */}
              <Animated.View entering={FadeInDown.delay(450).springify()}>
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={!canSave}
                  style={{
                    backgroundColor: canSave ? color : '#1A1A35',
                    borderRadius: 18, paddingVertical: 18,
                    alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10,
                    shadowColor: canSave ? color : 'transparent',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.45, shadowRadius: 18,
                    elevation: canSave ? 12 : 0,
                  }}
                >
                  <Ionicons name="checkmark-circle" size={22} color={canSave ? '#FFF' : '#374151'} />
                  <Text style={{ color: canSave ? '#FFF' : '#374151', fontSize: 17, fontWeight: '900' }}>
                    Guardar Cambios
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
