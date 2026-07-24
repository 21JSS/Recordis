import type { Priority, RepeatMode } from '@/context/RemindersContext';

// ─── Reminder accent colors ───────────────────────────────────────────────────
export const REMINDER_COLORS: { label: string; hex: string }[] = [
  { label: 'Morado',   hex: '#A78BFA' },
  { label: 'Índigo',   hex: '#818CF8' },
  { label: 'Azul',     hex: '#60A5FA' },
  { label: 'Cian',     hex: '#22D3EE' },
  { label: 'Verde',    hex: '#34D399' },
  { label: 'Lima',     hex: '#A3E635' },
  { label: 'Amarillo', hex: '#FBBF24' },
  { label: 'Naranja',  hex: '#FB923C' },
  { label: 'Rojo',     hex: '#F87171' },
  { label: 'Rosa',     hex: '#F472B6' },
];

// ─── Repeat options ───────────────────────────────────────────────────────────
export const REPEAT_OPTIONS: { value: RepeatMode; label: string; icon: string }[] = [
  { value: 'none',    label: 'Una vez',  icon: 'radio-button-on-outline' },
  { value: 'daily',   label: 'Diario',   icon: 'today-outline' },
  { value: 'weekly',  label: 'Semanal',  icon: 'calendar-outline' },
  { value: 'monthly', label: 'Mensual',  icon: 'calendar-number-outline' },
];

// ─── Priority options ─────────────────────────────────────────────────────────
export const PRIORITY_OPTIONS: { value: Priority; label: string; color: string; icon: string }[] = [
  { value: 'low',    label: 'Baja',   color: '#34D399', icon: 'arrow-down-circle-outline' },
  { value: 'medium', label: 'Media',  color: '#FBBF24', icon: 'remove-circle-outline' },
  { value: 'high',   label: 'Alta',   color: '#F87171', icon: 'arrow-up-circle-outline' },
];

// ─── Snooze durations ─────────────────────────────────────────────────────────
export const SNOOZE_OPTIONS: { value: number; label: string }[] = [
  { value: 1,  label: '1 min' },
  { value: 3,  label: '3 min' },
  { value: 5,  label: '5 min' },
  { value: 10, label: '10 min' },
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hora' },
];

// ─── Medication intervals ──────────────────────────────────────────────────────
export const MEDICATION_INTERVALS: { value: number; label: string; desc: string }[] = [
  { value: 4,  label: 'Cada 4 hrs',  desc: '6 tomas / día' },
  { value: 6,  label: 'Cada 6 hrs',  desc: '4 tomas / día' },
  { value: 8,  label: 'Cada 8 hrs',  desc: '3 tomas / día' },
  { value: 12, label: 'Cada 12 hrs', desc: '2 tomas / día' },
  { value: 24, label: 'Cada 24 hrs', desc: '1 toma / día' },
];

// ─── Medication treatment durations ───────────────────────────────────────────
export const MEDICATION_DURATIONS: { value: number; label: string }[] = [
  { value: 1,  label: '1 día' },
  { value: 3,  label: '3 días' },
  { value: 5,  label: '5 días' },
  { value: 7,  label: '7 días' },
  { value: 10, label: '10 días' },
  { value: 14, label: '14 días' },
  { value: 30, label: '30 días' },
];

// ─── Priority color helper ────────────────────────────────────────────────────
export function priorityColor(p: Priority): string {
  return PRIORITY_OPTIONS.find(o => o.value === p)?.color ?? '#A78BFA';
}
