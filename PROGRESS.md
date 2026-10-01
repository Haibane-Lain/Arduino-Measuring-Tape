# Progress report — Milestone 1: foundation + mockup screens

**Project:** Arduino Measuring Tape
**Scope this milestone:** repository foundation, three mobile mockup screens
(React / Expo), first-pass Arduino UNO firmware.
**Date:** 2026-10-01

## Summary

The project now has a runnable foundation. The mobile app reproduces all three
screens from `User Interface-1.pdf` — **Distance**, **Measurement History** and
**Settings** — backed by a shared, typed app-state layer and a simulated sensor
feed. The firmware sketch for the UNO sensor node is written and documented.
Both the app and the firmware are ready for the next milestone: replacing the
mock transport with a real Bluetooth link.

## Deliverables

| # | Deliverable | Status | Where |
| - | ----------- | ------ | ----- |
| 1 | Git repository + docs | ✅ | repo root |
| 2 | Expo + TypeScript app with Expo Router | ✅ | `mobile/` |
| 3 | Design tokens from the mockup | ✅ | `mobile/src/theme/index.ts` |
| 4 | Main / Distance screen | ✅ | `mobile/src/app/(tabs)/index.tsx` |
| 5 | Measurement History screen | ✅ | `mobile/src/app/(tabs)/history.tsx` |
| 6 | Settings screen | ✅ | `mobile/src/app/(tabs)/settings.tsx` |
| 7 | Shared UI components | ✅ | `mobile/src/components/` |
| 8 | App state + simulated sensor feed | ✅ | `mobile/src/state/AppState.tsx` |
| 9 | Device transport contract (stub) | ✅ | `mobile/src/services/device.ts` |
| 10 | Arduino UNO firmware sketch | ✅ | `firmware/measuring_tape/` |
| 11 | UI spec + firmware wiring docs | ✅ | `docs/`, `firmware/README.md` |

## What works today

- **Navigation** — three tabs (Main / History / Settings) via Expo Router, with
  a themed tab bar and active-state highlight.
- **Live reading** — the hero value, gauge sweep, status badge and
  "last updated" clock all track a simulated feed (`SIMULATE_LIVE_DATA` in
  `mobile/src/config.ts`), driven from the central `AppState` provider.
- **Units** — switching units in Settings immediately re-renders the hero value
  and every history row (cm ⇄ m ⇄ in ⇄ ft).
- **Alert rule** — dropping below the configured threshold flips the badge from
  green to amber.
- **History** — scrollable, newest-first, with relative timestamps and a
  clear-history action (confirmation dialog).
- **Settings** — units and alert sound open a dependency-free option sheet;
  the threshold is an inline numeric field.

## Verification

Run from `mobile/`:

| Command | Result |
| ------- | ------ |
| `npx tsc --noEmit` | ✅ 0 errors |
| `npx eslint . --max-warnings=0` | ✅ 0 problems |
| `npx expo-doctor` | ✅ 21/21 checks pass |
| Metro bundle (web) | ✅ bundled, 984 modules |
| Metro bundle (Android) | ✅ bundled, 1605 modules |

> Screenshots were not captured in this environment because no desktop browser
> was attached to the session. Run `npm run web` (or `npm start`) in `mobile/`
> to preview all three screens; see the layout notes in `docs/UI-SPEC.md`.

## Design decisions

1. **Expo Router + `src/app/`** — file-based routing matches Expo's current
   guidance and keeps non-route code (components, state, utils) out of the
   routes directory.
2. **Single canonical unit (cm)** — every measurement is stored in centimetres
   and converted at render time, so changing units never mutates history.
3. **Design tokens over literals** — all colours, spacing and radii live in the
   theme, so the palette can be adjusted in one place.
4. **Dependency-light interactions** — option sheets use the platform `Modal`
   rather than a picker library.
5. **Transport contract first** — screens depend on `DeviceTransport` types, not
   on Bluetooth APIs, so wiring the real hardware is additive.

## Known limitations

- The sensor feed is **simulated**; no Bluetooth is implemented yet.
- Firmware has **not run on physical hardware**; it has been written against the
  standard AVR/Ultrasonic patterns but not flashed.
- `Save Settings` and `Clear History` surface confirmation via `Alert`, which is
  a no-op on web (native only).
- `react-dom` is pinned to `19.2.3` to match `react`; `expo-router` would
  otherwise pull `react-dom@19.3.0` and break npm's peer resolution.

## Next steps

1. **Bluetooth transport** — implement `DeviceTransport` against
   `react-native-ble-plx` (or an SPP bridge) and parse `DIST:` frames.
2. **Persist history** — `AsyncStorage`/SQLite so the log survives restarts.
3. **Persist settings** — store units/threshold/sound and push `THRESH:` to the
   device on connect.
4. **Bench-test the firmware** — flash the UNO, verify sampling accuracy and the
   command parser, then calibrate `SMOOTHING`.
5. **Device management UX** — pairing flow, reconnect handling and a "searching"
   state for the header status.
6. **Polish** — empty/loading states, alert sound playback, unit-aware gauge
   labels, and app icons/splash.
