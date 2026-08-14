import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

export function AnimatedSplashOverlay() {
  const [phase, setPhase] = useState<'idle' | 'animating' | 'done'>('idle');
  // Track when animation fully completes so overlay stops intercepting touches
  const [animDone, setAnimDone] = useState(false);

  // Shared values
  const clockScale = useSharedValue(0.3);
  const clockOpacity = useSharedValue(0);
  const clockRotate = useSharedValue(0);       // smooth rotation, NOT bounce
  const glowOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);
  const zoomScale = useSharedValue(1);
  const overlayOpacity = useSharedValue(1);

  function startAnimation() {
    // 1. Fade in title text smoothly
    textOpacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) });

    // 2. Clock appears: smooth scale (NO spring/bounce) + fade-in
    clockOpacity.value = withDelay(200,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) })
    );
    clockScale.value = withDelay(200,
      withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) })
    );

    // 3. Clock hands rotate — smooth 360° spin (like a clock ticking forward)
    clockRotate.value = withDelay(300,
      withTiming(360, { duration: 1400, easing: Easing.inOut(Easing.cubic) })
    );

    // 4. Glow pulse around clock
    glowOpacity.value = withDelay(400,
      withSequence(
        withTiming(0.8, { duration: 500, easing: Easing.out(Easing.ease) }),
        withTiming(0.3, { duration: 400, easing: Easing.in(Easing.ease) }),
        withTiming(0.6, { duration: 300, easing: Easing.out(Easing.ease) }),
      )
    );

    // 5. Subtitle fades in
    subtitleOpacity.value = withDelay(900, withTiming(1, { duration: 500 }));

    // 6. PRONOUNCED zoom out — scale to 14 (bigger = more immersive "entering" feel)
    zoomScale.value = withDelay(
      2200,
      withTiming(14, { duration: 800, easing: Easing.in(Easing.cubic) })
    );
    overlayOpacity.value = withDelay(
      2500,
      withTiming(0, { duration: 500, easing: Easing.out(Easing.ease) }, (finished) => {
        if (finished) {
          runOnJS(setAnimDone)(true);
          runOnJS(setPhase)('done');
        }
      })
    );
  }

  const clockStyle = useAnimatedStyle(() => ({
    opacity: clockOpacity.value,
    transform: [
      { scale: clockScale.value },
      { rotate: `${clockRotate.value}deg` },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
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

          <View style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center', marginHorizontal: 2 }}>
            {/* Glow ring behind the clock */}
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: '#A78BFA',
                },
                glowStyle,
              ]}
            />
            <Animated.View style={clockStyle}>
              <Ionicons name="time" size={44} color="#A78BFA" />
            </Animated.View>
          </View>

          <Text style={styles.titleText}>rdis</Text>
        </Animated.View>

        <Animated.View style={[{ marginTop: 16 }, subtitleStyle]}>
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
