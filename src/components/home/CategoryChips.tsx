import React from 'react';
import { ScrollView, Text, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { CATEGORIES, type Category } from '@/constants/categories';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';

interface CategoryChipsProps {
  categoryFilter: Category | 'all';
  setCategoryFilter: (c: Category | 'all') => void;
}

export function CategoryChips({ categoryFilter, setCategoryFilter }: CategoryChipsProps) {
  return (
    <Animated.View entering={FadeInDown.delay(120).springify()}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false} // Oculta la barra de scroll en horizontal
        contentContainerStyle={{ paddingHorizontal: 18, paddingVertical: 8, gap: 8 }}
      >
        {/* ── Chip para mostrar "Todos" los recordatorios ── */}
        <TouchableOpacity
          onPress={() => { Haptics.selectionAsync(); setCategoryFilter('all'); }}
          className="flex-row items-center gap-1.5 px-4 py-2.5 rounded-[20px] border-[1.5px]"
          style={{
            backgroundColor: categoryFilter === 'all' ? '#FFFFFF22' : 'rgba(0,0,0,0.2)',
            borderColor: categoryFilter === 'all' ? '#FFFFFF' : 'rgba(255,255,255,0.1)',
          }}
        >
          <Ionicons name="apps-outline" size={13} color={categoryFilter === 'all' ? '#FFFFFF' : '#4B5563'} />
          <ThemedText className="text-sm font-bold" style={{ color: categoryFilter === 'all' ? '#FFFFFF' : '#4B5563' }}>
            Todos
          </ThemedText>
        </TouchableOpacity>

        {/* ── Mapeo dinámico de todas las categorías definidas en la app ── */}
        {CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c.value}
            onPress={() => {
              Haptics.selectionAsync();
              setCategoryFilter(c.value);
            }}
            className="flex-row items-center gap-1 px-3.5 py-2 rounded-full border-[1.5px]"
            style={{
              backgroundColor: categoryFilter === c.value ? `${c.color}22` : 'rgba(0,0,0,0.2)',
              borderColor: categoryFilter === c.value ? c.color : 'rgba(255,255,255,0.1)',
            }}
          >
            <Ionicons name={c.icon as any} size={13} color={categoryFilter === c.value ? c.color : '#4B5563'} />
            <ThemedText className="text-sm font-bold" style={{ color: categoryFilter === c.value ? c.color : '#4B5563' }}>
              {c.label}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Animated.View>
  );
}
