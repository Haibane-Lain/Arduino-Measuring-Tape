# Plan — bare-minimum prototype

Shortest path from the Milestone 1 mockup to a live reading on the phone.

**Version:** 0.1.0
**Date:** 11 October 2026
**Related:** [`PROTOTYPE-SHOPPING-LIST.md`](PROTOTYPE-SHOPPING-LIST.md) · [`PLAN.md`](PLAN.md) · [`REQUIREMENTS.md`](REQUIREMENTS.md) · [`../PROGRESS.md`](../PROGRESS.md)

---

## 1 · Goal & definition of done

**Goal:** point the sensor at something and see a live number on the phone,
updating ~5×/s, over classic Bluetooth SPP.

**Done when:** moving the sensor changes the hero value on the app's Main screen
within ~500 ms of a real `DIST:` frame arriving. Nothing else is required.

This is a spike, not a shippable build: it is **USB-powered**, **breadboard**,
**hardcoded to one bonded device**, and has **no persistence or reconnect**.

---

## 2 · Scope

### In scope
- Flash the existing firmware and prove the radio link.
- Add `react-native-bluetooth-classic` + config plugin + Android permissions.
- Write a minimal `SppTransport` against the existing `DeviceTransport` contract.
- Drive `AppState` from the transport and show live values in the existing screens.
- One connect/disconnect control.

### Out of scope (accepted gaps)
Persistence (M3), auto-reconnect + backoff, pushing `THRESH:`/`BEEP:` on connect,
periodic `PING`, alert-sound playback, temperature compensation, datum offset,
battery/boost/charger, enclosure, parser unit tests.
**If the link drops, restart the app.**

---

## 3 · Phase A — Node side (no app code)

| ID | Task | Deliverable | Depends on |
| -- | ---- | ----------- | ---------- |
| PA-1 | Gather parts from the shopping list (HC-05, divider resistors, breadboard, jumpers). | Parts on hand | — |
| PA-2 | Wire per the sketch pin map: TRIG→D9, ECHO→D10, buzzer→D8, BT RX←D2, BT TX→D3 **through the divider**. | Breadboarded node | PA-1 |
| PA-3 | Flash the existing sketch unchanged (`arduino-cli` or Arduino IDE, board "Arduino UNO"). | Flashed node | PA-2 |
| PA-4 | Confirm `DIST:` streams at ~5 Hz in the Arduino serial monitor (9600 baud). | Serial-verified node | PA-3 |
| PA-5 | Pair the HC-05 and read `DIST:` in a generic Android BT-serial terminal. | Radio verified | PA-4 |

No firmware changes are expected — the sketch already does 5 Hz sampling, EMA
smoothing, `DIST:`/`DIST:ERR`, `PING`/`PONG`, `THRESH:` and `BEEP:`.

**PA-5 is the insurance test:** if a generic terminal sees data, the node is
proven and any later trouble is app-side only. Do it before writing RN code.

---

## 4 · Phase B — App side (the only real code)

| ID | Task | Deliverable | Depends on |
| -- | ---- | ----------- | ---------- |
| PB-1 | `npx expo install react-native-bluetooth-classic`; add the `with-rn-bluetooth-classic` config plugin and Android permissions in `mobile/app.json` (`BLUETOOTH_CONNECT`/`SCAN` for API 31+, `ACCESS_FINE_LOCATION` for ≤ 30). | Configured project | PA-5 |
| PB-2 | Build a dev build: `npx expo run:android` (the module does not run in Expo Go). | Dev build on phone | PB-1 |
| PB-3 | Implement `SppTransport` in `mobile/src/services/sppTransport.ts` against `DeviceTransport`: `connect()` to a target device, `subscribe()` buffers bytes, splits on `\n`, parses `DIST:<cm>` (skip `DIST:ERR`). | Transport module | PB-2 |
| PB-4 | Target a device via a `DEVICE_MAC`/name constant in `mobile/src/config.ts` (assume already bonded in Android Settings). | Device target | PB-3 |
| PB-5 | Wire the transport into `mobile/src/state/AppState.tsx`; set `connection` from the transport and flip `SIMULATE_LIVE_DATA = false`. | Live readings in the UI | PB-4 |
| PB-6 | Add a minimal connect/disconnect control (Main screen or Settings) plus the existing status badge reflecting `connection`. | Connection UI | PB-5 |

Everything is additive: the screens already depend on `DeviceTransport` types,
so no screen redesign is needed. The simulator currently feeds `measurements[0]`,
so PB-5 is a contained change.

---

## 5 · Files touched

| File | Change |
| ---- | ------ |
| `mobile/app.json` | Bluetooth config plugin + Android permissions |
| `mobile/package.json` | `react-native-bluetooth-classic` dependency |
| `mobile/src/services/sppTransport.ts` | **New** — the core work |
| `mobile/src/services/device.ts` | Minor — device target / optional connection-state listener |
| `mobile/src/config.ts` | `SIMULATE_LIVE_DATA = false`; device id constant |
| `mobile/src/state/AppState.tsx` | Consume the transport instead of the simulator |
| one screen (Main or Settings) | Connect/disconnect control |

---

## 6 · Verification ladder (cheapest first)

1. **Serial only** — flash the UNO, open the Arduino monitor at 9600, confirm
   `DIST:` streams. (No phone, no radio.)
2. **Generic BT terminal** — pair the HC-05 with any Android serial-terminal app
   and confirm `DIST:` appears. (Proves radio + divider + baud, no RN code.)
3. **USB serial sanity on commands** — send `PING`/`THRESH:`/`BEEP:` and check
   `PONG`/`OK:`.
4. **RN app** — connect and watch the hero value track the sensor.

---

## 7 · Risks

| # | Risk | Mitigation |
| - | ---- | ---------- |
| R1 | `react-native-bluetooth-classic` may lag RN 0.86 / the new architecture. | Do PA-5 first; if the build breaks, fall back to HM-10 + a BLE transport. |
| R2 | HC-05 RX damaged by 5 V. | Fit the 1 kΩ + 2 kΩ divider (HR-10) and verify TX level with a multimeter. |
| R3 | Classic SPP does not work in emulators and varies across Android OEMs. | Test on the physical device only; declare all permissions (SR-14). |
| R4 | Split BLE/SPP data packets. | Line-buffer in `SppTransport` (accumulate until `\n`). |

---

## 8 · Sequencing

```
PA-1..PA-5  (node, needs only parts)  ─┐
                                        ├─► PB-3 (SppTransport) ─► PB-5 ─► PB-6 ─► verify
PB-1..PB-2  (deps + dev build, phone) ─┘
```

Phase A and Phase B can run in parallel once parts arrive; the critical path is
**PA (blocked on the HC-05) → PB-2 (the RN build risk) → PB-3**.

---

## 9 · Follow-ups after the prototype works

1. Bonded-device picker instead of a hardcoded MAC (M2-T7).
2. Push `THRESH:`/`BEEP:` on connect and send periodic `PING` (M2-T6).
3. Auto-reconnect with backoff (SR-19).
4. Persistence (M3), then hardware bring-up (M4) and enclosure (M5).
