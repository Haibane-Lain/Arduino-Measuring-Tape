import { HISTORY_LIMIT } from '@/config';
import {
  ALERT_SOUNDS,
  DEFAULT_SETTINGS,
  DISTANCE_UNITS,
  type AlertSound,
  type DistanceUnit,
  type LastDevice,
  type Measurement,
  type Settings,
} from '@/services/device';
import { round1 } from '@/utils/units';

const MAX_STORED_DISTANCE_CM = 10_000;
const MAX_THRESHOLD_CM = 1_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function sanitizeSettings(value: unknown): Settings {
  if (!isRecord(value)) {
    return DEFAULT_SETTINGS;
  }

  const units = DISTANCE_UNITS.includes(value.units as DistanceUnit)
    ? (value.units as DistanceUnit)
    : DEFAULT_SETTINGS.units;

  const alertSound = ALERT_SOUNDS.includes(value.alertSound as AlertSound)
    ? (value.alertSound as AlertSound)
    : DEFAULT_SETTINGS.alertSound;

  const rawThreshold = Number(value.alertThresholdCm);
  const alertThresholdCm = Number.isFinite(rawThreshold)
    ? Math.min(Math.max(Math.round(rawThreshold), 0), MAX_THRESHOLD_CM)
    : DEFAULT_SETTINGS.alertThresholdCm;

  return { units, alertThresholdCm, alertSound };
}

export function sanitizeMeasurements(value: unknown): Measurement[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set<string>();
  const measurements: Measurement[] = [];

  for (const item of value) {
    if (!isRecord(item)) {
      continue;
    }

    const id = typeof item.id === 'string' ? item.id : '';
    const valueCm = Number(item.valueCm);
    const timestamp = Number(item.timestamp);

    if (
      id.length === 0 ||
      seen.has(id) ||
      !Number.isFinite(valueCm) ||
      valueCm <= 0 ||
      valueCm > MAX_STORED_DISTANCE_CM ||
      !Number.isFinite(timestamp) ||
      timestamp <= 0
    ) {
      continue;
    }

    seen.add(id);
    measurements.push({
      id,
      valueCm: round1(valueCm),
      timestamp,
    });
  }

  measurements.sort((left, right) => right.timestamp - left.timestamp);
  return measurements.slice(0, HISTORY_LIMIT);
}

export function sanitizeLastDevice(value: unknown): LastDevice | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = typeof value.id === 'string' ? value.id : '';
  if (id.length === 0) {
    return null;
  }

  const name =
    typeof value.name === 'string' && value.name.length > 0 ? value.name : null;
  const rssi = Number.isFinite(Number(value.rssi)) ? Number(value.rssi) : null;
  const connectedAt = Number(value.connectedAt);

  return {
    id,
    name,
    rssi,
    connectedAt: Number.isFinite(connectedAt) && connectedAt > 0 ? connectedAt : 0,
  };
}
