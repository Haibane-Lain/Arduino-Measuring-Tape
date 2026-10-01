import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { HISTORY_LIMIT, LIVE_TICK_MS, MAX_RANGE_CM, SENSOR_NOISE_CM, SIMULATE_LIVE_DATA } from '@/config';
import { seedMeasurements } from '@/data/mockMeasurements';
import { DEFAULT_SETTINGS } from '@/services/device';
import type { ConnectionState, Measurement, Settings } from '@/services/device';
import { clamp, round1 } from '@/utils/units';

type AppStateValue = {
  connection: ConnectionState;
  /** Most recent reading, or `null` before the first sample arrives. */
  current: Measurement | null;
  measurements: Measurement[];
  settings: Settings;
  clearHistory: () => void;
  updateSettings: (patch: Partial<Settings>) => void;
};

const AppStateContext = createContext<AppStateValue | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [measurements, setMeasurements] = useState<Measurement[]>(() =>
    seedMeasurements.slice(0, HISTORY_LIMIT),
  );
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  // Hard-coded while the mock transport is in use. Replace with the state
  // reported by the real DeviceTransport once the Arduino link lands.
  const connection: ConnectionState = 'connected';

  // --- Simulated sensor feed ------------------------------------------------
  useEffect(() => {
    if (!SIMULATE_LIVE_DATA) return;

    const interval = setInterval(() => {
      setMeasurements((prev) => {
        const head = prev[0];
        if (!head) return prev;

        const drift = (Math.random() - 0.5) * SENSOR_NOISE_CM * 2;
        const nextValue = clamp(round1(head.valueCm + drift), 0, MAX_RANGE_CM);
        const updatedHead: Measurement = { ...head, valueCm: nextValue, timestamp: Date.now() };
        return [updatedHead, ...prev.slice(1)];
      });
    }, LIVE_TICK_MS);

    return () => clearInterval(interval);
  }, []);

  const clearHistory = useCallback(() => setMeasurements([]), []);

  const updateSettings = useCallback(
    (patch: Partial<Settings>) => setSettings((prev) => ({ ...prev, ...patch })),
    [],
  );

  const value = useMemo<AppStateValue>(
    () => ({
      connection,
      current: measurements[0] ?? null,
      measurements,
      settings,
      clearHistory,
      updateSettings,
    }),
    [connection, measurements, settings, clearHistory, updateSettings],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateValue {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used inside <AppStateProvider>');
  }
  return context;
}
