# UI specification

Derived from `User Interface-1.pdf` (three phone mockups) and implemented in
`mobile/src`. All values are centralised in `mobile/src/theme/index.ts`.

## Design tokens

| Token | Value | Used for |
| ----- | ----- | -------- |
| `colors.background` | `#161B27` | App canvas |
| `colors.surface` | `#212838` | Cards, sheets, tab bar |
| `colors.surfaceAlt` | `#2A3242` | Gauge track, neutral badge |
| `colors.border` | `#2E3648` | Hairlines, outlines |
| `colors.textPrimary` | `#EAF0FA` | Values, titles |
| `colors.textSecondary` | `#8B94AA` | Labels, units |
| `colors.textMuted` | `#6A7390` | Timestamps, captions |
| `colors.accent` | `#3AA0FF` | Primary accent |
| `colors.accentBright` | `#22D3EE` | Active tab, header icons, scan spinner |
| `colors.accentText` | `#7CC7FF` | Hero distance reading |
| `colors.success` | `#34D399` | Connected dot, safe badge |
| `colors.warning` | `#FBBF24` | Below threshold, no echo |
| `colors.danger` | `#F87171` | Offline, permission/BLE errors |
| `colors.dangerSoft` | `rgba(248, 113, 113, 0.14)` | Error cards |

Gradients: gauge `#5BE3FF → #2F8BFF`, history bar `#3FD8FF → #1E3A5F`.

## Global chrome

- Header: section icon + title on the left; tappable connection status on the
  right. Statuses: Connected, Connecting, Reconnecting, Scanning, Offline,
  Bluetooth off, Unavailable.
- Tapping the status opens the global **Connect device** sheet.
- Bottom tab bar: Main / History / Settings.

## Screen 1 — Main / Distance

`src/app/(tabs)/index.tsx`

- Hero value: latest reading, or `--` before the first measurement.
- Unit suffix follows the selected unit.
- Caption:
  - `PRESS THE BUTTON ON THE TAPE` while connected and waiting;
  - `CONNECT THE TAPE TO START` while disconnected;
  - `NO ECHO — AIM AT A SURFACE` after `DIST:ERR`;
  - `LAST MEASUREMENT` when a reading is shown.
- Half-circle gauge with unit-aware `0` and full-scale labels.
- Status badge:
  - green `Within safe range`;
  - amber `Below alert threshold`;
  - amber `No echo`;
  - neutral `Waiting for measurement` / `No device connected`.
- Footer: `Last updated: HH:MM:SS` and the connected device name.
- Outline `Connect device` button appears while disconnected.

## Screen 2 — History

`src/app/(tabs)/history.tsx`

- Newest-first list of successful readings. Each row: gradient bar, value +
  unit, relative timestamp (`Today 21:38`).
- `DIST:ERR` never creates a row.
- Empty state explains how to record a reading and offers a Connect button when
  offline.

## Screen 3 — Settings

`src/app/(tabs)/settings.tsx`

- **Device** card: connection status, device name, error text, Scan/Disconnect.
- **Preferences** card:
  - Units → Centimeter / Meter / Inch / Feet.
  - Alert threshold → numeric field in cm.
  - Alert sound → Beep / Chime / Off.
- Settings save automatically; a hint says so.
- Outlined **Clear History** action with confirmation.

## Connect device sheet

`src/components/DeviceModal.tsx`

- Bottom sheet opened from any header status or Connect button.
- When opened while disconnected, starts a 12 s scan.
- Lists nearby `DistanceMeter` nodes with RSSI.
- States: searching, no devices, scanning, connecting, connected, permission
  denied, Bluetooth off, unsupported (web/Expo Go).
- Actions: connect to a row, Scan again/Stop, Disconnect, Open Android settings.

## Deviations from the original mockup

| Mockup | Implementation | Why |
| ------ | -------------- | --- |
| History/Settings headers read “Distance” | Descriptive titles | The duplicate header was a placeholder. |
| Filled dome gauge | Stroked half-circle arc with unit labels | Reads as a gauge and shows range. |
| Static numbers | Real BLE readings, one per button press | Matches the final hardware. |
| “Save Settings” button | Auto-save + `Changes are saved automatically` | Persistence should not depend on a button. |
| Always “Connected” | Live connection states | The device is not always connected. |
| No connection UI | Global device sheet | Needed to scan/pick/reconnect. |
| No empty/error states | Empty, no-echo, permission and BLE-off states | Finished app behaviour. |
