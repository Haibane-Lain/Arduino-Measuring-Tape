# Arduino Measuring Tape

A Bluetooth tape measure: an **Arduino UNO** with an ultrasonic sensor streams
distance readings to a **React Native (Expo)** app that shows the live value,
keeps a measurement history and lets you tune alerts.

This repository is the project **foundation**: a runnable mobile mockup built
against the `User Interface-1.pdf` designs, plus the first-pass firmware.

```
.
├── mobile/                     # Expo + TypeScript app (Expo Router)
│   └── src/
│       ├── app/                # routes: (tabs)/index | history | settings
│       ├── components/         # header, gauge, rows, buttons
│       ├── state/              # AppState provider (mock live feed)
│       ├── services/           # device transport contract + types
│       ├── data/               # seed measurements
│       ├── utils/              # unit + time formatting
│       └── theme/              # design tokens
├── firmware/                   # Arduino UNO sketch + wiring/protocol docs
│   └── measuring_tape/measuring_tape.ino
├── docs/
│   ├── documentation.html      # source of documentation.pdf
│   └── UI-SPEC.md              # screen-by-screen design notes
├── documentation.pdf           # full technical documentation (23 pages)
├── PROGRESS.md                 # milestone status report
└── User Interface-1.pdf        # source design mockup
```

## Mobile app

```bash
cd mobile
npm install
npm start          # then press "a" (Android) or "i" (iOS)
npm run web        # run the mockup in a browser
npm run typecheck  # tsc --noEmit
```

The app currently renders **mock data**: `src/config.ts` enables a simulated
sensor feed that nudges the reading every 2 seconds. Flip `SIMULATE_LIVE_DATA`
to `false` once the real Bluetooth transport is wired in.

### Screens

| Route | Tab | Contents |
| ----- | --- | -------- |
| `mobile/src/app/(tabs)/index.tsx` | Main | Hero reading, half-circle gauge, range badge |
| `mobile/src/app/(tabs)/history.tsx` | History | Newest-first measurement log |
| `mobile/src/app/(tabs)/settings.tsx` | Settings | Units, alert threshold, alert sound, history controls |

## Firmware

Open `firmware/measuring_tape/measuring_tape.ino` in the Arduino IDE and upload
to an UNO. See [`firmware/README.md`](firmware/README.md) for the pinout and the
line-based serial protocol.

## Documentation

[`documentation.pdf`](documentation.pdf) is the full technical document: system
architecture, mobile app internals, design system, firmware, wire protocol,
quality gates and the Milestone 1 progress report. Its source is
[`docs/documentation.html`](docs/documentation.html) — regenerate with:

```powershell
& "$env:ProgramFiles\Google\Chrome\Application\chrome.exe" --headless=new `
  --no-pdf-header-footer --print-to-pdf="documentation.pdf" `
  "file:///C:/Coding/Arduino%20Measuring%20Tape/docs/documentation.html"
```

## Status

Milestone 1 (foundation + mockup screens) is complete. See
[`PROGRESS.md`](PROGRESS.md) for the detailed report and what comes next.
