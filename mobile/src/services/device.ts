/**
 * Device layer contracts.
 *
 * The UI depends only on these types and on `DeviceTransport`, never on a
 * concrete BLE library. `bleTransport.native.ts` is the real implementation;
 * `bleTransport.web.ts` supplies a friendly unsupported state in the browser.
 */

export type ConnectionState =
  | 'unavailable'
  | 'bluetooth-off'
  | 'disconnected'
  | 'scanning'
  | 'connecting'
  | 'reconnecting'
  | 'connected';

export type Measurement = {
  id: string;
  /** Distance in centimetres - the single canonical unit in the app. */
  valueCm: number;
  /** Epoch milliseconds when the reading reached the phone. */
  timestamp: number;
};

export type DistanceUnit = 'Centimeter' | 'Meter' | 'Inch' | 'Feet';

export type AlertSound = 'Beep' | 'Chime' | 'Off';

export type Settings = {
  units: DistanceUnit;
  /** Alert when a reading drops below this distance (cm). */
  alertThresholdCm: number;
  alertSound: AlertSound;
};

export const DEFAULT_SETTINGS: Settings = {
  units: 'Centimeter',
  alertThresholdCm: 30,
  alertSound: 'Beep',
};

export const DISTANCE_UNITS: DistanceUnit[] = ['Centimeter', 'Meter', 'Inch', 'Feet'];
export const ALERT_SOUNDS: AlertSound[] = ['Beep', 'Chime', 'Off'];

/** A peripheral discovered during a scan. */
export type DeviceInfo = {
  id: string;
  name: string | null;
  rssi: number | null;
};

/** A device we should try to reconnect to on the next launch. */
export type LastDevice = DeviceInfo & {
  connectedAt: number;
};

export type ReadingState = 'idle' | 'ok' | 'no-echo';

export type TransportEvent =
  | { type: 'connection'; state: ConnectionState; device?: DeviceInfo; error?: string }
  | { type: 'device'; device: DeviceInfo }
  | { type: 'scan-complete' }
  | { type: 'reading'; valueCm: number }
  | { type: 'no-echo' }
  | { type: 'error'; message: string };

/**
 * Minimal contract the UI depends on. Implementations may scan, connect,
 * monitor and auto-reconnect internally; the app only sees these events.
 */
export interface DeviceTransport {
  subscribe(listener: (event: TransportEvent) => void): () => void;
  startScan(): Promise<void>;
  stopScan(): Promise<void>;
  connect(device: DeviceInfo): Promise<void>;
  disconnect(): Promise<void>;
  send(command: string): Promise<void>;
  destroy(): void;
}

/** True when the UI should present the node as online. */
export function isConnected(state: ConnectionState): boolean {
  return state === 'connected';
}

/** True while a connection attempt is in flight. */
export function isBusy(state: ConnectionState): boolean {
  return state === 'connecting' || state === 'reconnecting' || state === 'scanning';
}
