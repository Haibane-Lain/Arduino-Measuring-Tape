# Measuring Tape — firmware

Arduino UNO sketch for the measuring tape sensor node.

## Hardware

| Part | Purpose | Notes |
| ---- | ------- | ----- |
| Arduino UNO (ATmega328P) | Controller | 5 V logic |
| HC-SR04 | Ultrasonic distance | 2 cm – 400 cm range |
| HC-05 / HC-06 | Bluetooth SPP link | Default 9600 baud |
| Piezo buzzer | Local alert | Optional, pin D8 |

## Wiring

| Signal | UNO pin |
| ------ | ------- |
| HC-SR04 `TRIG` | D9 |
| HC-SR04 `ECHO` | D10 |
| Buzzer `+` | D8 (through 220 Ω) |
| HC-05 `TXD` | D2 (SoftwareSerial RX) |
| HC-05 `RXD` | D3 (SoftwareSerial TX, **via voltage divider**) |
| HC-05 `VCC` / `GND` | 5 V / GND |
| HC-SR04 `VCC` / `GND` | 5 V / GND |

> The HC-05 `RXD` pin is a 3.3 V input. Feed it through a divider
> (1 kΩ series + 2 kΩ to GND). Powering `VCC` from 5 V is fine on the
> breakout modules used here.

## Flashing

1. Open `measuring_tape/measuring_tape.ino` in the Arduino IDE.
2. Select **Tools → Board → Arduino UNO** and the correct port.
3. Upload.

The sketch also mirrors every frame to the USB serial port at **9600 baud**,
so you can validate the sensor before pairing Bluetooth.

## Wire protocol

Newline-delimited ASCII, 9600 baud, 8N1.

### Device → phone

| Frame | Meaning |
| ----- | ------- |
| `DIST:<cm>` | Smoothed distance in centimetres, e.g. `DIST:127.1` |
| `DIST:ERR` | Echo timed out — nothing in range |
| `INFO:MEASURING_TAPE_V1` | Sent once on boot |
| `PONG` | Reply to `PING` |
| `OK:<key>=<value>` | Command acknowledged |
| `ERR:<reason>` | Command rejected |

### Phone → device

| Frame | Meaning |
| ----- | ------- |
| `THRESH:<cm>` | Set alert threshold, e.g. `THRESH:30` |
| `BEEP:<0\|1>` | Enable/disable the buzzer |
| `PING` | Liveness check |

## Status

The sketch is a **first-pass foundation**: it compiles against the AVR core
and covers sampling, smoothing, alerts and the command parser. It has not yet
been flashed to physical hardware as part of this milestone.
