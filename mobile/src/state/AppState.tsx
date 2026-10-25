import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AppState as NativeAppState } from 'react-native';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';

import { AUTO_CONNECT_DELAY_MS, HISTORY_LIMIT } from '@/config';
import { getBleTransport } from '@/services/bleTransport';
import {
  DEFAULT_SETTINGS,
  type ConnectionState,
  type DeviceInfo,
  type DeviceTransport,
  type LastDevice,
  type Measurement,
  type ReadingState,
  type Settings,
  type TransportEvent,
} from '@/services/device';
import {
  loadStoredState,
  saveHistory,
  saveLastDevice,
  saveSettings,
} from '@/storage/persistence';
import { sanitizeSettings } from '@/storage/validation';
import { shouldPlayAlert } from '@/utils/alerts';
import { round1 } from '@/utils/units';

type AppStateValue = {
  /** True once settings/history have been read from storage. */
  ready: boolean;
  connection: ConnectionState;
  connectionError: string | null;
  connectedDevice: DeviceInfo | null;
  devices: DeviceInfo[];
  scanning: boolean;
  current: Measurement | null;
  readingState: ReadingState;
  measurements: Measurement[];
  settings: Settings;
  deviceModalOpen: boolean;
  openDeviceModal: () => void;
  closeDeviceModal: () => void;
  scanDevices: () => Promise<void>;
  stopScan: () => Promise<void>;
  connectDevice: (device: DeviceInfo) => Promise<void>;
  disconnectDevice: () => Promise<void>;
  clearHistory: () => void;
  updateSettings: (patch: Partial<Settings>) => void;
};

const AppStateContext = createContext<AppStateValue | undefined>(undefined);

function mergeDevices(existing: DeviceInfo[], incoming: DeviceInfo): DeviceInfo[] {
  const byId = new Map(existing.map((device) => [device.id, device]));
  byId.set(incoming.id, incoming);
  return [...byId.values()].sort((left, right) => {
    const leftName = (left.name ?? 'Unknown device').toLowerCase();
    const rightName = (right.name ?? 'Unknown device').toLowerCase();
    return leftName.localeCompare(rightName);
  });
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [connection, setConnectionState] = useState<ConnectionState>('disconnected');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connectedDevice, setConnectedDevice] = useState<DeviceInfo | null>(null);
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [current, setCurrent] = useState<Measurement | null>(null);
  const [readingState, setReadingState] = useState<ReadingState>('idle');
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [deviceModalOpen, setDeviceModalOpen] = useState(false);

  const transportRef = useRef<DeviceTransport | null>(null);
  const connectionRef = useRef<ConnectionState>('disconnected');
  const settingsRef = useRef<Settings>(DEFAULT_SETTINGS);
  const measurementsRef = useRef<Measurement[]>([]);
  const lastDeviceRef = useRef<LastDevice | null>(null);
  const manualDisconnectRef = useRef(false);
  const autoConnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const beepPlayer = useAudioPlayer(require('../../assets/sounds/beep.wav'));
  const chimePlayer = useAudioPlayer(require('../../assets/sounds/chime.wav'));
  const playersRef = useRef({ beep: beepPlayer, chime: chimePlayer });

  useEffect(() => {
    playersRef.current = { beep: beepPlayer, chime: chimePlayer };
  }, [beepPlayer, chimePlayer]);

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
    }).catch(() => {});
  }, []);

  const playAlert = useCallback(
    (valueCm: number) => {
      const activeSettings = settingsRef.current;
      if (!shouldPlayAlert(valueCm, activeSettings)) {
        return;
      }

      const player =
        activeSettings.alertSound === 'Chime'
          ? playersRef.current.chime
          : playersRef.current.beep;
      void player
        .seekTo(0)
        .then(() => player.play())
        .catch(() => {});
    },
    [],
  );

  const handleTransportEvent = useCallback(
    (event: TransportEvent) => {
      switch (event.type) {
        case 'connection': {
          connectionRef.current = event.state;
          setConnectionState(event.state);

          if (event.state === 'connected') {
            manualDisconnectRef.current = false;
            setConnectionError(null);
            setDeviceModalOpen(false);
            if (event.device) {
              setConnectedDevice(event.device);
              const lastDevice: LastDevice = {
                ...event.device,
                connectedAt: Date.now(),
              };
              lastDeviceRef.current = lastDevice;
              void saveLastDevice(lastDevice);
            }
          } else if (event.state === 'disconnected' || event.state === 'unavailable' || event.state === 'bluetooth-off') {
            setConnectedDevice(null);
          }

          if (event.error) {
            setConnectionError(event.error);
          }
          break;
        }
        case 'device':
          setDevices((previous) => mergeDevices(previous, event.device));
          break;
        case 'scan-complete':
          break;
        case 'reading': {
          const valueCm = round1(event.valueCm);
          if (!Number.isFinite(valueCm) || valueCm <= 0) {
            return;
          }

          const measurement: Measurement = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            valueCm,
            timestamp: Date.now(),
          };
          const nextHistory = [measurement, ...measurementsRef.current].slice(0, HISTORY_LIMIT);

          measurementsRef.current = nextHistory;
          setMeasurements(nextHistory);
          setCurrent(measurement);
          setReadingState('ok');
          void saveHistory(nextHistory);
          playAlert(valueCm);
          break;
        }
        case 'no-echo':
          setCurrent(null);
          setReadingState('no-echo');
          break;
        case 'error':
          setConnectionError(event.message);
          break;
      }
    },
    [playAlert],
  );

  useEffect(() => {
    let cancelled = false;

    const transport = getBleTransport();
    transportRef.current = transport;
    const unsubscribe = transport.subscribe(handleTransportEvent);

    void (async () => {
      const stored = await loadStoredState();
      if (cancelled) {
        return;
      }

      settingsRef.current = stored.settings;
      measurementsRef.current = stored.measurements;
      setSettings(stored.settings);
      setMeasurements(stored.measurements);
      if (stored.measurements.length > 0) {
        setCurrent(stored.measurements[0]);
        setReadingState('ok');
      }
      setReady(true);

      const lastDevice = stored.lastDevice;
      if (lastDevice) {
        lastDeviceRef.current = lastDevice;
        autoConnectTimerRef.current = setTimeout(() => {
          autoConnectTimerRef.current = null;
          if (!cancelled && !manualDisconnectRef.current) {
            void transport.connect(lastDevice);
          }
        }, AUTO_CONNECT_DELAY_MS);
      }
    })();

    return () => {
      cancelled = true;
      if (autoConnectTimerRef.current) {
        clearTimeout(autoConnectTimerRef.current);
        autoConnectTimerRef.current = null;
      }
      unsubscribe();
      transportRef.current = null;
    };
  }, [handleTransportEvent]);

  // Android can drop a BLE link while the app is backgrounded without surfacing
  // a disconnect event. Try once more when the app comes back to the foreground.
  useEffect(() => {
    const subscription = NativeAppState.addEventListener('change', (state) => {
      const transport = transportRef.current;
      const lastDevice = lastDeviceRef.current;
      if (
        state === 'active' &&
        transport &&
        lastDevice &&
        !manualDisconnectRef.current &&
        !['connected', 'connecting', 'reconnecting', 'scanning'].includes(connectionRef.current)
      ) {
        void transport.connect(lastDevice);
      }
    });

    return () => subscription.remove();
  }, []);

  const cancelAutoConnect = useCallback(() => {
    if (autoConnectTimerRef.current) {
      clearTimeout(autoConnectTimerRef.current);
      autoConnectTimerRef.current = null;
    }
  }, []);

  const openDeviceModal = useCallback(() => {
    cancelAutoConnect();
    setConnectionError(null);
    setDeviceModalOpen(true);
  }, [cancelAutoConnect]);

  const closeDeviceModal = useCallback(() => {
    setDeviceModalOpen(false);
    void transportRef.current?.stopScan();
  }, []);

  const scanDevices = useCallback(async () => {
    cancelAutoConnect();
    setConnectionError(null);
    setDevices([]);
    await transportRef.current?.startScan();
  }, [cancelAutoConnect]);

  const stopScan = useCallback(async () => {
    await transportRef.current?.stopScan();
  }, []);

  const connectDevice = useCallback(
    async (device: DeviceInfo) => {
      cancelAutoConnect();
      setConnectionError(null);
      manualDisconnectRef.current = false;
      await transportRef.current?.connect(device);
    },
    [cancelAutoConnect],
  );

  const disconnectDevice = useCallback(async () => {
    cancelAutoConnect();
    manualDisconnectRef.current = true;
    lastDeviceRef.current = null;
    setConnectionError(null);
    await saveLastDevice(null);
    await transportRef.current?.disconnect();
    setConnectedDevice(null);
  }, [cancelAutoConnect]);

  const clearHistory = useCallback(() => {
    measurementsRef.current = [];
    setMeasurements([]);
    setCurrent(null);
    setReadingState('idle');
    void saveHistory([]);
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    const next = sanitizeSettings({ ...settingsRef.current, ...patch });
    settingsRef.current = next;
    setSettings(next);
    void saveSettings(next);
  }, []);

  const scanning = connection === 'scanning';

  const value = useMemo<AppStateValue>(
    () => ({
      ready,
      connection,
      connectionError,
      connectedDevice,
      devices,
      scanning,
      current,
      readingState,
      measurements,
      settings,
      deviceModalOpen,
      openDeviceModal,
      closeDeviceModal,
      scanDevices,
      stopScan,
      connectDevice,
      disconnectDevice,
      clearHistory,
      updateSettings,
    }),
    [
      ready,
      connection,
      connectionError,
      connectedDevice,
      devices,
      scanning,
      current,
      readingState,
      measurements,
      settings,
      deviceModalOpen,
      openDeviceModal,
      closeDeviceModal,
      scanDevices,
      stopScan,
      connectDevice,
      disconnectDevice,
      clearHistory,
      updateSettings,
    ],
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
