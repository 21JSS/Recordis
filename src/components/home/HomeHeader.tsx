import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { getGreeting } from '@/utils/helpers';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';

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
  liveTime: string;
  activeCount: number;
  totalTodayCount: number;
  completedTodayCount: number;
}

export function HomeHeader({
  weather,
  liveTime,
  activeCount,
  totalTodayCount,
  completedTodayCount,
}: HomeHeaderProps) {
  const dailyQuote = React.useMemo(() => INSPIRATIONAL_QUOTES[Math.floor(Math.random() * INSPIRATIONAL_QUOTES.length)], []);

  // Calcular progreso (0 a 1)
  const progress = totalTodayCount === 0 ? 0 : (completedTodayCount / totalTodayCount);
  const progressPercent = Math.round(progress * 100);

  return (
    <Animated.View
      entering={FadeInDown.duration(550).springify()}
      className="px-6 pt-4 pb-3.5 border-b border-[#141428]"
    >
      {/* ── Fila 1: Saludo dinámico y Clima ── */}
      <ThemedView className="flex-row items-center justify-between mb-1.5">
        <ThemedView className="flex-row items-center gap-2">
          <Ionicons name="partly-sunny" size={22} color="#FBBF24" />
          <ThemedText className="text-white text-lg font-extrabold" style={{ letterSpacing: 0.5 }}>{getGreeting()}</ThemedText>
        </ThemedView>
        <ThemedView className="flex-row items-center gap-1.5 bg-white/8 px-3 py-1.5 rounded-lg">
          <Ionicons name={weather.icon} size={15} color="#FBBF24" />
          <ThemedText className="text-white text-sm font-bold">{weather.temp}</ThemedText>
        </ThemedView>
      </ThemedView>

      {/* ── Fila 2: Título Principal y Progreso Diario ── */}
      <ThemedView className="flex-row items-center justify-between mb-2.5">
        <ThemedView className="flex-1 pr-3">
          <ThemedText className="text-white text-2xl font-black" style={{ letterSpacing: -0.5 }}>Mis Recordatorios</ThemedText>
          <ThemedText className="text-white/70 text-sm font-semibold italic mt-0.5">"{dailyQuote}"</ThemedText>
        </ThemedView>
        {/* Progreso Diario (Anillo simulado con bordes) */}
        <ThemedView className="items-center justify-center">
          <ThemedView className="w-11 h-11 rounded-full bg-white/5 flex items-center justify-center relative">
            <ThemedView className="absolute inset-0 border-4 border-white/80 opacity-80" style={{
              borderTopColor: progress > 0.25 ? '#FFFFFF' : 'transparent',
              borderRightColor: progress > 0.50 ? '#FFFFFF' : 'transparent',
              borderBottomColor: progress > 0.75 ? '#FFFFFF' : 'transparent',
              borderLeftColor: progress === 1 ? '#FFFFFF' : 'transparent',
              transform: [{ rotate: '-45deg' }],
            }} />
            <ThemedText className="text-white text-xs font-extrabold">{progressPercent}%</ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>

      {/* ── Fila 3: Reloj en vivo y Número de Recordatorios Activos ── */}
      <ThemedView className="flex-row items-center justify-between">
        <ThemedView className="flex-row items-center gap-2">
          <Ionicons name="time-outline" size={17} color="#A78BFA" />
          <ThemedText className="text-primary text-base font-bold" style={{ letterSpacing: 0.8 }}>{liveTime}</ThemedText>
        </ThemedView>
        <ThemedView className="flex-row items-center gap-1.5 bg-white/8 rounded-full px-3 py-1.5 border border-white/15">
          <Ionicons name="alarm-outline" size={19} color="#FFFFFF" />
          <ThemedText className="text-white text-sm font-bold">{activeCount} activos</ThemedText>
        </ThemedView>
      </ThemedView>
    </Animated.View>
  );
}
