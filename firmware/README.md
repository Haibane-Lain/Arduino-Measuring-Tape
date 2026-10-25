# Measuring Tape — ESP32 firmware

Firmware for the hand-held sensor node: ESP32 + HC-SR04 ultrasonic sensor +
SSD1306 OLED + KY-004 button. Press the button, the node measures once, shows
the result locally, and notifies the Android app over BLE.

## Hardware

| Part | Purpose | Notes |
| ---- | ------- | ----- |
| ESP32 Dev Module | Controller + BLE | ESP32-WROOM-32 class board, 4 MB flash |
| HC-SR04 | Ultrasonic distance | 2–400 cm stated range |
| SSD1306 OLED | Local display | 128×64, I²C address `0x3C` |
| KY-004 button module | Take a reading | Active level configurable |
| 1 kΩ + 2 kΩ resistors | ECHO level divider | **Required** |

## Wiring

| Signal | ESP32 pin |
| ------ | --------- |
| HC-SR04 `TRIG` | GPIO18 |
| HC-SR04 `ECHO` | GPIO19 **through a 1 kΩ/2 kΩ divider** |
| HC-SR04 `VCC` / `GND` | 5 V (`VIN`) / GND |
| KY-004 `S` | GPIO27 |
| KY-004 `VCC` / `GND` | 3.3 V / GND |
| SSD1306 `SDA` | GPIO21 |
| SSD1306 `SCL` | GPIO22 |
| SSD1306 `VCC` / `GND` | 3.3 V / GND |

> **Do not connect HC-SR04 ECHO directly to the ESP32.** The sensor drives
> ECHO at 5 V and the ESP32 GPIOs are 3.3 V. Use a divider: ECHO → 1 kΩ →
> GPIO19, plus 2 kΩ from GPIO19 to GND. This is the most common way to damage
> an ESP32 pin.

## Flashing

1. Install the **ESP32 by Espressif** board package in Arduino IDE 2.x
   (Boards Manager). Core 2.0.17+ and 3.x are supported.
2. Install these libraries through Library Manager:
   - **Adafruit SSD1306**
   - **Adafruit GFX Library**
   - **Adafruit BusIO**
3. Open `esp32_measuring_tape/esp32_measuring_tape.ino`.
4. Select **Tools → Board → ESP32 Dev Module** and the correct port.
5. Upload at 115200 baud.

The serial monitor at **115200 baud** mirrors every frame. Press the button and
you should see a `DIST:` line even without the phone connected.

## Behaviour

- One measurement per button press.
- Five samples are taken; invalid echoes are discarded and the median is used.
- The OLED shows the reading and BLE state, then turns off after 10 s.
- Pressing the button wakes the screen and takes a new reading.
- If no echo is returned, the device shows `--` / `No echo` and sends
  `DIST:ERR`.
- If the OLED is missing or fails to initialise, the device continues headless
  so BLE still works.
- Readings can be calibrated from the case datum with the `CAL:<cm>` command.

## BLE

- Device name: `DistanceMeter`
- Service: `4fafc201-1fb5-459e-8fcc-c5c9c331914b`
- Measurement characteristic: `beb5483e-36e1-4688-b7f5-ea07361b26a8`
  — `READ` + `NOTIFY`
- Command characteristic: `beb5483e-36e1-4688-b7f5-ea07361b26a9`
  — `WRITE` + `WRITE_NR`

See [`../docs/PROTOCOL.md`](../docs/PROTOCOL.md) for the full frame contract.

## Quick bench verification

1. Power the ESP32 over USB.
2. Open the serial monitor at 115200; confirm the boot lines.
3. Press the button; note the `DIST:` value in the monitor.
4. Use **nRF Connect** (Android) to connect to `DistanceMeter`.
5. Read the measurement characteristic; it contains
   `INFO:MEASURING_TAPE_V2`.
6. Enable notifications, press the button, and confirm `DIST:` notifications.
7. Write `PING` to the command characteristic; confirm `PONG`.
8. Compare readings against a steel tape at 10 / 50 / 100 / 200 cm.

## Notes

- This is the final ESP32 design. The earlier UNO + HC-05 sketch is kept in
  [`archive/uno_measuring_tape`](archive/uno_measuring_tape) for reference only.
- Power is USB for this version. Battery/charger and enclosure work are not
  part of the final application.
