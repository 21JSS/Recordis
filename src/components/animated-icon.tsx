import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

export function AnimatedSplashOverlay() {
  const [phase, setPhase] = useState<'idle' | 'animating' | 'done'>('idle');
  // Track when animation fully completes so overlay stops intercepting touches
  const [animDone, setAnimDone] = useState(false);

  // Shared values
  const clockY = useSharedValue(-220);
  const clockScale = useSharedValue(0.1);
  const clockRotate = useSharedValue(-60);
  const textOpacity = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);
  const zoomScale = useSharedValue(1);
  const overlayOpacity = useSharedValue(1);

  function startAnimation() {
    textOpacity.value = withTiming(1, { duration: 400 });

    clockY.value = withDelay(250, withSpring(0, { damping: 8, stiffness: 130 }));
    clockScale.value = withDelay(250, withSpring(1, { damping: 9, stiffness: 140 }));
    clockRotate.value = withDelay(250, withSpring(0, { damping: 10, stiffness: 150 }));

    subtitleOpacity.value = withDelay(800, withTiming(1, { duration: 500 }));

    zoomScale.value = withDelay(
      2200,
      withTiming(7, { duration: 700, easing: Easing.in(Easing.cubic) })
    );
    overlayOpacity.value = withDelay(
      2400,
      withTiming(0, { duration: 500, easing: Easing.out(Easing.ease) }, (finished) => {
        if (finished) {
          runOnJS(setAnimDone)(true);
          runOnJS(setPhase)('done');
        }
      })
    );
  }

  const clockStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: clockY.value },
      { scale: clockScale.value },
      { rotate: `${clockRotate.value}deg` },
    ],
  }));

  const textStyle = useAnimatedStyle(() => ({ opacity: textOpacity.value }));
  const subtitleStyle = useAnimatedStyle(() => ({ opacity: subtitleOpacity.value }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
    transform: [{ scale: zoomScale.value }],
  }));

  if (phase === 'done') return null;

  return (
    <Animated.View
      style={[styles.splashOverlay, containerStyle]}
      // CRITICAL FIX: once animation is done, this overlay must NOT intercept touches.
      // pointerEvents='none' lets all gestures pass through to the underlying UI.
      pointerEvents={animDone ? 'none' : 'auto'}
      onLayout={() => {
        SplashScreen.hideAsync().finally(() => {
          setPhase('animating');
          startAnimation();
        });
      }}
    >
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={[{ flexDirection: 'row', alignItems: 'center' }, textStyle]}>
          <Text style={styles.titleText}>Rec</Text>

          <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginHorizontal: 1 }}>
            <Animated.View style={clockStyle}>
              <Ionicons name="time" size={42} color="#A78BFA" />
            </Animated.View>
          </View>

          <Text style={styles.titleText}>rdis</Text>
        </Animated.View>

        <Animated.View style={[{ marginTop: 14 }, subtitleStyle]}>
          <Text style={styles.tagline}>Recuerda lo importante</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

export function AnimatedIcon() {
  return (
    <View style={{ justifyContent: 'center', alignItems: 'center' }}>
      <Ionicons name="time" size={48} color="#A78BFA" />
    </View>
  );
}

const styles = StyleSheet.create({
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#080816',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    // CRITICAL FIX: elevation only applies on Android; without this
    // on RN the view intercepts touches even when transparent
    elevation: Platform.OS === 'android' ? 999 : 0,
  },
  titleText: {
    fontSize: 50,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    color: '#A78BFA',
    fontWeight: '600',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
});
