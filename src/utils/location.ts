/**
 * location.ts
 * Location utilities for geofencing-based reminders.
 * Uses expo-location + expo-task-manager for background geofence monitoring.
 */

import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Reminder } from '@/context/RemindersContext';

const GEOFENCE_TASK = 'recordis-geofence-task';

// ─── Request location permissions ─────────────────────────────────────────────
export async function requestLocationPermissions(): Promise<boolean> {
  try {
    const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
    if (fgStatus !== 'granted') return false;

    // Background permission is needed for geofencing
    if (Platform.OS === 'android') {
      const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
      return bgStatus === 'granted';
    }

    return true;
  } catch (e) {
    console.warn('[Location] requestLocationPermissions error:', e);
    return false;
  }
}

// ─── Start geofencing for reminders with locationTrigger ─────────────────────
export async function startGeofencing(reminders: Reminder[]): Promise<void> {
  try {
    const locationReminders = reminders.filter(
      (r) => r.active && !r.completedAt && r.locationTrigger
    );

    if (locationReminders.length === 0) {
      await stopGeofencing();
      return;
    }

    const regions: Location.LocationRegion[] = locationReminders.map((r) => ({
      identifier: `geo-${r.id}`,
      latitude: r.locationTrigger!.latitude,
      longitude: r.locationTrigger!.longitude,
      radius: r.locationTrigger!.radius,
      notifyOnEnter: true,
      notifyOnExit: false,
    }));

    await Location.startGeofencingAsync(GEOFENCE_TASK, regions);
  } catch (e) {
    console.warn('[Location] startGeofencing error:', e);
  }
}

// ─── Stop geofencing ─────────────────────────────────────────────────────────
export async function stopGeofencing(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(GEOFENCE_TASK);
    if (isRegistered) {
      await Location.stopGeofencingAsync(GEOFENCE_TASK);
    }
  } catch (_) {}
}

// ─── Define the geofence task ────────────────────────────────────────────────
TaskManager.defineTask(GEOFENCE_TASK, async ({ data, error }) => {
  if (error) {
    console.warn('[Geofence] Task error:', error);
    return;
  }

  const eventData = data as { eventType: Location.GeofencingEventType; region: Location.LocationRegion };
  
  if (eventData.eventType === Location.GeofencingEventType.Enter) {
    const regionId = eventData.region.identifier ?? '';
    // Extract reminder ID from region identifier
    const reminderId = regionId.replace('geo-', '');

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📍 Recordatorio por ubicación',
        body: `Has llegado a la zona de tu recordatorio`,
        sound: 'default',
        ...(Platform.OS === 'android' && {
          channelId: 'recordis-alarms',
          priority: Notifications.AndroidNotificationPriority.MAX,
        }),
      },
      trigger: null, // Fire immediately
    });
  }
});

// ─── Get current location (for UI) ───────────────────────────────────────────
export async function getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch {
    return null;
  }
}
