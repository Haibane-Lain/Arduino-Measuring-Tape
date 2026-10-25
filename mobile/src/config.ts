/**
 * Runtime configuration shared by the app and the BLE transport.
 *
 * The canonical unit everywhere is centimetres. Values are converted only for
 * display, so changing units never mutates history.
 */

/** Full scale of the gauge, in centimetres (the sensor is usable to ~3 m). */
export const MAX_RANGE_CM = 300;

/** Upper bound on how many measurements are kept in history. */
export const HISTORY_LIMIT = 50;

/** BLE identity of the ESP32 node. */
export const BLE_DEVICE_NAME = 'DistanceMeter';
export const BLE_SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
export const BLE_MEASUREMENT_CHAR_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';
export const BLE_COMMAND_CHAR_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a9';

/** Stop scanning after this long. */
export const SCAN_TIMEOUT_MS = 12_000;

/** Per-attempt BLE connection timeout. */
export const CONNECT_TIMEOUT_MS = 10_000;

/** Backoff used for automatic reconnection after a drop. */
export const RECONNECT_DELAYS_MS = [2_000, 4_000, 8_000, 15_000, 30_000] as const;

/** How long to wait before retrying a cold auto-connect after launch. */
export const AUTO_CONNECT_DELAY_MS = 700;
