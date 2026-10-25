# Requirements — Arduino Measuring Tape

Final requirements for the ESP32/BLE prototype and its Android application.

**Version:** 1.0.0
**Status:** Implemented baseline
**Date:** 25 October 2026
**Related:** [`../README.md`](../README.md) · [`PROTOCOL.md`](PROTOCOL.md) · [`PLAN.md`](PLAN.md) · [`../PROGRESS.md`](../PROGRESS.md) · [`../firmware/README.md`](../firmware/README.md)

---

## 1 · Purpose & scope

The system has two parts:

- a hand-held **ESP32 sensor node** with an HC-SR04 ultrasonic sensor, SSD1306
  OLED and KY-004 button; and
- an **Android app** built with Expo/React Native that connects over BLE,
  displays the latest reading on a gauge, keeps history, persists settings and
  plays a threshold alert.

The node takes **one measurement per button press**. It does not stream
continuously and does not store readings when the phone is disconnected.

### 1.1 Locked decisions

| # | Decision | Consequence |
| - | -------- | ----------- |
| D1 | Android only | BLE is the radio; no iOS product support is required. |
| D2 | ESP32 Dev Module | 3.3 V logic; ECHO must be level-shifted. |
| D3 | BLE GATT, not classic SPP | App uses `@sfourdrinier/react-native-ble-plx`. |
| D4 | One reading per button press | Saves power; app logs one history entry per press. |
| D5 | Phone-side alert | The prototype has no buzzer. |
| D6 | USB-powered prototype | Battery/enclosure are out of scope. |

### 1.2 Priorities

Every requirement is tagged **M** (must), **S** (should) or **C** (could).

---

## 2 · Functional requirements

| ID | Requirement | Priority |
| -- | ----------- | -------- |
| FR-1 | The node shall take a filtered distance measurement when the button is pressed. | M |
| FR-2 | The node shall show the reading and no-echo state on the OLED. | M |
| FR-3 | The node shall send one `DIST:` notification per successful press. | M |
| FR-4 | The node shall send `DIST:ERR` when no valid echo is returned. | M |
| FR-5 | The node shall announce itself as `DistanceMeter` and answer `PING` with `PONG`. | M |
| FR-6 | The app shall scan for, list and connect to nearby DistanceMeter nodes. | M |
| FR-7 | The app shall display the latest reading, a gauge and a safe/warning badge. | M |
| FR-8 | The app shall log each successful reading newest-first and allow clearing history. | M |
| FR-9 | The app shall support cm / m / in / ft and re-render immediately. | M |
| FR-10 | The app shall persist settings and history across restarts. | M |
| FR-11 | The app shall remember the last device and reconnect automatically. | M |
| FR-12 | The app shall show connection/error states and allow manual disconnect. | M |
| FR-13 | The app shall play Beep/Chime/Off below the alert threshold. | S |
| FR-14 | The node shall mirror frames to USB serial for bench testing. | M |
| FR-15 | The node shall support a datum-offset calibration command. | S |
| FR-16 | The app shall expose an empty state and connection guidance. | S |

---

## 3 · Hardware requirements

### 3.1 Controller and sensor

| ID | Requirement | Priority |
| -- | ----------- | -------- |
| HR-1 | ESP32 Dev Module (ESP32-WROOM-32 class), 3.3 V logic. | M |
| HR-2 | HC-SR04 ultrasonic sensor, 2–400 cm stated range. | M |
| HR-3 | HC-SR04 ECHO shall pass through a 1 kΩ/2 kΩ divider to 3.3 V. | M |
| HR-4 | TRIG on GPIO18, ECHO on GPIO19. | M |
| HR-5 | SSD1306 128×64 OLED on I²C GPIO21/GPIO22, address `0x3C`. | M |
| HR-6 | KY-004 button on GPIO27; active level configurable in firmware. | M |
| HR-7 | Sensor VCC from 5 V (`VIN`); OLED/button from 3.3 V. | M |

### 3.2 BLE and display

| ID | Requirement | Priority |
| -- | ----------- | -------- |
| HR-8 | BLE device name `DistanceMeter`, advertised with the service UUID. | M |
| HR-9 | Measurement characteristic is readable and notifiable. | M |
| HR-10 | Command characteristic accepts writes. | M |
| HR-11 | The node restarts advertising after a client disconnects. | M |
| HR-12 | The OLED is optional; a missing display must not block BLE. | S |
| HR-13 | The OLED sleeps after 10 s of inactivity and wakes on a press. | S |

### 3.3 Power

| ID | Requirement | Priority |
| -- | ----------- | -------- |
| HR-14 | The prototype is powered over USB. | M |
| HR-15 | Battery, charging and boost circuitry are out of scope. | — |

---

## 4 · Software requirements

### 4.1 Firmware

| ID | Requirement | Priority |
| -- | ----------- | -------- |
| SR-1 | Build with Arduino IDE 2.x, ESP32 core 2.0.17+ or 3.x. | M |
| SR-2 | Use Adafruit SSD1306, Adafruit GFX Library and Adafruit BusIO. | M |
| SR-3 | Median-of-5 filtering with invalid-echo rejection. | M |
| SR-4 | Debounced button, one measurement per press. | M |
| SR-5 | Fixed-size frame buffers; no heap `String` in the hot path. | S |
| SR-6 | Support `PING` and `CAL:<cm>` commands. | S |
| SR-7 | Continue headless if the OLED fails to initialise. | S |
| SR-8 | Tuning constants at the top of the sketch. | M |
| SR-9 | Mirror every frame to USB serial at 115200. | M |

### 4.2 Mobile application

| ID | Requirement | Priority |
| -- | ----------- | -------- |
| SR-10 | Expo SDK 57, React Native 0.86, React 19.2, TypeScript strict, Expo Router. | M |
| SR-11 | Use `@sfourdrinier/react-native-ble-plx` 3.9.x (RN 0.86/Expo 57 fork). | M |
| SR-12 | Require a development build; BLE does not run in Expo Go. | M |
| SR-13 | Declare `BLUETOOTH_SCAN`/`BLUETOOTH_CONNECT`; location for API ≤ 30. | M |
| SR-14 | Line-buffer BLE notifications and tolerate split/merged packets. | M |
| SR-15 | Scan, connect, discover, monitor and reconnect with backoff. | M |
| SR-16 | Persist settings, history and last device with AsyncStorage. | M |
| SR-17 | Show clear states for scanning, connecting, reconnecting, offline, Bluetooth off and unavailable. | M |
| SR-18 | Play local alert sounds with `expo-audio`. | S |
| SR-19 | Provide a browser fallback that explains BLE is native-only. | S |
| SR-20 | Keep `tsc`, ESLint, Expo Doctor and Jest green. | M |
| SR-21 | Unit-test the parser, storage validation, units and alert rule. | S |

### 4.3 BLE protocol

Newline-delimited ASCII over GATT. Full contract: [`PROTOCOL.md`](PROTOCOL.md).

| Direction | Frame | Meaning |
| --------- | ----- | ------- |
| Node → app | `DIST:<cm>` | Filtered distance |
| Node → app | `DIST:ERR` | No echo |
| Node → app | `INFO:MEASURING_TAPE_V2` | Identity / initial value |
| Node → app | `PONG` | Reply to `PING` |
| Node → app | `OK:CAL=<cm>` | Calibration accepted |
| Node → app | `ERR:<reason>` | Rejected command |
| App → node | `PING` | Liveness check |
| App → node | `CAL:<cm>` | Datum offset (−100…+100) |

| ID | Requirement | Priority |
| -- | ----------- | -------- |
| SR-22 | Treat the protocol above as the frozen interface. | M |
| SR-23 | Ignore unknown frames without closing the link. | M |
| SR-24 | Do not add a history entry for `DIST:ERR`. | M |

---

## 5 · Non-functional targets

| Aspect | Target |
| ------ | ------ |
| Measurement | One filtered reading per press, ~200 ms sampling |
| End-to-end latency | < 500 ms from notification to UI |
| Accuracy | cm-level to ~2 m; bench-verify against a steel tape |
| Range | 5 cm – 3 m usable |
| Reconnect | Automatic, backoff capped at 30 s per attempt |
| App cold start | < 3 s |
| History | 50 entries, newest first |
| Persistence | Settings/history survive force-quit |

---

## 6 · Verification & acceptance

| Area | How it is verified |
| ---- | ------------------ |
| Firmware compiles | `arduino-cli compile --fqbn esp32:esp32:esp32` |
| Serial output | `DIST:`/`DIST:ERR` visible at 115200 |
| BLE GATT | nRF Connect: read INFO, notify DIST, write PING/CAL |
| Sensor accuracy | Compare 10/50/100/200 cm against a steel tape |
| App build | `npx expo run:android` or EAS development build |
| App behaviour | Scan, connect, reading, history, units, threshold alert |
| Reconnect | Power-cycle the node and walk out of range |
| Persistence | Force-quit and reopen; history/settings/last device restore |
| OLED | Sleep after 10 s, wake and measure on press |
| Quality gates | `tsc`, ESLint, Expo Doctor, Jest, web bundle |

---

## 7 · Out of scope

- iOS support and app-store release.
- Battery, charging, boost and power budgeting.
- Enclosure design, cutouts and final datum calibration.
- Continuous streaming and offline history on the node.
- Device-side buzzer.
- Temperature compensation.
- Multiple simultaneous nodes.
- Cloud sync/accounts.

---

## 8 · Risks

| # | Risk | Mitigation |
| - | ---- | ---------- |
| R1 | HC-SR04 ECHO overvoltage damages the ESP32. | Mandatory 1 kΩ/2 kΩ divider; documented. |
| R2 | `neverForLocation` filters BLE results on some OEMs. | Disable it and request location if scanning fails. |
| R3 | Android ≤ 11 needs location services enabled. | Documented; app requests fine location. |
| R4 | BLE library / RN 0.86 incompatibility. | Use the maintained Expo 57 fork; dev build required. |
| R5 | OLED failure blocks the app. | Firmware continues headless. |
| R6 | Sensor accuracy varies with target angle/temperature. | Median filter; bench calibration; scope temperature compensation out. |
| R7 | No physical hardware test in this environment. | Provide bench checklist and perform acceptance on device. |
