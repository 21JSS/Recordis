import { useEffect } from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import type { Reminder } from '@/context/RemindersContext';
import { formatTime, MONTH_NAMES } from '@/utils/helpers';
import { SNOOZE_OPTIONS } from '@/constants/reminderOptions';

interface AlarmOverlayProps {
  reminder: Reminder | undefined;
  onDismiss: () => void;
  onSnooze: () => void;
}

function friendlyDate(iso: string): string {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  if (iso === todayStr) return 'Hoy';
  const parts = iso.split('-');
  const d = parseInt(parts[2], 10);
  const m = parseInt(parts[1], 10) - 1;
  return `${d} de ${MONTH_NAMES[m]}`;
}

export function AlarmOverlay({ reminder, onDismiss, onSnooze }: AlarmOverlayProps) {
  const bellRotate   = useSharedValue(0);

  const color = reminder?.color ?? '#A78BFA';

  useEffect(() => {
    if (!reminder) return;
    
    // Smooth, more elegant bell shake
    bellRotate.value = withRepeat(
      withSequence(
        withTiming(-12, { duration: 100 }), withTiming(12, { duration: 100 }),
        withTiming(-8, { duration: 100 }), withTiming(8, { duration: 100 }),
        withTiming(0,   { duration: 200 }),
        withTiming(0,   { duration: 800 }) // pause between shakes
      ), -1, false
    );
  }, [reminder?.id]);

  const bellStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${bellRotate.value}deg` }] }));

  const snoozeLabel = SNOOZE_OPTIONS.find(s => s.value === (reminder?.snoozeMinutes ?? 10))?.label ?? '10 min';

  if (!reminder) return null;

  return (
    <Modal visible={!!reminder} transparent animationType="fade" statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: '#09090C', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        
        {/* ── ALARM VISUAL ── */}
        <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 50, marginTop: 40 }}>
          {/* Core bell circle ONLY - removed outer ripples to fix overlapping circles */}
          <View style={{
            width: 140, height: 140, borderRadius: 70,
            backgroundColor: '#111122', // Safe dark color instead of alpha hex
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 2, borderColor: color,
            shadowColor: color, shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.6, shadowRadius: 20, elevation: 15,
          }}>
            <Animated.View style={bellStyle}>
              <Ionicons name="notifications" size={64} color={color} />
            </Animated.View>
          </View>
        </View>

        {/* ── DETAILS ── */}
        <View style={{ alignItems: 'center', width: '100%', marginBottom: 40 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Ionicons name="sparkles" size={12} color="#6B7280" />
            <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '800', letterSpacing: 4, textTransform: 'uppercase' }}>
              Recordatorio
            </Text>
            <Ionicons name="sparkles" size={12} color="#6B7280" />
          </View>
          
          <Text style={{ color: '#FFF', fontSize: 32, fontWeight: '900', textAlign: 'center', marginBottom: 16, letterSpacing: -0.5 }}>
            {reminder.title}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 24 }}>
            <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
            <Text style={{ color: '#9CA3AF', fontSize: 14, fontWeight: '600' }}>
              {friendlyDate(reminder.date)}
            </Text>
          </View>

          {/* Stunning Time Pill */}
          <View style={{
            backgroundColor: '#181824', borderRadius: 24,
            paddingHorizontal: 28, paddingVertical: 14,
            borderWidth: 1.5, borderColor: color,
            flexDirection: 'row', alignItems: 'center', gap: 12,
            shadowColor: color, shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3, shadowRadius: 10, elevation: 8,
          }}>
            <Ionicons name="time" size={26} color={color} />
            <Text style={{ color, fontSize: 46, fontWeight: '900', letterSpacing: 1.5 }}>
              {formatTime(reminder.hour, reminder.minute)}
            </Text>
          </View>
        </View>

        {/* ── NOTES PREVIEW ── */}
        {!!reminder.notes && (
          <View style={{ width: '100%', paddingHorizontal: 24, marginBottom: 40 }}>
            <Text style={{ color: '#9CA3AF', fontSize: 15, textAlign: 'center', lineHeight: 22 }} numberOfLines={3}>
              "{reminder.notes}"
            </Text>
          </View>
        )}

        <View style={{ flex: 1 }} />

        {/* ── ACTIONS ── */}
        <View style={{ flexDirection: 'row', gap: 16, width: '100%', paddingHorizontal: 12, marginBottom: 20 }}>
          {/* Snooze Button */}
          <TouchableOpacity
            onPress={onSnooze}
            style={{
              flex: 1, paddingVertical: 18,
              borderRadius: 24, backgroundColor: '#181824',
              alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8,
              borderWidth: 1.5, borderColor: '#2A2A3C',
            }}
          >
            <Ionicons name="alarm-outline" size={20} color="#9CA3AF" />
            <Text style={{ color: '#9CA3AF', fontSize: 16, fontWeight: '700' }}>
              +{snoozeLabel}
            </Text>
          </TouchableOpacity>

          {/* Dismiss Button */}
          <TouchableOpacity
            onPress={onDismiss}
            style={{
              flex: 1.3, paddingVertical: 18,
              borderRadius: 24, backgroundColor: color,
              alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10,
              shadowColor: color, shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.5, shadowRadius: 16, elevation: 12,
            }}
          >
            <Ionicons name="checkmark-circle" size={24} color="#FFF" />
            <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '900' }}>
              ¡Ya lo sé!
            </Text>
          </TouchableOpacity>
        </View>

      </View>
    </Modal>
  );
}
