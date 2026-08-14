import { useEffect, useRef } from 'react';
import { Alert, Share, Text, TouchableOpacity, View } from 'react-native';
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
import Swipeable from 'react-native-gesture-handler/Swipeable';
import * as Haptics from 'expo-haptics';
import { BellIcon } from '@/components/icons/AppIcons';
import type { Reminder } from '@/context/RemindersContext';
import { formatTime, MONTH_NAMES } from '@/utils/helpers';
import { priorityColor, REPEAT_OPTIONS } from '@/constants/reminderOptions';
import { categoryColor, categoryIcon, categoryLabel } from '@/constants/categories';

interface ReminderCardProps {
  reminder: Reminder;
  index: number;
  simpleMode?: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onEdit?: () => void;
  onComplete?: () => void;
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

// ─── Swipe Actions ───────────────────────────────────────────────────────────
function DeleteAction() {
  return (
    <View style={{
      backgroundColor: '#EF4444',
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      width: 90,
      marginBottom: 12,
      marginLeft: 8,
    }}>
      <Ionicons name="trash-outline" size={24} color="#FFF" />
      <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700', marginTop: 4 }}>Eliminar</Text>
    </View>
  );
}

function CompleteAction({ isCompleted }: { isCompleted: boolean }) {
  return (
    <View style={{
      backgroundColor: isCompleted ? '#FBBF24' : '#10B981',
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      width: 90,
      marginBottom: 12,
      marginRight: 8,
    }}>
      <Ionicons name={isCompleted ? 'refresh-outline' : 'checkmark-circle-outline'} size={24} color="#FFF" />
      <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700', marginTop: 4 }}>
        {isCompleted ? 'Reactivar' : 'Completar'}
      </Text>
    </View>
  );
}

export function ReminderCard({ reminder, index, simpleMode, onToggle, onDelete, onEdit, onComplete }: ReminderCardProps) {
  const swipeableRef = useRef<Swipeable>(null);
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
  const isCompleted = !!reminder.completedAt;
  const catColor = categoryColor(reminder.category || 'personal');
  const catIcon = categoryIcon(reminder.category || 'personal');
  const catLabel = categoryLabel(reminder.category || 'personal');

  // Font sizes adapt for simple mode (larger = more accessible)
  const titleSize = simpleMode ? 18 : 15;
  const timeSize = simpleMode ? 30 : 26;

  function handleDelete() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Eliminar recordatorio',
      `¿Estás seguro de eliminar "${reminder.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onDelete();
          },
        },
      ]
    );
  }

  function handleSwipeDelete() {
    swipeableRef.current?.close();
    handleDelete();
  }

  function handleSwipeComplete() {
    swipeableRef.current?.close();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onComplete?.();
  }

  async function handleShare() {
    Haptics.selectionAsync();
    const timeStr = formatTime(reminder.hour, reminder.minute);
    const dateStr = friendlyDate(reminder.date);
    const message = `📋 Recordatorio de Recordis\n\n🔔 ${reminder.title}\n📅 ${dateStr}\n⏰ ${timeStr}${reminder.notes ? `\n📝 ${reminder.notes}` : ''}`;
    try {
      await Share.share({ message });
    } catch (_) {}
  }

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 65).springify().damping(16)}
      style={cardStyle}
    >
      <Swipeable
        ref={swipeableRef}
        renderRightActions={() => <DeleteAction />}
        renderLeftActions={() => <CompleteAction isCompleted={isCompleted} />}
        onSwipeableOpen={(direction) => {
          if (direction === 'right') handleSwipeDelete();
          else if (direction === 'left') handleSwipeComplete();
        }}
        overshootRight={false}
        overshootLeft={false}
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
              backgroundColor: dim || isCompleted ? '#1A1A30' : color,
              borderTopLeftRadius: 22,
              borderBottomLeftRadius: 22,
            }}
          />

          <View
            style={{
              backgroundColor: reminder.ringing ? '#14082A' : isCompleted ? '#0A0F0A' : dim ? '#0C0C1C' : '#111128',
              borderWidth: 1.5,
              borderColor: reminder.ringing ? color : isCompleted ? '#1A3A1A' : dim ? '#161630' : '#1E1A40',
              borderRadius: 22,
              padding: 16,
              paddingLeft: 20,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            {/* Toggle */}
            <TouchableOpacity
              onPress={() => { Haptics.selectionAsync(); onToggle(); }}
              style={{
                width: 30, height: 30, borderRadius: 15,
                borderWidth: 2,
                borderColor: isCompleted ? '#10B981' : dim ? '#2D3748' : color,
                backgroundColor: isCompleted ? '#10B98130' : dim ? 'transparent' : `${color}20`,
                alignItems: 'center', justifyContent: 'center',
                marginRight: 14,
              }}
            >
              {isCompleted ? (
                <Ionicons name="checkmark" size={16} color="#10B981" />
              ) : !dim ? (
                <View style={{ width: 13, height: 13, borderRadius: 7, backgroundColor: color }} />
              ) : null}
            </TouchableOpacity>

            {/* Content */}
            <View style={{ flex: 1 }}>
              {/* Title row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                {reminder.ringing && <BellIcon size={15} ringing />}
                <Text
                  numberOfLines={1}
                  style={{
                    color: isCompleted ? '#4B5563' : dim ? '#4B5563' : '#E5E7EB',
                    fontSize: titleSize, fontWeight: '700', flex: 1,
                    textDecorationLine: isCompleted ? 'line-through' : 'none',
                  }}
                >
                  {reminder.title}
                </Text>
              </View>

              {/* Time */}
              <Text
                style={{
                  color: isCompleted ? '#2D3748' : dim ? '#2D3748' : color,
                  fontSize: timeSize, fontWeight: '900', letterSpacing: 0.5, marginBottom: 6,
                  textDecorationLine: isCompleted ? 'line-through' : 'none',
                }}
              >
                {formatTime(reminder.hour, reminder.minute)}
              </Text>

              {/* Metadata row */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {/* Category */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: `${catColor}15`, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: `${catColor}30` }}>
                  <Ionicons name={catIcon as any} size={11} color={catColor} />
                  <Text style={{ color: catColor, fontSize: 11, fontWeight: '700' }}>
                    {catLabel}
                  </Text>
                </View>

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

                {/* Completed Badge */}
                {isCompleted && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#10B98115', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: '#10B98130' }}>
                    <Ionicons name="checkmark-circle" size={11} color="#10B981" />
                    <Text style={{ color: '#10B981', fontSize: 11, fontWeight: '700' }}>
                      Completado
                    </Text>
                  </View>
                )}

                {/* Repeat - hide in simple mode */}
                {!simpleMode && reminder.repeat !== 'none' && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#0C0C20', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 }}>
                    <Ionicons name="repeat-outline" size={11} color="#6B7280" />
                    <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600' }}>
                      {repeatLabel(reminder.repeat)}
                    </Text>
                  </View>
                )}

                {/* Priority dot - hide in simple mode */}
                {!simpleMode && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#0C0C20', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 }}>
                    <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: pColor }} />
                    <Text style={{ color: pColor, fontSize: 11, fontWeight: '700', textTransform: 'capitalize' }}>
                      {reminder.priority === 'high' ? 'Alta' : reminder.priority === 'medium' ? 'Media' : 'Baja'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Notes preview */}
              {!simpleMode && !!reminder.notes && (
                <Text numberOfLines={1} style={{ color: '#374151', fontSize: 12, marginTop: 6 }}>
                  {reminder.notes}
                </Text>
              )}
            </View>

            {/* Action buttons */}
            <View style={{ alignItems: 'center', gap: 6, marginLeft: 6 }}>
              {/* Share */}
              <TouchableOpacity
                onPress={handleShare}
                style={{
                  width: 32, height: 32, borderRadius: 16,
                  backgroundColor: '#12121E',
                  alignItems: 'center', justifyContent: 'center',
                  borderWidth: 1, borderColor: '#2A1A50',
                }}
              >
                <Ionicons name="share-outline" size={15} color="#A78BFA" />
              </TouchableOpacity>

              {/* Edit */}
              {onEdit && (
                <TouchableOpacity
                  onPress={() => { Haptics.selectionAsync(); onEdit(); }}
                  style={{
                    width: 32, height: 32, borderRadius: 16,
                    backgroundColor: '#12121E',
                    alignItems: 'center', justifyContent: 'center',
                    borderWidth: 1, borderColor: '#2A1A50',
                  }}
                >
                  <Ionicons name="pencil-outline" size={15} color="#60A5FA" />
                </TouchableOpacity>
              )}

              {/* Delete */}
              <TouchableOpacity
                onPress={handleDelete}
                style={{
                  width: 32, height: 32, borderRadius: 16,
                  backgroundColor: '#12121E',
                  alignItems: 'center', justifyContent: 'center',
                  borderWidth: 1, borderColor: '#2A1A50',
                }}
              >
                <Ionicons name="close" size={15} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Swipeable>
    </Animated.View>
  );
}
