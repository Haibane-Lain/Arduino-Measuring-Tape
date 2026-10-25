# Plan — Arduino Measuring Tape

Delivery plan and status for the final ESP32/BLE application.

**Version:** 1.0.0
**Date:** 25 October 2026
**Related:** [`REQUIREMENTS.md`](REQUIREMENTS.md) · [`PROTOCOL.md`](PROTOCOL.md) · [`../PROGRESS.md`](../PROGRESS.md) · [`../README.md`](../README.md)

---

## 1 · Locked target

| Decision | Effect |
| -------- | ------ |
| ESP32 + BLE | Replaces the earlier UNO + HC-05 classic-SPP design |
| One reading per button press | No continuous stream; one history entry per press |
| Android app | Expo SDK 57 / RN 0.86 development build |
| Phone-side alert | No buzzer on the prototype |
| USB-powered | Battery/enclosure deferred |

---

## 2 · Milestones

| Milestone | Theme | Status |
| --------- | ----- | ------ |
| M1 | Mockup screens + initial firmware | ✅ done (historical) |
| M2 | ESP32 BLE node + protocol | ✅ implemented |
| M3 | Real BLE transport + connection UX | ✅ implemented |
| M4 | Persistence, reconnect, alerts | ✅ implemented |
| M5 | Tests, build config, documentation | ✅ implemented |
| M6 | Hardware bring-up and enclosure | ⬜ future work |

---

## 3 · M2 — ESP32 node

| Task | Deliverable | Status |
| ---- | ----------- | ------ |
| M2-T1 | ESP32 sketch with HC-SR04, OLED, button | ✅ |
| M2-T2 | Median filter, no-echo, datum offset | ✅ |
| M2-T3 | BLE service + measurement/command characteristics | ✅ |
| M2-T4 | Advertising restart after disconnect | ✅ |
| M2-T5 | Serial mirror for bench testing | ✅ |
| M2-T6 | Compile and bench-verify on hardware | ⬜ needs hardware |

Exit criteria: pressing the button displays a value locally and sends one
`DIST:` notification.

---

## 4 · M3 — Mobile transport

| Task | Deliverable | Status |
| ---- | ----------- | ------ |
| M3-T1 | Maintained BLE fork + Expo config plugin | ✅ |
| M3-T2 | Android permissions | ✅ manifest verified |
| M3-T3 | Scan/pick transport with fragmented-packet parser | ✅ |
| M3-T4 | Connect/discover/monitor/read flow | ✅ |
| M3-T5 | Last-device restore + backoff reconnect | ✅ |
| M3-T6 | Connection states and device sheet | ✅ |
| M3-T7 | Native build + BLE acceptance on a phone | ⬜ needs hardware |

Exit criteria: moving the sensor changes the app within ~500 ms of a press.

---

## 5 · M4 — Persistence and alerts

| Task | Deliverable | Status |
| ---- | ----------- | ------ |
| M4-T1 | AsyncStorage settings/history/last-device | ✅ |
| M4-T2 | Validation and defaults on load | ✅ |
| M4-T3 | History limit and clear action | ✅ |
| M4-T4 | Beep/Chime/Off assets and alert rule | ✅ |
| M4-T5 | Empty/error/loading states | ✅ |

Exit criteria: force-quit and reopen preserves state and reconnects.

---

## 6 · M5 — Quality and documentation

| Task | Deliverable | Status |
| ---- | ----------- | ------ |
| M5-T1 | Unit tests for parser/validation/units/alert | ✅ 26 tests |
| M5-T2 | `tsc`, ESLint, Expo Doctor | ✅ |
| M5-T3 | Web bundle and UI smoke test | ✅ |
| M5-T4 | Android prebuild + manifest check | ✅ |
| M5-T5 | EAS development profile | ✅ |
| M5-T6 | README, firmware guide, protocol, requirements, plan, UI spec, progress | ✅ |
| M5-T7 | ESP32 compile check | ✅ 86% flash / 13% RAM; bench pending |

---

## 7 · M6 — Hardware bring-up (future)

1. Build the circuit on perfboard; include the ECHO divider and decoupling.
2. Flash and verify serial + BLE with nRF Connect.
3. Calibrate against a steel tape at 10/50/100/200 cm.
4. Add battery/charger/boost and power switch.
5. Choose an enclosure, cut the sensor apertures and set the datum offset.
6. Validate accuracy with the lid closed.
7. Consider a device buzzer and temperature compensation.

---

## 8 · Definition of done

- Node: button → local display + one BLE reading, with no-echo handling.
- App: scan/connect, live latest value, history, units, threshold alert,
  persistence and automatic reconnect.
- Quality gates green: `tsc`, ESLint, Expo Doctor, Jest, web bundle.
- Firmware compiles for `esp32:esp32:esp32`.
- Physical acceptance completed with an Android phone and the ESP32 node.
