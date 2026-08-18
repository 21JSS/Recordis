import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
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

import { CATEGORIES, type Category } from '@/constants/categories';
import {
  MEDICATION_DURATIONS,
  MEDICATION_INTERVALS,
  PRIORITY_OPTIONS,
  REMINDER_COLORS,
  REPEAT_OPTIONS,
  SNOOZE_OPTIONS,
} from '@/constants/reminderOptions';
import { useReminders, type NewReminderParams, type Priority, type RepeatMode } from '@/context/RemindersContext';
import { DAY_NAMES_SHORT, MONTH_NAMES, buildCalendarCells, dateISO, pad, todayISO } from '@/utils/helpers';

// ─── Section header ───────────────────────────────────────────────────────────
function SectionLabel({ icon, title, color = '#7C3AED' }: { icon: string; title: string; color?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
      <Ionicons name={icon as any} size={14} color={color} />
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
      <View style={{ backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 14, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden', width: '100%' }}>
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
          style={{ color: '#FFF', fontSize: 26, fontWeight: '900', textAlign: 'center', paddingVertical: 8, backgroundColor: 'rgba(0,0,0,0.2)' }}
        />
        <TouchableOpacity onPress={() => onChange(value <= min ? max : value - 1)} style={{ paddingVertical: 9, alignItems: 'center' }}>
          <Ionicons name="chevron-down" size={18} color={color} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Date picker — Mini Calendar ──────────────────────────────────────────────
function DatePicker({ value, onChange, accentColor = '#7C3AED' }: { value: string; onChange: (d: string) => void; accentColor?: string }) {
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
    <View style={{ backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 16, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)', padding: 14, paddingBottom: 18 }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <TouchableOpacity onPress={() => setViewDate(new Date(year, month - 1, 1))} style={{ padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12 }}>
          <Ionicons name="chevron-back" size={20} color={accentColor} />
        </TouchableOpacity>
        <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '800', textTransform: 'capitalize' }}>
          {MONTH_NAMES[month]} {year}
        </Text>
        <TouchableOpacity onPress={() => setViewDate(new Date(year, month + 1, 1))} style={{ padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12 }}>
          <Ionicons name="chevron-forward" size={20} color={accentColor} />
        </TouchableOpacity>
      </View>
      {/* Day names */}
      <View style={{ flexDirection: 'row', marginBottom: 10 }}>
        {DAY_NAMES_SHORT.map((d) => (
          <View key={d} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 }}>{d}</Text>
          </View>
        ))}
      </View>
      {/* Grid */}
      <View style={{ gap: 6 }}>
        {Array.from({ length: Math.ceil(cells.length / 7) }, (_, row) => (
          <View key={row} style={{ flexDirection: 'row', gap: 6 }}>
            {cells.slice(row * 7, row * 7 + 7).map((day, col) => {
              if (day === null) return <View key={`empty-${col}`} style={{ flex: 1, height: 40 }} />;
              const cellIso = dateISO(year, month, day);
              const selected = cellIso === value;
              const isToday = cellIso === todayISO();
              return (
                <TouchableOpacity
                  key={`day-${day}`}
                  onPress={() => onChange(cellIso)}
                  style={{
                    flex: 1, height: 40, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: selected ? accentColor : isToday ? `${accentColor}33` : 'rgba(255,255,255,0.03)',
                    borderRadius: 12,
                    borderWidth: 1.5, borderColor: selected ? '#FFF' : isToday ? accentColor : 'transparent',
                  }}
                >
                  <Text style={{ color: selected ? '#FFF' : isToday ? accentColor : '#D1D5DB', fontSize: 14, fontWeight: selected || isToday ? '800' : '600' }}>
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
function ColorSwatch({ hex, selected, onPress }: { hex: string; label: string; selected: boolean; onPress: () => void }) {
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

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 4 }}>
      {REMINDER_COLORS.map((c) => (
        <ColorSwatch key={c.hex} hex={c.hex} label={c.label} selected={c.hex === value} onPress={() => onChange(c.hex)} />
      ))}
    </ScrollView>
  );
}

// ─── Chip row ─────────────────────────────────────────────────────────────────
function ChipRow<T extends string>({ options, value, onChange, accentColor }: {
  options: { value: T; label: string; icon: string; color?: string }[];
  value: T; onChange: (v: T) => void; accentColor?: string;
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map((o) => {
        const selected = o.value === value;
        const color = o.color ?? accentColor ?? '#A78BFA';
        return (
          <TouchableOpacity
            key={o.value}
            onPress={() => onChange(o.value)}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              paddingHorizontal: 14, paddingVertical: 9, borderRadius: 100,
              backgroundColor: selected ? `${color}22` : 'rgba(0,0,0,0.3)',
              borderWidth: 1.5, borderColor: selected ? color : 'rgba(255,255,255,0.1)',
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

// ─── Main Modal ───────────────────────────────────────────────────────────────
interface AddReminderModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (params: NewReminderParams) => void;
}

export function AddReminderModal({ visible, onClose, onSave }: AddReminderModalProps) {
  const { addMedicationReminders } = useReminders();
  const [mode, setMode] = useState<'normal' | 'medication'>('normal');
  const [title, setTitle] = useState('');
  const [hour, setHour] = useState(8);
  const [minute, setMinute] = useState(0);
  const [ampm, setAmPm] = useState<'AM' | 'PM'>('AM');
  const [date, setDate] = useState(todayISO());
  const [color, setColor] = useState(REMINDER_COLORS[0].hex);
  const [repeat, setRepeat] = useState<RepeatMode>('none');
  const [priority, setPriority] = useState<Priority>('medium');
  const [notes, setNotes] = useState('');
  const [snooze, setSnooze] = useState(10);
  const [category, setCategory] = useState<Category>('personal');
  const [medicationName, setMedicationName] = useState('');
  const [dosage, setDosage] = useState('');
  const [intervalHours, setIntervalHours] = useState(8);
  const [durationDays, setDurationDays] = useState(5);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showTimePickerAndroid, setShowTimePickerAndroid] = useState(false);

  // Derivar la fecha del picker de tiempo basándonos en hour, minute y ampm
  const pickerDate = new Date();
  let h24 = hour;
  if (ampm === 'PM' && h24 < 12) h24 += 12;
  if (ampm === 'AM' && h24 === 12) h24 = 0;
  pickerDate.setHours(h24, minute, 0, 0);

  const handleTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowTimePickerAndroid(false);
    if (selectedDate) {
      const newH = selectedDate.getHours();
      const newM = selectedDate.getMinutes();
      setMinute(newM);
      if (newH === 0) { setHour(12); setAmPm('AM'); }
      else if (newH < 12) { setHour(newH); setAmPm('AM'); }
      else if (newH === 12) { setHour(12); setAmPm('PM'); }
      else { setHour(newH - 12); setAmPm('PM'); }
    }
  };

  // ── Parseador de Lenguaje Natural (NLP Básico) ──
  useEffect(() => {
    if (showAdvanced || mode === 'medication') return;

    const t = title.toLowerCase();

    // Fechas
    if (t.includes('mañana')) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
      setDate(tStr);
    } else if (t.includes('hoy')) {
      setDate(todayISO());
    }

    // Horas ("a las 8", "a las 10:30", "a las 8pm")
    const timeMatch = t.match(/a las (\d{1,2})(?::(\d{2}))?\s*(am|pm|de la mañana|de la tarde|de la noche)?/);
    if (timeMatch) {
      let h = parseInt(timeMatch[1], 10);
      const m = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      let ampmVal = ampm;

      const modifier = timeMatch[3];
      if (modifier) {
        if (modifier.includes('pm') || modifier.includes('tarde') || modifier.includes('noche')) {
          ampmVal = 'PM';
          if (h < 12) h += 12;
        } else if (modifier.includes('am') || modifier.includes('mañana')) {
          ampmVal = 'AM';
          if (h === 12) h = 0;
        }
      }

      let displayH = h;
      let newAmPm: 'AM' | 'PM' = 'AM';
      if (h === 0) { displayH = 12; newAmPm = 'AM'; }
      else if (h < 12) { displayH = h; newAmPm = 'AM'; }
      else if (h === 12) { displayH = 12; newAmPm = 'PM'; }
      else { displayH = h - 12; newAmPm = 'PM'; }

      setHour(displayH);
      setMinute(m);
      setAmPm(newAmPm);
    }
  }, [title, showAdvanced, mode]);

  function reset() {
    setMode('normal');
    setTitle(''); setHour(8); setMinute(0); setAmPm('AM');
    setDate(todayISO()); setColor(REMINDER_COLORS[0].hex);
    setRepeat('none'); setPriority('medium'); setNotes(''); setSnooze(10);
    setCategory('personal');
    setMedicationName(''); setDosage(''); setIntervalHours(8); setDurationDays(5);
    setShowAdvanced(false);
  }

  function handleSave() {
    const realHour = ampm === 'PM' && hour !== 12 ? hour + 12 : ampm === 'AM' && hour === 12 ? 0 : hour;
    if (mode === 'medication') {
      const nameTrimmed = medicationName.trim();
      if (!nameTrimmed) return;
      addMedicationReminders({ medicationName: nameTrimmed, dosage: dosage.trim(), startHour: realHour, startMinute: minute, startDate: date, intervalHours, durationDays, color: color || '#22D3EE' });
      reset(); onClose(); return;
    }
    const trimmed = title.trim();
    if (!trimmed) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave({ title: trimmed, hour: realHour, minute, date, color, repeat, priority, notes: notes.trim(), snoozeMinutes: snooze, category });
    reset();
  }

  function handleClose() { reset(); onClose(); }

  const canSave = mode === 'medication' ? medicationName.trim().length > 0 : title.trim().length > 0;
  const totalDoses = Math.ceil((24 / intervalHours) * durationDays);
  const isMed = mode === 'medication';
  const accent = isMed ? '#22D3EE' : color;

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      {/*
        ANDROID TOUCH FIX:
        The backdrop and the bottom-sheet are SIBLINGS, NOT parent-child.
        On Android, a Pressable/TouchableOpacity that is an ancestor of a
        ScrollView intercepts all scroll gestures — making the middle of
        the scroll area unresponsive. Sibling layout avoids this entirely.
      */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          {/* ── Backdrop (tap to close) — sits behind the sheet ── */}
          <TouchableOpacity
            style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000000CC' }]}
            activeOpacity={1}
            onPress={handleClose}
          />

          {/* ── Bottom sheet — sibling of backdrop, not child ── */}
          <BlurView
            intensity={40}
            tint="dark"
            style={{
              backgroundColor: 'rgba(9, 9, 30, 0.65)',
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              borderTopWidth: 1.5,
              borderColor: 'rgba(255,255,255,0.15)',
              maxHeight: '92%',
              overflow: 'hidden',
            }}
          >
            {/* Drag Handle */}
            <View style={{ alignItems: 'center', paddingTop: 14, paddingBottom: 6 }}>
              <View style={{ width: 44, height: 5, borderRadius: 3, backgroundColor: '#3A2A60' }} />
            </View>

            {/* ── Header ── */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: isMed ? '#22D3EE22' : '#7C3AED22', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: isMed ? '#22D3EE' : '#7C3AED' }}>
                  <Ionicons name={isMed ? 'medical' : 'alarm'} size={18} color={isMed ? '#22D3EE' : '#7C3AED'} />
                </View>
                <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '900' }}>
                  {isMed ? 'Modo Medicamento' : 'Nuevo Recordatorio'}
                </Text>
              </View>

              {/* ── CLOSE BUTTON — grande y visible ── */}
              <TouchableOpacity
                onPress={handleClose}
                hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
                style={{
                  width: 40, height: 40, borderRadius: 20,
                  backgroundColor: '#1E1040',
                  alignItems: 'center', justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: isMed ? '#164E63' : '#3D2370',
                }}
              >
                <Ionicons name="close" size={22} color={isMed ? '#67E8F9' : '#C084FC'} />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', paddingHorizontal: 24, marginBottom: 18, gap: 10 }}>
              <TouchableOpacity
                onPress={() => { setMode('normal'); setColor(REMINDER_COLORS[0].hex); }}
                style={{ flex: 1, paddingVertical: 10, borderRadius: 14, backgroundColor: !isMed ? '#7C3AED' : 'rgba(0,0,0,0.3)', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderColor: !isMed ? '#A78BFA' : 'rgba(255,255,255,0.1)' }}
              >
                <Ionicons name="alarm-outline" size={16} color={!isMed ? '#FFF' : '#6B7280'} />
                <Text style={{ color: !isMed ? '#FFF' : '#6B7280', fontSize: 13, fontWeight: '700' }}>Normal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => { setMode('medication'); setColor('#22D3EE'); }}
                style={{ flex: 1, paddingVertical: 10, borderRadius: 14, backgroundColor: isMed ? '#0891B2' : 'rgba(0,0,0,0.3)', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderColor: isMed ? '#67E8F9' : 'rgba(255,255,255,0.1)' }}
              >
                <Ionicons name="medical-outline" size={16} color={isMed ? '#FFF' : '#6B7280'} />
                <Text style={{ color: isMed ? '#FFF' : '#6B7280', fontSize: 13, fontWeight: '700' }}>Medicamento</Text>
              </TouchableOpacity>
            </View>

            {/* ── Scrollable content ── (NO Pressable ancestor — touch fix) */}
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              scrollEventThrottle={16}
              overScrollMode="always"
              bounces={Platform.OS === 'ios'}
              contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 80 : 80, gap: 24 }}
            >
              {isMed ? (
                <>
                  <Animated.View entering={FadeInDown.delay(50).springify()}>
                    <SectionLabel icon="medical-outline" title="Nombre del medicamento" color="#22D3EE" />
                    <TextInput value={medicationName} onChangeText={setMedicationName} placeholder="ej: Paracetamol, Ibuprofeno..." placeholderTextColor="#2D3748" returnKeyType="next" style={{ backgroundColor: '#0C0C20', color: '#FFF', borderRadius: 16, paddingHorizontal: 18, paddingVertical: 15, fontSize: 16, borderWidth: 1.5, borderColor: '#0E4455' }} />
                  </Animated.View>

                  <Animated.View entering={FadeInDown.delay(80).springify()}>
                    <SectionLabel icon="flask-outline" title="Dosis u observaciones" color="#22D3EE" />
                    <TextInput value={dosage} onChangeText={setDosage} placeholder="ej: 1 pastilla 500mg después de comer" placeholderTextColor="#2D3748" style={{ backgroundColor: '#0C0C20', color: '#FFF', borderRadius: 16, paddingHorizontal: 18, paddingVertical: 15, fontSize: 15, borderWidth: 1.5, borderColor: '#0E4455' }} />
                  </Animated.View>

                  <Animated.View entering={FadeInDown.delay(100).springify()}>
                    <SectionLabel icon="time-outline" title="Hora de la primera toma" color="#22D3EE" />
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <NumberStepper value={hour} min={1} max={12} label="Hora" onChange={setHour} color="#22D3EE" />
                      <View style={{ justifyContent: 'center', paddingTop: 28 }}><Text style={{ color: '#22D3EE', fontSize: 28, fontWeight: '900' }}>:</Text></View>
                      <NumberStepper value={minute} min={0} max={59} label="Min" onChange={setMinute} color="#22D3EE" />
                      <View style={{ flex: 1, alignItems: 'center' }}>
                        <Text style={{ color: '#4B5563', fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Período</Text>
                        <TouchableOpacity onPress={() => setAmPm(a => a === 'AM' ? 'PM' : 'AM')} style={{ flex: 1, width: '100%', backgroundColor: '#0891B2', borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#22D3EE', minHeight: 96 }}>
                          <Text style={{ color: '#FFF', fontSize: 22, fontWeight: '900' }}>{ampm}</Text>
                          <Text style={{ color: '#A5F3FC', fontSize: 9, marginTop: 2 }}>toca</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </Animated.View>

                  <Animated.View entering={FadeInDown.delay(120).springify()}>
                    <SectionLabel icon="calendar-outline" title="Fecha de inicio" color="#22D3EE" />
                    <DatePicker value={date} onChange={setDate} accentColor="#22D3EE" />
                  </Animated.View>

                  <Animated.View entering={FadeInDown.delay(150).springify()}>
                    <SectionLabel icon="stopwatch-outline" title="¿Cada cuántas horas?" color="#22D3EE" />
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {MEDICATION_INTERVALS.map((item) => {
                        const sel = item.value === intervalHours;
                        return (
                          <TouchableOpacity key={item.value} onPress={() => setIntervalHours(item.value)} style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, backgroundColor: sel ? '#0891B222' : '#0C0C20', borderWidth: 1.5, borderColor: sel ? '#22D3EE' : '#1A1A35' }}>
                            <Text style={{ color: sel ? '#22D3EE' : '#D1D5DB', fontSize: 14, fontWeight: '800' }}>{item.label}</Text>
                            <Text style={{ color: sel ? '#A5F3FC' : '#4B5563', fontSize: 10, marginTop: 2 }}>{item.desc}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </Animated.View>

                  <Animated.View entering={FadeInDown.delay(180).springify()}>
                    <SectionLabel icon="hourglass-outline" title="¿Por cuántos días?" color="#22D3EE" />
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {MEDICATION_DURATIONS.map((item) => {
                        const sel = item.value === durationDays;
                        return (
                          <TouchableOpacity key={item.value} onPress={() => setDurationDays(item.value)} style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, backgroundColor: sel ? '#0891B222' : '#0C0C20', borderWidth: 1.5, borderColor: sel ? '#22D3EE' : '#1A1A35' }}>
                            <Text style={{ color: sel ? '#22D3EE' : '#D1D5DB', fontSize: 14, fontWeight: '800' }}>{item.label}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </Animated.View>

                  <Animated.View entering={FadeInDown.delay(200).springify()}>
                    <SectionLabel icon="color-palette-outline" title="Color de etiqueta" color="#22D3EE" />
                    <ColorPicker value={color} onChange={setColor} />
                  </Animated.View>

                  <Animated.View entering={FadeInDown.delay(220).springify()}>
                    <View style={{ backgroundColor: '#06202A', borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: '#0E4455', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <Ionicons name="information-circle" size={24} color="#22D3EE" />
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#22D3EE', fontSize: 14, fontWeight: '800' }}>Resumen de tomas</Text>
                        <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 2 }}>
                          Se programarán {totalDoses} tomas (cada {intervalHours}h por {durationDays} días)
                        </Text>
                      </View>
                    </View>
                  </Animated.View>
                </>
              ) : (
                <>
                  <Animated.View entering={FadeInDown.delay(50).springify()}>
                    <SectionLabel icon="pencil-outline" title="Nombre" />
                    <TextInput value={title} onChangeText={setTitle} placeholder="Ej: Tomar pastilla mañana a las 8pm" placeholderTextColor="#2D3748" returnKeyType="done" style={{ backgroundColor: 'rgba(0,0,0,0.3)', color: '#FFF', borderRadius: 16, paddingHorizontal: 18, paddingVertical: 15, fontSize: 16, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)' }} />
                  </Animated.View>

                  <Animated.View entering={FadeInDown.delay(80).springify()}>
                    <SectionLabel icon="time-outline" title="Hora exacta" />
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                      <TouchableOpacity onPress={() => { setHour(9); setMinute(0); setAmPm('AM'); }} style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100, backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)' }}>
                        <Text style={{ color: '#A78BFA', fontSize: 13, fontWeight: '700' }}>Mañana (9:00 AM)</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => { setHour(2); setMinute(0); setAmPm('PM'); }} style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100, backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)' }}>
                        <Text style={{ color: '#A78BFA', fontSize: 13, fontWeight: '700' }}>Tarde (2:00 PM)</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => { setHour(8); setMinute(0); setAmPm('PM'); }} style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100, backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)' }}>
                        <Text style={{ color: '#A78BFA', fontSize: 13, fontWeight: '700' }}>Noche (8:00 PM)</Text>
                      </TouchableOpacity>
                    </View>


                    {Platform.OS === 'ios' ? (
                      <View style={{ backgroundColor: '#1A1A35', borderRadius: 16, overflow: 'hidden' }}>
                        <DateTimePicker
                          value={pickerDate}
                          mode="time"
                          display="spinner"
                          textColor="#FFFFFF"
                          onChange={handleTimeChange}
                        />
                      </View>
                    ) : (
                      <>
                        <TouchableOpacity 
                          onPress={() => setShowTimePickerAndroid(true)} 
                          style={{ backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 14, paddingVertical: 18, alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)' }}
                        >
                           <Text style={{ color: '#FFF', fontSize: 32, fontWeight: '900', letterSpacing: 2 }}>{pad(hour)}:{pad(minute)} {ampm}</Text>
                           <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
                             <Ionicons name="time" size={14} color="#A78BFA" />
                             <Text style={{ color: '#A78BFA', fontSize: 13, fontWeight: '700' }}>Toca para cambiar la hora</Text>
                           </View>
                        </TouchableOpacity>
                        
                        {showTimePickerAndroid && (
                          <DateTimePicker
                            value={pickerDate}
                            mode="time"
                            display="default"
                            onChange={handleTimeChange}
                          />
                        )}
                      </>
                    )}
                  </Animated.View>

                  {!showAdvanced ? (
                    <Animated.View entering={FadeInDown.delay(100).springify()}>
                      <TouchableOpacity onPress={() => setShowAdvanced(true)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 }}>
                        <Ionicons name="chevron-down" size={16} color="#fff" opacity={0.58} />
                        <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '700', opacity: 0.58 }}>Más opciones (Fecha, Color, Repetición...)</Text>
                      </TouchableOpacity>
                    </Animated.View>
                  ) : (
                    <>

                      <Animated.View entering={FadeInDown.delay(150).springify()}>
                        <SectionLabel icon="calendar-outline" title="Fecha" />
                        <DatePicker value={date} onChange={setDate} />
                      </Animated.View>

                      <Animated.View entering={FadeInDown.delay(200).springify()}>
                        <SectionLabel icon="pricetag-outline" title="Categoría" />
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                          {CATEGORIES.map((c) => {
                            const sel = c.value === category;
                            return (
                              <TouchableOpacity
                                key={c.value}
                                onPress={() => { Haptics.selectionAsync(); setCategory(c.value); }}
                                style={{
                                  flexDirection: 'row', alignItems: 'center', gap: 6,
                                  paddingHorizontal: 14, paddingVertical: 9, borderRadius: 100,
                                  backgroundColor: sel ? `${c.color}22` : 'rgba(0,0,0,0.3)',
                                  borderWidth: 1.5, borderColor: sel ? c.color : 'rgba(255,255,255,0.1)',
                                }}
                              >
                                <Ionicons name={c.icon as any} size={14} color={sel ? c.color : '#4B5563'} />
                                <Text style={{ color: sel ? c.color : '#4B5563', fontSize: 13, fontWeight: '700' }}>{c.label}</Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </Animated.View>

                      <Animated.View entering={FadeInDown.delay(220).springify()}>
                        <SectionLabel icon="color-palette-outline" title="Color" />
                        <ColorPicker value={color} onChange={setColor} />
                      </Animated.View>

                      <Animated.View entering={FadeInDown.delay(250).springify()}>
                        <SectionLabel icon="repeat-outline" title="Repetición" />
                        <ChipRow options={REPEAT_OPTIONS} value={repeat} onChange={setRepeat} />
                      </Animated.View>

                      <Animated.View entering={FadeInDown.delay(300).springify()}>
                        <SectionLabel icon="flag-outline" title="Prioridad" />
                        <ChipRow options={PRIORITY_OPTIONS} value={priority} onChange={setPriority} />
                      </Animated.View>

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

                      <Animated.View entering={FadeInDown.delay(400).springify()}>
                        <SectionLabel icon="document-text-outline" title="Notas (opcional)" />
                        <TextInput value={notes} onChangeText={setNotes} placeholder="Agrega detalles adicionales..." placeholderTextColor="#2D3748" multiline numberOfLines={3} textAlignVertical="top" style={{ backgroundColor: 'rgba(0,0,0,0.3)', color: '#FFF', borderRadius: 16, paddingHorizontal: 18, paddingVertical: 14, fontSize: 15, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)', minHeight: 90 }} />
                      </Animated.View>
                    </>
                  )}
                </>
              )}

              {/* ── Save button ── */}
              <Animated.View entering={FadeInDown.delay(450).springify()}>
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={!canSave}
                  style={{
                    backgroundColor: canSave ? (isMed ? '#0891B2' : color) : '#1A1A35',
                    borderRadius: 18, paddingVertical: 18,
                    alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10,
                    shadowColor: canSave ? (isMed ? '#0891B2' : color) : 'transparent',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.45, shadowRadius: 18,
                    elevation: canSave ? 12 : 0,
                  }}
                >
                  <Ionicons name={isMed ? 'medical' : 'checkmark-circle'} size={22} color={canSave ? '#FFF' : '#374151'} />
                  <Text style={{ color: canSave ? '#FFF' : '#374151', fontSize: 17, fontWeight: '900' }}>
                    {isMed ? 'Programar Tratamiento' : 'Guardar Recordatorio'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </ScrollView>
          </BlurView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
