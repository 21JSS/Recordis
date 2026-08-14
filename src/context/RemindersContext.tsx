import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  cancelReminderNotification,
  rescheduleAllReminders,
  scheduleReminderNotification,
} from '@/utils/notifications';
import type { Category } from '@/constants/categories';

// ─── Reminder type (extended for V4) ──────────────────────────────────────────
export type RepeatMode = 'none' | 'daily' | 'weekly' | 'monthly';
export type Priority   = 'low' | 'medium' | 'high';

export interface LocationTrigger {
  latitude: number;
  longitude: number;
  radius: number;   // meters
  name: string;     // friendly name like "Supermercado"
}

export interface Reminder {
  id: string;
  title: string;
  hour: number;    // 0-23
  minute: number;  // 0-59
  active: boolean;
  ringing: boolean;
  date: string;    // YYYY-MM-DD — primary trigger date
  // ── Extended fields ──
  color: string;           // accent hex color chosen by user
  repeat: RepeatMode;      // recurrence
  priority: Priority;      // importance level
  notes: string;           // optional extra description
  snoozeMinutes: number;   // snooze duration in minutes
  // ── Category ──
  category: Category;      // personal, trabajo, salud, escuela, otro
  // ── Completed ──
  completedAt?: string;    // ISO timestamp when completed
  // ── Medication fields ──
  isMedication?: boolean;
  medicationName?: string;
  dosage?: string;
  intervalHours?: number;
  // ── Location trigger ──
  locationTrigger?: LocationTrigger;
}

export interface NewReminderParams {
  title: string;
  hour: number;
  minute: number;
  date: string;
  color: string;
  repeat: RepeatMode;
  priority: Priority;
  notes: string;
  snoozeMinutes: number;
  category: Category;
  locationTrigger?: LocationTrigger;
}

export interface NewMedicationParams {
  medicationName: string;
  dosage: string;
  startHour: number;
  startMinute: number;
  startDate: string;
  intervalHours: number;
  durationDays: number;
  color: string;
}

export interface RemindersContextValue {
  reminders: Reminder[];
  addReminder: (params: NewReminderParams) => void;
  addMedicationReminders: (params: NewMedicationParams) => void;
  editReminder: (id: string, params: Partial<NewReminderParams>) => void;
  deleteReminder: (id: string) => void;
  toggleReminder: (id: string) => void;
  completeReminder: (id: string) => void;
  snoozeReminder: (id: string) => void;
  dismissAlarm: () => void;
  ringingReminder: Reminder | undefined;
  exportReminders: () => string;
  importReminders: (json: string) => boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Given a reminder, determine if it should ring right now */
function shouldRing(r: Reminder, h: number, m: number, today: string): boolean {
  if (!r.active || r.ringing || r.completedAt) return false;
  if (r.hour !== h || r.minute !== m) return false;

  switch (r.repeat) {
    case 'none':
      return r.date === today;
    case 'daily':
      return true;
    case 'weekly': {
      const triggerDate = new Date(r.date);
      const now = new Date(today);
      return triggerDate.getDay() === now.getDay();
    }
    case 'monthly': {
      const triggerDay = parseInt(r.date.split('-')[2], 10);
      const todayDay = parseInt(today.split('-')[2], 10);
      return triggerDay === todayDay;
    }
    default:
      return false;
  }
}

// ─── Persistence key ─────────────────────────────────────────────────────────
const STORAGE_KEY = '@recordis/reminders';

async function loadReminders(): Promise<Reminder[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: Reminder[] = JSON.parse(raw);
    // Reset ringing state on load (app was killed/restarted)
    // Also migrate old reminders that don't have category
    return parsed.map((r) => ({
      ...r,
      ringing: false,
      category: r.category || 'personal',
    }));
  } catch {
    return [];
  }
}

async function saveReminders(reminders: Reminder[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
  } catch (e) {
    console.warn('[RemindersContext] saveReminders error:', e);
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────
const RemindersContext = createContext<RemindersContextValue | null>(null);

export function RemindersProvider({ children }: { children: React.ReactNode }) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loaded, setLoaded] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load persisted reminders on mount
  useEffect(() => {
    loadReminders().then((loaded) => {
      setReminders(loaded);
      setLoaded(true);
      // Reschedule all OS-level notifications (in case app was killed)
      rescheduleAllReminders(loaded);
    });
  }, []);

  // Persist reminders whenever they change (after initial load)
  useEffect(() => {
    if (!loaded) return;
    saveReminders(reminders);
  }, [reminders, loaded]);

  // Tick every 10 s — check for due reminders (in-app alarm overlay)
  useEffect(() => {
    tickRef.current = setInterval(() => {
      const now = new Date();
      const h = now.getHours();
      const m = now.getMinutes();
      const today = todayISO();
      setReminders((prev) =>
        prev.map((r) => (shouldRing(r, h, m, today) ? { ...r, ringing: true } : r))
      );
    }, 10_000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  function addReminder(params: NewReminderParams) {
    const newReminder: Reminder = {
      id: uid(),
      active: true,
      ringing: false,
      ...params,
    };
    setReminders((prev) => [...prev, newReminder]);
    // Schedule OS notification
    scheduleReminderNotification(newReminder);
  }

  function editReminder(id: string, params: Partial<NewReminderParams>) {
    setReminders((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, ...params };
        // Re-schedule notification with updated data
        if (updated.active) {
          scheduleReminderNotification(updated);
        }
        return updated;
      })
    );
  }

  function addMedicationReminders(params: NewMedicationParams) {
    const {
      medicationName,
      dosage,
      startHour,
      startMinute,
      startDate,
      intervalHours,
      durationDays,
      color,
    } = params;

    const [y, m, d] = startDate.split('-').map((n) => parseInt(n, 10));
    const startMs = new Date(y, m - 1, d, startHour, startMinute, 0, 0).getTime();
    const endMs = startMs + durationDays * 24 * 60 * 60 * 1000;
    const stepMs = intervalHours * 60 * 60 * 1000;

    const newReminders: Reminder[] = [];
    let currentMs = startMs;
    let doseIndex = 1;

    while (currentMs < endMs) {
      const dt = new Date(currentMs);
      const isoDate = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;

      newReminders.push({
        id: uid(),
        title: `💊 ${medicationName}`,
        hour: dt.getHours(),
        minute: dt.getMinutes(),
        active: true,
        ringing: false,
        date: isoDate,
        color: color || '#22D3EE',
        repeat: 'none',
        priority: 'high',
        notes: dosage ? `Dosis: ${dosage} (Cada ${intervalHours}h - Toma #${doseIndex})` : `Cada ${intervalHours}h - Toma #${doseIndex}`,
        snoozeMinutes: 5,
        category: 'salud',
        isMedication: true,
        medicationName,
        dosage,
        intervalHours,
      });

      currentMs += stepMs;
      doseIndex++;
    }

    setReminders((prev) => [...prev, ...newReminders]);
    // Schedule OS notifications for each dose
    newReminders.forEach((r) => scheduleReminderNotification(r));
  }

  function deleteReminder(id: string) {
    cancelReminderNotification(id);
    setReminders((prev) => prev.filter((r) => r.id !== id));
  }

  function toggleReminder(id: string) {
    setReminders((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, active: !r.active, ringing: false };
        if (updated.active) {
          scheduleReminderNotification(updated);
        } else {
          cancelReminderNotification(id);
        }
        return updated;
      })
    );
  }

  function completeReminder(id: string) {
    setReminders((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const isCompleting = !r.completedAt;
        const updated = {
          ...r,
          completedAt: isCompleting ? new Date().toISOString() : undefined,
          ringing: false,
        };
        if (isCompleting) {
          cancelReminderNotification(id);
        } else if (updated.active) {
          scheduleReminderNotification(updated);
        }
        return updated;
      })
    );
  }

  /** Snooze: dismiss current ring, set a new date+time = now + snoozeMinutes */
  function snoozeReminder(id: string) {
    setReminders((prev) =>
      prev.map((r) => {
        if (r.id !== id || !r.ringing) return r;
        const future = new Date(Date.now() + r.snoozeMinutes * 60_000);
        const snoozeDate = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, '0')}-${String(future.getDate()).padStart(2, '0')}`;
        const snoozed = {
          ...r,
          ringing: false,
          active: true,
          hour: future.getHours(),
          minute: future.getMinutes(),
          date: snoozeDate,
          repeat: 'none' as RepeatMode, // snooze is always once
        };
        // Re-schedule the snoozed notification
        scheduleReminderNotification(snoozed);
        return snoozed;
      })
    );
  }

  function dismissAlarm() {
    setReminders((prev) =>
      prev.map((r) => {
        if (!r.ringing) return r;
        // For repeating reminders, keep active so it rings next time
        return { ...r, ringing: false, active: r.repeat !== 'none' };
      })
    );
  }

  function exportReminders(): string {
    return JSON.stringify({
      version: 4,
      exportedAt: new Date().toISOString(),
      reminders: reminders.map((r) => ({ ...r, ringing: false })),
    }, null, 2);
  }

  function importReminders(json: string): boolean {
    try {
      const data = JSON.parse(json);
      const imported: Reminder[] = (data.reminders || data).map((r: any) => ({
        ...r,
        ringing: false,
        category: r.category || 'personal',
        id: r.id || uid(), // ensure unique IDs
      }));
      setReminders((prev) => [...prev, ...imported]);
      imported.filter((r) => r.active).forEach((r) => scheduleReminderNotification(r));
      return true;
    } catch (e) {
      console.warn('[RemindersContext] importReminders error:', e);
      return false;
    }
  }

  const ringingReminder = reminders.find((r) => r.ringing);

  return (
    <RemindersContext.Provider
      value={{
        reminders,
        addReminder,
        addMedicationReminders,
        editReminder,
        deleteReminder,
        toggleReminder,
        completeReminder,
        snoozeReminder,
        dismissAlarm,
        ringingReminder,
        exportReminders,
        importReminders,
      }}
    >
      {children}
    </RemindersContext.Provider>
  );
}

export function useReminders() {
  const ctx = useContext(RemindersContext);
  if (!ctx) throw new Error('useReminders must be used inside RemindersProvider');
  return ctx;
}
