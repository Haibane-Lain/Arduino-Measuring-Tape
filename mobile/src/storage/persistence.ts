import AsyncStorage from '@react-native-async-storage/async-storage';

import type { LastDevice, Measurement, Settings } from '@/services/device';
import {
  sanitizeLastDevice,
  sanitizeMeasurements,
  sanitizeSettings,
} from '@/storage/validation';

const KEYS = {
  settings: '@measuring_tape/settings/v1',
  history: '@measuring_tape/history/v1',
  lastDevice: '@measuring_tape/last_device/v1',
} as const;

export type StoredState = {
  settings: Settings;
  measurements: Measurement[];
  lastDevice: LastDevice | null;
};

function parseJson(value: string | null | undefined): unknown {
  if (!value) {
    return null;
  }
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

export async function loadStoredState(): Promise<StoredState> {
  const emptyState: StoredState = {
    settings: sanitizeSettings(null),
    measurements: [],
    lastDevice: null,
  };

  try {
    const entries = await AsyncStorage.multiGet([
      KEYS.settings,
      KEYS.history,
      KEYS.lastDevice,
    ]);
    const values = new Map(entries);

    return {
      settings: sanitizeSettings(parseJson(values.get(KEYS.settings))),
      measurements: sanitizeMeasurements(parseJson(values.get(KEYS.history))),
      lastDevice: sanitizeLastDevice(parseJson(values.get(KEYS.lastDevice))),
    };
  } catch {
    return emptyState;
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.settings, JSON.stringify(settings));
  } catch {
    // A failed preference write must not interrupt measurement handling.
  }
}

export async function saveHistory(measurements: Measurement[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.history, JSON.stringify(measurements));
  } catch {
    // History is best-effort; the in-memory list remains usable.
  }
}

export async function saveLastDevice(device: LastDevice | null): Promise<void> {
  try {
    if (device === null) {
      await AsyncStorage.removeItem(KEYS.lastDevice);
      return;
    }
    await AsyncStorage.setItem(KEYS.lastDevice, JSON.stringify(device));
  } catch {
    // Reconnection still works for this session even if persistence fails.
  }
}
