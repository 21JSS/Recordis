import React, { useEffect } from 'react';
import { TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface FABProps {
  fabBottom: number;
  onPress: () => void;
}

export function FAB({ fabBottom, onPress }: FABProps) {
  // ── Animación de Pulso (Latido) ──
  const fabScale = useSharedValue(1);
  
  useEffect(() => {
    // Hace que el botón "palpite" constantemente para llamar la atención del usuario
    fabScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,    // Repetición infinita
      false  // No revertir, empezar desde el principio cada vez
    );
  }, []);
  
  const fabStyle = useAnimatedStyle(() => ({ transform: [{ scale: fabScale.value }] }));

  return (
    <View style={{
      position: 'absolute',
      bottom: fabBottom,   // Posición calculada en index.tsx para no tapar la barra nativa de navegación
      right: 22,
      zIndex: 50,          // Por debajo de los confetis (999) pero por encima de las listas
    }}>
      <Animated.View style={fabStyle}>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); // Feedback táctil más notorio
            onPress();
          }}
          activeOpacity={0.85}
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: '#A78BFA',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#7C3AED',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.5,
            shadowRadius: 10,
            elevation: 8, // Sombra en Android
          }}
        >
          <Ionicons
            name="add"
            size={38}
            color="#FFF"
          />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
