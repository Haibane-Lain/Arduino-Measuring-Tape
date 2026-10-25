import { HISTORY_LIMIT } from '@/config';
import { DEFAULT_SETTINGS } from '@/services/device';
import {
  sanitizeLastDevice,
  sanitizeMeasurements,
  sanitizeSettings,
} from '@/storage/validation';

describe('sanitizeSettings', () => {
  it('falls back to defaults for malformed data', () => {
    expect(sanitizeSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings({ units: 'Furlongs' })).toEqual(DEFAULT_SETTINGS);
  });

  it('clamps the threshold and accepts valid values', () => {
    expect(
      sanitizeSettings({ units: 'Inch', alertThresholdCm: 9999, alertSound: 'Chime' }),
    ).toEqual({
      units: 'Inch',
      alertThresholdCm: 1000,
      alertSound: 'Chime',
    });
    expect(sanitizeSettings({ alertThresholdCm: -3 }).alertThresholdCm).toBe(0);
  });
});

describe('sanitizeMeasurements', () => {
  it('drops invalid entries, deduplicates and sorts newest first', () => {
    const result = sanitizeMeasurements([
      { id: 'a', valueCm: 10.04, timestamp: 1000 },
      { id: 'a', valueCm: 99, timestamp: 2000 },
      { id: 'bad-value', valueCm: -1, timestamp: 3000 },
      { id: 'bad-time', valueCm: 20, timestamp: 0 },
      { id: 'b', valueCm: 30, timestamp: 4000 },
      'not an object',
    ]);

    expect(result).toEqual([
      { id: 'b', valueCm: 30, timestamp: 4000 },
      { id: 'a', valueCm: 10, timestamp: 1000 },
    ]);
  });

  it('respects the history limit', () => {
    const entries = Array.from({ length: HISTORY_LIMIT + 5 }, (_, index) => ({
      id: `m-${index}`,
      valueCm: index + 1,
      timestamp: index + 1,
    }));

    expect(sanitizeMeasurements(entries)).toHaveLength(HISTORY_LIMIT);
  });
});

describe('sanitizeLastDevice', () => {
  it('returns null for an invalid device', () => {
    expect(sanitizeLastDevice(null)).toBeNull();
    expect(sanitizeLastDevice({ name: 'No id' })).toBeNull();
  });

  it('keeps valid device data', () => {
    expect(
      sanitizeLastDevice({
        id: 'AA:BB',
        name: 'DistanceMeter',
        rssi: -55,
        connectedAt: 1234,
      }),
    ).toEqual({
      id: 'AA:BB',
      name: 'DistanceMeter',
      rssi: -55,
      connectedAt: 1234,
    });
  });
});
