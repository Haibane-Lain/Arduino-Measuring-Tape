# BLE wire protocol

The ESP32 node exposes a single GATT service. The Android app is the BLE
central; the node is the peripheral.

## GATT

| Item | UUID / value |
| ---- | ------------ |
| Advertising name | `DistanceMeter` |
| Service | `4fafc201-1fb5-459e-8fcc-c5c9c331914b` |
| Measurement characteristic | `beb5483e-36e1-4688-b7f5-ea07361b26a8` |
| Measurement properties | `READ`, `NOTIFY` |
| Command characteristic | `beb5483e-36e1-4688-b7f5-ea07361b26a9` |
| Command properties | `WRITE`, `WRITE_NR` |

The measurement characteristic has a `0x2902` client-characteristic-configuration
descriptor so the app can enable notifications.

## Frames

All frames are UTF-8/ASCII and newline-terminated. The app must tolerate
fragmented packets and multiple frames in one BLE notification.

### Device → app

| Frame | Meaning |
| ----- | ------- |
| `DIST:<cm>` | One filtered reading in centimetres, e.g. `DIST:127.1` |
| `DIST:ERR` | The sensor returned no valid echo |
| `INFO:MEASURING_TAPE_V2` | Device identity; also the initial read value |
| `PONG` | Reply to `PING` |
| `OK:CAL=<cm>` | Calibration offset accepted |
| `ERR:CAL` | Calibration offset out of range |
| `ERR:UNKNOWN` | Unrecognised command |

### App → device

| Frame | Meaning |
| ----- | ------- |
| `PING` | Liveness check; reply is `PONG` |
| `CAL:<cm>` | Set the datum offset in centimetres, range −100…+100 |

The app does not need to send `CAL` for normal operation. It is available for
bench calibration and future enclosure work.

## Connection sequence

1. Scan for the service UUID or the device name.
2. Connect and discover services/characteristics.
3. Read the measurement characteristic to receive `INFO:...` or the last value.
4. Subscribe to notifications on the measurement characteristic.
5. Read the command characteristic handle for writes.
6. Send `PING` (optional) and expect `PONG`.
7. Press the physical button on the node. One `DIST:` notification is sent per
   press.
8. On disconnect, the node restarts advertising after a short delay.

## Error handling

- `DIST:ERR` means the sensor timed out. The app must not add a history entry.
- Unknown frames must be ignored without closing the connection.
- A dropped link should be retried with backoff. The app remembers the last
  device.
