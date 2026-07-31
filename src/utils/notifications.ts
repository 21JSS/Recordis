/**
 * notifications.ts
 * Centralized module for scheduling local notifications with expo-notifications.
 * Works when the app is in background or fully closed.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Reminder } from '@/context/RemindersContext';

// ─── Notification handler — show while app is in foreground ──────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── Request permissions ──────────────────────────────────────────────────────
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    // Create high-priority alarm channel
    await Notifications.setNotificationChannelAsync('recordis-alarms', {
      name: '🔔 Recordis Alarmas',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 400, 200, 400],
      lightColor: '#A78BFA',
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

// ─── Schedule a single reminder notification ──────────────────────────────────
export async function scheduleReminderNotification(reminder: Reminder): Promise<void> {
  if (!reminder.active) return;

  try {
    // Cancel any existing notification for this reminder first
    await cancelReminderNotification(reminder.id);

    // Parse the target date+time
    const [year, month, day] = reminder.date.split('-').map(Number);
    const triggerDate = new Date(year, month - 1, day, reminder.hour, reminder.minute, 0, 0);

    // Don't schedule if the time has already passed (for non-repeating)
    if (reminder.repeat === 'none' && triggerDate.getTime() <= Date.now()) {
      return;
    }

    let trigger: Notifications.NotificationTriggerInput;

    switch (reminder.repeat) {
      case 'daily':
        trigger = {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: reminder.hour,
          minute: reminder.minute,
        };
        break;
      case 'weekly':
        trigger = {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: triggerDate.getDay() + 1, // 1=Sunday ... 7=Saturday
          hour: reminder.hour,
          minute: reminder.minute,
        };
        break;
      case 'monthly':
        trigger = {
          type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
          day: triggerDate.getDate(),
          hour: reminder.hour,
          minute: reminder.minute,
        };
        break;
      default:
        // One-time (none)
        trigger = {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        };
        break;
    }

    const priorityEmoji = reminder.priority === 'high' ? '🔴' : reminder.priority === 'medium' ? '🟡' : '🟢';
    const body = reminder.notes
      ? reminder.notes
      : reminder.isMedication
      ? `💊 Hora de tomar: ${reminder.medicationName}`
      : `Tienes un recordatorio programado`;

    await Notifications.scheduleNotificationAsync({
      identifier: `reminder-${reminder.id}`,
      content: {
        title: `${priorityEmoji} ${reminder.title}`,
        body,
        sound: 'default',
        color: reminder.color,
        data: { reminderId: reminder.id },
        ...(Platform.OS === 'android' && {
          channelId: 'recordis-alarms',
          priority: Notifications.AndroidNotificationPriority.MAX,
          vibrate: [0, 400, 200, 400],
        }),
      },
      trigger,
    });
  } catch (error) {
    console.warn('[Notifications] scheduleReminderNotification error:', error);
  }
}

// ─── Cancel a scheduled notification ─────────────────────────────────────────
export async function cancelReminderNotification(reminderId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(`reminder-${reminderId}`);
  } catch (_) {
    // Ignore — notification may not exist
  }
}

// ─── Reschedule all active reminders (called on app start) ───────────────────
export async function rescheduleAllReminders(reminders: Reminder[]): Promise<void> {
  // Cancel everything first to avoid duplicates
  await Notifications.cancelAllScheduledNotificationsAsync();

  const activeReminders = reminders.filter((r) => r.active);
  await Promise.all(activeReminders.map((r) => scheduleReminderNotification(r)));
}
