import { Audio } from 'expo-av';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Types ──────────────────────────────────────────────────────────────────
interface Reminder {
  id: string;
  title: string;
  hour: number;
  minute: number;
  active: boolean;
  ringing: boolean;
}

// ─── Alarm sound ──────────────────────────────────────────────────────────────
const ALARM_SOURCE = require('../../assets/audio/alarm.ogg');

// ─── Helpers ──────────────────────────────────────────────────────────────────
function pad(n: number) {
  return n.toString().padStart(2, '0');
}
function formatTime(hour: number, minute: number) {
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h = hour % 12 || 12;
  return `${h}:${pad(minute)} ${ampm}`;
}
function nowHM() {
  const now = new Date();
  return { hour: now.getHours(), minute: now.getMinutes() };
}
function uid() {
  return Math.random().toString(36).slice(2);
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [hour, setHour] = useState(8);
  const [minute, setMinute] = useState(0);
  const [ampm, setAmPm] = useState<'AM' | 'PM'>('AM');

  // Track which reminder is currently ringing
  const [ringingId, setRingingId] = useState<string | null>(null);

  // Sound reference using expo-av
  const soundRef = useRef<Audio.Sound | null>(null);

  // Tick every 10 seconds to check for due reminders
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    tickRef.current = setInterval(() => {
      const { hour: h, minute: m } = nowHM();
      setReminders(prev =>
        prev.map(r => {
          if (r.active && !r.ringing && r.hour === h && r.minute === m) {
            return { ...r, ringing: true };
          }
          return r;
        })
      );
    }, 10_000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  // Start / stop looping alarm using expo-av
  useEffect(() => {
    let isMounted = true;

    async function updateAlarmSound() {
      if (ringingId) {
        try {
          if (soundRef.current) {
            await soundRef.current.unloadAsync();
          }
          const { sound } = await Audio.Sound.createAsync(
            ALARM_SOURCE,
            { isLooping: true, shouldPlay: true }
          );
          if (isMounted) {
            soundRef.current = sound;
          } else {
            await sound.unloadAsync();
          }
        } catch (err) {
          console.log('Error playing alarm:', err);
        }
      } else {
        if (soundRef.current) {
          try {
            await soundRef.current.stopAsync();
            await soundRef.current.unloadAsync();
          } catch (e) {}
          soundRef.current = null;
        }
      }
    }

    updateAlarmSound();

    return () => {
      isMounted = false;
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, [ringingId]);

  // Watch for a newly ringing reminder
  useEffect(() => {
    const ringing = reminders.find(r => r.ringing);
    if (ringing && ringingId !== ringing.id) {
      setRingingId(ringing.id);
    }
  }, [reminders]);

  // ── Actions ───────────────────────────────────────────────────────────────
  function addReminder() {
    if (!title.trim()) {
      Alert.alert('Escribe un nombre para el recordatorio');
      return;
    }
    const realHour = ampm === 'PM' && hour !== 12 ? hour + 12 : ampm === 'AM' && hour === 12 ? 0 : hour;
    setReminders(prev => [
      ...prev,
      { id: uid(), title: title.trim(), hour: realHour, minute, active: true, ringing: false },
    ]);
    setTitle('');
    setHour(8);
    setMinute(0);
    setAmPm('AM');
    setShowModal(false);
  }

  function dismissAlarm() {
    setRingingId(null);
    setReminders(prev =>
      prev.map(r => (r.ringing ? { ...r, ringing: false, active: false } : r))
    );
  }

  function deleteReminder(id: string) {
    if (ringingId === id) dismissAlarm();
    setReminders(prev => prev.filter(r => r.id !== id));
  }

  function toggleReminder(id: string) {
    setReminders(prev =>
      prev.map(r => (r.id === id ? { ...r, active: !r.active, ringing: false } : r))
    );
  }

  // ── Ringing overlay ───────────────────────────────────────────────────────
  const ringingReminder = reminders.find(r => r.ringing);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F1A' }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F1A" />

      {/* ── Header ── */}
      <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ color: '#A78BFA', fontSize: 13, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase' }}>
          Recordis
        </Text>
        <Text style={{ color: '#FFFFFF', fontSize: 28, fontWeight: '800', marginTop: 4 }}>
          Mis Recordatorios
        </Text>
        <Text style={{ color: '#6B7280', fontSize: 14, marginTop: 2 }}>
          {reminders.filter(r => r.active).length} activos
        </Text>
      </View>

      {/* ── List ── */}
      <ScrollView
        style={{ flex: 1, paddingHorizontal: 24 }}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {reminders.length === 0 && (
          <View style={{ alignItems: 'center', marginTop: 80 }}>
            <Text style={{ fontSize: 48 }}>⏰</Text>
            <Text style={{ color: '#4B5563', fontSize: 16, marginTop: 12, textAlign: 'center' }}>
              Sin recordatorios{'\n'}Toca + para agregar uno
            </Text>
          </View>
        )}

        {reminders.map(r => (
          <View
            key={r.id}
            style={{
              backgroundColor: r.ringing ? '#1E0A2E' : '#1A1A2E',
              borderRadius: 20,
              padding: 20,
              marginBottom: 14,
              borderWidth: 1,
              borderColor: r.ringing ? '#A78BFA' : '#2D2D4A',
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            {/* Toggle */}
            <TouchableOpacity
              onPress={() => toggleReminder(r.id)}
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                borderWidth: 2,
                borderColor: r.active ? '#A78BFA' : '#4B5563',
                backgroundColor: r.active ? '#A78BFA22' : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 14,
              }}
            >
              {r.active && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#A78BFA' }} />}
            </TouchableOpacity>

            {/* Info */}
            <View style={{ flex: 1 }}>
              <Text style={{ color: r.active ? '#FFFFFF' : '#6B7280', fontSize: 17, fontWeight: '700' }}>
                {r.ringing ? '🔔 ' : ''}{r.title}
              </Text>
              <Text style={{ color: r.active ? '#A78BFA' : '#4B5563', fontSize: 24, fontWeight: '800', marginTop: 2 }}>
                {formatTime(r.hour, r.minute)}
              </Text>
            </View>

            {/* Delete */}
            <TouchableOpacity
              onPress={() => deleteReminder(r.id)}
              style={{ padding: 8 }}
            >
              <Text style={{ color: '#EF4444', fontSize: 20 }}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* ── FAB ── */}
      <TouchableOpacity
        onPress={() => setShowModal(true)}
        style={{
          position: 'absolute',
          bottom: 40,
          right: 28,
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: '#7C3AED',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#7C3AED',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.5,
          shadowRadius: 16,
          elevation: 10,
        }}
      >
        <Text style={{ color: '#FFFFFF', fontSize: 32, lineHeight: 36 }}>+</Text>
      </TouchableOpacity>

      {/* ── Add Reminder Modal ── */}
      <Modal visible={showModal} transparent animationType="slide">
        <Pressable
          style={{ flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' }}
          onPress={() => setShowModal(false)}
        >
          <Pressable onPress={(e: any) => e.stopPropagation()}>
            <View
              style={{
                backgroundColor: '#16162A',
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                padding: 28,
                paddingBottom: Platform.OS === 'ios' ? 44 : 28,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '800', marginBottom: 20 }}>
                Nuevo Recordatorio
              </Text>

              {/* Title input */}
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="¿Qué tienes que hacer?"
                placeholderTextColor="#4B5563"
                style={{
                  backgroundColor: '#1E1E3A',
                  color: '#FFFFFF',
                  borderRadius: 14,
                  paddingHorizontal: 18,
                  paddingVertical: 14,
                  fontSize: 16,
                  marginBottom: 20,
                  borderWidth: 1,
                  borderColor: '#2D2D4A',
                }}
              />

              {/* Time picker */}
              <Text style={{ color: '#9CA3AF', fontSize: 13, fontWeight: '600', marginBottom: 10, letterSpacing: 1 }}>
                HORA
              </Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
                {/* Hours */}
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#6B7280', fontSize: 11, marginBottom: 4, textAlign: 'center' }}>Hora</Text>
                  <View style={{ flexDirection: 'row', backgroundColor: '#1E1E3A', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#2D2D4A' }}>
                    <TouchableOpacity onPress={() => setHour(h => (h <= 1 ? 12 : h - 1))} style={{ padding: 12, flex: 1, alignItems: 'center' }}>
                      <Text style={{ color: '#A78BFA', fontSize: 18 }}>−</Text>
                    </TouchableOpacity>
                    <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '800', flex: 2, textAlign: 'center', paddingVertical: 10 }}>
                      {pad(hour)}
                    </Text>
                    <TouchableOpacity onPress={() => setHour(h => (h >= 12 ? 1 : h + 1))} style={{ padding: 12, flex: 1, alignItems: 'center' }}>
                      <Text style={{ color: '#A78BFA', fontSize: 18 }}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Minutes */}
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#6B7280', fontSize: 11, marginBottom: 4, textAlign: 'center' }}>Min</Text>
                  <View style={{ flexDirection: 'row', backgroundColor: '#1E1E3A', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#2D2D4A' }}>
                    <TouchableOpacity onPress={() => setMinute(m => (m <= 0 ? 55 : m - 5))} style={{ padding: 12, flex: 1, alignItems: 'center' }}>
                      <Text style={{ color: '#A78BFA', fontSize: 18 }}>−</Text>
                    </TouchableOpacity>
                    <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '800', flex: 2, textAlign: 'center', paddingVertical: 10 }}>
                      {pad(minute)}
                    </Text>
                    <TouchableOpacity onPress={() => setMinute(m => (m >= 55 ? 0 : m + 5))} style={{ padding: 12, flex: 1, alignItems: 'center' }}>
                      <Text style={{ color: '#A78BFA', fontSize: 18 }}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* AM/PM */}
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#6B7280', fontSize: 11, marginBottom: 4, textAlign: 'center' }}>AM/PM</Text>
                  <TouchableOpacity
                    onPress={() => setAmPm(a => (a === 'AM' ? 'PM' : 'AM'))}
                    style={{
                      backgroundColor: '#7C3AED',
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingVertical: 14,
                      borderWidth: 1,
                      borderColor: '#A78BFA',
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '800' }}>{ampm}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Preview */}
              <Text style={{ color: '#A78BFA', fontSize: 36, fontWeight: '900', textAlign: 'center', marginBottom: 24 }}>
                {pad(hour)}:{pad(minute)} {ampm}
              </Text>

              {/* Confirm */}
              <TouchableOpacity
                onPress={addReminder}
                style={{
                  backgroundColor: '#7C3AED',
                  borderRadius: 16,
                  paddingVertical: 16,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '800' }}>
                  Guardar Recordatorio
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── ALARM OVERLAY — visible while ringing ── */}
      <Modal visible={!!ringingReminder} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: '#0F0A1A',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 32,
          }}
        >
          {/* Pulsing ring — simple animated text emoji */}
          <Text style={{ fontSize: 96, marginBottom: 24 }}>🔔</Text>

          <Text style={{ color: '#A78BFA', fontSize: 14, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
            Recordatorio
          </Text>
          <Text style={{ color: '#FFFFFF', fontSize: 32, fontWeight: '900', textAlign: 'center', marginBottom: 8 }}>
            {ringingReminder?.title}
          </Text>
          <Text style={{ color: '#7C3AED', fontSize: 52, fontWeight: '900', marginBottom: 48 }}>
            {ringingReminder ? formatTime(ringingReminder.hour, ringingReminder.minute) : ''}
          </Text>

          <TouchableOpacity
            onPress={dismissAlarm}
            style={{
              backgroundColor: '#7C3AED',
              borderRadius: 100,
              paddingVertical: 22,
              paddingHorizontal: 64,
              shadowColor: '#7C3AED',
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.6,
              shadowRadius: 24,
              elevation: 16,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '900', letterSpacing: 0.5 }}>
              ¡Ya lo sé! Apagar
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}