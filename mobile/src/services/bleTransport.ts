import { PermissionsAndroid, Platform } from 'react-native';
import type {
  BleManager,
  Characteristic,
  ConnectionManager,
  Device,
  State,
  Subscription,
} from '@sfourdrinier/react-native-ble-plx';

import {
  AUTO_CONNECT_DELAY_MS,
  BLE_COMMAND_CHAR_UUID,
  BLE_DEVICE_NAME,
  BLE_MEASUREMENT_CHAR_UUID,
  BLE_SERVICE_UUID,
  CONNECT_TIMEOUT_MS,
  RECONNECT_DELAYS_MS,
  SCAN_TIMEOUT_MS,
} from '@/config';
import {
  type ConnectionState,
  type DeviceInfo,
  type DeviceTransport,
  type TransportEvent,
} from '@/services/device';
import {
  decodeBase64Ascii,
  encodeAsciiBase64,
  ProtocolParser,
  type DeviceFrame,
} from '@/services/protocol';

type Listener = (event: TransportEvent) => void;

function messageOf(error: unknown): string {
  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }
  if (typeof error === 'string' && error.length > 0) {
    return error;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.length > 0) {
      return message;
    }
  }
  return 'Bluetooth operation failed';
}

function infoFromDevice(device: Device): DeviceInfo {
  return {
    id: device.id,
    name: device.name ?? device.localName ?? null,
    rssi: device.rssi ?? null,
  };
}

function withTimeout<T>(promise: Promise<T>, milliseconds: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const timeout = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), milliseconds);
  });

  return Promise.race([promise, timeout]).finally(() => {
    if (timer) {
      clearTimeout(timer);
    }
  });
}

function matchesDistanceMeter(device: Device): boolean {
  const name = (device.name ?? device.localName ?? '').toLowerCase();
  if (name === BLE_DEVICE_NAME.toLowerCase()) {
    return true;
  }

  return (device.serviceUUIDs ?? []).some(
    (uuid) => uuid.toLowerCase() === BLE_SERVICE_UUID.toLowerCase(),
  );
}

/**
 * Real BLE transport for the ESP32 node.
 *
 * Uses the maintained RN 0.86 / Expo 57 fork of react-native-ble-plx and its
 * ConnectionManager for timeouts and retries. Scanning is client-side filtered
 * so devices whose service UUID is only in the scan response are still found.
 */
export class NativeBleTransport implements DeviceTransport {
  private readonly listeners = new Set<Listener>();
  private readonly parser = new ProtocolParser();

  private manager: BleManager | null = null;
  private connections: ConnectionManager | null = null;
  private managerSubscription: Subscription | null = null;

  private currentState: ConnectionState = 'disconnected';
  private lastError: string | null = null;
  private target: DeviceInfo | null = null;
  private connectedDevice: Device | null = null;
  private commandCharacteristic: Characteristic | null = null;
  private monitorSubscription: Subscription | null = null;
  private disconnectSubscription: Subscription | null = null;

  private scanActive = false;
  private scanTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempt = 0;
  private connectionGeneration = 0;
  private connectPromise: Promise<void> | null = null;
  private shouldReconnect = false;
  private destroyed = false;
  private fatalError: string | null = null;

  constructor() {
    this.setupManager();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener({
      type: 'connection',
      state: this.currentState,
      device: this.target ?? undefined,
      error: this.lastError ?? undefined,
    });
    if (this.fatalError) {
      listener({ type: 'error', message: this.fatalError });
    }
    return () => {
      this.listeners.delete(listener);
    };
  }

  async startScan(): Promise<void> {
    if (!this.ensureManager()) {
      return;
    }

    if (
      this.currentState === 'connected' ||
      this.currentState === 'connecting' ||
      this.currentState === 'reconnecting' ||
      this.connectedDevice
    ) {
      this.emit({
        type: 'error',
        message: 'Wait for the current connection attempt to finish before scanning.',
      });
      return;
    }

    // A manual scan supersedes any pending automatic reconnect.
    this.clearReconnectTimer();
    this.shouldReconnect = false;
    this.reconnectAttempt = 0;

    if (!(await this.ensurePermissions())) {
      return;
    }

    await this.stopScan(false);

    const manager = this.manager;
    if (!manager) {
      return;
    }

    if (!(await this.ensureBluetoothOn())) {
      return;
    }

    this.scanActive = true;
    this.lastError = null;
    this.setState('scanning');

    try {
      // Duplicates are allowed so a later scan-response packet can supply the
      // name/service UUID when the first advertisement did not. AppState
      // de-duplicates by device id before rendering.
      await manager.startDeviceScan(null, { allowDuplicates: true }, (error, device) => {
        if (!this.scanActive) {
          return;
        }
        if (error) {
          this.scanActive = false;
          this.clearScanTimer();
          this.lastError = messageOf(error);
          this.emit({ type: 'error', message: this.lastError });
          this.setState('disconnected');
          this.emit({ type: 'scan-complete' });
          return;
        }
        if (device && matchesDistanceMeter(device)) {
          this.emit({ type: 'device', device: infoFromDevice(device) });
        }
      });
    } catch (error) {
      this.scanActive = false;
      this.clearScanTimer();
      this.lastError = messageOf(error);
      this.emit({ type: 'error', message: this.lastError });
      this.setState('disconnected');
      this.emit({ type: 'scan-complete' });
      return;
    }

    if (!this.scanActive) {
      return;
    }

    this.scanTimer = setTimeout(() => {
      void this.stopScan(true);
    }, SCAN_TIMEOUT_MS);
  }

  async stopScan(timedOut = true): Promise<void> {
    this.clearScanTimer();
    const wasScanning = this.scanActive;
    this.scanActive = false;

    if (this.manager && wasScanning) {
      try {
        await this.manager.stopDeviceScan();
      } catch {
        // The native scan may already have stopped itself.
      }
    }

    if (wasScanning) {
      if (this.currentState === 'scanning') {
        this.setState('disconnected');
      }
      if (timedOut) {
        this.emit({ type: 'scan-complete' });
      }
    }
  }

  async connect(device: DeviceInfo): Promise<void> {
    if (!this.ensureManager() || this.destroyed) {
      return;
    }

    if (!(await this.ensurePermissions())) {
      return;
    }

    if (!(await this.ensureBluetoothOn())) {
      return;
    }

    if (this.connectedDevice?.id === device.id) {
      this.setState('connected', infoFromDevice(this.connectedDevice));
      return;
    }

    this.clearReconnectTimer();
    this.reconnectAttempt = 0;

    await this.stopScan(false);

    if (this.connectedDevice || this.connectPromise) {
      await this.disconnect();
    }

    this.target = device;
    this.shouldReconnect = true;
    this.reconnectAttempt = 0;
    this.lastError = null;
    await this.connectInternal(false);
  }

  async disconnect(): Promise<void> {
    this.shouldReconnect = false;
    this.reconnectAttempt = 0;
    this.clearReconnectTimer();
    await this.stopScan(false);

    this.connectionGeneration += 1;
    this.connectPromise = null;
    const targetId = this.target?.id;
    this.cleanupConnection();

    if (this.connections && targetId) {
      try {
        this.connections.cancel(targetId);
      } catch {
        // No pending attempt.
      }
    }

    if (this.manager && targetId) {
      try {
        await this.manager.cancelDeviceConnection(targetId);
      } catch {
        // Already disconnected.
      }
    }

    this.target = null;
    this.lastError = null;
    this.setState('disconnected');
  }

  async send(command: string): Promise<void> {
    if (!this.commandCharacteristic) {
      throw new Error('The tape is not connected.');
    }

    const line = command.endsWith('\n') ? command : `${command}\n`;
    await this.commandCharacteristic.writeWithoutResponse(encodeAsciiBase64(line));
  }

  destroy(): void {
    this.destroyed = true;
    this.shouldReconnect = false;
    this.scanActive = false;
    this.clearScanTimer();
    this.clearReconnectTimer();
    this.cleanupConnection();
    this.managerSubscription?.remove();
    this.managerSubscription = null;

    if (this.connections) {
      this.connections.destroy();
      this.connections = null;
    }

    if (this.manager) {
      void this.manager.destroy().catch(() => {});
      this.manager = null;
    }

    this.listeners.clear();
  }

  // -------------------------------------------------------------------------
  // Connection lifecycle
  // -------------------------------------------------------------------------

  private setupManager() {
    try {
      // Load lazily so an Expo Go build (where the native module is absent)
      // can show the friendly fallback instead of crashing during module import.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const ble = require('@sfourdrinier/react-native-ble-plx') as typeof import('@sfourdrinier/react-native-ble-plx');
      this.manager = new ble.BleManager();
      this.connections = new ble.ConnectionManager(this.manager);
      this.managerSubscription = this.manager.onStateChange((state) => {
        this.handleAdapterState(state);
      }, true);
    } catch (error) {
      this.manager = null;
      this.connections = null;
      this.managerSubscription = null;
      this.fatalError =
        'Bluetooth requires an Android development build. Expo Go and the browser cannot use the BLE module.';
      this.lastError = this.fatalError;
      this.currentState = 'unavailable';
      this.emit({ type: 'error', message: messageOf(error) });
    }
  }

  private ensureManager(): boolean {
    if (this.manager && this.connections) {
      return true;
    }
    if (!this.fatalError) {
      this.setupManager();
    }
    return this.manager !== null && this.connections !== null;
  }

  private handleAdapterState(state: State | keyof typeof State) {
    if (this.destroyed) {
      return;
    }

    if (state === 'PoweredOn') {
      this.lastError = null;
      const busy = this.currentState === 'connecting' || this.currentState === 'reconnecting';
      if (this.currentState !== 'connected' && this.currentState !== 'scanning' && !busy) {
        this.setState('disconnected', this.target ?? undefined);
      }
      if (!busy && this.shouldReconnect && this.target && !this.connectedDevice) {
        this.reconnectAttempt = 0;
        this.scheduleReconnect();
      }
      return;
    }

    if (state === 'PoweredOff') {
      this.scanActive = false;
      this.clearScanTimer();
      this.clearReconnectTimer();
      this.connectionGeneration += 1;
      this.cleanupConnection();
      this.lastError = 'Bluetooth is off. Turn it on to connect to the tape.';
      this.setState('bluetooth-off', this.target ?? undefined, this.lastError);
      return;
    }

    if (state === 'Unsupported' || state === 'Unauthorized') {
      this.scanActive = false;
      this.clearScanTimer();
      this.clearReconnectTimer();
      this.connectionGeneration += 1;
      this.cleanupConnection();
      this.lastError =
        state === 'Unauthorized'
          ? 'Bluetooth permission was denied. Allow it in Android settings.'
          : 'This device does not support Bluetooth Low Energy.';
      this.setState('unavailable', this.target ?? undefined, this.lastError);
    }
  }

  private async ensureBluetoothOn(): Promise<boolean> {
    if (!this.manager) {
      return false;
    }

    try {
      const state = await this.manager.state();
      if (state === 'PoweredOn') {
        return true;
      }

      this.lastError =
        state === 'PoweredOff'
          ? 'Bluetooth is off. Turn it on to connect to the tape.'
          : state === 'Unauthorized'
            ? 'Bluetooth permission was denied. Allow it in Android settings.'
            : 'Bluetooth is not available on this device.';
      this.setState(
        state === 'PoweredOff' ? 'bluetooth-off' : 'unavailable',
        this.target ?? undefined,
        this.lastError,
      );
      return false;
    } catch (error) {
      this.lastError = messageOf(error);
      this.emit({ type: 'error', message: this.lastError });
      return false;
    }
  }

  private async connectInternal(isRetry: boolean): Promise<void> {
    if (!this.manager || !this.connections || !this.target || this.destroyed) {
      return;
    }

    if (this.connectPromise) {
      await this.connectPromise;
      return;
    }

    const generation = (this.connectionGeneration += 1);
    const target = this.target;

    const promise = (async () => {
      this.setState(isRetry ? 'reconnecting' : 'connecting', target);

      try {
        const device = await this.connections!.attemptConnectOnce(target.id, {
          timeoutMs: CONNECT_TIMEOUT_MS,
          connectionOptions: { autoConnect: false },
        });

        if (this.destroyed || generation !== this.connectionGeneration) {
          await this.manager!.cancelDeviceConnection(device.id).catch(() => {});
          return;
        }

        await this.attach(device, generation);
      } catch (error) {
        if (this.destroyed || generation !== this.connectionGeneration) {
          return;
        }

        // Invalidate a late disconnect callback from a half-open connection
        // before tearing it down; otherwise it could schedule a second retry
        // engine on top of the one below.
        this.connectionGeneration += 1;

        if (this.manager) {
          try {
            await this.manager.cancelDeviceConnection(target.id);
          } catch {
            // The link was never established.
          }
        }

        this.cleanupConnection();
        const message = `Could not connect to ${target.name ?? BLE_DEVICE_NAME}. Make sure it is powered on and nearby.`;
        this.lastError = error instanceof Error && error.message ? `${message} (${error.message})` : message;

        if (isRetry && this.shouldReconnect) {
          this.scheduleReconnect();
        } else {
          this.setState('disconnected', target, this.lastError);
        }
      }
    })();

    this.connectPromise = promise;
    try {
      await promise;
    } finally {
      if (this.connectPromise === promise) {
        this.connectPromise = null;
      }
    }
  }

  private async attach(device: Device, generation: number): Promise<void> {
    this.cleanupConnection();

    this.disconnectSubscription = device.onDisconnected((error) => {
      this.handleDisconnected(generation, error);
    });

    await withTimeout(
      device.discoverAllServicesAndCharacteristics(),
      CONNECT_TIMEOUT_MS,
      'Service discovery timed out',
    );
    if (generation !== this.connectionGeneration) {
      await this.manager?.cancelDeviceConnection(device.id).catch(() => {});
      return;
    }

    const characteristics = await withTimeout(
      device.characteristicsForService(BLE_SERVICE_UUID),
      CONNECT_TIMEOUT_MS,
      'Reading the DistanceMeter service timed out',
    );
    const measurement = characteristics.find(
      (characteristic) =>
        characteristic.uuid.toLowerCase() === BLE_MEASUREMENT_CHAR_UUID.toLowerCase(),
    );
    const command = characteristics.find(
      (characteristic) =>
        characteristic.uuid.toLowerCase() === BLE_COMMAND_CHAR_UUID.toLowerCase(),
    );

    if (!measurement || !command) {
      throw new Error('DistanceMeter service found, but its characteristics are missing');
    }

    this.parser.reset();
    this.monitorSubscription = measurement.monitor((error, characteristic) => {
      if (error) {
        this.emit({ type: 'error', message: messageOf(error) });
        return;
      }
      this.handleCharacteristicValue(characteristic?.value);
    });

    try {
      const initial = await withTimeout(measurement.read(), 4_000, 'Initial read timed out');
      this.handleInitialCharacteristicValue(initial.value);
    } catch {
      // Some Android stacks reject the initial read even though notifications
      // work. The first button press will still deliver a value.
    }

    this.connectedDevice = device;
    this.commandCharacteristic = command;
    this.reconnectAttempt = 0;
    this.lastError = null;
    this.target = infoFromDevice(device);
    this.setState('connected', this.target);

    // PING is diagnostic only; do not let a slow write delay the connection.
    void this.send('PING').catch(() => {});
  }

  private handleDisconnected(generation: number, error: unknown) {
    if (generation !== this.connectionGeneration || this.destroyed) {
      return;
    }

    this.cleanupConnection();

    if (!this.shouldReconnect) {
      this.setState('disconnected', this.target ?? undefined);
      return;
    }

    this.lastError = error ? messageOf(error) : 'The tape disconnected.';
    this.reconnectAttempt = 0;
    this.scheduleReconnect();
  }

  private scheduleReconnect() {
    if (this.destroyed || !this.shouldReconnect || !this.target) {
      return;
    }

    this.clearReconnectTimer();

    if (this.reconnectAttempt >= RECONNECT_DELAYS_MS.length) {
      this.shouldReconnect = false;
      this.setState(
        'disconnected',
        this.target,
        this.lastError ?? 'Could not reconnect to the tape.',
      );
      return;
    }

    const delay = RECONNECT_DELAYS_MS[this.reconnectAttempt] ?? RECONNECT_DELAYS_MS[0];
    this.reconnectAttempt += 1;
    this.setState('reconnecting', this.target, this.lastError ?? undefined);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.connectInternal(true);
    }, Math.max(delay, AUTO_CONNECT_DELAY_MS));
  }

  private async handleCharacteristicValue(value: string | null | undefined) {
    if (!value) {
      return;
    }

    const frames = this.parser.push(decodeBase64Ascii(value));
    for (const frame of frames) {
      this.handleFrame(frame);
    }
  }

  /**
   * The characteristic keeps its last value. Parsing a stale DIST frame on
   * connect would add a duplicate history entry, so the initial read only
   * consumes identity/command frames. Real readings arrive via notifications.
   */
  private handleInitialCharacteristicValue(value: string | null | undefined) {
    if (!value) {
      return;
    }

    const frames = this.parser.push(decodeBase64Ascii(value));
    for (const frame of frames) {
      if (frame.type === 'distance' || frame.type === 'no-echo') {
        continue;
      }
      this.handleFrame(frame);
    }
    this.parser.reset();
  }

  private handleFrame(frame: DeviceFrame) {
    switch (frame.type) {
      case 'distance':
        this.emit({ type: 'reading', valueCm: frame.valueCm });
        break;
      case 'no-echo':
        this.emit({ type: 'no-echo' });
        break;
      case 'error':
        this.emit({ type: 'error', message: frame.raw });
        break;
      default:
        break;
    }
  }

  private cleanupConnection() {
    this.monitorSubscription?.remove();
    this.monitorSubscription = null;
    this.disconnectSubscription?.remove();
    this.disconnectSubscription = null;
    this.commandCharacteristic = null;
    this.connectedDevice = null;
    this.parser.reset();
  }

  private clearScanTimer() {
    if (this.scanTimer) {
      clearTimeout(this.scanTimer);
      this.scanTimer = null;
    }
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private setState(state: ConnectionState, device?: DeviceInfo, error?: string) {
    this.currentState = state;
    if (error !== undefined) {
      this.lastError = error;
    }
    this.emit({ type: 'connection', state, device, error });
  }

  private emit(event: TransportEvent) {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        // A screen-level listener must not break the transport.
      }
    }
  }

  private async ensurePermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      const apiLevel = Number(Platform.Version);
      const permissions =
        apiLevel >= 31
          ? [
              PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
              PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            ]
          : [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];

      const result = await PermissionsAndroid.requestMultiple(permissions);
      const granted = permissions.every(
        (permission) => result[permission] === PermissionsAndroid.RESULTS.GRANTED,
      );

      if (!granted) {
        this.lastError = 'Bluetooth permission was denied. Allow it in Android settings.';
        this.emit({ type: 'error', message: this.lastError });
      }
      return granted;
    } catch (error) {
      this.lastError = messageOf(error);
      this.emit({ type: 'error', message: this.lastError });
      return false;
    }
  }
}

let sharedTransport: DeviceTransport | null = null;

/**
 * One transport for the app lifetime. Keeping the BleManager alive avoids
 * destroying and recreating the native singleton during React StrictMode
 * remounts or Fast Refresh.
 */
export function getBleTransport(): DeviceTransport {
  if (!sharedTransport) {
    sharedTransport = new NativeBleTransport();
  }
  return sharedTransport;
}
