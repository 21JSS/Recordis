/**
 * AppIcons — animated vector icons using @expo/vector-icons (Ionicons).
 * Each icon wraps in an Animated.View so it can be given scale/rotation animations.
 */
import { Ionicons } from '@expo/vector-icons';
import {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Animated from 'react-native-reanimated';

export type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

// ─── Base animated icon ───────────────────────────────────────────────────────
interface IconProps {
  name: IoniconName;
  size?: number;
  color?: string;
  animate?: 'pulse' | 'spin' | 'bounce' | 'none';
}

export function AppIcon({ name, size = 24, color = '#A78BFA', animate = 'none' }: IconProps) {
  const scale = useSharedValue(1);
  const rotate = useSharedValue('0deg');

  if (animate === 'pulse') {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.18, { duration: 700 }),
        withTiming(1, { duration: 700 })
      ),
      -1,
      false
    );
  } else if (animate === 'bounce') {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 400 }),
        withTiming(0.96, { duration: 200 }),
        withTiming(1, { duration: 300 })
      ),
      -1,
      false
    );
  }

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={style}>
      <Ionicons name={name} size={size} color={color} />
    </Animated.View>
  );
}

// ─── Tab bar icon with focus animation ───────────────────────────────────────
interface TabIconProps {
  name: IoniconName;
  focused: boolean;
  size?: number;
}

export function TabBarIcon({ name, focused, size = 24 }: TabIconProps) {
  const scale = useSharedValue(focused ? 1 : 0.85);
  const opacity = useSharedValue(focused ? 1 : 0.55);

  if (focused) {
    scale.value = withSpring(1.1, { damping: 10, stiffness: 180 }, () => {
      scale.value = withSpring(1, { damping: 14 });
    });
    opacity.value = withTiming(1, { duration: 200 });
  } else {
    scale.value = withSpring(0.85, { damping: 12 });
    opacity.value = withTiming(0.5, { duration: 200 });
  }

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={style}>
      <Ionicons
        name={name}
        size={size}
        color={focused ? '#A78BFA' : '#4B5563'}
      />
    </Animated.View>
  );
}

// ─── Bell icon with ring animation ───────────────────────────────────────────
interface BellIconProps {
  size?: number;
  ringing?: boolean;
}

export function BellIcon({ size = 32, ringing = false }: BellIconProps) {
  const rotate = useSharedValue(0);

  if (ringing) {
    rotate.value = withRepeat(
      withSequence(
        withTiming(-15, { duration: 100 }),
        withTiming(15, { duration: 100 }),
        withTiming(-12, { duration: 100 }),
        withTiming(12, { duration: 100 }),
        withTiming(0, { duration: 150 })
      ),
      -1,
      false
    );
  } else {
    rotate.value = withTiming(0, { duration: 200 });
  }

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }],
  }));

  return (
    <Animated.View style={style}>
      <Ionicons
        name={ringing ? 'notifications' : 'notifications-outline'}
        size={size}
        color={ringing ? '#C084FC' : '#A78BFA'}
      />
    </Animated.View>
  );
}
