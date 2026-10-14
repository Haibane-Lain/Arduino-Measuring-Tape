# Plan — Arduino Measuring Tape

Delivery plan from the Milestone 1 mockup to a working, enclosed, battery-powered
Android device.

**Version:** 0.2.0
**Date:** 6 October 2026
**Related:** [`REQUIREMENTS.md`](REQUIREMENTS.md) · [`../PROGRESS.md`](../PROGRESS.md) · [`../README.md`](../README.md)

---

## 1 · Locked decisions

| # | Decision | Effect on this plan |
| - | -------- | ------------------- |
| D1 | Android only | Use classic Bluetooth SPP (HC-05); no BLE migration |
| D2 | Battery powered | Purchase battery/boost/charger; add the power work-stream |
| D3 | Arduino UNO | Existing sketch, pin map and protocol stand |
| D4 | Off-the-shelf project box | Drill/cut a stock ABS box; no 3D printing |

---

## 2 · Milestone overview

| Milestone | Theme | Exit criteria | Status |
| --------- | ----- | ------------- | ------ |
| M1 | Foundation & mockup screens | App screens + firmware sketch + docs | ✅ done |
| M2 | Real Bluetooth connectivity | Phone streams live `DIST:` frames from the UNO | ⬜ next |
| M3 | Persistence | History and settings survive restarts | ⬜ |
| M4 | Hardware bring-up | Flashed, calibrate-mounted node on battery | ⬜ |
| M5 | Enclosure | Closed project box reads accurately | ⬜ |
| M6 | Polish & device build | Dev build on a phone, alerts, icons, docs updated | ⬜ |

---

## 3 · Milestone 2 — Real Bluetooth connectivity

**Goal:** replace the mock transport with a live SPP link.

| ID | Task | Deliverable | Depends on |
| -- | ---- | ----------- | ---------- |
| M2-T1 | Spike `react-native-bluetooth-classic` (1.70.x) in a dev build; confirm RN 0.86 compatibility | Working BLE/SPP module on device | — |
| M2-T2 | Add the library + `with-rn-bluetooth-classic` config plugin and Android permissions in `app.json` | Configured dev build | M2-T1 |
| M2-T3 | Implement `SppTransport` against `DeviceTransport` (scan/pair/connect/subscribe/disconnect) | `mobile/src/services/sppTransport.ts` | M2-T2 |
| M2-T4 | Add line-buffered protocol parser for `DIST:`, `DIST:ERR`, `INFO:`, `PONG`, `OK:`, `ERR:` | Parser module + tests | M2-T3 |
| M2-T5 | Wire transport into `AppState`; set `SIMULATE_LIVE_DATA = false` | Live readings in the UI | M2-T4 |
| M2-T6 | Push `THRESH:`/`BEEP:` on connect; send periodic `PING`; handle disconnect/reconnect | Connect handshake + backoff | M2-T5 |
| M2-T7 | Device-management UX: "searching", list of bonded devices, connect/disconnect control | Connection UI | M2-T5 |

**Exit criteria:** moving the sensor changes the hero value within ~500 ms; killing the
node flips the badge to offline and reconnecting restores the stream automatically.

**Risk:** M2-T1 is the highest-risk task in the whole plan — if the classic library is
broken on RN 0.86, the fallback is an HM-10 BLE module and a BLE transport (see R1).

---

## 4 · Milestone 3 — Persistence

| ID | Task | Deliverable | Depends on |
| -- | ---- | ----------- | ---------- |
| M3-T1 | Add `@react-native-async-storage/async-storage` (or `expo-sqlite`) | Installed | M2 |
| M3-T2 | Persist settings (units, threshold, sound) and restore on launch | Settings survive restart | M3-T1 |
| M3-T3 | Persist measurement history within `HISTORY_LIMIT`; hydrate on launch | History survives restart | M3-T1 |
| M3-T4 | Push persisted threshold to the node when it connects | Restored config applied | M3-T2, M2-T6 |

**Exit criteria:** force-quit and reopen — history and settings are intact, and the node
receives the saved threshold on connect.

---

## 5 · Milestone 4 — Hardware bring-up

| ID | Task | Deliverable | Depends on |
| -- | ---- | ----------- | ---------- |
| M4-T1 | Build the circuit on perfboard per the pin map; include the 3.3 V divider | Assembled node | — |
| M4-T2 | Flash the sketch; verify `INFO:` and `DIST:` over USB serial | Bench-verified firmware | M4-T1 |
| M4-T3 | Validate accuracy vs a steel tape at 10/50/100/200 cm; tune `SMOOTHING` | Calibration notes | M4-T2 |
| M4-T4 | Verify `THRESH:`/`BEEP:`/`PING` handling and the buzzer alert | Command tests pass | M4-T2 |
| M4-T5 | (S) Add median filter + warm-up discard; (S) datum offset constant | Updated sketch | M4-T3 |
| M4-T6 | (S) Add temperature compensation (DS18B20/DHT22) | Compensated readings | M4-T3 |
| M4-T7 | Add battery + boost + charger, power switch; measure average current | Battery-powered node | M4-T1 |
| M4-T8 | Refactor the hot path off `String` to fixed buffers | RAM-safe firmware | M4-T2 |

**Exit criteria:** the node runs from battery for a full bench session, reports accurate
distances, and survives a USB unplug/replug.

---

## 6 · Milestone 5 — Enclosure

| ID | Task | Deliverable | Depends on |
| -- | ---- | ----------- | ---------- |
| M5-T1 | Pick the project box (≈120 × 80 × 50 mm) and lay out components | Chosen enclosure + layout sketch | M4-T1 |
| M5-T2 | Drill the sensor apertures and the buzzer vent; verify no obstruction | Sensor cutouts | M5-T1 |
| M5-T3 | Cutouts for the power switch, charge port and (S) USB access | External access | M5-T1 |
| M5-T4 | Mount boards on M3 standoffs; secure the battery and wiring | Internal assembly | M5-T1 |
| M5-T5 | Define the front datum face and measure its offset to the sensor; set the firmware offset | Calibrated datum | M5-T2, M4-T5 |
| M5-T6 | Validate accuracy with the box fully closed | Closed-box acceptance | M5-T4, M5-T5 |

**Exit criteria:** with the lid on, readings remain accurate from the datum face and the
buzzer is clearly audible.

---

## 7 · Milestone 6 — Polish & device build

| ID | Task | Deliverable | Depends on |
| -- | ---- | ----------- | ---------- |
| M6-T1 | App alert sound playback (expo audio module) | Audible app alert | M2 |
| M6-T2 | Empty/loading/error states and reconnect messaging | Polished UX | M2 |
| M6-T3 | Unit-aware gauge labels; app icon and splash | Finished build | — |
| M6-T4 | EAS development build installed on the target phone | Installable dev build | M2 |
| M6-T5 | Update `README.md`, `PROGRESS.md`, `documentation.html`/PDF | Docs reflect v0.2.0 | all |
| M6-T6 | (S) Unit tests for parser + reducers wired into the quality gates | `npm test` green | M2-T4, M3 |

**Exit criteria:** a reviewer can flash the node, install the dev build, pair, measure and
see it logged — following the updated docs alone.

---

## 8 · Sequencing & dependencies

```
M2 (connectivity) ──► M3 (persistence)
   │
   └─ M4 (hardware bring-up) ──► M5 (enclosure)
                                     │
M2 + M3 + M5 ─────────────────────► M6 (polish & device build)
```

- **M2-T1 first.** It de-risks the only unproven technical assumption (Android SPP on RN 0.86).
- **M4 can run in parallel** with the app work — it needs no phone.
- **M5 depends on M4-T1** because the physical layout fixes the cutouts and datum offset.

---

## 9 · Immediate next actions

1. **M2-T1** — prototype `react-native-bluetooth-classic` in a dev build and confirm it links on RN 0.86.
2. **M4-T1** — order parts (HC-05, HC-SR04, buzzer, resistors, battery, boost/charger, project box) and breadboard the circuit.
3. **M4-T2** — flash the existing sketch and confirm `DIST:` frames over USB serial.

---

## 10 · Definition of done (overall)

- Node: on a full charge, measures accurately from the case datum, streams at 5 Hz, alerts
  below threshold, and runs ≥ 8 h.
- App: pairs on Android, shows live value + gauge + badge, logs history, persists settings,
  and reconnects automatically.
- Quality gates green: `tsc`, `eslint`, `expo-doctor` (and new unit tests).
- Documentation updated to v0.2.0.
