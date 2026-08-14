import React from 'react';
import { Platform, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export function SearchBar({ searchQuery, setSearchQuery }: SearchBarProps) {
  return (
    <Animated.View
      // Animación de entrada: aparece flotando justo después del encabezado
      entering={FadeInDown.delay(80).springify()}
      style={{ paddingHorizontal: 18, paddingTop: 14, paddingBottom: 6 }}
    >
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: '#111128',
        borderRadius: 18,
        paddingHorizontal: 16,
        // En iOS necesitamos más padding vertical para que el texto no se corte
        paddingVertical: Platform.OS === 'ios' ? 12 : 4,
        borderWidth: 1.5,
        borderColor: searchQuery ? '#7C3AED' : '#1A1A35', // Si hay búsqueda, resalta en morado
      }}>
        {/* Ícono de la lupa */}
        <Ionicons name="search" size={18} color={searchQuery ? '#A78BFA' : '#4B5563'} />
        
        {/* ── Input de Texto ── */}
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery} // Actualiza el estado global en index.tsx
          placeholder="Buscar recordatorios..."
          placeholderTextColor="#2D3748"
          returnKeyType="search"
          style={{
            flex: 1,
            color: '#FFF',
            fontSize: 15,
            fontWeight: '600',
          }}
        />

        {/* ── Botón para limpiar búsqueda ── */}
        {/* Sólo se muestra si el usuario ha escrito algo */}
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#4B5563" />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}
