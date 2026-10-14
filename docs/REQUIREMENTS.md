# Requirements — Arduino Measuring Tape

System requirements specification for the Bluetooth tape measure.

**Version:** 0.2.0
**Status:** Draft — locked baseline for Milestone 2
**Date:** 6 October 2026
**Related:** [`../PROGRESS.md`](../PROGRESS.md) · [`PLAN.md`](PLAN.md) · [`UI-SPEC.md`](UI-SPEC.md) · [`../firmware/README.md`](../firmware/README.md)

---

## 1 · Purpose & scope

The Arduino Measuring Tape is a two-part system:

- a **hand-held sensor node** — an Arduino UNO with an ultrasonic distance sensor and a
  classic-Bluetooth serial link, powered by a battery and housed in an off-the-shelf
  project box; and
- a **phone application** — an Expo/React Native app that shows the live reading on a
  gauge, keeps a measurement history, and lets the user configure units and alerts.

This document states what each part must do. It supersedes the implicit requirements in
`PROGRESS.md` and `documentation.html` where they conflict.

### 1.1 Locked decisions

These were agreed before this draft and drive everything else:

| # | Decision | Consequence |
| - | -------- | ----------- |
| D1 | **Android only** (no iOS) | Classic Bluetooth **SPP (HC-05/HC-06)** is the radio. No BLE migration needed. |
| D2 | **Battery powered** | Needs a battery, charging/boost path, and a power budget. |
| D3 | **Arduino UNO** (ATmega328P) | 5 V logic; existing sketch and pin map stand. |
| D4 | **Off-the-shelf project box** | No 3D-printed enclosure; cutouts drilled into a stock ABS box. |

### 1.2 Priorities

Every requirement is tagged **M** (must), **S** (should) or **C** (could), following
MoSCoW. Must-haves define a shippable device; should-haves are expected but deferrable;
could-haves are stretch goals.

---

## 2 · Functional requirements

| ID | Requirement | Priority |
| -- | ----------- | -------- |
| FR-1 | The node shall measure distance with the ultrasonic sensor and transmit a reading at ~5 Hz over Bluetooth SPP. | M |
| FR-2 | The node shall emit a distinguishable error frame when no echo is returned (nothing in range). | M |
| FR-3 | The node shall sound a local buzzer alert while the reading is below a configurable threshold. | M |
| FR-4 | The node shall accept commands to set the threshold and enable/disable the buzzer. | M |
| FR-5 | The node shall announce itself on boot and answer a liveness ping. | M |
| FR-6 | The app shall discover, pair with and connect to the node over classic Bluetooth. | M |
| FR-7 | The app shall display the live reading, a gauge, and a safe/warning status badge. | M |
| FR-8 | The app shall log readings newest-first and allow the user to clear the log. | M |
| FR-9 | The app shall let the user pick units (cm / m / in / ft), threshold and alert sound, and re-render immediately. | M |
| FR-10 | The app shall persist settings and history across restarts. | M |
| FR-11 | The app shall push the threshold and buzzer setting to the node on connect. | S |
| FR-12 | The app shall show connection state and reconnect automatically after a dropout. | S |
| FR-13 | The node shall mirror all frames to USB serial for bench testing. | M |
| FR-14 | The app shall play the selected alert sound when a reading crosses below the threshold. | S |
| FR-15 | The node shall indicate power/connection state with an LED. | C |

---

## 3 · Hardware requirements

### 3.1 Controller

| ID | Requirement | Priority |
| -- | ----------- | -------- |
| HR-1 | Arduino UNO R3 (ATmega328P, 5 V, 16 MHz), flashed via USB. | M |
| HR-2 | Reserve flash/RAM for the sketch plus `SoftwareSerial` within 32 KB / 2 KB. | M |
| HR-3 | Expose: D9 (TRIG out), D10 (ECHO in), D8 (buzzer), D2/D3 (BT serial). | M |
| HR-4 | D13 (or a spare pin) drives a status LED. | C |

### 3.2 Distance sensor

| ID | Requirement | Priority |
| -- | ----------- | -------- |
| HR-5 | HC-SR04 ultrasonic sensor, 5 V, 2–400 cm stated range. | M |
| HR-6 | Usable measuring range **≥ 5 cm and ≤ 3 m**, with cm-level accuracy. | M |
| HR-7 | Temperature compensation (DS18B20/DHT22) or a self-compensating module for stable accuracy over a metre scale. | S |
| HR-8 | The sensor face must remain clear of obstruction; no material inside its ~15° beam or its near-field dead zone. | M |

### 3.3 Bluetooth radio

| ID | Requirement | Priority |
| -- | ----------- | -------- |
| HR-9 | HC-05 (or HC-06) classic Bluetooth SPP module, default 9600 baud. | M |
| HR-10 | The UNO→module RX line shall pass through a **3.3 V divider (1 kΩ series + 2 kΩ to GND)**. | M |
| HR-11 | Module to be paired and trusted once; the app reconnects to the bonded device. | M |
| HR-12 | Reliable link at ≥ 3 m indoor range. | S |

### 3.4 Alerting & feedback

| ID | Requirement | Priority |
| -- | ----------- | -------- |
| HR-13 | Piezo buzzer on D8 through a ~220 Ω resistor. | M |
| HR-14 | The buzzer must be audible through the enclosure (vent or external mount). | M |
| HR-15 | Status LED (power/connected), current-limited. | C |

### 3.5 Power

| ID | Requirement | Priority |
| -- | ----------- | -------- |
| HR-16 | Rechargeable Li-ion/LiPo cell (target ≥ 2000 mAh) with a 5 V regulated supply to the UNO. | M |
| HR-17 | Charge and over/under-discharge protection (e.g. TP4056 + protection, or a combined charge/boost module). | M |
| HR-18 | Physical power switch. | M |
| HR-19 | **Runtime ≥ 8 hours** of continuous measurement on a full charge. | M |
| HR-20 | Reverse-polarity protection and bulk + per-rail decoupling capacitors. | S |
| HR-21 | Battery-level indication to the app (frame field or derived threshold warning). | C |

#### Power budget (target)

| Load | Typical draw |
| ---- | ------------ |
| Arduino UNO R3 (5 V, running) | ~50 mA |
| HC-SR04 (active) | ~15 mA |
| HC-05 (connected, average) | ~40 mA |
| Piezo buzzer (intermittent) | ~25 mA |
| Status LED | ~5 mA |
| **Total (continuous, LED on)** | **~135 mA** |

With a 5 V boost from a 3.7 V cell at ~85 % efficiency, a 2000 mAh cell gives roughly
10 hours; a 3000 mAh 18650 gives roughly 14 hours. The ≥ 8 h target therefore has margin.

### 3.6 Support components & consumables

- Resistors: 220 Ω (buzzer), 1 kΩ + 2 kΩ (divider), LED resistor (C).
- Capacitors: 100 µF bulk + 100 nF per rail.
- Perfboard/PCB, 2-pin JST battery connector, stranded hook-up wire, heat-shrink.
- M3 screws and standoffs for mounting boards inside the box.
- Optional: DS18B20 + 4.7 kΩ pull-up; tactile pushbutton; ferrite bead on the radio supply.

### 3.7 Tools

Soldering iron and solder, wire strippers, multimeter, small screwdrivers, drill/dremel
and step bits for box cutouts, USB cable, heat gun (optional).

---

## 4 · Software requirements

### 4.1 Firmware (Arduino UNO)

| ID | Requirement | Priority |
| -- | ----------- | -------- |
| SR-1 | Build with Arduino IDE 2.x or `arduino-cli`, AVR core ≥ 1.8.6, board "Arduino UNO". | M |
| SR-2 | Implement 5 Hz sampling, EMA smoothing, and `DIST:`/`DIST:ERR` output. | M |
| SR-3 | Parse `THRESH:`, `BEEP:` and `PING` commands and reply `OK:`/`ERR:`. | M |
| SR-4 | Mirror every frame to USB serial (9600 baud) for testing. | M |
| SR-5 | Replace heap-allocating `String` concatenation in the hot path with fixed `char` buffers. | S |
| SR-6 | Discard sensor warm-up samples and apply a median-of-3 filter before the EMA. | S |
| SR-7 | Apply a configurable **datum offset** so readings are measured from the case front face. | S |
| SR-8 | Enable the watchdog timer and tolerate radio disconnects without locking up. | S |
| SR-9 | Expose tuning constants (`SMOOTHING`, offset, filter sizes) at the top of the sketch. | M |

### 4.2 Mobile application

| ID | Requirement | Priority |
| -- | ----------- | -------- |
| SR-10 | Expo SDK 57, React Native 0.86, React 19.2, TypeScript strict, Expo Router 57 (current stack). | M |
| SR-11 | Implement a real `DeviceTransport` (SPP) behind the existing contract in `src/services/device.ts`. | M |
| SR-12 | Use `react-native-bluetooth-classic` (1.70.x for RN ≥ 0.73) with the `with-rn-bluetooth-classic` config plugin. | M |
| SR-13 | Require a **development build** (`npx expo run:android` or EAS); the module does not run in Expo Go. | M |
| SR-14 | Declare Android permissions: `BLUETOOTH_CONNECT` / `BLUETOOTH_SCAN` (API 31+) and `ACCESS_FINE_LOCATION` (API ≤ 30, for discovery). | M |
| SR-15 | Persist settings and history (`@react-native-async-storage/async-storage` or `expo-sqlite`). | M |
| SR-16 | Parse the line protocol with partial-line buffering (tolerate split packets). | M |
| SR-17 | Flip `SIMULATE_LIVE_DATA` to `false` and drive state from the transport. | M |
| SR-18 | Push `THRESH:`/`BEEP:` on connect and send periodic `PING`. | S |
| SR-19 | Auto-reconnect with backoff; expose `connecting`/`disconnected` UI states. | S |
| SR-20 | Play the alert sound via the current Expo audio module. | S |

### 4.3 Wire protocol

Newline-delimited ASCII, 9600 baud, 8N1. Frozen contract:

| Direction | Frame | Meaning |
| --------- | ----- | ------- |
| Node → app | `DIST:<cm>` | Smoothed distance, e.g. `DIST:127.1` |
| Node → app | `DIST:ERR` | Echo timed out |
| Node → app | `INFO:MEASURING_TAPE_V1` | Boot banner |
| Node → app | `PONG` | Reply to `PING` |
| Node → app | `OK:<key>=<value>` | Command acknowledged |
| Node → app | `ERR:<reason>` | Command rejected |
| App → node | `THRESH:<cm>` | Set alert threshold |
| App → node | `BEEP:<0\|1>` | Buzzer on/off |
| App → node | `PING` | Liveness check |

| ID | Requirement | Priority |
| -- | ----------- | -------- |
| SR-21 | The protocol above is the frozen interface between firmware and app. | M |
| SR-22 | The app parser shall tolerate partial lines and unknown frames without crashing. | M |

### 4.4 Build & development environment

- Node.js LTS ≥ 20 (24.x in use) and npm 11.x.
- Always install native/Expo packages with `npx expo install <pkg>`.
- Android Studio + emulator **and** a physical Android device (Bluetooth does not work in emulators).
- EAS CLI for cloud builds.

### 4.5 Quality gates

| ID | Requirement | Priority |
| -- | ----------- | -------- |
| SR-23 | `npx tsc --noEmit`, `npx eslint . --max-warnings=0`, `npx expo-doctor` stay green. | M |
| SR-24 | Add unit tests for unit conversion, the frame parser and settings/history reducers. | S |
| SR-25 | Bench-verify firmware accuracy and command handling on real hardware before Milestone 2 closes. | M |

---

## 5 · Enclosure requirements

Because the device is hand-held, the case is a functional requirement, not cosmetics.
"Off-the-shelf project box" (D4) means a stock ABS enclosure that is cut/drilled to fit.

### 5.1 Size & fit

| ID | Requirement | Priority |
| -- | ----------- | -------- |
| ER-1 | Internal volume fits the UNO (68.6 × 53.4 mm board plus USB/barrel-jack and header height), sensor, radio, buzzer, battery and wiring. | M |
| ER-2 | Suggested stock size ≈ **120 × 80 × 50 mm** (Hammond 1591-series class or equivalent). | S |
| ER-3 | Boards mounted on M3 standoffs, secured, with no strain on solder joints. | M |
| ER-4 | Buzzer and any indicator LED visible/audible from outside. | M |

### 5.2 Cutouts

| Cutout | Requirement | Priority |
| -- | ----------- | -------- |
| Sensor | Two ~16–18 mm apertures aligned with the transducer cylinders, or one large grille with > 50 % open area, unobstructed by solid plastic. | M |
| USB | Access to the UNO USB-B port (bench programming) without opening the box. | S |
| Power switch | Slide of the switch protrudes and is operable. | M |
| Charging | Charge port reachable externally (USB-C/micro-USB) and its indicator visible. | M |
| Buzzer vent | Holes or a grille over the piezo. | M |

### 5.3 Measurement datum

| ID | Requirement | Priority |
| -- | ----------- | -------- |
| ER-5 | The box shall present a flat **front datum face** to press against the start surface, with the sensor recessed behind it. | M |
| ER-6 | The offset between datum face and transducer face shall be fixed, documented and entered as the firmware datum offset (SR-7). | M |
| ER-7 | A targeting aid (moulded sight line, notch, or soft flat foot) shall indicate where the beam points. | S |

### 5.4 Acoustic & RF

| ID | Requirement | Priority |
| -- | ----------- | -------- |
| ER-8 | Keep the acoustic path clear — no solid plastic in front of the transducers within ~2–3 cm. | M |
| ER-9 | Damp crosstalk/case resonance (foam ring between transducers). | S |
| ER-10 | Plastic (non-metallic) material around the HC-05 antenna, with a keep-out; antenna toward the box edge. | M |
| ER-11 | Battery and wiring kept away from the antenna region. | S |

### 5.5 Durability

| ID | Requirement | Priority |
| -- | ----------- | -------- |
| ER-12 | Indoor, dry use is the stated operating environment. | M |
| ER-13 | Components and battery secured against shock from normal handling. | M |
| ER-14 | IP-rated sealing (IP54) is **out of scope** for now. | C |

---

## 6 · Non-functional targets

| Aspect | Target |
| ------ | ------ |
| Update rate | 5 Hz (sensor → screen) |
| End-to-end latency | < 500 ms |
| Accuracy | cm-level up to ~2 m; state and verify on the bench |
| Range | 5 cm – 3 m usable |
| Battery life | ≥ 8 h continuous |
| Reconnect time | < 5 s, automatic |
| Link range | ≥ 3 m indoors |
| App cold start | < 3 s |
| Device mass | hand-held; keep under ~300 g including battery |

---

## 7 · Verification & acceptance criteria

| Area | How it is verified |
| ---- | ------------------ |
| Firmware compiles | Arduino IDE / `arduino-cli` build with 0 errors, fits flash/RAM |
| Sensor accuracy | Compare against a steel tape at 10 / 50 / 100 / 200 cm; note error |
| Command parser | Send `THRESH:`, `BEEP:`, `PING` from a serial monitor; check `OK:`/`PONG` |
| Buzzer alert | Reading below threshold triggers the buzzer; `BEEP:0` silences it |
| Bluetooth link | Android app pairs, connects, receives `DIST:` at ~5 Hz; survives a walk-away reconnect |
| App behaviour | Live value, gauge, badge, history, units and threshold all work on device |
| Persistence | Kill and reopen the app; history and settings survive |
| Power | Measure average current; confirm ≥ 8 h runtime projection |
| Enclosure | Sensor reads accurately through the cutouts with the box closed; datum offset consistent |

---

## 8 · Out of scope (for now)

- iOS support (would require BLE, a different radio and app library).
- Offline/cloud sync and accounts.
- Multiple simultaneous sensor nodes.
- IP-rated or outdoor weatherproofing.
- 3D-printed custom enclosure.
- App store release.

---

## 9 · Risks

| # | Risk | Mitigation |
| - | ---- | ---------- |
| R1 | `react-native-bluetooth-classic` may lag the RN 0.86 new architecture. | Prototype the transport early (Plan M2-T1); fall back to BLE (HM-10) if it breaks. |
| R2 | HC-SR04 accuracy drifts with temperature and noisy/angled targets. | Median filter + EMA; optional temperature compensation (HR-7). |
| R3 | Classic SPP does not work in emulators and is flaky across Android OEM permission models. | Test on a real device; declare all permissions correctly (SR-14). |
| R4 | Battery/boost noise can disturb the radio or sensor. | Bulk decoupling, ferrite, keep switching supply away from the antenna. |
| R5 | Acoustic apertures in the project box reduce range/accuracy. | Oversize openings, no solid covering, bench-validate closed-box readings. |
| R6 | `String` use on the UNO fragments RAM during long runs. | Migrate hot path to fixed buffers (SR-5). |
