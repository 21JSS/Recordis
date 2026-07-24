import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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

  // Shared values
  const clockY = useSharedValue(-220); // Starts above screen
  const clockScale = useSharedValue(0.1);
  const clockRotate = useSharedValue(-60);
  const textOpacity = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);
  const zoomScale = useSharedValue(1);
  const overlayOpacity = useSharedValue(1);

  function startAnimation() {
    // 1. Text "Rec  rdis" fades in
    textOpacity.value = withTiming(1, { duration: 400 });

    // 2. Clock jumps down into the "O" position with spring bounce
    clockY.value = withDelay(
      250,
      withSpring(0, { damping: 8, stiffness: 130 })
    );
    clockScale.value = withDelay(
      250,
      withSpring(1, { damping: 9, stiffness: 140 })
    );
    clockRotate.value = withDelay(
      250,
      withSpring(0, { damping: 10, stiffness: 150 })
    );

    // 3. Subtitle "Recuerda lo importante" fades in
    subtitleOpacity.value = withDelay(800, withTiming(1, { duration: 500 }));

    // 4. Zoom animation reveals the app
    zoomScale.value = withDelay(
      2200,
      withTiming(7, { duration: 700, easing: Easing.in(Easing.cubic) })
    );
    overlayOpacity.value = withDelay(
      2400,
      withTiming(0, { duration: 500, easing: Easing.out(Easing.ease) }, (finished) => {
        if (finished) runOnJS(setPhase)('done');
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

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
    transform: [{ scale: zoomScale.value }],
  }));

  if (phase === 'done') return null;

  return (
    <Animated.View
      style={[styles.splashOverlay, containerStyle]}
      onLayout={() => {
        SplashScreen.hideAsync().finally(() => {
          setPhase('animating');
          startAnimation();
        });
      }}
    >
      {/* Title "Rec [Clock] rdis" */}
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={[{ flexDirection: 'row', alignItems: 'center' }, textStyle]}>
          <Text style={styles.titleText}>Rec</Text>

          {/* Vector Clock jumping into O position */}
          <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginHorizontal: 1 }}>
            <Animated.View style={clockStyle}>
              <Ionicons name="time" size={42} color="#A78BFA" />
            </Animated.View>
          </View>

          <Text style={styles.titleText}>rdis</Text>
        </Animated.View>

        {/* Subtitle */}
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
