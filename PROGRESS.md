# Progress report — final application

**Project:** Arduino Measuring Tape
**Version:** 1.0.0
**Date:** 25 October 2026
**Target:** ESP32 + BLE + SSD1306 OLED + KY-004 button; Expo/React Native Android app

## Summary

The mockup is now a working end-to-end application design: the ESP32 takes one
filtered reading per button press, displays it locally and notifies the Android
app over BLE. The app scans for and connects to the node, shows the latest
reading and history, persists settings/history, reconnects automatically and
plays a threshold alert.

The earlier UNO + HC-05 classic-SPP design is archived under
`firmware/archive/uno_measuring_tape/`; it is no longer the target.

## What is implemented

| Area | Delivered |
| ---- | --------- |
| Firmware | ESP32 sketch, OLED UI, button debounce, median-of-5 filtering, no-echo frame, datum offset command, BLE advertising restart |
| BLE protocol | GATT service, measurement notify characteristic, command write characteristic, line-buffered parser |
| Mobile transport | Scan/pick, permission handling, connection timeout, automatic reconnect with backoff, last-device restore |
| App state | Live reading, no-echo state, history, settings, connection/error states |
| Persistence | Settings, history and last device in AsyncStorage; validation on load |
| Alerts | Phone-side Beep/Chime/Off with local WAV assets |
| UI | Real connection status, device sheet, empty states, unit-aware gauge, auto-saved settings |
| Tests | 26 unit tests across protocol, validation, units and alert rules |
| Docs | README, firmware guide, protocol, requirements, plan, UI spec, final progress |

## Verification performed

| Check | Result |
| ----- | ------ |
| `npx tsc --noEmit` | ✅ 0 errors |
| `npx eslint . --max-warnings=0` | ✅ 0 problems |
| `npx expo-doctor` | ✅ 21/21 checks |
| `npm test` | ✅ 4 suites, 26 tests |
| `npx expo export --platform web` | ✅ bundled; alert sounds included |
| `npx expo export --platform android` | ✅ 3.4 MB Hermes bundle |
| `npx expo prebuild --platform android --no-install` | ✅ generated project; BLE permissions present |
| UI smoke test (web/headless) | ✅ Main, History, Settings and device sheet render |
| Firmware compile (`esp32:esp32:esp32`) | ✅ 1,134,455 bytes flash (86%), 42,900 bytes RAM (13%) |
| Hardware BLE/E2E | ⚠️ requires the physical ESP32 and an Android phone |

### Android manifest verification

The generated manifest contains:

- `BLUETOOTH_SCAN` with `usesPermissionFlags="neverForLocation"`
- `BLUETOOTH_CONNECT`
- `BLUETOOTH` / `BLUETOOTH_ADMIN` (≤ API 30)
- `ACCESS_FINE_LOCATION` with `maxSdkVersion="30"`
- No `RECORD_AUDIO` permission (audio playback only)

## Known limitations

- **No native build or BLE hardware test could be run in this environment**:
  the machine has no Android SDK/adb and no attached Android device. The code
  typechecks, bundles, prebuilds and passes unit tests; final acceptance needs
  a development build on a phone and the ESP32 node.
- The app is Android-first. BLE is implemented with an Android/iOS-capable
  library, but iOS has not been tested and the product decision remains Android.
- The node is USB-powered; battery, charger and enclosure are out of scope.
- The prototype has no buzzer; alerts are played by the phone.
- `neverForLocation` is enabled for Android 12+. If a particular OEM filters
  scan results, set it to `false` and request location permission instead.
- Android ≤ 11 requires location services to be enabled for BLE scanning.

## Hardware acceptance checklist

1. Flash the ESP32 and verify `DIST:` in the 115200 serial monitor.
2. Connect with **nRF Connect**, read `INFO:MEASURING_TAPE_V2`, enable
   notifications, press the button and see `DIST:`.
3. Write `PING` and see `PONG`.
4. `npx expo run:android` (or EAS development build), install on the phone.
5. Scan, connect, press the button; verify the value and a new history row.
6. Kill/reopen the app; verify settings/history restore and the app reconnects.
7. Power-cycle the ESP32; verify the app shows Reconnecting and recovers.
8. Walk out of range; verify backoff/reconnect behavior.
9. Cover the sensor and verify `DIST:ERR` / "No echo" without a history entry.
10. Set a threshold above the current reading and verify Beep/Chime/Off.
11. Compare 10/50/100/200 cm readings against a steel tape.
12. Use `CAL:<cm>` if the enclosure datum offset needs correction.

## Notes for the next hardware session

- The sketch compiles with ESP32 Arduino core 3.3.12 via
  `arduino-cli compile --fqbn esp32:esp32:esp32 firmware/esp32_measuring_tape`.
- The HC-SR04 ECHO divider is mandatory.
- If the KY-004 is active LOW, change `BUTTON_ACTIVE_LEVEL` in the sketch.
- If the OLED is absent, the firmware continues headless so BLE still works.
