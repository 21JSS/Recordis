/**
 * CalendarGrid — Fixed animation bug.
 *
 * Bug root cause: hooks (useSharedValue) were called AFTER an early return
 * inside DayCell (conditional hook = React rules violation). Also the DayCell keys
 * were `${row}-${col}` and didn't change when navigating months, so React reused
 * the same nodes and the `entering` animation never re-triggered.
 *
 * Fix:
 *  1. Move hooks to the top of DayCell, before any conditional return.
 *  2. Pass a `monthKey` prop so each DayCell gets a unique key per month/year,
 *     forcing a full remount (and fresh entrance animation) on every month change.
 */
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { DAY_NAMES_SHORT } from '@/utils/helpers';

// ─── Single day cell ──────────────────────────────────────────────────────────
interface DayCellProps {
  day: number | null;
  isToday: boolean;
  isSelected: boolean;
  hasReminders: boolean;
  dotColors: string[];     // colors for each reminder dot
  onPress: () => void;
  enterDelay: number;
}

function DayCell({ day, isToday, isSelected, hasReminders, dotColors, onPress, enterDelay }: DayCellProps) {
  // ⚠️ Hooks MUST be before any conditional return
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (day === null) {
    return <View style={{ flex: 1, height: 52, margin: 3 }} />;
  }

  function handlePress() {
    scale.value = withSpring(0.85, { damping: 10 }, () => {
      scale.value = withSpring(1, { damping: 14 });
    });
    onPress();
  }

  return (
    <Animated.View
      entering={FadeInDown.delay(enterDelay).springify().damping(16)}
      style={[{ flex: 1, margin: 3 }, pressStyle]}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        style={{
          height: 52,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isSelected ? '#7C3AED' : isToday ? '#1E1040' : '#111128',
          borderWidth: 1.5,
          borderColor: isSelected ? '#A78BFA' : isToday ? '#4C1D95' : '#1A1A35',
        }}
      >
        <Text
          style={{
            color: isSelected ? '#FFFFFF' : isToday ? '#C084FC' : '#D1D5DB',
            fontSize: 15,
            fontWeight: isSelected || isToday ? '800' : '500',
          }}
        >
          {day}
        </Text>
        {hasReminders && (
          <View style={{ flexDirection: 'row', gap: 3, position: 'absolute', bottom: 5 }}>
            {dotColors.slice(0, 3).map((dc, idx) => (
              <View
                key={idx}
                style={{
                  width: 5, height: 5, borderRadius: 3,
                  backgroundColor: isSelected ? '#FFF' : dc,
                }}
              />
            ))}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Full calendar grid ───────────────────────────────────────────────────────
interface CalendarGridProps {
  cells: (number | null)[];
  /** Used as part of each cell's React key so changing month forces remount & re-animation */
  monthKey: string;
  selectedDay: number | null;
  todayDay: number | null; // null if today is not in this month
  daysWithReminders: Set<number>;
  /** Map from day number to array of reminder colors */
  reminderColors: Map<number, string[]>;
  onDayPress: (day: number) => void;
}

export function CalendarGrid({
  cells,
  monthKey,
  selectedDay,
  todayDay,
  daysWithReminders,
  reminderColors,
  onDayPress,
}: CalendarGridProps) {
  const rows = Math.ceil(cells.length / 7);

  return (
    <View style={{ paddingHorizontal: 14 }}>
      {/* Day-of-week headers */}
      <View style={{ flexDirection: 'row', marginBottom: 8 }}>
        {DAY_NAMES_SHORT.map((d) => (
          <View key={d} style={{ flex: 1, alignItems: 'center' }}>
            <Text
              style={{
                color: '#4B5563',
                fontSize: 12,
                fontWeight: '700',
                letterSpacing: 0.4,
              }}
            >
              {d}
            </Text>
          </View>
        ))}
      </View>

      {/* Rows of days */}
      {Array.from({ length: rows }, (_, row) => (
        <View key={`row-${row}`} style={{ flexDirection: 'row' }}>
          {cells.slice(row * 7, row * 7 + 7).map((day, col) => (
            <DayCell
              // Key includes monthKey so the cell fully remounts on month change,
              // triggering the `entering` animation fresh each time.
              key={`${monthKey}-${row}-${col}`}
              day={day}
              isToday={day !== null && day === todayDay}
              isSelected={day !== null && day === selectedDay}
              hasReminders={day !== null && daysWithReminders.has(day)}
              dotColors={day !== null ? (reminderColors.get(day) ?? ['#A78BFA']) : []}
              onPress={() => day && onDayPress(day)}
              enterDelay={row * 35 + col * 18}
            />
          ))}
        </View>
      ))}
    </View>
  );
}
