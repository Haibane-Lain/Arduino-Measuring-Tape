/**
 * Device layer.
 *
 * Today the app runs against `mockTransport`, which fabricates readings so the
 * UI can be built and reviewed. The firmware sketch in `../firmware` streams
 * newline-delimited frames over a Bluetooth SPP link, e.g.:
 *
 *     DIST:127.1
 *     DIST:127.4
 *
 * Wiring the real thing up (later milestone) means writing a transport that
 * matches `DeviceTransport` and dropping it into the provider - no screen code
 * should need to change.
 */

export type ConnectionState = 'disconnected' | 'connecting' | 'connected';

export type Measurement = {
  id: string;
  /** Distance in centimetres - the single canonical unit in the app. */
  valueCm: number;
  /** Epoch milliseconds when the reading was captured. */
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

/**
 * Minimal contract the UI depends on. A real implementation will wrap
 * `react-native-ble-plx` (BLE) or a classic SPP bridge.
 */
export interface DeviceTransport {
  readonly state: ConnectionState;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  /** Subscribe to incoming distances. Returns an unsubscribe function. */
  subscribe(listener: (valueCm: number) => void): () => void;
}
