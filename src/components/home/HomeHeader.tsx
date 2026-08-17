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

      {/* ── Fila 2: Título Principal y Progreso Diario ── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={{ color: '#FFFFFF', fontSize: 28, fontWeight: '900', letterSpacing: -0.5 }}>
            Mis Recordatorios
          </Text>
          <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 13, fontWeight: '600', marginTop: 2, fontStyle: 'italic' }}>
            "{dailyQuote}"
          </Text>
        </View>
        
        {/* Progreso Diario (Anillo simulado con bordes) */}
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          <View style={{
            width: 50, height: 50, borderRadius: 25, 
            borderWidth: 4, borderColor: '#1A1A2E',
            alignItems: 'center', justifyContent: 'center'
          }}>
            <View style={{
               position: 'absolute', width: 50, height: 50, borderRadius: 25,
               borderWidth: 4, borderColor: '#10B981',
               opacity: progress > 0 ? (progressPercent / 100) : 0,
               borderTopColor: progress > 0.25 ? '#10B981' : 'transparent',
               borderRightColor: progress > 0.50 ? '#10B981' : 'transparent',
               borderBottomColor: progress > 0.75 ? '#10B981' : 'transparent',
               borderLeftColor: progress === 1 ? '#10B981' : 'transparent',
               transform: [{ rotate: '45deg' }]
            }} />
            <Text style={{ color: '#10B981', fontSize: 12, fontWeight: '800' }}>{progressPercent}%</Text>
          </View>
        </View>
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
