import { useEffect } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { BellIcon } from '@/components/icons/AppIcons';
import type { Reminder } from '@/context/RemindersContext';
import { formatTime, MONTH_NAMES } from '@/utils/helpers';
import { priorityColor, REPEAT_OPTIONS } from '@/constants/reminderOptions';

interface ReminderCardProps {
  reminder: Reminder;
  index: number;
  onToggle: () => void;
  onDelete: () => void;
}

function repeatLabel(r: Reminder['repeat']): string {
  return REPEAT_OPTIONS.find(o => o.value === r)?.label ?? '';
}

function friendlyDate(iso: string): string {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth()+1).padStart(2,'0')}-${String(tomorrow.getDate()).padStart(2,'0')}`;
  if (iso === todayStr) return 'Hoy';
  if (iso === tomorrowStr) return 'Mañana';
  const parts = iso.split('-');
  const d = parseInt(parts[2], 10);
  const m = parseInt(parts[1], 10) - 1;
  return `${d} ${MONTH_NAMES[m].slice(0, 3)}`;
}

export function ReminderCard({ reminder, index, onToggle, onDelete }: ReminderCardProps) {
  const ringScale = useSharedValue(1);
  const accentOpacity = useSharedValue(0.18);

  useEffect(() => {
    if (reminder.ringing) {
      ringScale.value = withRepeat(
        withSequence(
          withTiming(1.04, { duration: 270, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: 270, easing: Easing.in(Easing.ease) })
        ),
        -1, false
      );
      accentOpacity.value = withRepeat(
        withSequence(withTiming(0.6, { duration: 500 }), withTiming(0.2, { duration: 500 })),
        -1, false
      );
    } else {
      ringScale.value = withSpring(1);
      accentOpacity.value = withTiming(0.18);
    }
  }, [reminder.ringing]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
  }));

  const pColor = priorityColor(reminder.priority);
  const color  = reminder.color ?? '#A78BFA';
  const dim    = !reminder.active;

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 65).springify().damping(16)}
      style={cardStyle}
    >
      <View
        style={{
          borderRadius: 22,
          marginBottom: 12,
          overflow: 'hidden',
          shadowColor: reminder.ringing ? color : '#000',
          shadowOffset: { width: 0, height: reminder.ringing ? 8 : 3 },
          shadowOpacity: reminder.ringing ? 0.45 : 0.10,
          shadowRadius: reminder.ringing ? 22 : 6,
          elevation: reminder.ringing ? 14 : 3,
        }}
      >
        {/* Color accent bar on the left */}
        <View
          style={{
            position: 'absolute',
            left: 0, top: 0, bottom: 0,
            width: 4,
            backgroundColor: dim ? '#1A1A30' : color,
            borderTopLeftRadius: 22,
            borderBottomLeftRadius: 22,
          }}
        />

        <View
          style={{
            backgroundColor: reminder.ringing ? '#14082A' : dim ? '#0C0C1C' : '#111128',
            borderWidth: 1.5,
            borderColor: reminder.ringing ? color : dim ? '#161630' : '#1E1A40',
            borderRadius: 22,
            padding: 16,
            paddingLeft: 20,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          {/* Toggle */}
          <TouchableOpacity
            onPress={onToggle}
            style={{
              width: 30, height: 30, borderRadius: 15,
              borderWidth: 2,
              borderColor: dim ? '#2D3748' : color,
              backgroundColor: dim ? 'transparent' : `${color}20`,
              alignItems: 'center', justifyContent: 'center',
              marginRight: 14,
            }}
          >
            {!dim && (
              <View style={{ width: 13, height: 13, borderRadius: 7, backgroundColor: color }} />
            )}
          </TouchableOpacity>

          {/* Content */}
          <View style={{ flex: 1 }}>
            {/* Title row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              {reminder.ringing && <BellIcon size={15} ringing />}
              <Text
                numberOfLines={1}
                style={{
                  color: dim ? '#4B5563' : '#E5E7EB',
                  fontSize: 15, fontWeight: '700', flex: 1,
                }}
              >
                {reminder.title}
              </Text>
            </View>

            {/* Time */}
            <Text
              style={{
                color: dim ? '#2D3748' : color,
                fontSize: 26, fontWeight: '900', letterSpacing: 0.5, marginBottom: 6,
              }}
            >
              {formatTime(reminder.hour, reminder.minute)}
            </Text>

            {/* Metadata row */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {/* Date */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#0C0C20', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 }}>
                <Ionicons name="calendar-outline" size={11} color="#6B7280" />
                <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600' }}>
                  {friendlyDate(reminder.date)}
                </Text>
              </View>

              {/* Medication Badge */}
              {reminder.isMedication && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#06202A', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: '#0E4455' }}>
                  <Ionicons name="medical" size={11} color="#22D3EE" />
                  <Text style={{ color: '#22D3EE', fontSize: 11, fontWeight: '700' }}>
                    Medicamento
                  </Text>
                </View>
              )}

              {/* Repeat */}
              {reminder.repeat !== 'none' && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#0C0C20', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 }}>
                  <Ionicons name="repeat-outline" size={11} color="#6B7280" />
                  <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600' }}>
                    {repeatLabel(reminder.repeat)}
                  </Text>
                </View>
              )}

              {/* Priority dot */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#0C0C20', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 }}>
                <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: pColor }} />
                <Text style={{ color: pColor, fontSize: 11, fontWeight: '700', textTransform: 'capitalize' }}>
                  {reminder.priority === 'high' ? 'Alta' : reminder.priority === 'medium' ? 'Media' : 'Baja'}
                </Text>
              </View>
            </View>

            {/* Notes preview */}
            {!!reminder.notes && (
              <Text numberOfLines={1} style={{ color: '#374151', fontSize: 12, marginTop: 6 }}>
                {reminder.notes}
              </Text>
            )}
          </View>

          {/* Delete */}
          <TouchableOpacity
            onPress={onDelete}
            style={{
              width: 36, height: 36, borderRadius: 18,
              backgroundColor: '#12121E',
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 1, borderColor: '#2A1A50',
              marginLeft: 8,
            }}
          >
            <Ionicons name="close" size={17} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}
