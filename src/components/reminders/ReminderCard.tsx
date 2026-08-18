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
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
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
      marginLeft: 8,
      height: '100%',
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
      marginRight: 8,
      height: '100%',
    }}>
      <Ionicons name={isCompleted ? 'refresh-outline' : 'checkmark-circle-outline'} size={24} color="#FFF" />
      <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700', marginTop: 4 }}>
        {isCompleted ? 'Reactivar' : 'Completar'}
      </Text>
    </View>
  );
}

export function ReminderCard({ reminder, index, onToggle, onDelete, onEdit, onComplete }: ReminderCardProps) {
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

  // Tamaños de fuente grandes para accesibilidad universal
  const titleSize = 18;
  const timeSize = 30;

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
      style={[cardStyle, { marginBottom: 12 }]}
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
        <View style={{ borderRadius: 22, position: 'relative' }}>
          {/* ── Neon Glow using LinearGradient for perfect Android/iOS spread ── */}
          {!(dim || isCompleted) && (
            <LinearGradient
              colors={[color, `${color}00`]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{
                position: 'absolute',
                left: -18,
                top: 4,
                bottom: 4,
                width: 36,
                borderRadius: 18,
                opacity: reminder.ringing ? 1 : 0.85,
                zIndex: 10,
              }}
            />
          )}

          {/* Color accent bar OUTSIDE BlurView so its glow can spread freely */}
          <View
            style={{
              position: 'absolute',
              left: 0, top: 0, bottom: 0,
              width: 12,
              backgroundColor: dim || isCompleted ? 'rgba(255,255,255,0.1)' : color,
              borderTopLeftRadius: 22,
              borderBottomLeftRadius: 22,
              shadowColor: dim || isCompleted ? 'transparent' : color,
              shadowOffset: { width: -2, height: 0 },
              shadowOpacity: 1,
              shadowRadius: 20,
              elevation: 16,
              zIndex: 20,
            }}
          />

          <BlurView
            intensity={30}
            tint="dark"
            style={{
              borderRadius: 22,
              overflow: 'hidden',
              shadowColor: reminder.ringing ? color : '#000',
              shadowOffset: { width: 0, height: reminder.ringing ? 8 : 4 },
              shadowOpacity: reminder.ringing ? 0.6 : 0.25,
              shadowRadius: reminder.ringing ? 22 : 8,
              elevation: reminder.ringing ? 14 : 5,
              borderWidth: 1.5,
              borderColor: reminder.ringing ? color : 'rgba(255,255,255,0.1)',
            }}
          >

          <View
            style={{
              backgroundColor: reminder.ringing ? `${color}15` : 'rgba(0,0,0,0.2)',
              borderRadius: 22,
              padding: 16,
              paddingLeft: 28, // Incremented to account for the wider bar outside
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

                {/* Streak Badge */}
                {reminder.streak !== undefined && reminder.streak > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FF8A0015', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: '#FF8A0030' }}>
                    <Text style={{ fontSize: 11 }}>🔥</Text>
                    <Text style={{ color: '#FF8A00', fontSize: 11, fontWeight: '800' }}>
                      {reminder.streak}
                    </Text>
                  </View>
                )}

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
                <Text numberOfLines={1} style={{ color: '#9CA3AF', fontSize: 12, marginTop: 6 }}>
                  {reminder.notes}
                </Text>
              )}
            </View>
          </View>
        </BlurView>
        </View>
      </Swipeable>
    </Animated.View>
  );
}
