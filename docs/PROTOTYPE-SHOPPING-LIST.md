# Shopping list — final ESP32 prototype

Parts needed for the final application. This supersedes the earlier UNO/HC-05
list.

**Version:** 1.0.0
**Date:** 25 October 2026
**Related:** [`../README.md`](../README.md) · [`PROTOCOL.md`](PROTOCOL.md) · [`../firmware/README.md`](../firmware/README.md)

---

## 1 · Buy now

| ✓ | Item | Qty | Notes |
| - | ---- | --- | ----- |
| ☐ | ESP32 Dev Module | 1 | ESP32-WROOM-32 class, BLE, USB cable/port |
| ☐ | HC-SR04 ultrasonic sensor | 1 | 2–400 cm stated range |
| ☐ | SSD1306 OLED 128×64 | 1 | I²C, address `0x3C` |
| ☐ | KY-004 button module | 1 | Active level configurable in firmware |
| ☐ | Resistor 1 kΩ | 1 | HC-SR04 ECHO divider, series leg |
| ☐ | Resistor 2 kΩ | 1 | HC-SR04 ECHO divider, to GND |
| ☐ | Breadboard + jumper wires | 1 set | No soldering required for bring-up |
| ☐ | USB cable for the ESP32 | 1 | Power, flashing and serial monitor |

> ⚠️ **Do not skip the divider.** HC-SR04 ECHO is a 5 V output. Use
> ECHO → 1 kΩ → GPIO19, with 2 kΩ from GPIO19 to GND.

Optional spares:

| Item | Why |
| ---- | --- |
| Second HC-SR04 | Cheap spare in case one is miswired |
| Second SSD1306 | Display faults are easy to rule out |
| Dupont female-to-female leads | Easier sensor/OLED connections |

---

## 2 · Later (out of scope for this version)

| Item | Purpose |
| ---- | ------- |
| Li-ion/LiPo cell ≥ 2000 mAh | Battery operation |
| TP4056 + protection, or charge/boost module | Safe charging and 5 V rail |
| Slide power switch | Physical power control |
| 2-pin JST connector | Battery connection |
| Project box ≈ 120 × 80 × 50 mm | Enclosure |
| M3 screws + standoffs | Mounting |
| Perfboard / protoboard | Final soldered circuit |
| 100 µF + 100 nF capacitors | Decoupling |
| Piezo buzzer | Optional device-side alert |
| DS18B20 + 4.7 kΩ pull-up | Temperature compensation |

---

## 3 · Tools

Soldering iron (for the final board), wire strippers, multimeter, small
screwdrivers, drill/step bits (enclosure), and a phone with Bluetooth for the
app.

---

## 4 · Notes

- The ESP32 and HC-SR04 are the only active parts required to prove the link.
- The OLED and button make the device usable standalone; the app still works
  without the OLED because the firmware runs headless.
- Power is USB for this version; the battery path is future work.
