/**
 * BackupRestoreSheet.tsx
 * A modal for exporting and importing reminders data.
 */
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

interface BackupRestoreSheetProps {
  visible: boolean;
  onClose: () => void;
  onExport: () => string;
  onImport: (json: string) => boolean;
}

export function BackupRestoreSheet({ visible, onClose, onExport, onImport }: BackupRestoreSheetProps) {
  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);

  async function handleExport() {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const json = onExport();
      const fileName = `recordis_backup_${new Date().toISOString().split('T')[0]}.json`;
      
      const file = new File(Paths.cache, fileName);
      await file.write(json);
      const filePath = file.uri;

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'application/json',
          dialogTitle: 'Exportar Recordatorios',
        });
      } else {
        Alert.alert('Éxito', 'Backup guardado correctamente.');
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo exportar los recordatorios.');
    }
  }

  function handleImport() {
    const trimmed = importText.trim();
    if (!trimmed) {
      Alert.alert('Error', 'Pega el contenido del archivo de backup.');
      return;
    }
    const success = onImport(trimmed);
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Éxito', 'Recordatorios importados correctamente.');
      setImportText('');
      setShowImport(false);
      onClose();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'El formato del archivo no es válido.');
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <TouchableOpacity
            style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000000CC' }]}
            activeOpacity={1}
            onPress={onClose}
          />
          <Animated.View
          entering={FadeInUp.duration(400).springify()}
          style={{
            backgroundColor: '#09091E',
            borderTopLeftRadius: 36,
            borderTopRightRadius: 36,
            borderTopWidth: 1.5,
            borderColor: '#2A1A50',
            maxHeight: '90%',
            paddingBottom: Platform.OS === 'ios' ? 40 : 28,
          }}
        >
          {/* Drag Handle */}
          <View style={{ alignItems: 'center', paddingTop: 14, paddingBottom: 8 }}>
            <View style={{ width: 42, height: 4, borderRadius: 2, backgroundColor: '#2A1A50' }} />
          </View>

          {/* Header */}
          <Animated.View
            entering={FadeInDown.delay(80).springify()}
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              paddingHorizontal: 28, paddingBottom: 24,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{
                width: 42, height: 42, borderRadius: 21,
                backgroundColor: '#A78BFA22',
                alignItems: 'center', justifyContent: 'center',
                borderWidth: 1.5, borderColor: '#7C3AED',
              }}>
                <Ionicons name="cloud-outline" size={20} color="#A78BFA" />
              </View>
              <View>
                <Text style={{ color: '#FFF', fontSize: 22, fontWeight: '900' }}>
                  Respaldo
                </Text>
                <Text style={{ color: '#4B5563', fontSize: 13, fontWeight: '500', marginTop: 1 }}>
                  Exportar o importar datos
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={{
                width: 40, height: 40, borderRadius: 20,
                backgroundColor: '#1E1040',
                alignItems: 'center', justifyContent: 'center',
                borderWidth: 2, borderColor: '#3D2370',
              }}
            >
              <Ionicons name="close" size={22} color="#C084FC" />
            </TouchableOpacity>
          </Animated.View>

          {/* Actions */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 24, gap: 14, paddingBottom: 20 }}
          >
            {/* Export Button */}
            <Animated.View entering={FadeInDown.delay(130).springify()}>
              <TouchableOpacity
                onPress={handleExport}
                activeOpacity={0.85}
                style={{
                  backgroundColor: '#111128',
                  borderRadius: 22,
                  padding: 22,
                  borderWidth: 1.5,
                  borderColor: '#2D1F5E',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 16,
                }}
              >
                <View style={{
                  width: 50, height: 50, borderRadius: 25,
                  backgroundColor: '#10B98120',
                  alignItems: 'center', justifyContent: 'center',
                  borderWidth: 1, borderColor: '#10B98140',
                }}>
                  <Ionicons name="download-outline" size={24} color="#10B981" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#FFF', fontSize: 17, fontWeight: '800' }}>
                    Exportar Datos
                  </Text>
                  <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 2 }}>
                    Guarda todos tus recordatorios como archivo
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#4B5563" />
              </TouchableOpacity>
            </Animated.View>

            {/* Import Button / Section */}
            <Animated.View entering={FadeInDown.delay(180).springify()}>
              <TouchableOpacity
                onPress={() => setShowImport(!showImport)}
                activeOpacity={0.85}
                style={{
                  backgroundColor: '#111128',
                  borderRadius: 22,
                  padding: 22,
                  borderWidth: 1.5,
                  borderColor: showImport ? '#60A5FA' : '#2D1F5E',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 16,
                }}
              >
                <View style={{
                  width: 50, height: 50, borderRadius: 25,
                  backgroundColor: '#60A5FA20',
                  alignItems: 'center', justifyContent: 'center',
                  borderWidth: 1, borderColor: '#60A5FA40',
                }}>
                  <Ionicons name="push-outline" size={24} color="#60A5FA" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#FFF', fontSize: 17, fontWeight: '800' }}>
                    Importar Datos
                  </Text>
                  <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 2 }}>
                    Restaura recordatorios desde un backup
                  </Text>
                </View>
                <Ionicons name={showImport ? 'chevron-down' : 'chevron-forward'} size={20} color="#4B5563" />
              </TouchableOpacity>
            </Animated.View>

            {/* Import text area */}
            {showImport && (
              <Animated.View entering={FadeInDown.delay(50).springify()} style={{ gap: 12 }}>
                <TextInput
                  value={importText}
                  onChangeText={setImportText}
                  placeholder="Pega aquí el contenido del archivo JSON..."
                  placeholderTextColor="#2D3748"
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                  style={{
                    backgroundColor: '#0C0C20',
                    color: '#FFF',
                    borderRadius: 16,
                    paddingHorizontal: 18,
                    paddingVertical: 14,
                    fontSize: 14,
                    borderWidth: 1.5,
                    borderColor: '#2A1A50',
                    minHeight: 120,
                    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                  }}
                />
                <TouchableOpacity
                  onPress={handleImport}
                  style={{
                    backgroundColor: '#60A5FA',
                    borderRadius: 18,
                    paddingVertical: 16,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 10,
                  }}
                >
                  <Ionicons name="push-outline" size={20} color="#FFF" />
                  <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '800' }}>
                    Importar
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </ScrollView>
        </Animated.View>
      </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
