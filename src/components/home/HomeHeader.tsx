import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { getGreeting } from '@/utils/helpers';

const INSPIRATIONAL_QUOTES = [
  "Un paso a la vez, logras todo.",
  "Haz que hoy cuente.",
  "Tu salud y tu tiempo son un tesoro.",
  "Pequeños hábitos, grandes resultados.",
  "Organiza tu mente, organiza tu vida.",
  "El mejor momento es ahora.",
];

interface HomeHeaderProps {
  weather: { temp: string; icon: keyof typeof Ionicons.glyphMap };
  simpleMode: boolean;
  setSimpleMode: React.Dispatch<React.SetStateAction<boolean>>;
  liveTime: string;
  activeCount: number;
}

export function HomeHeader({
  weather,
  simpleMode,
  setSimpleMode,
  liveTime,
  activeCount,
}: HomeHeaderProps) {
  
  const dailyQuote = React.useMemo(() => INSPIRATIONAL_QUOTES[Math.floor(Math.random() * INSPIRATIONAL_QUOTES.length)], []);

  // ── Animación del botón de Modo Simple / Normal ──
  // Usamos useSharedValue para escalar suavemente el botón cuando es presionado.
  const modeScale = useSharedValue(1);
  const modeStyle = useAnimatedStyle(() => ({ transform: [{ scale: modeScale.value }] }));

  function toggleMode() {
    // Escala hacia abajo a 0.96 y regresa a 1 de forma muy suave
    modeScale.value = withTiming(0.96, { duration: 80 }, () => {
      modeScale.value = withTiming(1, { duration: 100 });
    });
    // Hacemos una vibración ligera en el celular (feedback táctil)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSimpleMode((v) => !v);
  }

  return (
    <Animated.View
      // Animación de entrada: el encabezado baja flotando desde arriba
      entering={FadeInDown.duration(550).springify()}
      style={{
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#141428',
      }}
    >
      {/* ── Fila 1: Saludo dinámico y Clima ── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="partly-sunny" size={22} color="#FBBF24" />
          <Text style={{ color: '#FFF', fontSize: 20, fontWeight: '800', letterSpacing: 0.5 }}>
            {getGreeting()}
          </Text>
        </View>

        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 6,
          backgroundColor: '#1A1A2E', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
        }}>
          <Ionicons name={weather.icon} size={15} color="#FBBF24" />
          <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '700' }}>
            {weather.temp}
          </Text>
        </View>
      </View>

      {/* ── Fila 2: Título Principal y Botón de Modo Simple ── */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <View>
          <Text style={{ color: '#FFFFFF', fontSize: 28, fontWeight: '900', letterSpacing: -0.5 }}>
            Mis Recordatorios
          </Text>
          <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 13, fontWeight: '600', marginTop: 2, fontStyle: 'italic' }}>
            "{dailyQuote}"
          </Text>
        </View>

        {/* ── Switch Simple / Normal ── */}
        <Animated.View style={modeStyle}>
          <TouchableOpacity
            onPress={toggleMode}
            activeOpacity={0.75}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              backgroundColor: simpleMode ? '#A78BFA22' : '#12122A',
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 24,
              borderWidth: 1.5,
              borderColor: simpleMode ? '#A78BFA' : '#252550',
            }}
          >
            <Ionicons
              name={simpleMode ? 'flash' : 'options-outline'}
              size={16}
              color={simpleMode ? '#A78BFA' : '#4B5563'}
            />
            <Text style={{
              color: simpleMode ? '#A78BFA' : '#4B5563',
              fontSize: 14,
              fontWeight: '800',
              letterSpacing: 0.3,
            }}>
              {simpleMode ? 'Simple' : 'Normal'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* ── Fila 3: Reloj en vivo y Número de Recordatorios Activos ── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="time-outline" size={17} color="#A78BFA" />
          <Text style={{ color: '#A78BFA', fontSize: 16, fontWeight: '700', letterSpacing: 0.8 }}>
            {liveTime}
          </Text>
        </View>
        <View style={{
          backgroundColor: '#160D35', borderRadius: 20,
          paddingHorizontal: 12, paddingVertical: 5,
          borderWidth: 1, borderColor: '#2D1F5E',
          flexDirection: 'row', alignItems: 'center', gap: 6,
        }}>
          <Ionicons name="alarm-outline" size={19} color="#C084FC" />
          <Text style={{ color: '#C084FC', fontSize: 13, fontWeight: '700' }}>
            {activeCount} activos
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}
