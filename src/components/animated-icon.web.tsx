import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function AnimatedSplashOverlay() {
  return null;
}

export function AnimatedIcon() {
  return (
    <View style={{ justifyContent: 'center', alignItems: 'center' }}>
      <Ionicons name="time" size={48} color="#A78BFA" />
    </View>
  );
}
