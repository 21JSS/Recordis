import { createContext, useContext, useEffect, useRef, useState } from 'react';

// ─── Reminder type (extended) ─────────────────────────────────────────────────
export type RepeatMode = 'none' | 'daily' | 'weekly' | 'monthly';
export type Priority   = 'low' | 'medium' | 'high';

export interface Reminder {
  id: string;
  title: string;
  hour: number;    // 0-23
  minute: number;  // 0-59
  active: boolean;
  ringing: boolean;
  date: string;    // YYYY-MM-DD — primary trigger date
  // ── New fields ──
  color: string;           // accent hex color chosen by user
  repeat: RepeatMode;      // recurrence
  priority: Priority;      // importance level
  notes: string;           // optional extra description
  snoozeMinutes: number;   // snooze duration in minutes
  // ── Medication fields ──
  isMedication?: boolean;
  medicationName?: string;
  dosage?: string;
  intervalHours?: number;
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
  deleteReminder: (id: string) => void;
  toggleReminder: (id: string) => void;
  snoozeReminder: (id: string) => void;
  dismissAlarm: () => void;
  ringingReminder: Reminder | undefined;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function uid() {
  return Math.random().toString(36).slice(2);
}

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Given a reminder, determine if it should ring right now */
function shouldRing(r: Reminder, h: number, m: number, today: string): boolean {
  if (!r.active || r.ringing) return false;
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

// ─── Context ─────────────────────────────────────────────────────────────────
const RemindersContext = createContext<RemindersContextValue | null>(null);

export function RemindersProvider({ children }: { children: React.ReactNode }) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Tick every 10 s — check for due reminders
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
    setReminders((prev) => [
      ...prev,
      {
        id: uid(),
        active: true,
        ringing: false,
        ...params,
      },
    ]);
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
        isMedication: true,
        medicationName,
        dosage,
        intervalHours,
      });

      currentMs += stepMs;
      doseIndex++;
    }

    setReminders((prev) => [...prev, ...newReminders]);
  }

  function deleteReminder(id: string) {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  }

  function toggleReminder(id: string) {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, active: !r.active, ringing: false } : r))
    );
  }

  /** Snooze: dismiss current ring, set a new date+time = now + snoozeMinutes */
  function snoozeReminder(id: string) {
    setReminders((prev) =>
      prev.map((r) => {
        if (r.id !== id || !r.ringing) return r;
        const future = new Date(Date.now() + r.snoozeMinutes * 60_000);
        const snoozeDate = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, '0')}-${String(future.getDate()).padStart(2, '0')}`;
        return {
          ...r,
          ringing: false,
          active: true,
          hour: future.getHours(),
          minute: future.getMinutes(),
          date: snoozeDate,
          repeat: 'none', // snooze is always once
        };
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

  const ringingReminder = reminders.find((r) => r.ringing);

  return (
    <RemindersContext.Provider
      value={{
        reminders,
        addReminder,
        addMedicationReminders,
        deleteReminder,
        toggleReminder,
        snoozeReminder,
        dismissAlarm,
        ringingReminder,
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
