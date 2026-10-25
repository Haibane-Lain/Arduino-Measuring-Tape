# Arduino Measuring Tape

A hand-held Bluetooth tape measure. An **ESP32** node with an HC-SR04
ultrasonic sensor, SSD1306 OLED and a button sends one filtered measurement per
press to an **Expo / React Native** Android app over **BLE**. The app shows the
reading on a gauge, records history, persists settings, and plays an alert
below a configurable threshold.

```
.
├── firmware/
│   ├── esp32_measuring_tape/     # final ESP32 sketch
│   ├── archive/uno_measuring_tape/ # earlier UNO/HC-05 design (reference only)
│   └── README.md                 # wiring, flashing, bench checks
├── mobile/                       # Expo SDK 57 / React Native 0.86 app
│   └── src/
│       ├── app/                  # Expo Router screens
│       ├── components/           # gauge, header, badges, device sheet
│       ├── services/             # BLE transport + line protocol
│       ├── state/                # live BLE/app state
│       ├── storage/              # AsyncStorage persistence + validation
│       ├── utils/                # units, time, alert rule
│       └── theme/                # design tokens
├── docs/
│   ├── PROTOCOL.md               # BLE GATT + wire protocol
│   ├── REQUIREMENTS.md           # final requirements
│   ├── PLAN.md                   # delivery status
│   └── UI-SPEC.md                # screen notes
├── PROGRESS.md                   # final report and verification
└── User Interface-1.pdf          # original UI mockup
```

## Hardware

| Part | Notes |
| ---- | ----- |
| ESP32 Dev Module | ESP32-WROOM-32 class board, BLE |
| HC-SR04 | Ultrasonic distance, 2–400 cm |
| SSD1306 OLED | 128×64, I²C `0x3C` |
| KY-004 button module | One measurement per press |
| 1 kΩ + 2 kΩ resistors | **Required** divider on HC-SR04 ECHO |

> **Do not wire HC-SR04 ECHO directly to the ESP32.** It is a 5 V output. Use
> ECHO → 1 kΩ → GPIO19, with 2 kΩ from GPIO19 to GND. See
> [`firmware/README.md`](firmware/README.md) for the full pin map.

## Firmware

1. Install the **ESP32 by Espressif** board package in Arduino IDE 2.x.
2. Install **Adafruit SSD1306**, **Adafruit GFX Library** and **Adafruit BusIO**.
3. Open `firmware/esp32_measuring_tape/esp32_measuring_tape.ino`.
4. Select **ESP32 Dev Module**, the correct port, and upload.
5. Open the serial monitor at **115200 baud**.

Press the button and confirm a `DIST:` line appears. The device also shows the
reading locally and turns its screen off after 10 seconds.

BLE details and the command/notification frames are in
[`docs/PROTOCOL.md`](docs/PROTOCOL.md).

## Mobile app

The BLE module requires a native development build; it does **not** run in Expo
Go or the browser.

```bash
cd mobile
npm install
npx expo run:android        # local build with Android Studio/SDK
# or, for a cloud build:
# npx eas-cli@latest build --platform android --profile development
```

Then:

```bash
npx expo start
```

### Using the app

1. Power the tape and press its button once to wake it.
2. Open the app and tap **Connect device** (or the header status).
3. Pick `DistanceMeter` from the scan sheet.
4. Press the physical button on the tape for each measurement.
5. The newest reading appears on the Main screen and in History.
6. Settings save automatically. History and the last device survive restarts;
   the app reconnects on launch and after a dropout.

The alert sound is played by the phone when a new reading is below the
configured threshold. The prototype has no buzzer on the node.

### Screens

| Route | Tab | Contents |
| ----- | --- | -------- |
| `mobile/src/app/(tabs)/index.tsx` | Main | Latest value, gauge, status badge, connection CTA |
| `mobile/src/app/(tabs)/history.tsx` | History | Newest-first measurement log |
| `mobile/src/app/(tabs)/settings.tsx` | Settings | Device, units, threshold, alert sound, history controls |

## Quality gates

Run from `mobile/`:

```bash
npx tsc --noEmit
npx eslint . --max-warnings=0
npx expo-doctor
npm test
npx expo export --platform web
```

The web build is useful for reviewing the UI, but BLE is native-only.

## Status

The application is feature-complete for the ESP32/BLE prototype. See
[`PROGRESS.md`](PROGRESS.md) for what was verified and the hardware acceptance
checklist. Battery/charger, enclosure and temperature compensation remain out
of scope for this version.
