import React from 'react';
import { ScrollView, Text, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { CATEGORIES, type Category } from '@/constants/categories';

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
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 6,
            paddingHorizontal: 16, paddingVertical: 10,
            borderRadius: 20,
            backgroundColor: categoryFilter === 'all' ? '#FFFFFF22' : 'rgba(0,0,0,0.2)',
            borderWidth: 1.5,
            borderColor: categoryFilter === 'all' ? '#FFFFFF' : 'rgba(255,255,255,0.1)',
          }}
        >
          <Ionicons name="apps-outline" size={13} color={categoryFilter === 'all' ? '#FFFFFF' : '#4B5563'} />
          <Text style={{ color: categoryFilter === 'all' ? '#FFFFFF' : '#4B5563', fontSize: 12, fontWeight: '700' }}>
            Todos
          </Text>
        </TouchableOpacity>

        {/* ── Mapeo dinámico de todas las categorías definidas en la app ── */}
        {CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c.value}
            onPress={() => {
              Haptics.selectionAsync();
              setCategoryFilter(c.value);
            }}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 5,
              paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100,
              // Si está seleccionado, usamos su color con opacidad (añadiendo '22' al final del HEX)
              backgroundColor: categoryFilter === c.value ? `${c.color}22` : 'rgba(0,0,0,0.2)',
              borderWidth: 1.5,
              borderColor: categoryFilter === c.value ? c.color : 'rgba(255,255,255,0.1)',
            }}
          >
            <Ionicons name={c.icon as any} size={13} color={categoryFilter === c.value ? c.color : '#4B5563'} />
            <Text style={{ color: categoryFilter === c.value ? c.color : '#4B5563', fontSize: 12, fontWeight: '700' }}>
              {c.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Animated.View>
  );
}
