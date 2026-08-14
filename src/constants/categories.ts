import type { Ionicons } from '@expo/vector-icons';

// ─── Category definitions ─────────────────────────────────────────────────────
export type Category = 'personal' | 'trabajo' | 'salud' | 'escuela' | 'otro';

export interface CategoryDef {
  value: Category;
  label: string;
  icon: string;
  color: string;
}

export const CATEGORIES: CategoryDef[] = [
  { value: 'personal', label: 'Personal',  icon: 'person-outline',   color: '#A78BFA' },
  { value: 'trabajo',  label: 'Trabajo',   icon: 'briefcase-outline', color: '#60A5FA' },
  { value: 'salud',    label: 'Salud',     icon: 'heart-outline',    color: '#F87171' },
  { value: 'escuela',  label: 'Escuela',   icon: 'school-outline',   color: '#FBBF24' },
  { value: 'otro',     label: 'Otro',      icon: 'ellipsis-horizontal-outline', color: '#34D399' },
];

export function categoryColor(cat: Category): string {
  return CATEGORIES.find((c) => c.value === cat)?.color ?? '#A78BFA';
}

export function categoryIcon(cat: Category): string {
  return CATEGORIES.find((c) => c.value === cat)?.icon ?? 'ellipsis-horizontal-outline';
}

export function categoryLabel(cat: Category): string {
  return CATEGORIES.find((c) => c.value === cat)?.label ?? 'Otro';
}
