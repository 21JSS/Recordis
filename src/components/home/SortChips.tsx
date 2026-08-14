import React from 'react';
import { ScrollView, Text, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

// Exportamos el tipo de ordenamiento para que index.tsx pueda usarlo en la función sortReminders
export type SortMode = 'date' | 'priority' | 'time' | 'category';

// Definimos las opciones de orden disponibles con sus íconos correspondientes
export const SORT_OPTIONS: { value: SortMode; label: string; icon: string }[] = [
  { value: 'date', label: 'Fecha', icon: 'calendar-outline' },
  { value: 'time', label: 'Hora', icon: 'time-outline' },
  { value: 'priority', label: 'Prioridad', icon: 'flag-outline' },
  { value: 'category', label: 'Categoría', icon: 'pricetag-outline' },
];

interface SortChipsProps {
  sortMode: SortMode;
  sortAsc: boolean;
  onSortPress: (mode: SortMode) => void;
}

export function SortChips({ sortMode, sortAsc, onSortPress }: SortChipsProps) {
  return (
    <Animated.View entering={FadeInDown.delay(160).springify()}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 8, gap: 6 }}
      >
        {/* Iteramos sobre todas las opciones de ordenamiento */}
        {SORT_OPTIONS.map((opt) => {
          const active = sortMode === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => onSortPress(opt.value)}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 4,
                paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100,
                // Resaltar visualmente la opción activa con un fondo oscuro sutil
                backgroundColor: active ? '#16163A' : 'transparent',
                borderWidth: 1,
                borderColor: active ? '#2D1F5E' : 'transparent',
              }}
            >
              <Ionicons name={opt.icon as any} size={12} color={active ? '#A78BFA' : '#374151'} />
              <Text style={{ color: active ? '#A78BFA' : '#374151', fontSize: 11, fontWeight: '700' }}>
                {opt.label}
              </Text>
              
              {/* Flecha indicadora de Ascendente o Descendente (sólo si está activa) */}
              {active && (
                <Ionicons
                  name={sortAsc ? 'arrow-up' : 'arrow-down'}
                  size={11}
                  color="#A78BFA"
                />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
}
