import type {
  DeviceInfo,
  DeviceTransport,
  TransportEvent,
} from '@/services/device';

type Listener = (event: TransportEvent) => void;

const UNSUPPORTED_MESSAGE =
  'Bluetooth is only available in the Android development build. Use npx expo run:android or an EAS development build.';

/**
 * Browser fallback. The rest of the app remains usable (settings, persisted
 * history, empty states), but BLE is a native-only capability.
 */
export class WebBleTransport implements DeviceTransport {
  private readonly listeners = new Set<Listener>();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener({ type: 'connection', state: 'unavailable', error: UNSUPPORTED_MESSAGE });
    listener({ type: 'error', message: UNSUPPORTED_MESSAGE });
    return () => {
      this.listeners.delete(listener);
    };
  }

  async startScan(): Promise<void> {
    this.emit({ type: 'error', message: UNSUPPORTED_MESSAGE });
  }

  async stopScan(): Promise<void> {}

  async connect(_device: DeviceInfo): Promise<void> {
    this.emit({ type: 'error', message: UNSUPPORTED_MESSAGE });
  }

  async disconnect(): Promise<void> {}

  async send(_command: string): Promise<void> {
    throw new Error(UNSUPPORTED_MESSAGE);
  }

  destroy(): void {
    this.listeners.clear();
  }

  private emit(event: TransportEvent) {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}

let sharedTransport: DeviceTransport | null = null;

export function getBleTransport(): DeviceTransport {
  if (!sharedTransport) {
    sharedTransport = new WebBleTransport();
  }
  return sharedTransport;
}
