# UI specification

Derived from `User Interface-1.pdf` (three phone mockups) and implemented in
`mobile/src`. All values are centralised in `mobile/src/theme/index.ts`.

## Design tokens

| Token | Value | Used for |
| ----- | ----- | -------- |
| `colors.background` | `#161B27` | App canvas |
| `colors.surface` | `#212838` | Cards, tab bar |
| `colors.surfaceAlt` | `#2A3242` | Gauge track, option sheet |
| `colors.border` | `#2E3648` | Hairlines, outlines |
| `colors.textPrimary` | `#EAF0FA` | Values, titles |
| `colors.textSecondary` | `#8B94AA` | Field labels, units |
| `colors.textMuted` | `#6A7390` | Timestamps, captions |
| `colors.accent` | `#3AA0FF` | Primary button, gauge end stop |
| `colors.accentBright` | `#22D3EE` | Active tab, header icons |
| `colors.accentText` | `#7CC7FF` | Hero distance reading |
| `colors.success` | `#34D399` | Connected dot, safe badge |
| `colors.warning` | `#FBBF24` | Out-of-range badge |

Gradients: gauge `#5BE3FF → #2F8BFF`, history bar `#3FD8FF → #1E3A5F`.

## Screen 1 — Main / Distance

`src/app/(tabs)/index.tsx`

- **Header** — Bluetooth icon + "Distance" on the left; green dot + "Connected"
  on the right (`AppHeader`).
- **Hero value** — the current reading at ~66 px in `accentText`, with the unit
  suffix (`cm`) in `textSecondary`.
- **Caption** — `CURRENT DISTANCE`, letter-spaced, `textMuted`.
- **Gauge** — half-circle dial (`DistanceGauge`), track in `surfaceAlt`, progress
  arc in the accent gradient. Sweep = `value / MAX_RANGE_CM`.
- **Status badge** — green `Within safe range`, or amber `Below alert threshold`
  when the reading falls under the alert threshold.
- **Footer** — `Last updated: HH:MM:SS`, refreshed by the simulated feed.

## Screen 2 — History

`src/app/(tabs)/history.tsx`

- Header: history icon + "Measurement History".
- Newest-first list of readings. Each row (`HistoryRow`): gradient bar, value +
  unit, right-aligned relative timestamp (`Today 21:38`).
- Rows are separated by a hairline (`Divider`) and the list scrolls.
- Empty state reads "No measurements yet…".

## Screen 3 — Settings

`src/app/(tabs)/settings.tsx`

- Header: cog icon + "Settings".
- Card with three rows (`SelectRow`, `ThresholdRow`):
  - **Units** → option sheet: Centimeter / Meter / Inch / Feet.
  - **Alert threshold** → numeric field, colour swatch, `cm` suffix.
  - **Alert sound** → option sheet: Beep / Chime / Off.
- Actions: outlined pill **Clear History** (confirm dialog) and solid accent
  pill **Save Settings**.

## Deviations from the mockup

| Mockup | Implementation | Why |
| ------ | -------------- | --- |
| History/Settings header both read "Distance" | Descriptive titles ("Measurement History", "Settings") | The mockup's duplicate header was almost certainly a placeholder. |
| Gauge is an ambiguous filled dome | Stroked half-circle arc with a value sweep | Reads clearly as a gauge and animates meaningfully. |
| Palette given only as pixels | Centralised tokens | Keeps all three screens consistent and themeable. |
| Static numbers | Simulated 2 s feed + seeded history | Lets the mockup demonstrate live behaviour before the hardware lands. |
