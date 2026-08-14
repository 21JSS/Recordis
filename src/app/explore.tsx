/**
 * stats.tsx — Statistics & Insights Screen
 * Replaces the old Explore tab with beautiful analytics about your reminders.
 */
import { useState } from 'react';
import { Alert, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useReminders } from '@/context/RemindersContext';
import { formatTime, MONTH_NAMES } from '@/utils/helpers';
import { CATEGORIES, categoryColor, categoryIcon, categoryLabel, type Category } from '@/constants/categories';
import { BackupRestoreSheet } from '@/components/reminders/BackupRestoreSheet';

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color, delay }: { icon: string; label: string; value: string | number; color: string; delay: number }) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify().damping(16)}
      style={{
        flex: 1,
        backgroundColor: '#111128',
        borderRadius: 20,
        padding: 18,
        borderWidth: 1.5,
        borderColor: '#1E1A40',
        minHeight: 110,
      }}
    >
      <View style={{
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: `${color}20`,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: `${color}40`,
        marginBottom: 12,
      }}>
        <Ionicons name={icon as any} size={18} color={color} />
      </View>
      <Text style={{ color: '#FFF', fontSize: 26, fontWeight: '900', letterSpacing: -0.5 }}>
        {value}
      </Text>
      <Text style={{ color: '#6B7280', fontSize: 12, fontWeight: '600', marginTop: 2 }}>
        {label}
      </Text>
    </Animated.View>
  );
}

// ─── Progress Bar ────────────────────────────────────────────────────────────
function ProgressBar({ value, max, color, label, delay }: { value: number; max: number; color: string; label: string; delay: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <Animated.View
      entering={FadeInRight.delay(delay).springify()}
      style={{ marginBottom: 14 }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={{ color: '#D1D5DB', fontSize: 13, fontWeight: '700' }}>{label}</Text>
        <Text style={{ color, fontSize: 13, fontWeight: '800' }}>{value} ({pct}%)</Text>
      </View>
      <View style={{ height: 8, borderRadius: 4, backgroundColor: '#1A1A35', overflow: 'hidden' }}>
        <View style={{ height: 8, borderRadius: 4, backgroundColor: color, width: `${Math.min(pct, 100)}%` }} />
      </View>
    </Animated.View>
  );
}

// ─── Stats Screen ────────────────────────────────────────────────────────────
export default function StatsScreen() {
  const { reminders, exportReminders, importReminders } = useReminders();
  const [showBackup, setShowBackup] = useState(false);

  // ── Calculations ──
  const total = reminders.length;
  const active = reminders.filter(r => r.active && !r.completedAt).length;
  const completed = reminders.filter(r => !!r.completedAt).length;
  const medications = reminders.filter(r => r.isMedication).length;

  // Category distribution
  const categoryStats = CATEGORIES.map(c => ({
    ...c,
    count: reminders.filter(r => (r.category || 'personal') === c.value).length,
  }));

  // Priority distribution
  const highP = reminders.filter(r => r.priority === 'high').length;
  const medP = reminders.filter(r => r.priority === 'medium').length;
  const lowP = reminders.filter(r => r.priority === 'low').length;

  // Streak calculation (days with completed reminders)
  const completedDates = new Set(
    reminders
      .filter(r => r.completedAt)
      .map(r => r.completedAt!.split('T')[0])
  );
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (completedDates.has(iso)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  // Upcoming reminders (next 3, active, not completed, sorted by date+time)
  const upcoming = reminders
    .filter(r => r.active && !r.completedAt)
    .sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return (a.hour * 60 + a.minute) - (b.hour * 60 + b.minute);
    })
    .slice(0, 3);

  function friendlyDate(iso: string): string {
    const todayD = new Date();
    const todayStr = `${todayD.getFullYear()}-${String(todayD.getMonth()+1).padStart(2,'0')}-${String(todayD.getDate()).padStart(2,'0')}`;
    if (iso === todayStr) return 'Hoy';
    const parts = iso.split('-');
    const d = parseInt(parts[2], 10);
    const m = parseInt(parts[1], 10) - 1;
    return `${d} ${MONTH_NAMES[m].slice(0, 3)}`;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#080816' }}>
      <StatusBar barStyle="light-content" backgroundColor="#080816" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* ── Header ── */}
        <Animated.View
          entering={FadeInDown.duration(500).springify()}
          style={{
            paddingHorizontal: 24,
            paddingTop: 18,
            paddingBottom: 14,
            borderBottomWidth: 1,
            borderBottomColor: '#141428',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <Ionicons name="stats-chart" size={14} color="#7C3AED" />
                <Text style={{ color: '#7C3AED', fontSize: 12, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                  Estadísticas
                </Text>
              </View>
              <Text style={{ color: '#FFFFFF', fontSize: 30, fontWeight: '900', letterSpacing: -0.5 }}>
                Mi Resumen
              </Text>
            </View>

            {/* Backup button */}
            <TouchableOpacity
              onPress={() => { Haptics.selectionAsync(); setShowBackup(true); }}
              style={{
                width: 44, height: 44, borderRadius: 22,
                backgroundColor: '#111128',
                alignItems: 'center', justifyContent: 'center',
                borderWidth: 1.5, borderColor: '#2D1F5E',
              }}
            >
              <Ionicons name="cloud-outline" size={22} color="#A78BFA" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ── Summary Cards ── */}
        <View style={{ paddingHorizontal: 18, paddingTop: 20 }}>
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
            <StatCard icon="albums-outline" label="Total" value={total} color="#A78BFA" delay={80} />
            <StatCard icon="checkmark-circle-outline" label="Completados" value={completed} color="#10B981" delay={120} />
          </View>
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
            <StatCard icon="alarm-outline" label="Activos" value={active} color="#60A5FA" delay={160} />
            <StatCard icon="flame-outline" label="Racha" value={`${streak}d`} color="#FB923C" delay={200} />
          </View>
        </View>

        {/* ── Completion Progress ── */}
        <Animated.View
          entering={FadeInDown.delay(240).springify()}
          style={{
            marginHorizontal: 18,
            backgroundColor: '#111128',
            borderRadius: 20,
            padding: 20,
            borderWidth: 1.5,
            borderColor: '#1E1A40',
            marginBottom: 20,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Ionicons name="pie-chart-outline" size={16} color="#A78BFA" />
            <Text style={{ color: '#A78BFA', fontSize: 12, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
              Progreso
            </Text>
          </View>

          <View style={{ height: 12, borderRadius: 6, backgroundColor: '#1A1A35', overflow: 'hidden', marginBottom: 10 }}>
            <View style={{
              height: 12, borderRadius: 6,
              backgroundColor: '#10B981',
              width: total > 0 ? `${Math.round((completed / total) * 100)}%` : '0%',
            }} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: '#6B7280', fontSize: 12, fontWeight: '600' }}>
              {completed} de {total} completados
            </Text>
            <Text style={{ color: '#10B981', fontSize: 12, fontWeight: '800' }}>
              {total > 0 ? Math.round((completed / total) * 100) : 0}%
            </Text>
          </View>
        </Animated.View>

        {/* ── Category Distribution ── */}
        <Animated.View
          entering={FadeInDown.delay(300).springify()}
          style={{
            marginHorizontal: 18,
            backgroundColor: '#111128',
            borderRadius: 20,
            padding: 20,
            borderWidth: 1.5,
            borderColor: '#1E1A40',
            marginBottom: 20,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <Ionicons name="pricetag-outline" size={16} color="#A78BFA" />
            <Text style={{ color: '#A78BFA', fontSize: 12, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
              Por Categoría
            </Text>
          </View>

          {categoryStats.map((c, i) => (
            <ProgressBar
              key={c.value}
              label={c.label}
              value={c.count}
              max={total}
              color={c.color}
              delay={340 + i * 40}
            />
          ))}
        </Animated.View>

        {/* ── Priority Distribution ── */}
        <Animated.View
          entering={FadeInDown.delay(400).springify()}
          style={{
            marginHorizontal: 18,
            backgroundColor: '#111128',
            borderRadius: 20,
            padding: 20,
            borderWidth: 1.5,
            borderColor: '#1E1A40',
            marginBottom: 20,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <Ionicons name="flag-outline" size={16} color="#A78BFA" />
            <Text style={{ color: '#A78BFA', fontSize: 12, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
              Por Prioridad
            </Text>
          </View>

          <ProgressBar label="Alta" value={highP} max={total} color="#F87171" delay={440} />
          <ProgressBar label="Media" value={medP} max={total} color="#FBBF24" delay={480} />
          <ProgressBar label="Baja" value={lowP} max={total} color="#34D399" delay={520} />
        </Animated.View>

        {/* ── Upcoming Reminders ── */}
        {upcoming.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(500).springify()}
            style={{
              marginHorizontal: 18,
              backgroundColor: '#111128',
              borderRadius: 20,
              padding: 20,
              borderWidth: 1.5,
              borderColor: '#1E1A40',
              marginBottom: 20,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <Ionicons name="time-outline" size={16} color="#A78BFA" />
              <Text style={{ color: '#A78BFA', fontSize: 12, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                Próximos Recordatorios
              </Text>
            </View>

            {upcoming.map((r, i) => (
              <Animated.View
                key={r.id}
                entering={FadeInRight.delay(540 + i * 60).springify()}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  borderBottomWidth: i < upcoming.length - 1 ? 1 : 0,
                  borderBottomColor: '#1A1A35',
                  gap: 14,
                }}
              >
                <View style={{
                  width: 42, height: 42, borderRadius: 21,
                  backgroundColor: `${r.color}20`,
                  alignItems: 'center', justifyContent: 'center',
                  borderWidth: 1, borderColor: `${r.color}40`,
                }}>
                  <Ionicons name={categoryIcon(r.category || 'personal') as any} size={18} color={r.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={{ color: '#E5E7EB', fontSize: 15, fontWeight: '700' }}>
                    {r.title}
                  </Text>
                  <Text style={{ color: '#6B7280', fontSize: 12, fontWeight: '600', marginTop: 2 }}>
                    {friendlyDate(r.date)} · {formatTime(r.hour, r.minute)}
                  </Text>
                </View>
                <View style={{
                  backgroundColor: `${categoryColor(r.category || 'personal')}15`,
                  borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
                  borderWidth: 1, borderColor: `${categoryColor(r.category || 'personal')}30`,
                }}>
                  <Text style={{ color: categoryColor(r.category || 'personal'), fontSize: 10, fontWeight: '700' }}>
                    {categoryLabel(r.category || 'personal')}
                  </Text>
                </View>
              </Animated.View>
            ))}
          </Animated.View>
        )}

        {/* ── Medication count ── */}
        {medications > 0 && (
          <Animated.View
            entering={FadeInDown.delay(600).springify()}
            style={{
              marginHorizontal: 18,
              backgroundColor: '#06202A',
              borderRadius: 20,
              padding: 20,
              borderWidth: 1.5,
              borderColor: '#0E4455',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <View style={{
              width: 44, height: 44, borderRadius: 22,
              backgroundColor: '#22D3EE20',
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 1, borderColor: '#22D3EE40',
            }}>
              <Ionicons name="medical" size={22} color="#22D3EE" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#22D3EE', fontSize: 16, fontWeight: '800' }}>
                {medications} Medicamentos
              </Text>
              <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 2 }}>
                Tomas programadas en tu tratamiento
              </Text>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Backup/Restore Sheet */}
      <BackupRestoreSheet
        visible={showBackup}
        onClose={() => setShowBackup(false)}
        onExport={exportReminders}
        onImport={importReminders}
      />
    </SafeAreaView>
  );
}
